from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import httpx
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
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

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

# ── Root ─────────────────────────────────────────────────

@app.get("/")
@app.get("/api")
@app.get("/api/")
def root():
    return {"status": "AisleAlly API is running"}

# ── Health Profile Endpoints ─────────────────────────────

@app.post("/api/profile")
def save_profile(profile: HealthProfile):
    try:
        base = f"{SUPABASE_URL}/rest/v1/health_profiles"
        # Check if exists
        check = httpx.get(
            f"{base}?user_id=eq.{profile.user_id}&select=id",
            headers=sb_headers(), timeout=10.0
        )
        existing = check.json()
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
        data = res.json()
        if not data:
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

# ── Gemini AI Endpoint ───────────────────────────────────

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
