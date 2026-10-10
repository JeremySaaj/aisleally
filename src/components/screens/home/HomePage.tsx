"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useHealthProfile } from "@/context/HealthProfileContext";
import CustomSectionCard from "@/components/ui/CustomSectionCard";
import TogglePill from "@/components/ui/TogglePill";
import SearchBar from "@/components/ui/SearchBar";
import ProductCard from "@/components/ui/ProductCard";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";
import GroceryMascot from "@/components/ui/GroceryMascot";
import { searchProducts, type SearchProduct } from "@/lib/api";

export default function HomePage() {
  const { profile, isLoading } = useHealthProfile();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [showIngredientInput, setShowIngredientInput] = useState(false);
  const [ingredientText, setIngredientText] = useState("");

  const activeTags = profile
    ? [...profile.healthFocusAreas, ...profile.hardExclusions, ...profile.customTags]
    : [];

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    setSearchError("");
    setHasSearched(true);
    try {
      const results = await searchProducts(q.trim());
      setSearchResults(results);
    } catch {
      setSearchError("Search failed. Try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: SearchProduct) => {
    // Store product data in sessionStorage so the analyze page can read it
    sessionStorage.setItem(`aisleally-product-${product.id}`, JSON.stringify(product));
    router.push(`/analyze/${product.id}`);
  };

  const handleAnalyzePasted = () => {
    const pastedProduct: SearchProduct = {
      id: "pasted-" + Date.now(),
      name: "Custom Product",
      category: "Manual Entry",
      ingredients_text: ingredientText.trim(),
    };
    const id = pastedProduct.id;
    sessionStorage.setItem(`aisleally-product-${id}`, JSON.stringify(pastedProduct));
    router.push(`/analyze/${id}`);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8">
              <GroceryMascot className="!w-8 !h-auto" />
            </div>
            <h1 className="text-lg font-extrabold text-primary tracking-tight">AisleAlly</h1>
          </div>
          <Link
            href="/onboarding"
            className="px-4 py-1.5 rounded-full border-2 border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors"
          >
            Edit Profile
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">

        {/* ===== ACTIVE PROFILE CARD ===== */}
        <CustomSectionCard className="!bg-[#D4EDDA] !shadow-md">
          <h2 className="text-sm font-bold text-primary mb-3">Your Active Profile</h2>
          {isLoading ? (
            <p className="text-xs text-gray-500 italic">Loading profile…</p>
          ) : activeTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeTags.map((tag) => (
                <TogglePill key={tag} label={tag} selected={true} readOnly={true} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">
              No profile set.{" "}
              <Link href="/onboarding" className="text-primary underline font-medium">
                Create one
              </Link>
            </p>
          )}
        </CustomSectionCard>

        {/* ===== SEARCH BAR ===== */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search a product name and press Enter…"
        />

        {/* ===== SEARCH RESULTS ===== */}
        {isSearching && (
          <div className="text-center py-6 text-sm text-gray-400">Searching…</div>
        )}

        {!isSearching && searchError && (
          <p className="text-sm text-red-500 text-center">{searchError}</p>
        )}

        {!isSearching && hasSearched && searchResults.length === 0 && !searchError && (
          <p className="text-sm text-gray-400 text-center">No products found. Try a different name.</p>
        )}

        {!isSearching && searchResults.length > 0 && (
          <CustomSectionCard>
            <h2 className="text-base font-bold text-primary mb-4">
              Results for &ldquo;{searchQuery}&rdquo;
            </h2>
            <div className="space-y-3">
              {searchResults.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  category={product.category}
                  status="unknown"
                  onClick={() => handleSelectProduct(product)}
                />
              ))}
            </div>
          </CustomSectionCard>
        )}

        {/* ===== FALLBACK CARD ===== */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowIngredientInput((prev) => !prev)}
            className="w-full rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 p-6 text-center hover:border-accent hover:bg-accent/5 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            <p className="text-sm font-bold text-primary">Can&apos;t find your product?</p>
            <p className="text-xs text-gray-400 mt-1">Paste ingredients below for instant AI analysis</p>
          </button>

          {showIngredientInput && (
            <div className="space-y-3">
              <textarea
                value={ingredientText}
                onChange={(e) => setIngredientText(e.target.value)}
                placeholder="Paste ingredient list here (e.g. Water, Almonds 2.5%, Carrageenan 407, Sunflower Lecithin...)"
                rows={4}
                aria-label="Ingredient list"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-primary placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-150 resize-none"
              />
              {ingredientText.trim().length > 0 && (
                <PrimaryActionButton label="Analyse Ingredients" onClick={handleAnalyzePasted} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
