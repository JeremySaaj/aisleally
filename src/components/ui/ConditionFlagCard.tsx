import React from "react";

interface ConditionFlagCardProps {
  /** "trigger" → red left border + pink bg, "caution" → orange left border + orange bg */
  status: "trigger" | "caution";
  /** Description text, e.g. "Carrageenan (407) is a thickener linked to gut inflammation..." */
  description: string;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * A flag card with a thick coloured left border indicating severity.
 *
 * - "trigger" → red (#EF4444) left border, light pink background
 * - "caution" → orange (#F97316) left border, light orange background
 *
 * Used on: Screen 3 (Product Analysis) — Condition Flags section.
 */
const flagStyles: Record<
  "trigger" | "caution",
  { border: string; bg: string; icon: string }
> = {
  trigger: {
    border: "border-l-4 border-l-[#EF4444]",
    bg: "bg-red-50",
    icon: "⚠",
  },
  caution: {
    border: "border-l-4 border-l-[#F97316]",
    bg: "bg-orange-50",
    icon: "⚡",
  },
};

export default function ConditionFlagCard({
  status,
  description,
  className = "",
}: ConditionFlagCardProps) {
  const styles = flagStyles[status];

  return (
    <div
      className={`rounded-xl p-4 ${styles.bg} ${styles.border} ${className}`}
      role="alert"
    >
      <p className="text-sm text-gray-700 leading-relaxed">
        <span className="mr-1.5" aria-hidden="true">
          {styles.icon}
        </span>
        {description}
      </p>
    </div>
  );
}
