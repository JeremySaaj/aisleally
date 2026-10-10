from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import httpx
import json as json_lib
import re
from typing import Optional

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent"

def sb_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

# ── Models ──────────────────────────────────────────────

class HealthProfile(BaseModel):
    user_id: str
    health_focus_areas: list[str] = []
    hard_exclusions: list[str] = []
    custom_tags: list[str] = []

class SearchHistoryEntry(BaseModel):
    user_id: str
    product_id: str
    product_name: str
    product_category: Optional[str] = None
    verdict: str
    compared_with_id: Optional[str] = None
    compared_with_name: Optional[str] = None
    ai_winner: Optional[str] = None

class IngredientExplainRequest(BaseModel):
    ingredient: str
    status: str
    health_focus_areas: list[str] = []
    hard_exclusions: list[str] = []

class AnalyzeRequest(BaseModel):
    product_name: str
    ingredients_text: str
    health_focus_areas: list[str] = []
    hard_exclusions: list[str] = []

# ── Root ─────────────────────────────────────────────────

@app.get("/")
@app.get("/api")
@app.get("/api/")
def root():
    return {"status": "AisleAlly API is running"}

@app.get("/api/debug")
def debug_config():
    """Check which environment variables are configured (values hidden)."""
    return {
        "supabase_url_set": bool(SUPABASE_URL),
        "supabase_key_set": bool(SUPABASE_KEY),
        "gemini_api_key_set": bool(GEMINI_API_KEY),
    }

@app.get("/api/models")
def list_gemini_models():
    """List available Gemini models for this API key."""
    try:
        res = httpx.get(
            f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}",
            timeout=10.0,
        )
        data = res.json()
        # Return just the names that support generateContent
        names = [
            m["name"] for m in data.get("models", [])
            if "generateContent" in m.get("supportedGenerationMethods", [])
        ]
        return {"models": names}
    except Exception as e:
        return {"error": str(e)}

# ── Auth Endpoints ───────────────────────────────────────

class AuthRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth")
def auth_user(req: AuthRequest):
    """
    Unified sign-in / sign-up endpoint.
    Strategy: try SIGNUP first — if Supabase says the account already exists,
    try SIGN-IN with the given password.  This correctly distinguishes
    "new user" from "wrong password" because Supabase returns the same
    'Invalid login credentials' error for both missing account AND wrong password
    on the sign-in endpoint, making the two cases indistinguishable if we
    try sign-in first.
    Returns {"user_id": str, "email": str, "is_new_user": bool}.
    """
    auth_base = f"{SUPABASE_URL}/auth/v1"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
    }
    payload = {"email": req.email, "password": req.password}

    try:
        # ── Step 1: attempt sign-up ──────────────────────────
        sign_up = httpx.post(
            f"{auth_base}/signup",
            json=payload, headers=headers, timeout=10.0,
        )
        up_body = sign_up.json() if sign_up.content else {}

        if sign_up.status_code in (200, 201):
            # New account created — email confirmation must be OFF in Supabase
            user = up_body.get("user") or up_body
            user_id = (user.get("id") if isinstance(user, dict) else None) or req.email
            return {"user_id": user_id, "email": req.email, "is_new_user": True}

        up_error = (up_body.get("msg") or up_body.get("error_description") or "").lower()
        up_code  = up_body.get("code") or up_body.get("error_code") or ""

        # Supabase signals "account already exists" in several ways depending on version
        account_exists = (
            "already registered" in up_error
            or "already been registered" in up_error
            or "already exists" in up_error
            or up_code in ("user_already_exists", "email_exists", "over_email_send_rate_limit")
            or sign_up.status_code in (422, 409)
        )

        if not account_exists:
            # Some unexpected sign-up error — surface it
            raise HTTPException(status_code=400, detail=up_body.get("msg", "Sign-up failed"))

        # ── Step 2: account exists — verify password via sign-in ──
        sign_in = httpx.post(
            f"{auth_base}/token?grant_type=password",
            json=payload, headers=headers, timeout=10.0,
        )
        if sign_in.status_code == 200:
            data = sign_in.json()
            user_id = data.get("user", {}).get("id") or req.email
            return {"user_id": user_id, "email": req.email, "is_new_user": False}

        # Sign-in failed → wrong password
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Auth error: {str(e)}")


