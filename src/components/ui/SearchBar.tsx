import React, { type KeyboardEvent } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Called when user presses Enter or clicks the search icon */
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search for a product...",
  className = "",
}: SearchBarProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      e.preventDefault();
      onSearch(value);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => onSearch?.(value)}
        className="pointer-events-auto absolute inset-y-0 left-0 flex items-center pl-4 cursor-pointer"
        aria-label="Search"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-gray-400 hover:text-primary transition-colors"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
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
