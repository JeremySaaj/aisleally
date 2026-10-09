import React from "react";

interface RemovableTagProps {
  /** Display label for the tag */
  label: string;
  /** Callback when the remove (×) button is clicked */
  onRemove: () => void;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Removable tag pill used in the "Selected Profile Tags" box.
 *
 * Light green border (#52B788), green text, with a × remove button.
 *
 * Used on: Screen 2 (Health Focus & Exclusions).
 */
export default function RemovableTag({
  label,
  onRemove,
  className = "",
}: RemovableTagProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-3 py-1.5 rounded-full
        border border-accent text-primary text-sm font-medium
        bg-accent/5
        ${className}
      `}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="
          ml-0.5 flex items-center justify-center w-5 h-5 rounded-full
          text-primary/60 hover:text-red-500 hover:bg-red-50
          transition-colors duration-150 cursor-pointer
          focus:outline-none focus:ring-1 focus:ring-red-300
        "
      >
        <span aria-hidden="true" className="text-base leading-none">×</span>
      </button>
    </span>
  );
}