@app.post("/api/auth/debug")
def auth_debug(req: AuthRequest):
    """Temporary endpoint — shows raw Supabase auth responses for debugging."""
    auth_base = f"{SUPABASE_URL}/auth/v1"
    headers = {"apikey": SUPABASE_KEY, "Content-Type": "application/json"}
    payload = {"email": req.email, "password": req.password}
    sign_up = httpx.post(f"{auth_base}/signup", json=payload, headers=headers, timeout=10.0)
    return {
        "signup_status": sign_up.status_code,
        "signup_body": sign_up.json() if sign_up.content else {},
    }


# ── Health Profile Endpoints ─────────────────────────────

@app.post("/api/profile")
def save_profile(profile: HealthProfile):
    try:
        base = f"{SUPABASE_URL}/rest/v1/health_profiles"
        check = httpx.get(
            f"{base}?user_id=eq.{profile.user_id}&select=id",
            headers=sb_headers(), timeout=10.0
        )
        existing = check.json() if isinstance(check.json(), list) else []
        data = {
            "user_id": profile.user_id,
            "health_focus_areas": profile.health_focus_areas,
            "hard_exclusions": profile.hard_exclusions,
            "custom_tags": profile.custom_tags,
        }
        if existing:
            res = httpx.patch(
                f"{base}?user_id=eq.{profile.user_id}",
                json=data, headers=sb_headers(), timeout=10.0
            )
        else:
            res = httpx.post(base, json=data, headers=sb_headers(), timeout=10.0)
        if res.status_code >= 400:
            raise HTTPException(status_code=500, detail=res.text)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile/{user_id}")
def get_profile(user_id: str):
    try:
        res = httpx.get(
            f"{SUPABASE_URL}/rest/v1/health_profiles?user_id=eq.{user_id}&select=*",
            headers=sb_headers(), timeout=10.0
        )
        if res.status_code >= 400:
            raise HTTPException(status_code=500, detail=f"Database error ({res.status_code}): {res.text}")
        data = res.json()
        if not isinstance(data, list) or len(data) == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        return data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Search History Endpoints ─────────────────────────────

@app.post("/api/history")
def save_history(entry: SearchHistoryEntry):
    try:
        res = httpx.post(
            f"{SUPABASE_URL}/rest/v1/search_history",
            json=entry.dict(), headers=sb_headers(), timeout=10.0
        )
        if res.status_code >= 400:
            raise HTTPException(status_code=500, detail=res.text)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history/{user_id}")
def get_history(user_id: str):
    try:
        res = httpx.get(
            f"{SUPABASE_URL}/rest/v1/search_history?user_id=eq.{user_id}&order=created_at.desc&limit=20&select=*",
            headers=sb_headers(), timeout=10.0
        )
        return res.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Product Search (Open Food Facts) ────────────────────

BLOCKED = {"cannabis", "hemp", "cbd", "thc", "marijuana", "weed",
           "nicotine", "tobacco", "vape", "e-cigarette"}

# Common food-term misspellings → correct Australian English spelling
FOOD_CORRECTIONS: dict[str, str] = {
    # yoghurt variants
    "youghurt": "yoghurt", "yogurt": "yoghurt", "yoghert": "yoghurt",
    "yohurt": "yoghurt", "yoghourt": "yoghurt", "yougart": "yoghurt",
    # chocolate
    "choclate": "chocolate", "chocloate": "chocolate", "chocolat": "chocolate",
    "chocalate": "chocolate", "choclate": "chocolate",
    # biscuit
    "biscut": "biscuit", "bisquit": "biscuit", "biscit": "biscuit",
    "biscuite": "biscuit",
    # cereal / muesli
    "museli": "muesli", "mueslie": "muesli", "muslie": "muesli",
    "ceral": "cereal", "cerael": "cereal",
    # cheese
    "chese": "cheese", "cheeze": "cheese",
    # butter / margarine
    "margerine": "margarine", "margerin": "margarine",
    # coffee
    "cofee": "coffee", "coffe": "coffee",
    # juice / smoothie
    "juise": "juice", "smothie": "smoothie", "smoothy": "smoothie",
    # bread
    "bred": "bread", "braed": "bread",
    # biscuit / cracker
    "craker": "cracker", "cracker": "cracker",
    # sauce / dressing
    "sause": "sauce", "dresing": "dressing",
    # vegemite (common AU brand)
    "vegimite": "vegemite", "vegemit": "vegemite",
    # weetbix
    "weetbicks": "weet-bix", "weetbix": "weet-bix",
    # milk
    "mlk": "milk",
    # protein
    "protien": "protein", "portein": "protein",
    # yoghurt again (common in AU)
    "jogurt": "yoghurt", "joghurt": "yoghurt",
}

