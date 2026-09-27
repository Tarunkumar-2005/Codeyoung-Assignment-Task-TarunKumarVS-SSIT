import React from 'react';

export default function CodeyoungLogo({ className = 'h-10 w-auto' }) {
  return (
    <div className="flex items-center bg-white rounded-lg select-none">
      <svg
        viewBox="0 0 380 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Codeyoung Logo"
      >
        {/* Crisp White Background */}
        <rect width="380" height="100" fill="#FFFFFF" rx="6" />

        {/* Codeyoung Icon Geometry */}
        <g id="codeyoung-icon" transform="translate(10, 8)">
          {/* Top-left tilted yellow polygon */}
          <path
            d="M16 2L36 6L28 50L58 56L54 75L4 65L16 2Z"
            fill="#FFE600"
          />

          {/* Bottom-right orange polygon */}
          <path
            d="M10 75H60V38H82V96H10V75Z"
            fill="#FFA700"
          />

          {/* Overlapping intersection polygon */}
          <path
            d="M58 50L78 54L75 75L54 75Z"
            fill="#FF5511"
            opacity="0.95"
          />
        </g>

        {/* Wordmark: Codeyoung */}
        <text
          x="108"
          y="66"
          fill="#000000"
          fontFamily="'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="44"
          fontWeight="900"
          letterSpacing="-0.035em"
        >
          Codeyoung
        </text>
      </svg>
    </div>
  );
}
