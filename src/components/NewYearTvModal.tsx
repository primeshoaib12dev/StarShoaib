import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Tv, X } from 'lucide-react';
import { soundEngine } from '../utils/audioEngine';

interface NewYearTvModalProps {
  onClose: () => void;
}

type TvChannel = 'newyear' | 'citynews' | 'music';

export const NewYearTvModal: React.FC<NewYearTvModalProps> = ({ onClose }) => {
  const [channel, setChannel] = useState<TvChannel>('newyear');
  const [countdown, setCountdown] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (channel !== 'newyear') return;
    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) return 0;
        if (prev === 1) {
          soundEngine.playNewYearFirework();
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [channel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
    }[] = [];

    const colors = ['#F5A623', '#FBBF24', '#F43F5E', '#38BDF8', '#FFFFFF'];

    const spawnBurst = () => {
      const bx = 60 + Math.random() * 360;
      const by = 40 + Math.random() * 110;
      const col = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 24; i++) {
        const ang = (Math.PI * 2 * i) / 24;
        const spd = 45 + Math.random() * 75;
        particles.push({
          x: bx,
          y: by,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 0.9 + Math.random() * 0.5,
          color: col,
        });
      }
    };

    spawnBurst();
    let burstTimer = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      burstTimer += dt;
      if (burstTimer > 0.75) {
        burstTimer = 0;
        spawnBurst();
      }

      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // City skyline silhouette at bottom of TV
      ctx.fillStyle = '#141B29';
      const buildings = [25, 50, 35, 70, 45, 85, 40, 60, 30, 75, 48];
      buildings.forEach((bh, i) => {
        ctx.fillRect(i * 44, canvas.height - bh, 40, bh);
      });

      // Fireworks particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 60 * dt;
        ctx.globalAlpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tv-modal-title"
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 pointer-events-auto"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#14181F] border-2 border-white/15 p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Tv className="w-5 h-5 text-[#F5A623]" aria-hidden="true" />
            <h2
              id="tv-modal-title"
              className="font-display text-2xl font-bold text-white"
            >
              Living Room TV
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Turn off TV"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* TV Screen Bezel */}
        <div className="relative rounded-2xl overflow-hidden border-4 border-[#07080A] bg-[#090D16] aspect-video">
          <canvas
            ref={canvasRef}
            width={480}
            height={270}
            className="w-full h-full block"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/20">
            {channel === 'newyear' && (
              <>
                <p className="text-xs font-semibold tracking-widest text-[#F5A623]">
                  SHOAIB CITY LIVE BROADCAST
                </p>
                <p className="mt-1 font-display text-4xl sm:text-5xl font-extrabold text-white drop-shadow">
                  {countdown > 0 ? `00:00:0${countdown}` : 'HAPPY NEW YEAR!'}
                </p>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-200">
                  {countdown > 0
                    ? 'Midnight fireworks countdown starting now!'
                    : '2027 Celebration Live from Star Tower & Harbour!'}
                </p>
              </>
            )}
            {channel === 'citynews' && (
              <>
                <p className="text-xs font-semibold text-sky-400">CITY TRAFFIC CAM</p>
                <p className="mt-1 font-display text-3xl font-bold text-white">
                  Streets Clear for Night Cruise
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  StarMotors reports instant car deliveries outside Shoaib House.
                </p>
              </>
            )}
            {channel === 'music' && (
              <>
                <p className="text-xs font-semibold text-amber-300">SHOAIBSTAR FM 98.4</p>
                <p className="mt-1 font-display text-3xl font-bold text-white">
                  West Coast Midnight Synth
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Non-stop celebration mix with Aisha &amp; Shoaib.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Channel Controls + Celebrate Firework Button */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'newyear', label: 'New Year TV' },
                { id: 'citynews', label: 'City News' },
                { id: 'music', label: 'FM Music' },
              ] as const
            ).map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setChannel(ch.id);
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  channel === ch.id
                    ? 'bg-[#F5A623] text-[#0B0D10]'
                    : 'bg-white/8 text-slate-200 hover:bg-white/15'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setCountdown(0);
              soundEngine.playNewYearFirework();
            }}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#F5A623] flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Fireworks!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
