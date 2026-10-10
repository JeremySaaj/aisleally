"use client";

import { useState, useEffect } from "react";
import { saveHistory, getUserId, searchProducts, type SearchProduct } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { ProductAnalysis } from "@/types/auth";
import HealthStatusBadge from "@/components/ui/HealthStatusBadge";
import CustomSectionCard from "@/components/ui/CustomSectionCard";
import ProductCard from "@/components/ui/ProductCard";
import ConditionFlagCard from "@/components/ui/ConditionFlagCard";
import IngredientRow from "@/components/ui/IngredientRow";
import { FlowButton } from "@/components/ui/FlowButton";

/**
 * Screen 3 — Product Analysis (Traffic Light Card)
 *
 * Displays a detailed ingredient-level breakdown of a selected product.
 * Accepts a `ProductAnalysis` object as a prop so it can be driven by
 * dynamic route data.
 */
export default function ProductAnalysisScreen({
  analysis,
}: {
  analysis: ProductAnalysis;
}) {
  const router = useRouter();
  const { product, verdict, conditionFlags, ingredients } = analysis;

  // Log product view to Supabase search history (fire-and-forget)
  useEffect(() => {
    saveHistory({
      user_id: getUserId(),
      product_id: product.id,
      product_name: product.name,
      product_category: product.category,
      verdict: verdict.status,
    }).catch(() => {});
  }, [product.id, product.name, product.category, verdict.status]);

  // State for the search-based comparison flow
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null);
  const [suggestions, setSuggestions] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingAiPick, setLoadingAiPick] = useState(false);
  const [aiPickError, setAiPickError] = useState<string | null>(null);

  // Live search via Open Food Facts
  useEffect(() => {
    if (!searchQuery.trim()) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchProducts(searchQuery);
        // Exclude the product currently being analysed
        setSuggestions(results.filter((r) => r.id !== product.id));
      } catch { setSuggestions([]); }
      finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, product.id]);

  const filteredSuggestions = suggestions;

  return (
    <div className="min-h-screen bg-cream">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/home")}
            aria-label="Go back to Home"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-primary hover:bg-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <span aria-hidden="true" className="text-lg">←</span>
          </button>
          <h1 className="text-lg font-bold text-primary">Product Analysis</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">

        {/* ===== PRODUCT CARD ===== */}
        <ProductCard
          name={product.name}
          category={product.category}
          status={product.status}
          imageUrl={product.image_url}
        />

        {/* ===== VERDICT CARD ===== */}
        <CustomSectionCard className="!bg-red-50 !border !border-red-200 !shadow-sm">
          <div className="flex flex-col items-center text-center py-2">
            <HealthStatusBadge
              status={verdict.status}
              dotOnly
              className="!h-5 !w-5 mb-3"
            />
            <h2 className="text-xl font-bold text-[#EF4444] mb-1">
              {verdict.title}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {verdict.subtext}
            </p>
          </div>
        </CustomSectionCard>

        {/* ===== CONDITION FLAGS ===== */}
        <CustomSectionCard>
          <h2 className="text-base font-bold text-primary mb-4">
            Condition flags
          </h2>
          <div className="space-y-3">
            {conditionFlags.map((flag, index) => (
              <ConditionFlagCard
                key={index}
                status={flag.status}
                description={flag.description}
              />
            ))}
          </div>
        </CustomSectionCard>

        {/* ===== INGREDIENT BREAKDOWN ===== */}
        <CustomSectionCard>
          <h2 className="text-base font-bold text-primary mb-4">
            Ingredient Breakdown
          </h2>
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <IngredientRow
                key={index}
                name={ingredient.name}
                status={ingredient.status}
                showExplanationHint={true}
                aiExplanation={ingredient.aiExplanation}
              />
            ))}
          </div>
        </CustomSectionCard>

        {/* ===== COMPARE WITH ANOTHER PRODUCT ===== */}
        <CustomSectionCard>
          <h2 className="text-base font-bold text-primary mb-4">
            Compare with another product
          </h2>

          {/* ── Search input ── */}
          <div className="relative">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-[#1B4332] focus-within:ring-1 focus-within:ring-[#1B4332] transition-colors">
              <span className="text-gray-400 text-base" aria-hidden="true">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay hiding so click events on suggestions can fire
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                placeholder="Search for a product to compare..."
                className="flex-1 text-sm text-primary placeholder:text-gray-400 bg-transparent outline-none"
              />
            </div>

            {/* ── Suggestions dropdown ── */}
            {showSuggestions && searchQuery.trim() && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                {isSearching && (
                  <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>
                )}
                {!isSearching && filteredSuggestions.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400">No products found</div>
                )}
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedProduct(suggestion);
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-primary hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <span className="font-medium">{suggestion.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{suggestion.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Selected product display ── */}
          {selectedProduct && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-[#22C55E] bg-[#F0FDF4] px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">
                  {selectedProduct.name}
                </p>
              </div>
              <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-[#22C55E] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Selected ✓
              </span>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                aria-label="Clear selection"
                className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* ── Run Head-to-Head button (when product selected) ── */}
          {selectedProduct && (
            <div className="mt-4">
              <FlowButton
                text="Run Head-to-Head Comparison"
                onClick={() => {
                  // Store product B so ComparisonClient can read it
                  sessionStorage.setItem(
                    `aisleally-product-${selectedProduct.id}`,
                    JSON.stringify(selectedProduct),
                  );
                  // Also make product A available to compare page (re-store with full ingredients)
                  sessionStorage.setItem(
                    `aisleally-compare-a`,
                    JSON.stringify({ id: product.id, name: product.name, category: product.category }),
                  );
                  router.push(`/compare?productA=${product.id}&productB=${selectedProduct.id}`);
                }}
              />
            </div>
          )}
        </CustomSectionCard>

        {/* ===== DIVIDER with "or" ===== */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* ===== AI PICK BUTTON ===== */}
        <button
          type="button"
          disabled={loadingAiPick}
          onClick={async () => {
            setLoadingAiPick(true);
            setAiPickError(null);
            try {
              // Pass condition flags so Gemini knows what was flagged
              const flagDescriptions = conditionFlags
                .map((f) => f.description)
                .filter(Boolean)
                .join("; ");

              // Pass hard exclusions so Gemini avoids suggesting products
              // that also contain the user's known trigger ingredients
              let hardExclusions = "";
              try {
                const profileRaw = localStorage.getItem("aisleally-profile");
                if (profileRaw) {
                  const profile = JSON.parse(profileRaw);
                  hardExclusions = (profile.hardExclusions ?? []).join(", ");
                }
              } catch { /* no profile */ }

              const params = new URLSearchParams({
                name: product.name,
                category: product.category ?? "",
                flags: flagDescriptions,
                exclusions: hardExclusions,
              });
              const res = await fetch(`/api/ai-pick?${params}`);
              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.detail || "No similar product found");
              }
              const alt = await res.json();
              // Store AI pick in sessionStorage so ComparisonClient can read it
              sessionStorage.setItem(`aisleally-product-${alt.id}`, JSON.stringify(alt));
              router.push(`/compare?productA=${product.id}&productB=${alt.id}`);
            } catch (e) {
              setAiPickError(
                e instanceof Error ? e.message : "Couldn't find a similar product to compare."
              );
            } finally {
              setLoadingAiPick(false);
            }
          }}
          className="w-full rounded-xl border-[1.5px] border-[#1B4332] bg-transparent text-[#1B4332] text-sm font-semibold py-3 px-6 hover:bg-[#1B4332] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          {loadingAiPick ? "Finding alternative…" : "⚡ Compare with AI Pick"}
        </button>

        {/* AI pick error — shown inline, not as an alert() */}
        {aiPickError && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold mb-0.5">No match found</p>
            <p className="text-xs text-amber-700">
              We couldn&apos;t find a similar product in the same category. Try searching for a specific brand above to compare manually.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