def _gemini_interpret_query(q: str) -> list:
    """
    Ask Gemini to interpret a grocery search query and return 1-3 OOF-friendly
    search terms.  Corrects typos, understands natural language, resolves
    colloquial product names.  Falls back to [q] on any error.
    """
    prompt = (
        f'An Australian shopper typed \"{q}\" into a grocery product search app.\n'
        'Your job: produce 1 to 3 search terms that will find the right products '
        'in the Open Food Facts database.\n'
        'Rules:\n'
        '- Fix typos (e.g. "nutello" → "nutella", "milo choclate" → "milo chocolate")\n'
        '- Interpret natural language (e.g. "choc hazelnut spread" → "nutella")\n'
        '- Interpret vague intent (e.g. "no sugar cereal" → ["sugar free cereal", "low sugar cereal"])\n'
        '- If the query is already a clear product name, just return that name\n'
        '- Return ONLY a valid JSON array of strings — no markdown, no explanation\n'
        '  Example: ["nutella", "hazelnut chocolate spread"]'
    )
    try:
        resp = httpx.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=6.0,
        )
        resp.raise_for_status()
        raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        # Strip markdown code fences if Gemini wraps the JSON
        raw_text = re.sub(r"^```[a-z]*\n?", "", raw_text)
        raw_text = re.sub(r"\n?```$", "", raw_text).strip()
        import json as _json
        terms = _json.loads(raw_text)
        if isinstance(terms, list) and terms:
            return [str(t).strip() for t in terms if str(t).strip()][:3]
    except Exception:
        pass
    return [q]  # fallback: use original query as-is

def _oof_search(query: str, page_size: int = 20) -> list:
    """Fetch raw product list from Open Food Facts for a given query string."""
    try:
        res = httpx.get(
            "https://world.openfoodfacts.org/cgi/search.pl",
            params={
                "search_terms": query,
                "action": "process",
                "json": "1",
                "fields": "id,product_name,categories_tags,ingredients_text,ingredients_text_en,image_front_small_url,image_url",
                "page_size": str(page_size),
                "sort_by": "unique_scans_n",
                "lc": "en",
            },
            timeout=15.0,
        )
        return res.json().get("products", [])
    except Exception:
        return []


def _is_likely_english(text: str) -> bool:
    """Heuristic: <=15 % non-ASCII characters -> probably English / Latin-script."""
    if not text:
        return False
    non_ascii = sum(1 for c in text if ord(c) > 127)
    return non_ascii <= len(text) * 0.15

def _best_ingredients(p: dict, english_only: bool = False) -> str:
    """Return the best ingredients text for an OOF product dict.

    If english_only=True, returns "" when no English text is available
    (used in AI Pick to skip non-English candidates).
    Otherwise, prefers English but falls back to whatever is available
    (used in search/clean so products are not silently dropped).
    """
    en = (p.get("ingredients_text_en") or "").strip()
    generic = (p.get("ingredients_text") or "").strip()
    # 1. Use the dedicated English field if it looks English
    if en and _is_likely_english(en):
        return en
    # 2. Use the generic field if it looks English
    if generic and _is_likely_english(generic):
        return generic
    # 3. In strict mode (AI Pick), skip non-English products
    if english_only:
        return ""
    # 4. Otherwise return best available text (Gemini can translate)
    return en or generic

def _clean_products(raw: list) -> list:
    """Filter and normalise a raw OOF product list."""
    products = []
    for p in raw:
        name = (p.get("product_name") or "").strip()
        ingredients = _best_ingredients(p)
        if not name or not ingredients:
            continue
        name_lower = name.lower()
        if any(kw in name_lower for kw in BLOCKED):
            continue
        cats = p.get("categories_tags") or []
        cats_lower = " ".join(cats).lower()
        if any(kw in cats_lower for kw in BLOCKED):
            continue
        non_ascii = sum(1 for c in name if ord(c) > 127)
        if non_ascii > len(name) * 0.3:
            continue
        category = "General"
        for cat in cats:
            if cat.startswith("en:"):
                cleaned = cat[3:].replace("-", " ").title()
                if 3 < len(cleaned) < 40:
                    category = cleaned
                    break
        image_url = (p.get("image_front_small_url") or p.get("image_url") or "").strip()
        products.append({
            "id": str(p.get("id") or p.get("code") or ""),
            "name": name,
            "category": category,
            "ingredients_text": ingredients,
            "image_url": image_url,
        })
    return products

