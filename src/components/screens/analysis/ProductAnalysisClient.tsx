"use client";

import { useEffect, useState } from "react";
import { analyzeProduct, type AnalyzeResult, type SearchProduct } from "@/lib/api";
import type { ProductAnalysis, HealthProfile } from "@/types/auth";
import ProductAnalysisScreen from "./ProductAnalysisScreen";

interface Props {
  productId: string;
}

function mapToProductAnalysis(
  product: SearchProduct,
  result: AnalyzeResult,
): ProductAnalysis {
  return {
    product: {
      id: product.id,
      name: product.name,
      category: product.category,
      status: result.verdict,
    },
    verdict: {
      status: result.verdict,
      title: result.verdict_title,
      subtext: result.verdict_subtext,
    },
    conditionFlags: result.condition_flags,
    ingredients: result.ingredients.map((ing) => ({
      name: ing.name,
      status: ing.status,
      showExplanationHint: true,
      aiExplanation: ing.explanation,
    })),
  };
}

export default function ProductAnalysisClient({ productId }: Props) {
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      // Read product data stored when user clicked the search result
      const raw = sessionStorage.getItem(`aisleally-product-${productId}`);
      if (!raw) {
        setError("Product not found. Please go back and search again.");
        return;
      }
      const product: SearchProduct = JSON.parse(raw);

      // Read health profile from localStorage
      let healthFocusAreas: string[] = [];
      let hardExclusions: string[] = [];
      try {
        const profileRaw = localStorage.getItem("aisleally-profile");
        if (profileRaw) {
          const profile: HealthProfile = JSON.parse(profileRaw);
          healthFocusAreas = profile.healthFocusAreas ?? [];
          hardExclusions = profile.hardExclusions ?? [];
        }
      } catch {
        // No profile — analyze without one
      }

      try {
        const result = await analyzeProduct({
          product_name: product.name,
          ingredients_text: product.ingredients_text,
          health_focus_areas: healthFocusAreas,
          hard_exclusions: hardExclusions,
        });
        setAnalysis(mapToProductAnalysis(product, result));
      } catch (e) {
        setError("Analysis failed. Please try again.");
        console.error(e);
      }
    }

    run();
  }, [productId]);

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

  if (!analysis) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 text-center">
          Analysing ingredients against your profile…
        </p>
      </div>
    );
  }

  return <ProductAnalysisScreen analysis={analysis} />;
}
