"use client";

import { Suspense } from "react";
import ComparisonScreen from "@/components/screens/comparison/ComparisonScreen";

/**
 * Route: /compare
 *
 * Screen 4 — Head-to-Head Comparison Engine.
 * Wraps ComparisonScreen in Suspense because it uses useSearchParams(),
 * which requires a Suspense boundary during static prerendering.
 */
export default function CompareRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading comparison…</p>
        </div>
      }
    >
      <ComparisonScreen />
    </Suspense>
  );
}
