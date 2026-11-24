import React from 'react';
import { Car, Compass, RotateCcw, Target, User } from 'lucide-react';
import { ShoaibStarLogo } from './ShoaibStarLogo';
import { DashboardTab } from '../utils/dashboardLogic';

interface DashboardShellProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onReplayIntro: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: Compass },
  { id: 'missions', label: 'Missions', icon: Target },
  { id: 'garage', label: 'Garage', icon: Car },
  { id: 'profile', label: 'Profile', icon: User },
];

export const DashboardShell: React.FC<DashboardShellProps> = ({
  activeTab,
  onSelectTab,
  onReplayIntro,
  children,
}) => {
  return (
    <div
      data-testid="dashboard-shell"
      className="min-h-screen w-full bg-[#0B0D10] text-slate-100 flex flex-col"
    >
      {/* Desktop Top Bar (3-zone contract) + Compact Mobile Top App Bar (52px) */}
      <header className="sticky top-0 z-30 pt-safe bg-[#0B0D10]/90 backdrop-blur-md border-b border-white/10">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between gap-8 max-w-7xl mx-auto px-6 h-16">
          {/* Zone 1: Single-line Brand wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] rounded-lg"
          >
            <ShoaibStarLogo size="sm" />
            <span className="font-display text-2xl font-bold tracking-wide text-white">
              SHOAIB<span className="text-[#F5A623]">STAR</span>
            </span>
          </button>

          {/* Zone 2: 4 single-line text navigation links */}
          <nav aria-label="Main navigation" className="flex items-center gap-7">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] rounded-md ${
                    isActive
                      ? 'text-[#F5A623]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-[#F5A623] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onReplayIntro}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#F5A623] hover:bg-[#e29518] text-[#0B0D10] text-xs font-bold whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Replay Intro</span>
            </button>
          </div>
        </div>

        {/* Mobile Compact Top App Bar (52px height) */}
        <div className="flex lg:hidden items-center justify-between px-4 h-[52px]">
          <button
            type="button"
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-2 min-h-[44px] pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] rounded-lg"
          >
            <ShoaibStarLogo size="sm" />
            <span className="font-display text-xl font-bold tracking-wide text-white whitespace-nowrap">
              SHOAIB<span className="text-[#F5A623]">STAR</span>
            </span>
          </button>

          <span className="text-sm font-semibold text-slate-200 truncate px-2">
            {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
          </span>

          <button
            type="button"
            onClick={onReplayIntro}
            aria-label="Replay Intro"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-[#F5A623] hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]"
          >
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 lg:pb-12">
        {children}
      </main>

      {/* Mobile Fixed Bottom Tab Bar (60px height; total sticky = 112px < 15% of 844px) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-[#14181F]/95 backdrop-blur-md border-t border-white/10"
      >
        <div className="grid grid-cols-4 items-center h-[60px]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[44px] h-full flex flex-col items-center justify-center gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F5A623] ${
                  isActive ? 'text-[#F5A623]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
