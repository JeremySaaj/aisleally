"use client";

import { useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import HealthStatusBadge from "@/components/ui/HealthStatusBadge";
import CustomSectionCard from "@/components/ui/CustomSectionCard";
import ProductComparisonCard from "@/components/ui/ProductComparisonCard";
import ComparisonTable from "@/components/ui/ComparisonTable";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";
import { getComparison, getThreeWayComparison } from "@/lib/mockComparison";
import { saveHistory, getUserId } from "@/lib/api";

/**
 * Screen 4 — Head-to-Head Comparison Engine
 *
 * Supports two modes:
 * - 2-way: productA vs AI Pick (default)
 * - 3-way: productA vs productB vs AI Pick (when aiPick=true in URL)
 */
export default function ComparisonScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const productAId = searchParams.get("productA") ?? "";
  const productBId = searchParams.get("productB") ?? undefined;
  const isThreeWay = searchParams.get("aiPick") === "true" && !!productBId;

  // Load the appropriate comparison data
  const threeWayData = isThreeWay
    ? getThreeWayComparison(productAId, productBId!)
    : undefined;
  const twoWayData = !isThreeWay
    ? getComparison(productAId, productBId)
    : undefined;
  const data = threeWayData ?? twoWayData;

  // Graceful fallback when no matching comparison is found
  if (!data) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-lg font-bold text-primary mb-2">
            No comparison found
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Go back and select a product to compare.
          </p>
          <PrimaryActionButton
            label="Back to Home"
            onClick={() => router.push("/home")}
          />
        </div>
      </div>
    );
  }

  // Log comparison to Supabase search history (fire-and-forget)
  useEffect(() => {
    const aiPick = ('isAiPick' in data.productB && data.productB.isAiPick) ? data.productB.name : undefined;
    saveHistory({
      user_id: getUserId(),
      product_id: data.productA.name.toLowerCase().replace(/\s+/g, "-"),
      product_name: data.productA.name,
      verdict: data.productA.status,
      compared_with_id: data.productB.name.toLowerCase().replace(/\s+/g, "-"),
      compared_with_name: data.productB.name,
      ai_winner: aiPick,
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive short column header names from the full product names
  const headerA = data.productA.name.split(" ").slice(0, 2).join(" ");
  const headerB = data.productB.name.split(" ").slice(0, 2).join(" ");

  return (
    <div className="min-h-screen bg-cream">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back to Product Analysis"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-primary hover:bg-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <span aria-hidden="true" className="text-lg">←</span>
          </button>
          <h1 className="text-lg font-bold text-primary">
            {isThreeWay ? "3-Way Comparison" : "Head-to-Head Comparison"}
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">

        {/* ===== PRODUCT CARDS ===== */}
        {isThreeWay && threeWayData ? (
          /* ── 3-way: A | VS | B | VS | AI Pick ── */
          <div className="flex items-stretch gap-1.5">
            <ProductComparisonCard
              name={threeWayData.productA.name}
              subtitle={threeWayData.productA.subtitle}
              status={threeWayData.productA.status}
              verdictLabel={threeWayData.productA.verdictLabel}
              letter="A"
            />
            <div className="flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-gray-400">VS</span>
            </div>
            <ProductComparisonCard
              name={threeWayData.productB.name}
              subtitle={threeWayData.productB.subtitle}
              status={threeWayData.productB.status}
              verdictLabel={threeWayData.productB.verdictLabel}
              letter="B"
            />
            <div className="flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-gray-400">VS</span>
            </div>
            <ProductComparisonCard
              name={threeWayData.aiPick.name}
              subtitle={threeWayData.aiPick.subtitle}
              status={threeWayData.aiPick.status}
              verdictLabel={threeWayData.aiPick.verdictLabel}
              isAiPick
              letter="C"
            />
          </div>
        ) : (
          /* ── 2-way: A | VS | B ── */
          <div className="flex items-stretch gap-2">
            <ProductComparisonCard
              name={data.productA.name}
              subtitle={data.productA.subtitle}
              status={data.productA.status}
              verdictLabel={data.productA.verdictLabel}
              letter="A"
            />
            <div className="flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-gray-400">VS</span>
            </div>
            <ProductComparisonCard
              name={twoWayData!.productB.name}
              subtitle={twoWayData!.productB.subtitle}
              status={twoWayData!.productB.status}
              verdictLabel={twoWayData!.productB.verdictLabel}
              isAiPick={twoWayData!.productB.isAiPick}
              letter="B"
            />
          </div>
        )}

        {/* ===== AI VERDICT CARD ===== */}
        <CustomSectionCard className="!bg-[#DCFCE7] !border !border-[#22C55E] !shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <HealthStatusBadge status="safe" dotOnly className="!h-4 !w-4" />
            <h2 className="text-base font-bold text-primary">AI Verdict</h2>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {data.verdict.text}
          </p>
          <div className="border-t border-[#22C55E]/30 my-3" />
          <p className="text-sm font-bold text-primary mb-1">Trade-off</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            {data.verdict.tradeoff}
          </p>
          {/* Extra 3-way insight */}
          {isThreeWay && threeWayData && (
            <>
              <div className="border-t border-[#22C55E]/30 my-3" />
              <p className="text-sm font-bold text-primary mb-1">
                Why AI Pick still wins
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {threeWayData.verdict.threeWayText}
              </p>
            </>
          )}
        </CustomSectionCard>


        {/* ===== SIDE-BY-SIDE BREAKDOWN TABLE ===== */}
        <CustomSectionCard>
          <h2 className="text-base font-bold text-primary mb-4">
            Side-by-side breakdown
          </h2>
          {isThreeWay && threeWayData ? (
            <ComparisonTable
              ingredients={threeWayData.comparisonRows}
              nameA={headerA}
              nameB={headerB}
              nameC="AI Pick"
            />
          ) : (
            <ComparisonTable
              ingredients={data.comparisonRows}
              nameA={headerA}
              nameB={headerB}
            />
          )}
        </CustomSectionCard>

        {/* ===== CTA ===== */}
        <PrimaryActionButton
          label="Start New Comparison"
          onClick={() => router.push("/home")}
        />
      </main>
    </div>
  );
}

