import React, { useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import {
  Mission,
  MissionFilter,
  filterMissions,
  formatCurrency,
  validateNewMission,
} from '../utils/dashboardLogic';

interface MissionsViewProps {
  missions: Mission[];
  onToggleMission: (id: string) => void;
  onAddMission: (input: {
    title: string;
    district: string;
    rewardCash: number;
    rewardXp: number;
  }) => void;
  onDeleteMission: (id: string) => void;
}

const MISSION_FILTERS: { id: MissionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

export const MissionsView: React.FC<MissionsViewProps> = ({
  missions,
  onToggleMission,
  onAddMission,
  onDeleteMission,
}) => {
  const [filter, setFilter] = useState<MissionFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState('');
  const [rewardCash, setRewardCash] = useState('15000');
  const [rewardXp, setRewardXp] = useState('200');
  const [formError, setFormError] = useState<string | null>(null);

  const visibleMissions = filterMissions(missions, filter);

  const handleOpenModal = () => {
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cashNum = Number(rewardCash);
    const xpNum = Number(rewardXp);
    const check = validateNewMission({
      title,
      district,
      rewardCash: cashNum,
      rewardXp: xpNum,
    });

    if (!check.valid) {
      setFormError(check.error ?? 'Please check the mission fields.');
      return;
    }

    onAddMission({
      title: title.trim(),
      district: district.trim(),
      rewardCash: Math.round(cashNum),
      rewardXp: Math.round(xpNum),
    });

    setTitle('');
    setDistrict('');
    setRewardCash('15000');
    setRewardXp('200');
    setFormError(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            Missions
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Complete objectives to earn Cash and Respect XP.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F5A623] hover:bg-[#e29518] text-[#0B0D10] text-sm font-bold flex items-center justify-center gap-2 self-start sm:self-auto transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Mission</span>
        </button>
      </div>

      {/* Filter Segmented Control */}
      <div
        role="group"
        aria-label="Filter missions"
        className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#14181F] border border-white/10"
      >
        {MISSION_FILTERS.map((item) => {
          const isActive = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] ${
                isActive
                  ? 'bg-[#F5A623] text-[#0B0D10]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Mission List */}
      <section className="rounded-2xl bg-[#14181F] border border-white/10 overflow-hidden">
        {visibleMissions.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <p className="text-sm text-slate-400">
              No missions match this filter.
            </p>
            <button
              type="button"
              onClick={handleOpenModal}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white/8 hover:bg-white/14 text-sm font-medium text-white transition-colors"
            >
              Create a Mission
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-white/8" data-testid="mission-list">
            {visibleMissions.map((mission) => (
              <li
                key={mission.id}
                className="p-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleMission(mission.id)}
                    aria-label={
                      mission.completed
                        ? `Mark "${mission.title}" incomplete`
                        : `Complete "${mission.title}"`
                    }
                    className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center border transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] ${
                      mission.completed
                        ? 'bg-[#F5A623] border-[#F5A623] text-[#0B0D10]'
                        : 'bg-[#0B0D10] border-white/20 text-transparent hover:border-[#F5A623]'
                    }`}
                  >
                    <Check className="w-5 h-5" aria-hidden="true" />
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-sm sm:text-base font-semibold truncate ${
                        mission.completed
                          ? 'line-through text-slate-400'
                          : 'text-white'
                      }`}
                    >
                      {mission.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 flex flex-wrap items-center gap-x-1.5">
                      <span>{mission.district}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#F5A623] font-medium tabular-nums">
                        {formatCurrency(mission.rewardCash)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{mission.rewardXp} XP</span>
                      <span aria-hidden="true">·</span>
                      <span>{mission.completed ? 'Completed' : 'Active'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteMission(mission.id)}
                  aria-label={`Delete '${mission.title}'`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add Mission Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-mission-heading"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#14181F] border border-white/12 p-6 pb-safe">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
              <h2
                id="new-mission-heading"
                className="font-display text-2xl font-bold text-white"
              >
                New Mission
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close new mission dialog"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
              {formError && (
                <p
                  role="alert"
                  className="rounded-xl bg-rose-500/15 border border-rose-400/30 px-3.5 py-2.5 text-xs font-medium text-rose-200"
                >
                  {formError}
                </p>
              )}

              <div>
                <label
                  htmlFor="mission-title-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Mission Title
                </label>
                <input
                  id="mission-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midnight Dock Delivery"
                  className="w-full min-h-[44px] rounded-xl bg-[#0B0D10] border border-white/15 px-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F5A623]"
                />
              </div>

              <div>
                <label
                  htmlFor="mission-district-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  District
                </label>
                <input
                  id="mission-district-input"
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. East Pier"
                  className="w-full min-h-[44px] rounded-xl bg-[#0B0D10] border border-white/15 px-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F5A623]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="mission-cash-input"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Cash Reward ($)
                  </label>
                  <input
                    id="mission-cash-input"
                    type="number"
                    min="1"
                    value={rewardCash}
                    onChange={(e) => setRewardCash(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-[#0B0D10] border border-white/15 px-3.5 text-sm text-white tabular-nums focus:outline-none focus:border-[#F5A623]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mission-xp-input"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Respect XP
                  </label>
                  <input
                    id="mission-xp-input"
                    type="number"
                    min="1"
                    value={rewardXp}
                    onChange={(e) => setRewardXp(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-[#0B0D10] border border-white/15 px-3.5 text-sm text-white tabular-nums focus:outline-none focus-visible:border-[#F5A623]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white/8 hover:bg-white/14 text-sm font-medium text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#F5A623] hover:bg-[#e29518] text-[#0B0D10] text-sm font-bold transition-colors"
                >
                  Save Mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