@app.get("/api/search")
def search_products(q: str):
    try:
        # ── Gemini query interpretation ─────────────────────────────────
        # Corrects typos, understands natural language, returns 1-3 OOF terms.
        search_terms = _gemini_interpret_query(q)

        seen_ids: set = set()
        merged: list = []

        # ── Primary searches: one OOF call per Gemini-suggested term ────
        for term in search_terms:
            if len(merged) >= 6:
                break
            for prod in _clean_products(_oof_search(term, page_size=20)):
                if prod["id"] and prod["id"] not in seen_ids:
                    seen_ids.add(prod["id"])
                    merged.append(prod)
                if len(merged) >= 6:
                    break

        # ── Word-level fallback ──────────────────────────────────────────
        # Split the best Gemini term into significant individual words and
        # search those too (OOF tokenises differently per word).
        if len(merged) < 6:
            best_term = search_terms[0] if search_terms else q
            stop_words = {"the", "and", "for", "with", "from", "that", "this",
                          "are", "was", "but", "not", "all", "can", "has", "its"}
            words = [w for w in re.split(r"[\s\-_/]+", best_term.lower())
                     if len(w) >= 3 and w not in stop_words]
            unique_words = list(dict.fromkeys(words))
            for word in unique_words[:3]:
                if len(merged) >= 6:
                    break
                for prod in _clean_products(_oof_search(word, page_size=10)):
                    if prod["id"] and prod["id"] not in seen_ids:
                        seen_ids.add(prod["id"])
                        merged.append(prod)
                    if len(merged) >= 6:
                        break

        return {"products": merged[:6]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
def analyze_product(req: AnalyzeRequest):
    try:
        profile_parts = []
        if req.health_focus_areas:
            profile_parts.append(f"Health focus areas: {', '.join(req.health_focus_areas)}")
        if req.hard_exclusions:
            profile_parts.append(f"Hard exclusions (must flag as trigger): {', '.join(req.hard_exclusions)}")
        profile_context = ". ".join(profile_parts) if profile_parts else "No specific health concerns."

        prompt = f"""You are a health-focused grocery ingredient analyst for Australian shoppers.

User health profile: {profile_context}

Product: {req.product_name}
Ingredients: {req.ingredients_text}

Note: If any ingredient names appear in a non-English language, treat them by their standard English equivalent (e.g. "sucre" -> sugar, "farine de ble" -> wheat flour) and analyse them the same way.

Analyze each ingredient against the user's health profile. Return a JSON object in this exact format:

{{
  "verdict": "safe",
  "verdict_title": "Safe to Eat",
  "verdict_subtext": "one sentence summary of the overall verdict for this user",
  "condition_flags": [
    {{"status": "trigger", "description": "specific reason relevant to user profile"}}
  ],
  "ingredients": [
    {{
      "name": "Ingredient Name",
      "status": "safe",
      "explanation": "1-2 sentences explaining why for this specific user profile"
    }}
  ]
}}

Rules:
- verdict must be one of: "safe", "caution", "trigger"
- verdict_title must be one of: "Safe to Eat", "Caution — Check Ingredients", "Trigger Found"
- Overall verdict = "trigger" if ANY ingredient is trigger; "caution" if any is caution but none trigger; else "safe"
- Flag as "trigger" if ingredient is in the hard exclusions or directly harms health focus areas
- Flag as "caution" if ingredient may be concerning for the health profile
- Flag as "safe" otherwise
- Include ALL ingredients from the list (parse comma-separated if needed)
- condition_flags: only list trigger and caution items; empty array if all ingredients are safe
- Be specific to this user's profile, not generic advice
- Return valid JSON only"""

        response = httpx.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"},
            },
            timeout=30.0,
        )
        response.raise_for_status()
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()

        # Strip markdown code blocks if Gemini adds them anyway
        text = re.sub(r'^```(?:json)?\s*\n?', '', text)
        text = re.sub(r'\n?```\s*$', '', text)
        text = text.strip()

        result = json_lib.loads(text)
        return result
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        body = e.response.text[:500] if e.response else ""
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error ({e.response.status_code}): {body}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analyze error: {str(e)}")

