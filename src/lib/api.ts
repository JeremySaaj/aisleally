/**
 * api.ts — AisleAlly Backend Client
 *
 * All calls go to the FastAPI backend. In production (Vercel), BASE_URL is ""
 * so requests use relative paths like /api/profile — Vercel rewrites these to
 * the FastAPI backend service. In local dev, set NEXT_PUBLIC_BACKEND_URL=http://localhost:8000.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

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
  await fetch(`${BASE_URL}/api/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
}

export async function getProfile(
  userId: string,
): Promise<ApiHealthProfile | null> {
  const res = await fetch(`${BASE_URL}/api/profile/${userId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

// ── Search History ────────────────────────────────────────────────────────────

export async function saveHistory(
  entry: ApiSearchHistoryEntry,
): Promise<void> {
  await fetch(`${BASE_URL}/api/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

// ── Ingredient Explanation ────────────────────────────────────────────────────

export async function explainIngredient(
  req: ApiIngredientExplainRequest,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/explain`, {
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

// ── Product Search ────────────────────────────────────────────────────────────

export interface SearchProduct {
  id: string;
  name: string;
  category: string;
  ingredients_text: string;
  image_url?: string;
}

export async function searchProducts(q: string): Promise<SearchProduct[]> {
  const res = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return (data.products ?? []) as SearchProduct[];
}

// ── Product Analysis ──────────────────────────────────────────────────────────

export interface AnalyzeIngredient {
  name: string;
  status: "safe" | "caution" | "trigger";
  explanation: string;
}

export interface AnalyzeResult {
  verdict: "safe" | "caution" | "trigger";
  verdict_title: string;
  verdict_subtext: string;
  condition_flags: Array<{ status: "trigger" | "caution"; description: string }>;
  ingredients: AnalyzeIngredient[];
}

export async function analyzeProduct(req: {
  product_name: string;
  ingredients_text: string;
  health_focus_areas?: string[];
  hard_exclusions?: string[];
}): Promise<AnalyzeResult> {
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Analysis failed: ${await res.text()}`);
  return res.json();
}

// ── Compare ──────────────────────────────────────────────────────────────────

export interface CompareRequest {
  product_a_name: string;
  product_a_ingredients: string;
  product_b_name: string;
  product_b_ingredients: string;
  health_focus_areas: string[];
  hard_exclusions: string[];
}

export interface CompareResult {
  product_a: { verdict: HealthStatus; verdict_label: string; subtitle: string };
  product_b: { verdict: HealthStatus; verdict_label: string; subtitle: string };
  winner: "A" | "B" | "tie";
  verdict_text: string;
  tradeoff_text: string;
  comparison_rows: Array<{ name: string; status_a: HealthStatus; status_b: HealthStatus }>;
}

type HealthStatus = "safe" | "caution" | "trigger" | "unknown";

export async function compareProducts(req: CompareRequest): Promise<CompareResult> {
  const res = await fetch(`${BASE_URL}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Compare failed: ${await res.text()}`);
  return res.json();
}
