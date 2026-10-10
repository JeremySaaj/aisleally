import React, { useState } from "react";
import type { HealthStatus } from "@/types/auth";
import CustomSectionCard from "@/components/ui/CustomSectionCard";

interface ProductComparisonCardProps {
  /** Product name, e.g. "Sanitarium Almond Milk" */
  name: string;
  /** Subtitle, e.g. "Original · 1L" */
  subtitle: string;
  /** Overall verdict status — determines badge colour */
  status: HealthStatus;
  /** Badge label, e.g. "Trigger Found" or "Safe" */
  verdictLabel: string;
  /** If true, renders a dark forest green "AI PICK" banner across the top */
  isAiPick?: boolean;
  /** "A", "B", or "C" — shown in the avatar when no image is available */
  letter: "A" | "B" | "C";
  /** Product image URL from Open Food Facts */
  imageUrl?: string;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Status-specific styling for the card.
 */
const cardStyles: Record<
  HealthStatus,
  { bg: string; border: string; badgeBg: string }
> = {
  safe: {
    bg: "!bg-[#F0FDF4]",
    border: "!border !border-[#22C55E]",
    badgeBg: "bg-[#22C55E]",
  },
  caution: {
    bg: "!bg-[#FFFBEB]",
    border: "!border !border-[#F97316]",
    badgeBg: "bg-[#F97316]",
  },
  trigger: {
    bg: "!bg-[#FEF2F2]",
    border: "!border !border-[#EF4444]",
    badgeBg: "bg-[#EF4444]",
  },
  unknown: {
    bg: "!bg-gray-50",
    border: "!border !border-gray-200",
    badgeBg: "bg-gray-300",
  },
};

/**
 * A single product card in the side-by-head comparison view.
 *
 * Shows product name, subtitle, avatar (image or letter), and a coloured verdict badge.
 * When `isAiPick` is true, renders a dark forest green banner across the top.
 *
 * Used on: Screen 4 (Head-to-Head Comparison).
 */
export default function ProductComparisonCard({
  name,
  subtitle,
  status,
  verdictLabel,
  isAiPick = false,
  letter,
  imageUrl,
  className = "",
}: ProductComparisonCardProps) {
  const styles = cardStyles[status];
  const [imgError, setImgError] = useState(false);
  const showImage = imageUrl && !imgError;

  return (
    <CustomSectionCard
      className={`!p-0 overflow-hidden flex-1 ${styles.bg} ${styles.border} ${className}`}
    >
      {/* AI PICK banner */}
      {isAiPick && (
        <div className="bg-primary py-1.5 text-center">
          <span className="text-xs font-bold text-white tracking-widest uppercase">
            AI PICK
          </span>
        </div>
      )}

      <div className="flex flex-col items-center text-center px-4 py-5">
        {/* Avatar — product image or letter fallback */}
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-200 overflow-hidden mb-3">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-gray-500 text-lg font-bold">{letter}</span>
          )}
        </div>

        {/* Product name */}
        <p className="text-sm font-bold text-primary leading-tight">{name}</p>

        {/* Subtitle */}
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>

        {/* Verdict badge */}
        <span
          className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${styles.badgeBg}`}
        >
          {verdictLabel}
        </span>
      </div>
    </CustomSectionCard>
  );
}
