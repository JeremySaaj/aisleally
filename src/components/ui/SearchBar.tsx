import React from "react";

interface SearchBarProps {
  /** Current input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Full-width rounded search input with a magnifying glass icon.
 *
 * Visual-only for MVP — no actual search logic. The parent handles
 * the value state and can wire it to an API later.
 *
 * Used on: Screen 2 (Home & Product Search).
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Search for a product...",
  className = "",
}: SearchBarProps) {
  return (
    <div className={`relative w-full ${className}`}>
      {/* Magnifying glass icon */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-gray-400"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search for a grocery product"
        className="
          w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4
          text-base text-primary placeholder:text-gray-400
          shadow-sm
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
          transition-shadow duration-200
        "
      />
    </div>
  );
}
