import React from "react";
import type { ComparisonRow } from "@/types/auth";

interface ComparisonTableProps {
  /** Array of comparison rows to render */
  ingredients: ComparisonRow[];
  /** Column header for Product A, e.g. "Sanitarium" */
  nameA?: string;
  /** Column header for Product B, e.g. "Aus Own" */
  nameB?: string;
  /** Column header for AI Pick (3-way mode), e.g. "AI Pick" */
  nameC?: string;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Status icon mapping for the table cells.
 * Uses emoji symbols for clarity on mobile.
 */
const statusIcon: Record<string, { symbol: string; color: string; label: string }> = {
  safe: { symbol: "✅", color: "text-[#22C55E]", label: "Safe" },
  caution: { symbol: "⚠️", color: "text-[#F97316]", label: "Caution" },
  trigger: { symbol: "❌", color: "text-[#EF4444]", label: "Trigger" },
};

/**
 * Side-by-side ingredient comparison table.
 *
 * Renders a 3-column table (Ingredient | Product A | Product B) by default,
 * or a 4-column table (Ingredient | Product A | Product B | AI Pick) when
 * `nameC` is provided and rows contain `statusC`.
 *
 * Used on: Screen 4 (Head-to-Head Comparison).
 */
export default function ComparisonTable({
  ingredients,
  nameA = "Product A",
  nameB = "Product B",
  nameC,
  className = "",
}: ComparisonTableProps) {
  const isThreeWay = !!nameC;
  const gridCols = isThreeWay ? "grid-cols-4" : "grid-cols-3";

  return (
    <div
      className={`w-full rounded-xl border border-gray-200 overflow-hidden bg-white ${className}`}
    >
      {/* Header row */}
      <div className={`grid ${gridCols} bg-gray-50 border-b border-gray-200`}>
        <div className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Ingredient
        </div>
        <div className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
          {nameA}
        </div>
        <div className="px-3 py-3 text-xs font-semibold text-primary uppercase tracking-wider text-center">
          {nameB}
        </div>
        {isThreeWay && (
          <div className="px-3 py-3 text-xs font-bold text-[#22C55E] uppercase tracking-wider text-center">
            {nameC}
          </div>
        )}
      </div>

      {/* Data rows */}
      {ingredients.map((row, index) => {
        const iconA = statusIcon[row.statusA];
        const iconB = statusIcon[row.statusB];
        const iconC = row.statusC ? statusIcon[row.statusC] : null;
        const isLast = index === ingredients.length - 1;

        return (
          <div
            key={row.name}
            className={`grid ${gridCols} ${
              isLast ? "" : "border-b border-gray-100"
            }`}
          >
            {/* Ingredient name */}
            <div className="px-3 py-3 text-sm text-gray-700 font-medium">
              {row.name}
            </div>

            {/* Product A status */}
            <div className="px-3 py-3 flex items-center justify-center">
              <span
                role="status"
                aria-label={iconA.label}
                className={`text-base ${iconA.color}`}
              >
                {iconA.symbol}
              </span>
            </div>

            {/* Product B status */}
            <div className="px-3 py-3 flex items-center justify-center">
              <span
                role="status"
                aria-label={iconB.label}
                className={`text-base ${iconB.color}`}
              >
                {iconB.symbol}
              </span>
            </div>

            {/* AI Pick status (3-way only) */}
            {isThreeWay && iconC && (
              <div className="px-3 py-3 flex items-center justify-center">
                <span
                  role="status"
                  aria-label={iconC.label}
                  className={`text-base ${iconC.color}`}
                >
                  {iconC.symbol}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
