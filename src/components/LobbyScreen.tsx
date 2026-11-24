import React, { useEffect, useState } from 'react';
import { Check, Lock, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Lobby3DPreview } from './Lobby3DPreview';
import { ShoaibStarLogo } from './ShoaibStarLogo';
import { OUTFITS, PersistedGameSave } from '../game/worldLogic';

interface LobbyScreenProps {
  save: PersistedGameSave;
  onSelectOutfit: (outfitId: string) => { status: 'equipped' | 'unlocked' | 'insufficient_coins' };
  onStartGame: () => void;
  onToggleMute: () => void;
  onReplayIntro: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  save,
  onSelectOutfit,
  onStartGame,
  onToggleMute,
  onReplayIntro,
}) => {
  const [notice, setNotice] = useState<string | null>(null);
  const [bgFailed, setBgFailed] = useState(false);

  const selectedOutfit =
    OUTFITS.find((o) => o.id === save.selectedOutfitId) ?? OUTFITS[0];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'BUTTON' || tag === 'INPUT') return;
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStartGame]);

  const handleOutfitClick = (outfitId: string) => {
    const result = onSelectOutfit(outfitId);
    if (result.status === 'insufficient_coins') {
      setNotice('Not enough coins for this outfit yet. Collect coins in the city or talk to Aisha!');
    } else if (result.status === 'unlocked') {
      setNotice('New outfit unlocked and equipped!');
    } else {
      setNotice(null);
    }
  };

  return (
    <main
      data-testid="lobby-screen"
      className="relative min-h-screen w-full bg-[#07080A] text-slate-100 overflow-x-hidden flex flex-col justify-between"
    >
      {/* Subtle GTA Key-Art Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {!bgFailed ? (
          <img
            src="/src/assets/images/shoaib_3d_loading_1795502822668.jpg"
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBgFailed(true)}
            className="w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#19140E] to-[#07080A]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07080A]/85 via-[#07080A]/80 to-[#07080A]" />
      </div>

      {/* Top Game Lobby Bar */}
      <header className="relative z-10 pt-safe px-4 sm:px-8 pt-4 pb-3 flex items-center justify-between gap-3 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <ShoaibStarLogo size="sm" />
          <span className="font-display text-2xl font-bold tracking-wide text-white">
            SHOAIB<span className="text-[#F5A623]">STAR</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live Coin Counter */}
          <div
            data-testid="lobby-coins"
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#14181F] border border-[#F5A623]/40 flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#F5A623]" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="currentColor" stroke="#0B0D10" strokeWidth="2" />
              <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0B0D10">$</text>
            </svg>
            <span className="font-display text-lg font-bold text-[#F5A623] tabular-nums">
              {save.coins.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={save.muted ? 'Unmute Audio' : 'Mute Audio'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#14181F] border border-white/12 text-slate-200 hover:border-[#F5A623] transition-colors"
          >
            {save.muted ? (
              <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#F5A623]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onReplayIntro}
            aria-label="Replay Intro"
            className="min-h-[44px] min-w-[44px] px-3 flex items-center justify-center gap-1.5 rounded-xl bg-[#14181F] border border-white/12 text-xs font-semibold text-slate-200 hover:border-white/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Intro</span>
          </button>
        </div>
      </header>

      {/* Main Lobby Content: 3D Character Dress + Start Game */}
      <section className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 flex flex-col lg:grid lg:grid-cols-12 gap-6 items-center justify-center">
        {/* Left: Live 3D Character Preview & Equipped Dress */}
        <div className="lg:col-span-5 w-full rounded-3xl bg-[#14181F]/95 border border-white/12 p-5 sm:p-6 flex flex-col items-center text-center">
          <p className="text-xs font-semibold tracking-wider text-[#F5A623]">
            3D Home Screen &amp; Wardrobe
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold text-white">
            Shoaib Home
          </h1>

          <div className="mt-3 w-full py-2 rounded-2xl bg-[#0B0D10] border border-white/8 overflow-hidden">
            <Lobby3DPreview outfit={selectedOutfit} />
            <div className="pb-3 px-3">
              <p className="font-display text-xl font-bold text-white">
                {selectedOutfit.name}
              </p>
              <p className="text-xs text-slate-400">
                Drag to rotate 3D character · Ready in Vice Safehouse
              </p>
            </div>
          </div>
        </div>

        {/* Right: Outfit Selector Grid & Start CTA */}
        <div className="lg:col-span-7 w-full space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Select Character Dress
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Pick or unlock an outfit using your Coins before entering your house &amp; city.
            </p>
          </div>

          {notice && (
            <p
              role="status"
              className="rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/35 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#FDE68A]"
            >
              {notice}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OUTFITS.map((outfit) => {
              const isOwned = save.unlockedOutfitIds.includes(outfit.id);
              const isSelected = save.selectedOutfitId === outfit.id;

              return (
                <button
                  key={outfit.id}
                  type="button"
                  onClick={() => handleOutfitClick(outfit.id)}
                  className={`min-h-[72px] p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] ${
                    isSelected
                      ? 'bg-[#F5A623]/15 border-[#F5A623]'
                      : 'bg-[#14181F] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Color swatch */}
                    <span
                      aria-hidden="true"
                      className="w-9 h-9 rounded-xl border border-white/20 shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: outfit.jacketColor }}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: outfit.accentColor }}
                      />
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {outfit.name}
                      </p>
                      <p className="text-xs text-slate-400 tabular-nums">
                        {isSelected
                          ? 'Equipped'
                          : isOwned
                            ? 'Owned · Tap to wear'
                            : `${outfit.price} Coins`}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0">
                    {isSelected ? (
                      <Check className="w-5 h-5 text-[#F5A623]" aria-hidden="true" />
                    ) : isOwned ? (
                      <span className="text-xs font-semibold text-slate-300">Wear</span>
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={onStartGame}
              className="w-full sm:w-auto min-h-[54px] px-8 py-3.5 rounded-2xl bg-[#F5A623] hover:bg-[#e29518] text-[#0B0D10] font-display text-2xl font-extrabold tracking-wide flex items-center justify-center gap-2.5 shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Play className="w-5 h-5 fill-current" aria-hidden="true" />
              <span>START GAME</span>
            </button>
          </div>
        </div>
      </section>

      {/* Clean single-line control hint */}
      <footer className="relative z-10 pb-safe px-4 py-3 text-center text-xs text-slate-400">
        Joystick / WASD Move · Touch Drag Look (1P/2P/3P) · Phone Order Cars
      </footer>
    </main>
  );
};
