import React, { useEffect } from 'react';
import { ShoaibStarLogo } from './ShoaibStarLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const duration = prefersReducedMotion ? 900 : 2700;
    const timer = window.setTimeout(() => {
      onComplete();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <main
      data-testid="splash-screen"
      className="relative min-h-screen w-full bg-[#07080A] text-white flex flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* Subtle radial amber spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] rounded-full bg-[#F5A623]/15 blur-[90px] animate-shoaib-glow"
      />

      {/* Centered Emblem & Brand Reveal */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <ShoaibStarLogo size="xl" animated />

        <h1 className="mt-7 font-display text-5xl sm:text-6xl font-extrabold tracking-wide text-white animate-shoaib-wordmark">
          SHOAIB<span className="text-[#F5A623]">STAR</span>
        </h1>

        <p className="mt-2 text-sm sm:text-base font-medium tracking-[0.16em] text-slate-400 animate-shoaib-sub">
          ShoaibStar Presents
        </p>
      </div>

      {/* Accessible Skip Intro button */}
      <div className="absolute bottom-8 right-6 sm:bottom-10 sm:right-10 z-20 pb-safe">
        <button
          type="button"
          onClick={onComplete}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/12 text-xs sm:text-sm font-medium text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]"
        >
          Skip Intro
        </button>
      </div>
    </main>
  );
};
