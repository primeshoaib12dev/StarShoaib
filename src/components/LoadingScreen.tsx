import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ShoaibStarLogo } from './ShoaibStarLogo';

interface LoadingScreenProps {
  muted: boolean;
  onToggleMute: () => void;
  onComplete: () => void;
}

interface LoadingSlide {
  src: string;
  caption: string;
  phase: string;
}

const LOADING_SLIDES: LoadingSlide[] = [
  {
    src: '/src/assets/images/shoaib_3d_loading_1795502822668.jpg',
    caption: 'ShoaibStar 3D · Vice City Sunset & Lamborghini',
    phase: 'Loading 3D Characters, Cars & Safehouse',
  },
  {
    src: '/src/assets/images/gta_couple_sunset_loading_1795501441962.jpg',
    caption: 'Shoaib & Aisha · Sunset Boulevard',
    phase: 'Preparing Villa Garden & Bathroom Spa',
  },
  {
    src: '/src/assets/images/gta_couple_newyear_loading_1795501441926.jpg',
    caption: 'New Year Eve · Downtown Skyline',
    phase: 'Syncing Lamborghini, BMW, Mercedes & Tata',
  },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  muted,
  onToggleMute,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [failedSlides, setFailedSlides] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setProgress(100);
      const fast = window.setTimeout(onComplete, 550);
      return () => window.clearTimeout(fast);
    }

    const progressTimer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(100, prev + 2);
      });
    }, 90);

    // Rotate GTA Couple & City loading screens automatically
    const slideTimer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % LOADING_SLIDES.length);
    }, 1550);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(slideTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    if (progress >= 100) {
      const doneTimer = window.setTimeout(onComplete, 350);
      return () => window.clearTimeout(doneTimer);
    }
  }, [progress, onComplete]);

  const activeSlide = LOADING_SLIDES[slideIndex];

  return (
    <main
      data-testid="loading-screen"
      className="fixed inset-0 w-screen h-screen bg-[#07080A] text-slate-100 overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Fullscreen Rotating GTA Artwork Backdrop */}
      <div className="absolute inset-0 z-0">
        {LOADING_SLIDES.map((slide, idx) => {
          const isCurrent = idx === slideIndex;
          const isFailed = failedSlides[idx];
          return (
            <div
              key={slide.src}
              aria-hidden={!isCurrent}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                isCurrent ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {!isFailed ? (
                <img
                  src={slide.src}
                  alt={slide.caption}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setFailedSlides((prev) => ({ ...prev, [idx]: true }))
                  }
                  className={`w-full h-full object-cover object-center transition-transform duration-[2200ms] ease-out ${
                    isCurrent ? 'scale-105' : 'scale-100'
                  }`}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1C160E] via-[#10141C] to-[#07080A]" />
              )}
            </div>
          );
        })}

        {/* Measured directional scrim for high contrast on left & bottom */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#07080A] via-[#07080A]/55 to-[#07080A]/45"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#07080A]/85 via-[#07080A]/30 to-transparent"
        />
      </div>

      {/* Top Bar: Brand + Audio + Skip */}
      <header className="relative z-10 pt-safe px-5 sm:px-10 pt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShoaibStarLogo size="sm" />
          <span className="font-display text-2xl font-bold tracking-wide text-white">
            SHOAIB<span className="text-[#F5A623]">STAR</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#0B0D10]/85 hover:bg-[#14181F] border border-white/15 text-slate-100 flex items-center justify-center gap-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#F5A623]" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{muted ? 'Muted' : 'Audio On'}</span>
          </button>

          <button
            type="button"
            onClick={onComplete}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0B0D10]/85 hover:bg-[#14181F] border border-white/15 text-xs sm:text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]"
          >
            Enter Lobby
          </button>
        </div>
      </header>

      {/* Left/Bottom Artwork Title & Slide Dots */}
      <section className="relative z-10 px-5 sm:px-10 my-auto max-w-xl">
        <p className="text-sm font-semibold tracking-wide text-[#F5A623]">
          {activeSlide.caption}
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.02] text-balance">
          Shoaib &amp; Aisha
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-slate-200 max-w-md leading-relaxed">
          Loading your safehouse, city streets, smartphone car delivery, and New Year celebration.
        </p>

        {/* Slide switcher dots */}
        <div className="mt-5 flex items-center gap-2" aria-label="Artwork slides">
          {LOADING_SLIDES.map((s, idx) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setSlideIndex(idx)}
              aria-label={`View artwork ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === slideIndex
                  ? 'w-7 bg-[#F5A623]'
                  : 'w-2.5 bg-white/35 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Bottom Rotating GTA Loader + Progress Bar */}
      <footer className="relative z-10 pb-safe px-5 sm:px-10 pb-7 sm:pb-9">
        <div className="max-w-7xl mx-auto flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-4">
            {/* Rotating GTA-style spinner + current phase */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                aria-hidden="true"
                className="w-7 h-7 rounded-full border-[3px] border-white/15 border-t-[#F5A623] border-r-[#F5A623] animate-spin shrink-0"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                {activeSlide.phase}
              </span>
            </div>

            <span
              aria-label="Loading percentage"
              className="font-display text-2xl sm:text-3xl font-bold text-[#F5A623] tabular-nums shrink-0"
            >
              {progress}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Game loading progress"
            className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden border border-white/10"
          >
            <div
              className="h-full bg-[#F5A623] rounded-full transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </footer>
    </main>
  );
};
