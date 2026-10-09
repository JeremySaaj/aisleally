"use client";

import { MeshGradient } from "@paper-design/shaders-react";

/**
 * Animated mesh gradient background using Paper Design shaders.
 *
 * Renders only the MeshGradient element — no page layout, no text, no nav.
 * Designed to be placed as an absolute layer behind content.
 *
 * Used on: Screen 1 (Health Focus header zone).
 */
export default function HeroBackground({ className = "" }: { className?: string }) {
  return (
    <MeshGradient
      className={className}
      colors={["#1B4332", "#52B788", "#D4EDDA", "#95D5B2", "#1B4332"]}
    />
  );
}
