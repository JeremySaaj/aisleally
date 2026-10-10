"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { compareProducts, type CompareResult, type SearchProduct } from "@/lib/api";
import type { HealthStatus } from "@/types/auth";
import HealthStatusBadge from "@/components/ui/HealthStatusBadge";
import CustomSectionCard from "@/components/ui/CustomSectionCard";
import ProductComparisonCard from "@/components/ui/ProductComparisonCard";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";

const verdictLabel: Record<string, string> = {
  safe: "Safe to Eat",
  caution: "Caution — Check Ingredients",
  trigger: "Trigger Found",
};

export default function ComparisonClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const productAId = searchParams.get("productA") ?? "";
  const productBId = searchParams.get("productB") ?? "";

  const [result, setResult] = useState<CompareResult | null>(null);
  const [productAName, setProductAName] = useState("");
  const [productBName, setProductBName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      // Load both products from sessionStorage
      const rawA = sessionStorage.getItem(`aisleally-product-${productAId}`);
      const rawB = sessionStorage.getItem(`aisleally-product-${productBId}`);

      if (!rawA || !rawB) {
        setError("Couldn't find both products. Please go back and try again.");
        return;
      }

      const productA: SearchProduct = JSON.parse(rawA);
      const productB: SearchProduct = JSON.parse(rawB);
      setProductAName(productA.name);
      setProductBName(productB.name);

      // Load health profile
      let healthFocusAreas: string[] = [];
      let hardExclusions: string[] = [];
      try {
        const profileRaw = localStorage.getItem("aisleally-profile");
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          healthFocusAreas = profile.healthFocusAreas ?? [];
          hardExclusions = profile.hardExclusions ?? [];
        }
      } catch { /* no profile */ }

      try {
        const data = await compareProducts({
          product_a_name: productA.name,
          product_a_ingredients: productA.ingredients_text,
          product_b_name: productB.name,
          product_b_ingredients: productB.ingredients_text,
          health_focus_areas: healthFocusAreas,
          hard_exclusions: hardExclusions,
        });
        setResult(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.length > 300 ? msg.slice(0, 300) + "…" : msg);
      }
    }
    run();
  }, [productAId, productBId]);

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-primary">Oops</p>
          <p className="text-sm text-gray-500">{error}</p>
          <a href="/home" className="inline-block mt-4 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 text-center">
          Comparing products against your health profile…
        </p>
      </div>
    );
  }

  const headerA = productAName.split(" ").slice(0, 2).join(" ");
  const headerB = productBName.split(" ").slice(0, 2).join(" ");
  const winnerBadge = result.winner === "A" ? headerA : result.winner === "B" ? headerB : null;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-primary hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <span aria-hidden="true" className="text-lg">←</span>
          </button>
          <h1 className="text-lg font-bold text-primary">Head-to-Head Comparison</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">

        {/* Product cards */}
        <div className="flex items-stretch gap-2">
          <ProductComparisonCard
            name={productAName}
            subtitle={result.product_a.subtitle}
            status={result.product_a.verdict as HealthStatus}
            verdictLabel={result.product_a.verdict_label}
            letter="A"
          />
          <div className="flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-gray-400">VS</span>
          </div>
          <ProductComparisonCard
            name={productBName}
            subtitle={result.product_b.subtitle}
            status={result.product_b.verdict as HealthStatus}
            verdictLabel={result.product_b.verdict_label}
            letter="B"
          />
        </div>

        {/* Winner banner */}
        {winnerBadge && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-white py-3 px-4">
            <span className="text-base">🏆</span>
            <p className="text-sm font-bold">AI Pick: {winnerBadge}</p>
          </div>
        )}

        {/* AI Verdict */}
        <CustomSectionCard className="!bg-[#DCFCE7] !border !border-[#22C55E] !shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <HealthStatusBadge status="safe" dotOnly className="!h-4 !w-4" />
            <h2 className="text-base font-bold text-primary">AI Verdict</h2>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">{result.verdict_text}</p>
          <div className="border-t border-[#22C55E]/30 my-3" />
          <p className="text-sm font-bold text-primary mb-1">Trade-off</p>
          <p className="text-sm text-gray-500 leading-relaxed">{result.tradeoff_text}</p>
        </CustomSectionCard>

        {/* Side-by-side ingredient breakdown */}
        <CustomSectionCard>
          <h2 className="text-base font-bold text-primary mb-4">Ingredient breakdown</h2>
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2 px-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ingredient</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-14 text-center">{headerA}</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-14 text-center">{headerB}</span>
          </div>
          <div className="space-y-2">
            {result.comparison_rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center bg-white rounded-lg px-3 py-2 border border-gray-100">
                <span className="text-sm text-primary truncate">{row.name}</span>
                <div className="w-14 flex justify-center">
                  <HealthStatusBadge status={row.status_a as HealthStatus} dotOnly className="!h-3 !w-3" />
                </div>
                <div className="w-14 flex justify-center">
                  <HealthStatusBadge status={row.status_b as HealthStatus} dotOnly className="!h-3 !w-3" />
                </div>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> Safe</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" /> Caution</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> Trigger</span>
          </div>
        </CustomSectionCard>

        <PrimaryActionButton label="Start New Comparison" onClick={() => router.push("/home")} />
      </main>
    </div>
  );
}
