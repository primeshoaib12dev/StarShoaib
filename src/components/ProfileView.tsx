import React, { useState } from 'react';
import { RotateCcw, Smartphone } from 'lucide-react';
import {
  PlayerProfile,
  validateProfileUpdate,
} from '../utils/dashboardLogic';

interface ProfileViewProps {
  profile: PlayerProfile;
  onUpdateProfile: (next: PlayerProfile) => void;
  onReplayIntro: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  onReplayIntro,
}) => {
  const [callsign, setCallsign] = useState(profile.callsign);
  const [crewTag, setCrewTag] = useState(profile.crewTag);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateProfileUpdate({ callsign, crewTag });
    if (!check.valid) {
      setSavedMsg(null);
      setError(check.error ?? 'Invalid profile values.');
      return;
    }
    setError(null);
    onUpdateProfile({
      ...profile,
      callsign: callsign.trim(),
      crewTag: crewTag.trim().toUpperCase(),
    });
    setSavedMsg('Profile saved to device storage.');
  };

  const handleToggleIntro = () => {
    onUpdateProfile({
      ...profile,
      playIntroOnLaunch: !profile.playIntroOnLaunch,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
          Profile & App Settings
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Customize your player identity, intro playback, and Android APK packaging readiness.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Player Identity Form */}
        <section className="rounded-2xl bg-[#14181F] border border-white/10 p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold text-white">
            Player Identity
          </h2>
          <form onSubmit={handleSave} className="mt-4 space-y-4" noValidate>
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-rose-500/15 border border-rose-400/30 px-3.5 py-2.5 text-xs font-medium text-rose-200"
              >
                {error}
              </p>
            )}
            {savedMsg && (
              <p
                role="status"
                className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-3.5 py-2.5 text-xs font-medium text-emerald-200"
              >
                {savedMsg}
              </p>
            )}

            <div>
              <label
                htmlFor="profile-callsign"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Callsign
              </label>
              <input
                id="profile-callsign"
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-[#0B0D10] border border-white/15 px-3.5 text-sm text-white focus:outline-none focus:border-[#F5A623]"
              />
            </div>

            <div>
              <label
                htmlFor="profile-crew"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Crew Tag (2–5 characters)
              </label>
              <input
                id="profile-crew"
                type="text"
                maxLength={5}
                value={crewTag}
                onChange={(e) => setCrewTag(e.target.value.toUpperCase())}
                className="w-full min-h-[44px] rounded-xl bg-[#0B0D10] border border-white/15 px-3.5 text-sm text-white uppercase focus:outline-none focus:border-[#F5A623]"
              />
            </div>

            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F5A623] hover:bg-[#e29518] text-[#0B0D10] text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Save Profile
            </button>
          </form>
        </section>

        {/* Intro & APK Settings */}
        <section className="rounded-2xl bg-[#14181F] border border-white/10 p-5 sm:p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-white">
              Splash & Loading Playback
            </h2>

            <div className="flex items-center justify-between gap-4 py-2">
              <div>
                <p className="text-sm font-semibold text-white">
                  Play ShoaibStar Intro on Launch
                </p>
                <p className="text-xs text-slate-400">
                  Shows the animated logo splash and loading screen when the app opens.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={profile.playIntroOnLaunch}
                aria-label="Play ShoaibStar Intro on Launch"
                onClick={handleToggleIntro}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] ${
                  profile.playIntroOnLaunch ? 'bg-[#F5A623]' : 'bg-white/15'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-[#0B0D10] transition-transform ${
                    profile.playIntroOnLaunch ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={onReplayIntro}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white/8 hover:bg-white/14 border border-white/12 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]"
            >
              <RotateCcw className="w-4 h-4 text-[#F5A623]" aria-hidden="true" />
              <span>Replay Logo & Loading Screen</span>
            </button>
          </div>

          {/* GitHub-to-APK Build Note */}
          <div className="pt-4 border-t border-white/10 flex items-start gap-3">
            <Smartphone
              className="w-5 h-5 text-[#F5A623] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-white">
                Android APK Build Ready
              </p>
              <p className="mt-1 text-slate-400">
                Configured with mobile safe-area insets, full offline state persistence, and a standalone production bundle for GitHub Actions + Capacitor Android APK builds.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
