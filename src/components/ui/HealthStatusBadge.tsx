import React from "react";
import type { HealthStatus } from "@/types/auth";

interface HealthStatusBadgeProps {
  /** "safe" renders green, "caution" renders orange, "trigger" renders red */
  status: HealthStatus;
  /** Override the default label text */
  label?: string;
  /** When true, renders only the coloured dot circle — no pill wrapper or text */
  dotOnly?: boolean;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Dynamic pill/status tag for grocery items.
 *
 * - **"safe"**    → green  — item is compatible with user's health profile
 * - **"caution"** → orange — minor concern (e.g., trace allergens)
 * - **"trigger"** → red    — item may trigger a sensitivity/allergy
 *
 * Set `dotOnly` to render just the coloured circle (used for ingredient rows,
 * verdict cards, etc.).
 *
 * Used on: Screen 2 (Home), Screen 3 (Product Analysis), Screen 5 (Grocery Results).
 */
const statusConfig: Record<
  HealthStatus,
  { bg: string; text: string; ring: string; dot: string; defaultLabel: string }
> = {
  safe: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
    defaultLabel: "Safe",
  },
  caution: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    ring: "ring-orange-600/20",
    dot: "bg-orange-500",
    defaultLabel: "Caution",
  },
  trigger: {
    bg: "bg-red-100",
    text: "text-red-800",
    ring: "ring-red-600/20",
    dot: "bg-red-500",
    defaultLabel: "Trigger",
  },
};

export default function HealthStatusBadge({
  status,
  label,
  dotOnly = false,
  className = "",
}: HealthStatusBadgeProps) {
  const config = statusConfig[status];

  if (dotOnly) {
    return (
      <span
        role="status"
        aria-label={label ?? config.defaultLabel}
        className={`inline-block rounded-full ${config.dot} ${className}`}
      />
    );
  }

  return (
    <span
      role="status"
      aria-label={label ?? config.defaultLabel}
      className={`
        inline-flex items-center rounded-full px-3 py-1 text-xs font-medium
        ring-1 ring-inset ${config.bg} ${config.text} ${config.ring}
        ${className}
      `}
    >
      {/* Coloured dot indicator */}
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${config.dot}`}
        aria-hidden="true"
      />
      {label ?? config.defaultLabel}
    </span>
  );
}
