"use client";

import { useState } from "react";
import type { HealthStatus } from "@/types/auth";
import HealthStatusBadge from "@/components/ui/HealthStatusBadge";

interface IngredientRowProps {
  /** Ingredient name, e.g. "Carrageenan (407)" */
  name: string;
  /** Safety status — determines dot colour and background */
  status: HealthStatus;
  /** If true, shows "Tap for AI Explanation" hint below the name */
  showExplanationHint: boolean;
  /** AI-generated explanation text (shown when row is expanded) */
  aiExplanation: string;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Visual style overrides per status.
 *
 * - safe    → white background, no border, green dot
 * - caution → light orange background, orange border, orange dot, bold orange name
 * - trigger → light pink background, red border, red dot, bold red name
 */
const rowStyles: Record<
  HealthStatus,
  { bg: string; border: string; nameColor: string }
> = {
  safe: {
    bg: "bg-white",
    border: "border border-gray-100",
    nameColor: "text-primary",
  },
  caution: {
    bg: "bg-orange-50",
    border: "border border-orange-200",
    nameColor: "text-[#F97316]",
  },
  trigger: {
    bg: "bg-red-50",
    border: "border border-red-200",
    nameColor: "text-[#EF4444]",
  },
};

/**
 * A single ingredient row in the Ingredient Breakdown section.
 *
 * Shows a coloured status dot on the left, the ingredient name, and
 * optionally a "Tap for AI Explanation" hint for flagged ingredients.
 * When tapped, the row expands to reveal the AI explanation with a
 * fade-in animation.
 *
 * Used on: Screen 3 (Product Analysis).
 */
export default function IngredientRow({
  name,
  status,
  showExplanationHint,
  aiExplanation,
  className = "",
}: IngredientRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = rowStyles[status];
  const isClickable = showExplanationHint && !!aiExplanation;

  return (
    <div
      className={`rounded-xl ${styles.bg} ${styles.border} transition-all duration-200 ${
        isClickable ? "cursor-pointer" : ""
      } ${className}`}
      onClick={isClickable ? () => setIsExpanded((prev) => !prev) : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsExpanded((prev) => !prev);
              }
            }
          : undefined
      }
      aria-expanded={isClickable ? isExpanded : undefined}
    >
      {/* Main row content */}
      <div className="flex items-center gap-3 p-4">
        {/* Status dot — uses HealthStatusBadge's centralised colour mapping */}
        <HealthStatusBadge
          status={status}
          dotOnly
          className="!h-3 !w-3 flex-shrink-0"
        />

        {/* Ingredient info */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${
              status !== "safe" ? styles.nameColor : "text-primary"
            }`}
          >
            {name}
          </p>
          {showExplanationHint && (
            <p className="text-xs text-gray-400 mt-0.5">
              {status === "safe"
                ? "✨ Tap to learn why this is safe for you"
                : "✨ Tap for AI Explanation"}
            </p>
          )}
        </div>
      </div>

      {/* Expanded AI explanation */}
      {isExpanded && (
        <div
          className="px-4 pb-4 animate-[fadeIn_200ms_ease-out]"
          style={{
            animation: "fadeIn 200ms ease-out",
          }}
        >
          <div className="border-t border-gray-200 mb-3" />
          <p className="text-xs font-semibold text-[#22C55E] mb-1">
            ✨ AI Explanation
          </p>
          <p className="text-xs text-gray-500 italic leading-relaxed">
            {aiExplanation}
          </p>
        </div>
      )}

      {/* Inline keyframes for fade-in */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
