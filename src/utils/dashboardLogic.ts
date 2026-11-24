export type AppStage = 'splash' | 'loading' | 'dashboard';
export type DashboardTab = 'overview' | 'missions' | 'garage' | 'profile';
export type MissionFilter = 'all' | 'active' | 'completed';
export type ActivityCategory = 'all' | 'mission' | 'income' | 'crew';
export type VehicleCategory = 'all' | 'sport' | 'bike' | 'classic';

export interface Mission {
  id: string;
  title: string;
  district: string;
  rewardCash: number;
  rewardXp: number;
  completed: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  name: string;
  category: Exclude<VehicleCategory, 'all'>;
  bay: string;
  topSpeedMph: number;
  acceleration: string;
  imageUrl: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  category: Exclude<ActivityCategory, 'all'>;
  timestamp: string;
  deltaText: string;
}

export interface PlayerProfile {
  callsign: string;
  crewTag: string;
  playIntroOnLaunch: boolean;
}

export interface AppStateData {
  profile: PlayerProfile;
  cashBalance: number;
  respectXp: number;
  activeVehicleId: string;
  missions: Mission[];
  vehicles: Vehicle[];
  activity: ActivityItem[];
}

export const STORAGE_KEY = 'shoaibstar_app_state_v1';

export const LOADING_TIPS: string[] = [
  'Complete daily objectives in Missions to raise your Respect rank and Cash reserve.',
  'Switch your active vehicle in the Garage to feature it on your Overview card.',
  'All progress saves locally on your device so your APK works offline anytime.',
  'Use the Profile tab to customize your Callsign or replay the ShoaibStar intro.'
];

export const INITIAL_APP_STATE: AppStateData = {
  profile: {
    callsign: 'Shoaib',
    crewTag: 'STAR',
    playIntroOnLaunch: true,
  },
  cashBalance: 248500,
  respectXp: 1420,
  activeVehicleId: 'veh-obsidian-gt',
  missions: [
    {
      id: 'mis-1',
      title: 'Night Courier Run',
      district: 'Downtown Harbour',
      rewardCash: 18500,
      rewardXp: 250,
      completed: false,
      createdAt: 'Today',
    },
    {
      id: 'mis-2',
      title: 'Pacific Highway Time Trial',
      district: 'West Coast Boulevard',
      rewardCash: 24000,
      rewardXp: 320,
      completed: false,
      createdAt: 'Today',
    },
    {
      id: 'mis-3',
      title: 'Garage Security Upgrade',
      district: 'Industrial Sector',
      rewardCash: 12000,
      rewardXp: 150,
      completed: true,
      createdAt: 'Yesterday',
    },
    {
      id: 'mis-4',
      title: 'Harbour Crew Meetup',
      district: 'South Pier',
      rewardCash: 9500,
      rewardXp: 120,
      completed: false,
      createdAt: 'Yesterday',
    },
  ],
  vehicles: [
    {
      id: 'veh-obsidian-gt',
      name: 'Obsidian GT-R',
      category: 'sport',
      bay: 'Bay 01',
      topSpeedMph: 218,
      acceleration: '2.7s 0-60',
      imageUrl: '/src/assets/images/garage_coupe_art_1795500905770.jpg',
    },
    {
      id: 'veh-amber-apex',
      name: 'Shoaib Apex 1000',
      category: 'bike',
      bay: 'Bay 02',
      topSpeedMph: 194,
      acceleration: '2.4s 0-60',
      imageUrl: '/src/assets/images/garage_bike_art_1795500906522.jpg',
    },
    {
      id: 'veh-sunset-retro',
      name: 'Coastline Retro V8',
      category: 'classic',
      bay: 'Bay 03',
      topSpeedMph: 176,
      acceleration: '3.6s 0-60',
      imageUrl: '/src/assets/images/loading_skyline_art_1795500905518.jpg',
    },
  ],
  activity: [
    {
      id: 'act-1',
      title: 'Garage Security Upgrade',
      detail: 'Completed perimeter sensor setup at Industrial Sector.',
      category: 'mission',
      timestamp: '2h ago',
      deltaText: '+$12,000',
    },
    {
      id: 'act-2',
      title: 'Arcade Safe Payout',
      detail: 'Daily passive collection transferred to primary account.',
      category: 'income',
      timestamp: '5h ago',
      deltaText: '+$15,500',
    },
    {
      id: 'act-3',
      title: 'Crew Invite Accepted',
      detail: 'Zaid joined STAR crew for weekend highway sprints.',
      category: 'crew',
      timestamp: '1d ago',
      deltaText: '+100 XP',
    },
  ],
};

