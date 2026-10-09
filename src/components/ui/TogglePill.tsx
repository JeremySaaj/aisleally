import React from "react";

interface TogglePillProps {
  /** Display label for the pill */
  label: string;
  /** Whether this pill is currently selected */
  selected: boolean;
  /** Callback when pill is toggled. Not required when readOnly is true. */
  onToggle?: () => void;
  /** If true, renders as a non-interactive display pill (for Active Profile card) */
  readOnly?: boolean;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Reusable toggle pill for health focus areas and hard exclusions.
 *
 * Selected state: dark forest green fill (#1B4332), white text, checkmark (✓)
 * Unselected state: white background, dark border, dark text, plus sign (+)
 *
 * When `readOnly` is true, renders as a non-interactive span for display
 * purposes (e.g., Active Profile card on Screen 2).
 *
 * Used on: Screen 1 (Health Focus & Exclusions), Screen 2 (Home — Active Profile).
 */
export default function TogglePill({
  label,
  selected,
  onToggle,
  readOnly = false,
  className = "",
}: TogglePillProps) {
  const baseClasses = `
    inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium
    ${selected ? "bg-primary text-white shadow-sm" : "bg-white border-2 border-primary/30 text-primary"}
    ${className}
  `;

  const iconClasses = `inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
    selected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
  }`;

  if (readOnly) {
    return (
      <span
        className={baseClasses}
        aria-label={`${label}: ${selected ? "active" : "inactive"}`}
      >
        <span className={iconClasses} aria-hidden="true">
          {selected ? "✓" : "+"}
        </span>
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={selected}
      aria-label={`${label}: ${selected ? "selected" : "not selected"}`}
      onClick={onToggle}
      className={`${baseClasses} cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 hover:border-primary/60 hover:bg-primary/5`}
    >
      <span className={iconClasses} aria-hidden="true">
        {selected ? "✓" : "+"}
      </span>
      {label}
    </button>
  );
}
