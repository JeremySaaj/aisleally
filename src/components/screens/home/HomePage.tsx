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
import { MOCK_RECENT_SEARCHES } from "@/lib/mockData";

/**
 * Screen 2 — Home & Product Search
 *
 * The main hub after profile setup. Displays:
 * - Header with mascot, branding, and "Edit Profile" button
 * - Active Profile card with selected health tags
 * - Search bar
 * - Recent Searches with colour-coded safety indicators
 * - Fallback card for manual ingredient pasting
 */
export default function HomePage() {
  const { profile, isLoading } = useHealthProfile();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showIngredientInput, setShowIngredientInput] = useState(false);
  const [ingredientText, setIngredientText] = useState("");

  /* --- Compute active tags from profile --- */
  const activeTags = profile
    ? [...profile.healthFocusAreas, ...profile.hardExclusions, ...profile.customTags]
    : [];

  return (
    <div className="min-h-screen bg-cream">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8">
              <GroceryMascot className="!w-8 !h-auto" />
            </div>
            <h1 className="text-lg font-extrabold text-primary tracking-tight">
              AisleAlly
            </h1>
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
          <h2 className="text-sm font-bold text-primary mb-3">
            Your Active Profile
          </h2>
          {isLoading ? (
            <p className="text-xs text-gray-500 italic">Loading profile…</p>
          ) : activeTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeTags.map((tag) => (
                <TogglePill
                  key={tag}
                  label={tag}
                  selected={true}
                  readOnly={true}
                />
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
          placeholder="Search for a product..."
        />


        {/* ===== RECENT SEARCHES ===== */}
        <CustomSectionCard>
          <h2 className="text-base font-bold text-primary mb-4">
            Recent Searches
          </h2>
          <div className="space-y-3">
            {MOCK_RECENT_SEARCHES.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                category={product.category}
                status={product.status}
                onClick={() => router.push(`/analyze/${product.id}`)}
              />
            ))}
          </div>
        </CustomSectionCard>


        {/* ===== FALLBACK CARD ===== */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowIngredientInput((prev) => !prev)}
            className="w-full rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 p-6 text-center hover:border-accent hover:bg-accent/5 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            <p className="text-sm font-bold text-primary">
              Can&apos;t find your product?
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Paste ingredients below for instant AI analysis
            </p>
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
                <PrimaryActionButton
                  label="Analyse Ingredients"
                  onClick={() => router.push("/analyze")}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

