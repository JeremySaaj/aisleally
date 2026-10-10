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

def _correct_query(q: str) -> str:
    """Replace known misspellings in a query string with correct spellings."""
    words = q.split()
    corrected = [FOOD_CORRECTIONS.get(w.lower(), w) for w in words]
    return " ".join(corrected)

def _oof_search(query: str, page_size: int = 20) -> list:
    """Fetch raw product list from Open Food Facts for a given query string."""
    try:
        res = httpx.get(
            "https://world.openfoodfacts.org/cgi/search.pl",
            params={
                "search_terms": query,
                "action": "process",
                "json": "1",
                "fields": "id,product_name,categories_tags,ingredients_text,image_front_small_url,image_url",
                "page_size": str(page_size),
                "sort_by": "unique_scans_n",
                "lc": "en",
            },
            timeout=15.0,
        )
        return res.json().get("products", [])
    except Exception:
        return []

def _clean_products(raw: list) -> list:
    """Filter and normalise a raw OOF product list."""
    products = []
    for p in raw:
        name = (p.get("product_name") or "").strip()
        ingredients = (p.get("ingredients_text") or "").strip()
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
        # ── Correct known misspellings before searching ──────────────
        q_corrected = _correct_query(q)

        # ── Primary search with the full query ──────────────────────────
        primary_raw = _oof_search(q_corrected, page_size=20)
        primary = _clean_products(primary_raw)

        # Deduplicate by product id, preserving order (primary results first)
        seen_ids: set = set()
        merged: list = []
        for prod in primary:
            if prod["id"] and prod["id"] not in seen_ids:
                seen_ids.add(prod["id"])
                merged.append(prod)

        # ── Fallback: search significant individual words ─────────────
        # Kick in when the full-query search returns fewer than 3 usable results,
        # OR always add word-level results to fill gaps (helps with typos /
        # partial words because OOF tokenises differently per word).
        stop_words = {"the", "and", "for", "with", "from", "that", "this",
                      "are", "was", "but", "not", "all", "can", "has", "its"}
        words = [w for w in re.split(r"[\s\-_/]+", q_corrected.lower())
                 if len(w) >= 3 and w not in stop_words]

        # De-duplicate words so we don't fire duplicate requests
        unique_words = list(dict.fromkeys(words))

        # Only fire word searches if we still need more results
        if len(merged) < 6 and unique_words:
            for word in unique_words[:3]:   # at most 3 extra requests
                if len(merged) >= 6:
                    break
                word_raw = _oof_search(word, page_size=10)
                word_products = _clean_products(word_raw)
                for prod in word_products:
                    if prod["id"] and prod["id"] not in seen_ids:
                        seen_ids.add(prod["id"])
                        merged.append(prod)
                    if len(merged) >= 6:
                        break

        return {"products": merged[:6]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Product Analysis (Gemini) ────────────────────────────

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
def ai_pick(name: str, category: str = ""):
    """Use Gemini to suggest a specific real alternative product, then find it on OOF."""
    try:
        name_lower = name.lower()
        original_cats = [w.lower() for w in re.split(r"[\s\-_/]+", category)]
        original_group = _food_group(name, original_cats)

        # ── Helper — find a valid alternative in OOF results ─────────────
        def _try_pick(query: str, strict_group: Optional[str]) -> Optional[dict]:
            raw_products = _oof_search(query, page_size=15)
            for p in raw_products:
                pname = (p.get("product_name") or "").strip()
                ingredients = (p.get("ingredients_text") or "").strip()
                if not pname or not ingredients:
                    continue
                if pname.lower() == name_lower:
                    continue
                if any(kw in pname.lower() for kw in BLOCKED):
                    continue
                non_ascii = sum(1 for c in pname if ord(c) > 127)
                if non_ascii > len(pname) * 0.3:
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

        # ── Step 1: Ask Gemini for specific AU supermarket alternatives ────
        suggestions: list[dict] = []
        try:
            gemini_prompt = f"""You are a nutrition expert helping Australian shoppers find healthier alternatives in supermarkets.

Product to replace:
- Name: {name}
- Category: {category}

Suggest TWO specific alternative products that:
1. Are in the SAME food category (e.g. if it's chips, suggest other chip/snack brands — NOT chocolate or completely different foods)
2. Are real products commonly sold in Australian supermarkets (Woolworths, Coles, Aldi, IGA)
3. Have a specific brand name (not just a generic category like "rice cakes")
4. Are different from the original product

Return ONLY this JSON — no explanation:
{{
  "suggestions": [
    {{"product_name": "Brand Product Name", "search_query": "short 2-3 word search"}},
    {{"product_name": "Brand Product Name 2", "search_query": "short 2-3 word search"}}
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
        queries: list[str] = []
        for s in suggestions[:2]:
            pn = (s.get("product_name") or "").strip()
            sq = (s.get("search_query") or "").strip()
            if pn and pn not in queries:
                queries.append(pn)
            if sq and sq != pn and sq not in queries:
                queries.append(sq)

        # Keyword fallbacks — category words, then name words
        cat_words = [w for w in re.split(r"[\s\-_/]+", category.lower()) if len(w) >= 3]
        name_words = [w for w in re.split(r"[\s\-_/]+", name.lower()) if len(w) >= 3]
        if cat_words:
            q = " ".join(cat_words[:2])
            if q not in queries:
                queries.append(q)
            for w in cat_words[:2]:
                if w not in queries:
                    queries.append(w)
        if name_words:
            q = name_words[0]
            if q not in queries:
                queries.append(q)

        # ── Step 3: Try with food-group filter ────────────────────────────
        for query in queries:
            result = _try_pick(query, original_group)
            if result:
                return result

        # ── Step 4: Relax food-group filter, retry all queries ────────────
        for query in queries:
            result = _try_pick(query, None)
            if result:
                return result

        # ── Step 5: Absolute last resort — broadest possible terms ────────
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
  "verdict_text": "2 sentence explanation of which is better for this user and why",
  "tradeoff_text": "1 sentence describing any trade-offs between the two products",
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
