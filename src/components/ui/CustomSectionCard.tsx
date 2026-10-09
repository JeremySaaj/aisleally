import React from "react";

interface CustomSectionCardProps {
  children: React.ReactNode;
  /** Optional card heading rendered at the top */
  title?: string;
  /** Additional Tailwind classes for per-screen overrides */
  className?: string;
}

/**
 * Reusable card wrapper providing consistent rounded corners, shadow,
 * padding, and background across all AisleAlly screens.
 *
 * Used on: Login (Screen 1), Health Focus (Screen 2), Grocery List (Screen 5), etc.
 */
export default function CustomSectionCard({
  children,
  title,
  className = "",
}: CustomSectionCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-lg p-8 max-w-md w-full ${className}`}
    >
      {title && (
        <h2 className="text-2xl font-semibold text-primary mb-6">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