# ── Gemini Ingredient Explanation ────────────────────────

@app.post("/api/explain")
def explain_ingredient(req: IngredientExplainRequest):
    try:
        profile_context = ""
        if req.health_focus_areas:
            profile_context += f"Health focus areas: {', '.join(req.health_focus_areas)}. "
        if req.hard_exclusions:
            profile_context += f"Hard exclusions: {', '.join(req.hard_exclusions)}."

        prompt = f"""You are a health-focused grocery assistant for Australian shoppers.
A user has the following health profile: {profile_context}

The ingredient "{req.ingredient}" has been flagged as {req.status} for this user.

Write exactly 1-2 sentences explaining why this ingredient is {req.status} for someone with this health profile.
Be specific, plain English, no jargon. Do not start with "I"."""

        response = httpx.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=15.0,
        )
        response.raise_for_status()
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        return {"explanation": text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── AI Pick (find a similar alternative product) ─────────

# Maps broad food-group keywords → set of OOF category tag fragments.
# If the original product and the candidate share NO group, they're too different.
FOOD_GROUPS: list[tuple[str, set[str]]] = [
    ("chips_snacks",   {"chip", "crisp", "snack", "popcorn", "pretzel", "cracker", "corn-chip", "rice-cracker"}),
    ("chocolate",      {"chocolate", "cacao", "cocoa", "confection", "candy", "lolly", "sweet"}),
    ("bread_bakery",   {"bread", "bakery", "biscuit", "cookie", "muffin", "cake", "pastry", "crumpet", "wrap", "tortilla"}),
    ("dairy",          {"yoghurt", "yogurt", "cheese", "milk", "cream", "butter", "dairy"}),
    ("cereal_grains",  {"cereal", "muesli", "oat", "porridge", "granola", "weetbix", "weet-bix", "grain", "rice-bubble"}),
    ("beverage",       {"juice", "drink", "beverage", "water", "soda", "smoothie", "coffee", "tea", "kombucha", "beer", "wine"}),
    ("condiment",      {"sauce", "dressing", "condiment", "dip", "spread", "jam", "jelly", "marmalade", "vegemite", "peanut-butter", "nutella"}),
    ("meat_seafood",   {"meat", "chicken", "beef", "pork", "fish", "salmon", "tuna", "seafood", "lamb", "turkey"}),
    ("frozen",         {"frozen", "ice-cream", "gelato", "sorbet"}),
    ("pasta_rice",     {"pasta", "noodle", "rice", "quinoa", "couscous"}),
    ("nuts_seeds",     {"nut", "seed", "almond", "cashew", "peanut", "walnut", "pistachio", "trail-mix"}),
    ("protein_supplement", {"protein", "supplement", "bar", "shake", "powder"}),
    ("fruit_veg",      {"fruit", "vegetable", "dried-fruit", "raisin", "sultana"}),
]

def _food_group(name: str, cats: list[str]) -> Optional[str]:
    """Return the broad food group for a product, or None if unknown."""
    combined = (name + " " + " ".join(cats)).lower()
    for group_name, keywords in FOOD_GROUPS:
        if any(kw in combined for kw in keywords):
            return group_name
    return None

@app.get("/api/ai-pick")
def ai_pick(name: str, category: str = "", flags: str = "", exclusions: str = ""):
    """Use Gemini to suggest a HEALTHIER alternative product, then find it on OOF."""
    try:
        name_lower = name.lower()
        original_cats = [w.lower() for w in re.split(r"[\s\-_/]+", category)]
        original_group = _food_group(name, original_cats)

        # Build flags context for the prompt (e.g. "High sugar; Contains palm oil")
        flags_context = f"\n- Health issues flagged in the original: {flags}" if flags.strip() else ""
        exclusions_list = [e.strip().lower() for e in exclusions.split(",") if e.strip()]
        exclusions_context = (
            f"\n- The user CANNOT have these ingredients (hard exclusions): {exclusions}"
            if exclusions.strip() else ""
        )

        # ── Helper — find a valid alternative in OOF results ─────────────
        def _try_pick(query: str, strict_group: Optional[str]) -> Optional[dict]:
            raw_products = _oof_search(query, page_size=15)
            for p in raw_products:
                pname = (p.get("product_name") or "").strip()
                ingredients = _best_ingredients(p, english_only=True)
                if not pname or not ingredients:
                    continue
                if pname.lower() == name_lower:
                    continue
                if any(kw in pname.lower() for kw in BLOCKED):
                    continue
                non_ascii = sum(1 for c in pname if ord(c) > 127)
                if non_ascii > len(pname) * 0.3:
                    continue
                # Hard-exclusion filter — skip if candidate contains any banned ingredient
                if exclusions_list:
                    ing_lower = ingredients.lower()
                    if any(excl in ing_lower for excl in exclusions_list):
                        continue
                # Food group check — only enforced when strict_group is set
                if strict_group is not None:
                    pcats_check = p.get("categories_tags") or []
                    candidate_group = _food_group(pname, [t.replace("en:", "") for t in pcats_check])
                    if candidate_group is not None and candidate_group != strict_group:
                        continue
                pcats = p.get("categories_tags") or []
                cat = "General"
                for c in pcats:
                    if c.startswith("en:"):
                        cleaned = c[3:].replace("-", " ").title()
                        if 3 < len(cleaned) < 40:
                            cat = cleaned
                            break
                img = (p.get("image_front_small_url") or p.get("image_url") or "").strip()
                return {
                    "id": str(p.get("id") or p.get("code") or ""),
                    "name": pname,
                    "category": cat,
                    "ingredients_text": ingredients,
                    "image_url": img,
                }
            return None

        # ── Step 1: Ask Gemini for HEALTHIER AU supermarket alternatives ──
        suggestions: list[dict] = []
        gemini_search_queries: list[str] = []
        try:
            gemini_prompt = f"""You are a nutrition expert helping Australian shoppers find a HEALTHIER alternative to a product they scanned.

Product to replace:
- Name: {name}
- Category: {category}{flags_context}{exclusions_context}

Your goal is to suggest TWO genuinely HEALTHIER alternatives — not just a different brand of the same thing, but something with a meaningfully better nutritional profile.

The alternatives MUST:
1. NOT contain any of the user's hard exclusions listed above — this is the most important rule; if the original was flagged for dairy, do NOT suggest another dairy product
2. Be in the SAME or a closely RELATED food category (e.g. for a sugary chocolate spread → natural nut butter is ideal; for chips → rice cakes or veggie chips; keep it comparable so the user can actually swap it)
3. Have BETTER nutrition: less sugar, fewer additives, simpler/more natural ingredients, better fats — specifically addressing the flagged issues above
4. Be real products with a brand name sold in Australian supermarkets (Woolworths, Coles, Aldi, IGA)
5. NOT be the same product as the original

Prioritise products that directly fix ALL the flagged issues. For example:
- If the original has dairy → suggest a dairy-free alternative (e.g. oat-based, almond-based, coconut-based)
- If the original has high sugar → suggest a low-sugar or no-added-sugar alternative
- If it contains palm oil → suggest one without palm oil
- If it is highly processed → suggest a whole-food or minimally processed alternative

Return ONLY this JSON — no explanation:
{{
  "suggestions": [
    {{"product_name": "Specific Brand Name", "search_query": "short 2-3 word OOF search", "healthier_because": "one sentence why it is healthier"}},
    {{"product_name": "Specific Brand Name 2", "search_query": "short 2-3 word OOF search", "healthier_because": "one sentence why it is healthier"}}
  ]
}}"""

            gemini_resp = httpx.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": gemini_prompt}]}],
                    "generationConfig": {"response_mime_type": "application/json"},
                },
                timeout=10.0,
            )
            gemini_resp.raise_for_status()
            raw = gemini_resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            raw = re.sub(r'^```(?:json)?\s*\n?', '', raw)
            raw = re.sub(r'\n?```\s*$', '', raw)
            suggestions = json_lib.loads(raw.strip()).get("suggestions", [])
        except Exception:
            # Gemini failed — fall through to keyword-only fallbacks
            pass

        # ── Step 2: Build ordered query list ──────────────────────────────
        # Gemini queries — no food-group filter (Gemini is trusted to pick something reasonable)
        gemini_queries: list[str] = []
        for s in suggestions[:2]:
            pn = (s.get("product_name") or "").strip()
            sq = (s.get("search_query") or "").strip()
            if pn and pn not in gemini_queries:
                gemini_queries.append(pn)
            if sq and sq != pn and sq not in gemini_queries:
                gemini_queries.append(sq)

        # Keyword fallbacks — category words, then name words
        cat_words = [w for w in re.split(r"[\s\-_/]+", category.lower()) if len(w) >= 3]
        name_words = [w for w in re.split(r"[\s\-_/]+", name.lower()) if len(w) >= 3]
        keyword_queries: list[str] = []
        if cat_words:
            q = " ".join(cat_words[:2])
            if q not in gemini_queries and q not in keyword_queries:
                keyword_queries.append(q)
            for w in cat_words[:2]:
                if w not in gemini_queries and w not in keyword_queries:
                    keyword_queries.append(w)
        if name_words:
            q = name_words[0]
            if q not in gemini_queries and q not in keyword_queries:
                keyword_queries.append(q)

        # ── Step 3: Gemini suggestions — no food-group filter ────────────
        # We trust Gemini to pick something in the right ballpark; filter would
        # wrongly block "almond butter" suggested as healthier alt to Nutella
        for query in gemini_queries:
            result = _try_pick(query, None)
            if result:
                return result

        # ── Step 4: Keyword fallbacks with food-group filter ─────────────
        for query in keyword_queries:
            result = _try_pick(query, original_group)
            if result:
                return result

        # ── Step 5: Relax food-group filter, retry keyword queries ────────
        for query in keyword_queries:
            result = _try_pick(query, None)
            if result:
                return result

        # ── Step 6: Absolute last resort — broadest possible terms ────────
        generic_terms: list[str] = []
        for w in (cat_words + name_words):
            if len(w) >= 4 and w not in generic_terms:
                generic_terms.append(w)
        for term in generic_terms[:3]:
            result = _try_pick(term, None)
            if result:
                return result

        raise HTTPException(
            status_code=404,
            detail=f"Couldn't find a comparable product for {name}. Try searching manually."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Product Comparison (Gemini) ──────────────────────────

class CompareRequest(BaseModel):
    product_a_name: str
    product_a_ingredients: str
    product_b_name: str
    product_b_ingredients: str
    health_focus_areas: list[str] = []
    hard_exclusions: list[str] = []

@app.post("/api/compare")
def compare_products(req: CompareRequest):
    try:
        profile_parts = []
        if req.health_focus_areas:
            profile_parts.append(f"Health focus areas: {', '.join(req.health_focus_areas)}")
        if req.hard_exclusions:
            profile_parts.append(f"Hard exclusions (must flag as trigger): {', '.join(req.hard_exclusions)}")
        profile_context = ". ".join(profile_parts) if profile_parts else "No specific health concerns."

        prompt = f"""You are a health-focused grocery analyst for Australian shoppers.

User health profile: {profile_context}

Compare these two products:

Product A: {req.product_a_name}
Ingredients A: {req.product_a_ingredients}

Product B: {req.product_b_name}
Ingredients B: {req.product_b_ingredients}

Return a JSON object in this exact format:

{{
  "product_a": {{
    "verdict": "safe",
    "verdict_label": "Safe to Eat",
    "subtitle": "one short reason why (max 8 words)"
  }},
  "product_b": {{
    "verdict": "safe",
    "verdict_label": "Safe to Eat",
    "subtitle": "one short reason why (max 8 words)"
  }},
  "winner": "A",
  "verdict_text": "2 sentence explanation of which is better for this user and why — use the ACTUAL product names (not 'Product A' or 'Product B')",
  "tradeoff_text": "1 sentence describing any trade-offs — use the ACTUAL product names (not 'Product A' or 'Product B')",
  "comparison_rows": [
    {{
      "name": "Ingredient Name",
      "status_a": "safe",
      "status_b": "caution"
    }}
  ]
}}

Rules:
- verdict must be one of: "safe", "caution", "trigger"
- verdict_label must be one of: "Safe to Eat", "Caution — Check Ingredients", "Trigger Found"
- winner must be "A", "B", or "tie"
- comparison_rows: include key ingredients and all flagged ones (max 12 rows)
- status values: "safe", "caution", "trigger"
- Return valid JSON only"""

        response = httpx.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"},
            },
            timeout=30.0,
        )
        response.raise_for_status()
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        text = re.sub(r'^```(?:json)?\s*\n?', '', text)
        text = re.sub(r'\n?```\s*$', '', text)
        result = json_lib.loads(text.strip())
        return result
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        body = e.response.text[:500] if e.response else ""
        raise HTTPException(status_code=502, detail=f"Gemini API error ({e.response.status_code}): {body}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compare error: {str(e)}")
