/**
 * api.ts — AisleAlly Backend Client
 *
 * All calls go to the FastAPI backend. The base URL is set via the
 * NEXT_PUBLIC_BACKEND_URL environment variable (Vercel production) and falls
 * back to localhost:8000 for local development.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ApiHealthProfile {
  user_id: string;
  health_focus_areas: string[];
  hard_exclusions: string[];
  custom_tags: string[];
}

export interface ApiSearchHistoryEntry {
  user_id: string;
  product_id: string;
  product_name: string;
  product_category?: string;
  verdict: string;
  compared_with_id?: string;
  compared_with_name?: string;
  ai_winner?: string;
}

export interface ApiIngredientExplainRequest {
  ingredient: string;
  status: string;
  health_focus_areas?: string[];
  hard_exclusions?: string[];
}

// ── Health Profile ────────────────────────────────────────────────────────────

export async function saveProfile(profile: ApiHealthProfile): Promise<void> {
  await fetch(`${BASE_URL}/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
}

export async function getProfile(
  userId: string,
): Promise<ApiHealthProfile | null> {
  const res = await fetch(`${BASE_URL}/profile/${userId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

// ── Search History ────────────────────────────────────────────────────────────

export async function saveHistory(
  entry: ApiSearchHistoryEntry,
): Promise<void> {
  await fetch(`${BASE_URL}/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

// ── Ingredient Explanation ────────────────────────────────────────────────────

export async function explainIngredient(
  req: ApiIngredientExplainRequest,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to explain ingredient");
  const data = await res.json();
  return data.explanation as string;
}

// ── User ID helper ────────────────────────────────────────────────────────────

/** Returns the current user's ID from localStorage (set at login). */
export function getUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  return localStorage.getItem("aisleally-user-id") ?? "anonymous";
}
