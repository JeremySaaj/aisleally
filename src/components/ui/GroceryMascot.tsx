import React from "react";

/**
 * AisleAlly grocery bag mascot — a smiling green bag with vegetables
 * and sneakers, rendered as inline SVG.
 *
 * Used on: Screen 2 (Health Focus & Exclusions) header zone.
 */
export default function GroceryMascot({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-28 h-auto ${className}`}
      aria-hidden="true"
      role="img"
    >
      {/* Bag body */}
      <rect x="25" y="55" width="90" height="95" rx="12" fill="#52B788" />
      <rect x="25" y="55" width="90" height="95" rx="12" fill="url(#bagGrad)" />

      {/* Bag fold / rim */}
      <rect x="20" y="48" width="100" height="14" rx="7" fill="#40916C" />

      {/* Left handle */}
      <path
        d="M48 48C48 28 62 20 70 20C78 20 92 28 92 48"
        stroke="#1B4332"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Vegetables poking out — left carrot */}
      <g transform="translate(38, 18) rotate(-15)">
        <rect x="0" y="0" width="6" height="28" rx="3" fill="#F4845F" />
        <path d="M3 0 L0 -8 M3 0 L6 -8" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Vegetables poking out — centre broccoli */}
      <g transform="translate(62, 12)">
        <circle cx="0" cy="0" r="7" fill="#2D6A4F" />
        <circle cx="6" cy="-3" r="5" fill="#40916C" />
        <circle cx="-5" cy="-2" r="5" fill="#2D6A4F" />
        <rect x="-2" y="5" width="4" height="14" rx="2" fill="#6B8F71" />
      </g>

      {/* Vegetables poking out — right celery */}
      <g transform="translate(92, 16) rotate(12)">
        <rect x="0" y="0" width="5" height="26" rx="2.5" fill="#95D5B2" />
        <path d="M2.5 0 L-2 -6 M2.5 0 L7 -6" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Face — white oval */}
      <ellipse cx="70" cy="100" rx="28" ry="26" fill="white" />

      {/* Eyes */}
      <ellipse cx="60" cy="94" rx="3.5" ry="4" fill="#1B4332" />
      <ellipse cx="80" cy="94" rx="3.5" ry="4" fill="#1B4332" />
      {/* Eye highlights */}
      <circle cx="61.5" cy="92.5" r="1.5" fill="white" />
      <circle cx="81.5" cy="92.5" r="1.5" fill="white" />

      {/* Blush */}
      <ellipse cx="52" cy="103" rx="6" ry="3.5" fill="#F8B4B4" opacity="0.5" />
      <ellipse cx="88" cy="103" rx="6" ry="3.5" fill="#F8B4B4" opacity="0.5" />

      {/* Smile */}
      <path
        d="M58 106 Q70 118 82 106"
        stroke="#1B4332"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Sneakers — left */}
      <g>
        <rect x="38" y="150" width="22" height="12" rx="6" fill="#1B4332" />
        <rect x="38" y="152" width="22" height="4" rx="2" fill="white" opacity="0.3" />
        <circle cx="44" cy="156" r="1.5" fill="white" opacity="0.4" />
      </g>

      {/* Sneakers — right */}
      <g>
        <rect x="80" y="150" width="22" height="12" rx="6" fill="#1B4332" />
        <rect x="80" y="152" width="22" height="4" rx="2" fill="white" opacity="0.3" />
        <circle cx="86" cy="156" r="1.5" fill="white" opacity="0.4" />
      </g>

      {/* Gradient definition */}
      <defs>
        <linearGradient id="bagGrad" x1="25" y1="55" x2="115" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#52B788" />
          <stop offset="1" stopColor="#40916C" />
        </linearGradient>
      </defs>
    </svg>
  );
}
