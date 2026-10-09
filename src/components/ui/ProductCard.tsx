import React from "react";
import type { HealthStatus } from "@/types/auth";

interface ProductCardProps {
  /** Product name, e.g. "Sanitarium Almond Milk" */
  name: string;
  /** Category text, e.g. "Dairy-free · Beverages" */
  category: string;
  /** Safety status for the coloured dot */
  status: HealthStatus;
  /** Optional click handler */
  onClick?: () => void;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Status dot colour mapping.
 * Matches the exact hex values from the design spec.
 */
const dotColors: Record<HealthStatus, string> = {
  safe: "bg-[#22C55E]",
  caution: "bg-[#F97316]",
  trigger: "bg-[#EF4444]",
};

const statusLabels: Record<HealthStatus, string> = {
  safe: "Safe",
  caution: "Caution — check ingredients",
  trigger: "Trigger — may affect you",
};

/**
 * Recent-search product card.
 *
 * Layout: gray avatar (first letter) | name + category | coloured status dot.
 * Used in the "Recent Searches" section on Screen 2.
 */
export default function ProductCard({
  name,
  category,
  status,
  onClick,
  className = "",
}: ProductCardProps) {
  const firstLetter = name.charAt(0).toUpperCase();

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick
        ? {
            onClick,
            type: "button" as const,
            "aria-label": `${name} — ${statusLabels[status]}`,
          }
        : {})}
      className={`
        flex items-center gap-4 w-full text-left p-4 rounded-xl
        bg-white border border-gray-100 shadow-sm
        transition-all duration-200
        ${onClick ? "cursor-pointer hover:shadow-md hover:border-gray-200" : ""}
        ${className}
      `}
    >
      {/* Avatar — first letter */}
      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 text-gray-500 text-lg font-bold">
        {firstLetter}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary truncate">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{category}</p>
      </div>

      {/* Status dot */}
      <div className="flex-shrink-0 flex items-center">
        <span
          className={`h-3.5 w-3.5 rounded-full ${dotColors[status]}`}
          role="status"
          aria-label={statusLabels[status]}
          title={statusLabels[status]}
        />
      </div>
    </Wrapper>
  );
}
