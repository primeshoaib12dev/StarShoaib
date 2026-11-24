import React, { useState } from 'react';
import { ArrowRight, Car, ChevronRight, X } from 'lucide-react';
import {
  ActivityCategory,
  ActivityItem,
  AppStateData,
  DashboardTab,
  calculateRankInfo,
  filterActivity,
  formatCurrency,
} from '../utils/dashboardLogic';

interface OverviewViewProps {
  state: AppStateData;
  onNavigateTab: (tab: DashboardTab) => void;
}

const ACTIVITY_TABS: { id: ActivityCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mission', label: 'Missions' },
  { id: 'income', label: 'Income' },
  { id: 'crew', label: 'Crew' },
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  state,
  onNavigateTab,
}) => {
  const [activityFilter, setActivityFilter] = useState<ActivityCategory>('all');
  const [selectedItem, setSelectedItem] = useState<ActivityItem | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const activeVehicle =
    state.vehicles.find((v) => v.id === state.activeVehicleId) ??
    state.vehicles[0];
  const activeMissionsCount = state.missions.filter((m) => !m.completed).length;
  const rankInfo = calculateRankInfo(state.respectXp);
  const filteredActivity = filterActivity(state.activity, activityFilter);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Spotlight Card */}
      <section className="relative overflow-hidden rounded-2xl bg-[#14181F] border border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-5 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs sm:text-sm font-medium text-[#F5A623]">
                {state.profile.crewTag} · Rank {rankInfo.rank} · {rankInfo.title}
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white text-balance">
                Welcome back, {state.profile.callsign}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Your command dashboard is synced. Track active street objectives, manage your garage lineup, and monitor cash flow in one place.
              </p>
            </div>

            {/* Rank progress bar */}
            <div className="space-y-2 max-w-md">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Rank Progression</span>
                <span className="tabular-nums font-semibold text-white">
                  {rankInfo.currentLevelXp} / {rankInfo.nextLevelXp} XP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#F5A623] rounded-full transition-[width] duration-300"
                  style={{ width: `${rankInfo.progressPct}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('missions')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F5A623] hover:bg-[#e29518] text-[#0B0D10] text-sm font-bold flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>Open Missions</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('garage')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white/8 hover:bg-white/14 border border-white/12 text-slate-100 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]"
              >
                View Garage
              </button>
            </div>
          </div>

          {/* Active Ride Visual */}
          <div className="lg:col-span-5 relative min-h-[210px] lg:min-h-full bg-[#1B2029]">
            {activeVehicle && !heroImgFailed ? (
              <img
                src={activeVehicle.imageUrl}
                alt={activeVehicle.name}
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#1F242D] to-[#12151B] text-slate-400">
                <Car className="w-10 h-10 text-[#F5A623] mb-2" aria-hidden="true" />
                <span className="text-sm font-medium text-slate-200">
                  {activeVehicle?.name ?? 'Active Ride'}
                </span>
              </div>
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#14181F] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#14181F]/80 lg:via-transparent"
            />
            {activeVehicle && (
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-300">Active Ride</p>
                  <p className="font-display text-xl font-bold text-white">
                    {activeVehicle.name}
                  </p>
                </div>
                <span className="text-xs font-medium text-[#F5A623] tabular-nums">
                  {activeVehicle.topSpeedMph} mph
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <section aria-label="Key metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-[#14181F] border border-white/10 p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-400">Cash Balance</p>
          <p
            data-testid="kpi-cash"
            className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white tabular-nums"
          >
            {formatCurrency(state.cashBalance)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#14181F] border border-white/10 p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-400">Respect XP</p>
          <p
            data-testid="kpi-xp"
            className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#F5A623] tabular-nums"
          >
            {state.respectXp.toLocaleString()} XP
          </p>
        </div>

        <div className="rounded-2xl bg-[#14181F] border border-white/10 p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-400">Active Missions</p>
          <p
            data-testid="kpi-missions"
            className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white tabular-nums"
          >
            {activeMissionsCount}
          </p>
        </div>

        <div className="rounded-2xl bg-[#14181F] border border-white/10 p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-400">Garage Rides</p>
          <p
            data-testid="kpi-vehicles"
            className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white tabular-nums"
          >
            {state.vehicles.length}
          </p>
        </div>
      </section>

      {/* Recent Activity Feed */}
      <section className="rounded-2xl bg-[#14181F] border border-white/10 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Recent Activity
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Tap any entry to inspect transaction or mission details.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter recent activity"
            className="flex items-center gap-1 p-1 bg-[#0B0D10] rounded-xl border border-white/10 self-start sm:self-auto overflow-x-auto max-w-full"
          >
            {ACTIVITY_TABS.map((tab) => {
              const isActive = activityFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivityFilter(tab.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] ${
                    isActive
                      ? 'bg-[#F5A623] text-[#0B0D10]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredActivity.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No activity recorded under this filter yet.
          </div>
        ) : (
          <ul className="divide-y divide-white/8">
            {filteredActivity.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="w-full min-h-[60px] py-3.5 px-2 -mx-2 rounded-xl flex items-center justify-between gap-4 text-left hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]"
                >
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-white truncate">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 flex items-center gap-1.5 truncate">
                      <span className="capitalize">{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.timestamp}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-[#F5A623] tabular-nums">
                      {item.deltaText}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Activity Detail Dialog */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-detail-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#14181F] border border-white/12 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[#F5A623] capitalize font-medium">
                  {selectedItem.category} · {selectedItem.timestamp}
                </p>
                <h3
                  id="activity-detail-title"
                  className="mt-1 font-display text-2xl font-bold text-white"
                >
                  {selectedItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Close activity details"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {selectedItem.detail}
            </p>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">Net Change</span>
              <span className="font-display text-xl font-bold text-[#F5A623] tabular-nums">
                {selectedItem.deltaText}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
