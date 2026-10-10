"use client";

import { Suspense } from "react";
import ComparisonClient from "@/components/screens/comparison/ComparisonClient";

export default function CompareRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading comparison…</p>
        </div>
      }
    >
      <ComparisonClient />
    </Suspense>
  );
}