export function getLoadingPhaseLabel(progress: number): string {
  const clamped = Math.max(0, Math.min(100, progress));
  if (clamped < 25) return 'Initializing ShoaibStar Engine';
  if (clamped < 55) return 'Loading City & Garage Assets';
  if (clamped < 85) return 'Syncing Player Profile & Missions';
  if (clamped < 100) return 'Preparing Main Dashboard';
  return 'Ready';
}

export function calculateRankInfo(xp: number): {
  rank: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  const xpPerRank = 500;
  const rank = Math.floor(safeXp / xpPerRank) + 1;
  const currentLevelXp = safeXp % xpPerRank;
  const nextLevelXp = xpPerRank;
  const progressPct = Math.round((currentLevelXp / nextLevelXp) * 100);

  const titles = [
    'Street Rookie',
    'Local Runner',
    'District Captain',
    'City Kingpin',
    'ShoaibStar Legend',
  ];
  const title = titles[Math.min(rank - 1, titles.length - 1)];

  return {
    rank,
    title,
    currentLevelXp,
    nextLevelXp,
    progressPct,
  };
}

export function filterMissions(missions: Mission[], filter: MissionFilter): Mission[] {
  if (filter === 'active') return missions.filter((m) => !m.completed);
  if (filter === 'completed') return missions.filter((m) => m.completed);
  return missions;
}

export function filterActivity(items: ActivityItem[], category: ActivityCategory): ActivityItem[] {
  if (category === 'all') return items;
  return items.filter((item) => item.category === category);
}

export function filterVehicles(vehicles: Vehicle[], category: VehicleCategory): Vehicle[] {
  if (category === 'all') return vehicles;
  return vehicles.filter((v) => v.category === category);
}

export function validateNewMission(input: {
  title: string;
  district: string;
  rewardCash: number;
  rewardXp: number;
}): { valid: boolean; error?: string } {
  const trimmedTitle = input.title.trim();
  const trimmedDistrict = input.district.trim();
  if (!trimmedTitle) {
    return { valid: false, error: 'Mission title is required.' };
  }
  if (trimmedTitle.length < 3) {
    return { valid: false, error: 'Mission title must be at least 3 characters.' };
  }
  if (!trimmedDistrict) {
    return { valid: false, error: 'District or location is required.' };
  }
  if (!Number.isFinite(input.rewardCash) || input.rewardCash <= 0) {
    return { valid: false, error: 'Cash reward must be greater than zero.' };
  }
  if (!Number.isFinite(input.rewardXp) || input.rewardXp <= 0) {
    return { valid: false, error: 'Respect XP reward must be greater than zero.' };
  }
  return { valid: true };
}

export function validateProfileUpdate(input: {
  callsign: string;
  crewTag: string;
}): { valid: boolean; error?: string } {
  const callsign = input.callsign.trim();
  const crewTag = input.crewTag.trim();
  if (!callsign || callsign.length < 2) {
    return { valid: false, error: 'Callsign must be at least 2 characters.' };
  }
  if (crewTag.length < 2 || crewTag.length > 5) {
    return { valid: false, error: 'Crew tag must be 2 to 5 characters.' };
  }
  return { valid: true };
}

export function applyMissionToggle(
  state: AppStateData,
  missionId: string
): AppStateData {
  const target = state.missions.find((m) => m.id === missionId);
  if (!target) return state;

  const nextCompleted = !target.completed;
  const cashDelta = nextCompleted ? target.rewardCash : -target.rewardCash;
  const xpDelta = nextCompleted ? target.rewardXp : -target.rewardXp;

  const nextMissions = state.missions.map((m) =>
    m.id === missionId ? { ...m, completed: nextCompleted } : m
  );

  const nextActivity = nextCompleted
    ? [
        {
          id: `act-${Date.now()}`,
          title: target.title,
          detail: `Completed objective in ${target.district}.`,
          category: 'mission' as const,
          timestamp: 'Just now',
          deltaText: `+${formatCurrency(target.rewardCash)}`,
        },
        ...state.activity.slice(0, 14),
      ]
    : state.activity;

  return {
    ...state,
    cashBalance: Math.max(0, state.cashBalance + cashDelta),
    respectXp: Math.max(0, state.respectXp + xpDelta),
    missions: nextMissions,
    activity: nextActivity,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function shouldAutostartFromSearch(search: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search);
  return params.get('autostart') === '1';
}
