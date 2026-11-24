import React from 'react';

interface ShoaibStarLogoProps {
  size?: 'sm' | 'md' | 'xl';
  animated?: boolean;
}

export const ShoaibStarLogo: React.FC<ShoaibStarLogoProps> = ({
  size = 'md',
  animated = false,
}) => {
  const dimensions =
    size === 'xl'
      ? 'w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-[4px]'
      : size === 'md'
        ? 'w-12 h-12 rounded-xl border-2'
        : 'w-8 h-8 rounded-lg border-[1.5px]';

  const letterClass =
    size === 'xl'
      ? 'text-[5.25rem] sm:text-[6.5rem]'
      : size === 'md'
        ? 'text-3xl'
        : 'text-xl';

  const starDimensions =
    size === 'xl'
      ? 'w-9 h-9 sm:w-11 sm:h-11 bottom-2.5 right-2.5 sm:bottom-3 sm:right-3'
      : size === 'md'
        ? 'w-3.5 h-3.5 bottom-1 right-1'
        : 'w-2.5 h-2.5 bottom-0.5 right-0.5';

  return (
    <div
      className={`relative overflow-hidden select-none bg-[#F5A623] border-[#0B0D10] ring-2 ring-white/90 shadow-2xl flex items-center justify-center ${dimensions} ${
        animated ? 'animate-shoaib-emblem' : ''
      }`}
      aria-hidden="true"
    >
      {/* Bold Rockstar-style geometric S monogram */}
      <span
        className={`font-display font-extrabold leading-none text-[#0B0D10] tracking-tighter -translate-x-[6%] -translate-y-[4%] ${letterClass}`}
      >
        S
      </span>

      {/* Iconic 5-pointed star mark */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`absolute text-[#0B0D10] ${starDimensions} ${
          animated ? 'animate-shoaib-star' : ''
        }`}
      >
        <path d="M12 1.8l3.09 6.26 6.91 1-5 4.87 1.18 6.88L12 17.56l-6.18 3.25L7 13.93 2 9.06l6.91-1L12 1.8z" />
      </svg>

      {/* Diagonal sheen sweep during splash animation */}
      {animated && (
        <div className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/75 to-transparent animate-shoaib-sheen" />
      )}
    </div>
  );
};
