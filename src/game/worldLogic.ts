export type AppFlowStage = 'splash' | 'loading' | 'lobby' | 'playing' | 'paused';
export type WorldZone = 'house' | 'city';
export type CameraViewMode = 'third_person' | 'first_person' | 'second_person';

export interface Outfit {
  id: string;
  name: string;
  price: number;
  jacketColor: string;
  accentColor: string;
  pantsColor: string;
  glasses: boolean;
  isHalfPant?: boolean;
}

export interface CarCatalogItem {
  id: string;
  name: string;
  category: string;
  price: number;
  color: string;
  accent: string;
  maxSpeed: number;
  imageUrl: string;
}

export interface SpawnedCar {
  instanceId: string;
  catalogId: string;
  name: string;
  color: string;
  accent: string;
  maxSpeed: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
}

export interface CoinPickup {
  id: string;
  x: number;
  y: number;
  amount: number;
  collected: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  color?: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  action?:
    | 'bathroom_freshen'
    | 'dress_halfpant'
    | 'welcome_cutscene'
    | 'family_baby_cutscene'
    | 'bring_home_marry';
  targetNpcId?: string;
  choices: {
    label: string;
    nextId: string | null;
    rewardCoins?: number;
  }[];
}

export interface PartnerState {
  spouseName: string;
  spouseJacketColor: string;
  spousePantsColor: string;
  hasBaby: boolean;
  marriedPartnerNames: string[];
}

export const DEFAULT_PARTNER_STATE: PartnerState = {
  spouseName: 'Aisha',
  spouseJacketColor: '#E11D48',
  spousePantsColor: '#1E293B',
  hasBaby: false,
  marriedPartnerNames: ['Aisha'],
};

export interface CityNpc {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  jacketColor: string;
  pantsColor: string;
  isFemale?: boolean;
  dialogueId: string;
}

export interface PersistedGameSave {
  coins: number;
  selectedOutfitId: string;
  unlockedOutfitIds: string[];
  ownedCarIds: string[];
  muted: boolean;
}

export interface NearbyInteraction {
  type:
    | 'gf'
    | 'tv'
    | 'door_exit'
    | 'door_enter'
    | 'car'
    | 'dressing'
    | 'bath'
    | 'npc'
    | null;
  label: string;
  targetId?: string;
}

export const GAME_STORAGE_KEY = 'shoaibstar_game_save_v2';

export const OUTFITS: Outfit[] = [
  {
    id: 'outfit-varsity',
    name: 'Street Gold Jacket',
    price: 0,
    jacketColor: '#181C24',
    accentColor: '#F5A623',
    pantsColor: '#1E293B',
    glasses: true,
  },
  {
    id: 'outfit-mafia',
    name: 'Midnight Mafia Suit',
    price: 400,
    jacketColor: '#0F172A',
    accentColor: '#E2E8F0',
    pantsColor: '#090D16',
    glasses: true,
  },
  {
    id: 'outfit-crimson',
    name: 'Vice Sunset Bomber',
    price: 650,
    jacketColor: '#991B1B',
    accentColor: '#FBBF24',
    pantsColor: '#18181B',
    glasses: false,
  },
  {
    id: 'outfit-boss',
    name: 'New Year White Blazer',
    price: 1000,
    jacketColor: '#F1F5F9',
    accentColor: '#F5A623',
    pantsColor: '#1E293B',
    glasses: true,
  },
  {
    id: 'outfit-halfpant',
    name: 'Lounge Half-Pant',
    price: 0,
    jacketColor: '#38BDF8',
    accentColor: '#F5A623',
    pantsColor: '#0F172A',
    glasses: false,
    isHalfPant: true,
  },
];

export const CAR_CATALOG: CarCatalogItem[] = [
  {
    id: 'car-lamborghini',
    name: 'Lamborghini Revuelto',
    category: 'Supercar',
    price: 0,
    color: '#F5A623',
    accent: '#0B0D10',
    maxSpeed: 420,
    imageUrl: '/src/assets/images/shoaib_3d_loading_1795502822668.jpg',
  },
  {
    id: 'car-bmw',
    name: 'BMW M4 Coupe',
    category: 'Sport Coupe',
    price: 450,
    color: '#2563EB',
    accent: '#E2E8F0',
    maxSpeed: 375,
    imageUrl: '/src/assets/images/garage_coupe_art_1795500905770.jpg',
  },
  {
    id: 'car-mercedes',
    name: 'Mercedes-AMG GT',
    category: 'Luxury GT',
    price: 650,
    color: '#CBD5E1',
    accent: '#0B0D10',
    maxSpeed: 390,
    imageUrl: '/src/assets/images/loading_skyline_art_1795500905518.jpg',
  },
  {
    id: 'car-tata',
    name: 'Tata Harrier EV',
    category: 'SUV',
    price: 300,
    color: '#10B981',
    accent: '#F8FAFC',
    maxSpeed: 330,
    imageUrl: '/src/assets/images/garage_coupe_art_1795500905770.jpg',
  },
  {
    id: 'car-obsidian-gtr',
    name: 'Obsidian GT-R',
    category: 'Sport Coupe',
    price: 0,
    color: '#1E2430',
    accent: '#F5A623',
    maxSpeed: 340,
    imageUrl: '/src/assets/images/garage_coupe_art_1795500905770.jpg',
  },
  {
    id: 'car-amber-bike',
    name: 'Shoaib Apex Bike',
    category: 'Superbike',
    price: 350,
    color: '#F5A623',
    accent: '#0B0D10',
    maxSpeed: 370,
    imageUrl: '/src/assets/images/garage_bike_art_1795500906522.jpg',
  },
];

export const HOUSE_BOUNDS = { w: 720, h: 520 };
export const CITY_BOUNDS = { w: 1600, h: 1200 };

// House interior obstacles (walls/furniture)
export const HOUSE_OBSTACLES: Rect[] = [
  // Sofa
  { x: 160, y: 170, w: 190, h: 64, label: 'Sofa' },
  // Coffee Table
  { x: 205, y: 112, w: 100, h: 36, label: 'Table' },
  // TV Console (top wall)
  { x: 185, y: 24, w: 140, h: 32, label: 'TV Stand' },
  // Kitchen Counter (right side)
  { x: 520, y: 40, w: 160, h: 56, label: 'Kitchen' },
  // Dining Island
  { x: 530, y: 165, w: 120, h: 60, label: 'Bar' },
  // Bed (bottom-left room)
  { x: 54, y: 350, w: 150, h: 120, label: 'Bed' },
  // Bathroom & Dressing Suite Divider (bottom-right room)
  { x: 510, y: 355, w: 22, h: 135, label: 'Bath Partition' },
];

export const HOUSE_TV_POS = { x: 255, y: 56 };
export const HOUSE_DOOR_POS = { x: 360, y: 492 };
export const HOUSE_GF_POS = { x: 430, y: 180 };
export const HOUSE_DRESSING_POS = { x: 565, y: 315 };
export const HOUSE_BATH_POS = { x: 642, y: 430 };

// Small city buildings & obstacles
export const CITY_BUILDINGS: Rect[] = [
  // Player's Safehouse Exterior (top-left block)
  { x: 120, y: 110, w: 260, h: 170, label: 'SHOAIB HOUSE', color: '#1F2633' },
  // Star Diner
  { x: 540, y: 110, w: 280, h: 160, label: 'STAR DINER', color: '#281F26' },
  // Neon Arcade & Club
  { x: 1040, y: 110, w: 320, h: 180, label: 'SHOAIB CLUB', color: '#1D2234' },
  // Downtown Tower
  { x: 1040, y: 500, w: 300, h: 220, label: 'STAR TOWER', color: '#1B2029' },
  // Park Gazebo / Fountain Center
  { x: 640, y: 575, w: 90, h: 90, label: 'FOUNTAIN', color: '#1E3A5F' },
  // Harbour Warehouse
  { x: 140, y: 520, w: 240, h: 180, label: 'GARAGE HUB', color: '#21252B' },
];

export const CITY_HOME_DOOR_POS = { x: 250, y: 294 };
export const CITY_CAR_SPAWN_POS = { x: 205, y: 342 };

export const INITIAL_CITY_COINS: CoinPickup[] = [
  { id: 'c1', x: 455, y: 220, amount: 50, collected: false },
  { id: 'c2', x: 920, y: 220, amount: 50, collected: false },
  { id: 'c3', x: 460, y: 425, amount: 75, collected: false },
  { id: 'c4', x: 915, y: 425, amount: 75, collected: false },
  { id: 'c5', x: 685, y: 480, amount: 100, collected: false },
  { id: 'c6', x: 1450, y: 430, amount: 100, collected: false },
  { id: 'c7', x: 455, y: 840, amount: 75, collected: false },
  { id: 'c8', x: 920, y: 840, amount: 100, collected: false },
];

export const CITY_NPCS: CityNpc[] = [
  {
    id: 'npc-rohan',
    name: 'Rohan',
    role: 'Neighbor',
    x: 118,
    y: 315,
    jacketColor: '#3B82F6',
    pantsColor: '#1E293B',
    dialogueId: 'npc_rohan',
  },
  {
    id: 'npc-zara',
    name: 'Zara',
    role: 'Diner Host',
    x: 590,
    y: 318,
    jacketColor: '#EC4899',
    pantsColor: '#0F172A',
    isFemale: true,
    dialogueId: 'npc_zara',
  },
  {
    id: 'npc-maya',
    name: 'Maya',
    role: 'Club DJ',
    x: 985,
    y: 300,
    jacketColor: '#8B5CF6',
    pantsColor: '#111827',
    isFemale: true,
    dialogueId: 'npc_maya',
  },
  {
    id: 'npc-vikram',
    name: 'Vikram',
    role: 'Auto Specialist',
    x: 420,
    y: 550,
    jacketColor: '#10B981',
    pantsColor: '#1F2937',
    dialogueId: 'npc_vikram',
  },
];

export const GF_DIALOGUE_TREE: Record<string, DialogueNode> = {
  start: {
    id: 'start',
    speaker: 'Aisha',
    text: 'Hey Shoaib, my husband! Welcome home — our Lamborghini, BMW, Mercedes, and Tata are parked outside. What should we do together?',
    choices: [
      { label: 'Give Aisha a warm family welcome!', nextId: 'welcome_plan', rewardCoins: 45 },
      { label: 'Let us prepare the nursery for our baby!', nextId: 'baby_plan', rewardCoins: 100 },
      { label: 'Come to the Bathroom & Spa to freshen up!', nextId: 'bathroom_plan', rewardCoins: 40 },
      { label: 'Let us watch the New Year show on TV!', nextId: 'tv_plan', rewardCoins: 50 },
      { label: 'I am ordering a new car on my phone for us.', nextId: 'car_plan', rewardCoins: 50 },
    ],
  },
  welcome_plan: {
    id: 'welcome_plan',
    speaker: 'Aisha',
    text: 'Welcome home, Shoaib! Let us celebrate with a cheerful family moment.',
    action: 'welcome_cutscene',
    choices: [
      { label: 'Celebrate together!', nextId: null },
    ],
  },
  baby_plan: {
    id: 'baby_plan',
    speaker: 'Aisha',
    text: 'Our nursery is ready! Let us welcome a new joy into our family and set up the baby crib.',
    action: 'family_baby_cutscene',
    choices: [
      { label: 'Welcome to our family, little star!', nextId: null },
    ],
  },
  bathroom_plan: {
    id: 'bathroom_plan',
    speaker: 'Aisha',
    text: 'Yes! I will switch into my resort spa swimwear and meet you in the Bathroom shower — you wear your Half-Pant lounge shorts!',
    action: 'bathroom_freshen',
    choices: [
      { label: 'Let us freshen up in the Shower!', nextId: null },
    ],
  },
  tv_plan: {
    id: 'tv_plan',
    speaker: 'Aisha',
    text: 'Yes! Walk up to the TV right there and turn it on. The fireworks countdown looks awesome!',
    choices: [
      { label: 'Awesome, see you by the sofa!', nextId: null },
    ],
  },
  car_plan: {
    id: 'car_plan',
    speaker: 'Aisha',
    text: 'Ooh, check your Lamborghini, BMW, Mercedes, and Tata right outside in our Villa Garden driveway!',
    choices: [
      { label: 'Watch me pull up outside!', nextId: null },
    ],
  },
  city_vibe: {
    id: 'city_vibe',
    speaker: 'Aisha',
    text: 'Neighbors and friends like Rohan, Zara, and Maya are out on Ocean Drive, and there are bonus coins near the Fountain!',
    choices: [
      { label: 'Got it, I will check outside!', nextId: null },
    ],
  },
  npc_rohan: {
    id: 'npc_rohan',
    speaker: 'Rohan',
    text: 'Yo Shoaib! That yellow Lamborghini and Tata Harrier parked in your garden look insane! Watch your speed at intersections so you do not have an accident!',
    choices: [
      { label: 'Thanks Rohan, see you around!', nextId: null, rewardCoins: 30 },
    ],
  },
  npc_zara: {
    id: 'npc_zara',
    speaker: 'Zara',
    text: 'Welcome to Star Diner, Shoaib! Grab the glowing coins along Ocean Drive or tell me what is on your mind.',
    choices: [
      { label: 'I Love You! Come home & marry me (Saadi)!', nextId: 'marry_zara', rewardCoins: 120 },
      { label: 'Appreciate the tip, Zara!', nextId: null, rewardCoins: 35 },
    ],
  },
  marry_zara: {
    id: 'marry_zara',
    speaker: 'Zara',
    text: 'I love you too, Shoaib! Let us head to your Villa Safehouse for our grand wedding ceremony!',
    action: 'bring_home_marry',
    targetNpcId: 'npc-zara',
    choices: [
      { label: 'Welcome home, my Wife Zara!', nextId: null },
    ],
  },
  npc_maya: {
    id: 'npc_maya',
    speaker: 'Maya',
    text: 'New Year countdown beats are spinning all night at Shoaib Club! Looking great out there in Vice City!',
    choices: [
      { label: 'I Love You! Come home & marry me (Saadi)!', nextId: 'marry_maya', rewardCoins: 120 },
      { label: 'Catch you at the party, Maya!', nextId: null, rewardCoins: 50 },
    ],
  },
  marry_maya: {
    id: 'marry_maya',
    speaker: 'Maya',
    text: 'Yes, Shoaib! I love you! Let us celebrate our Saadi back at your Safehouse!',
    action: 'bring_home_marry',
    targetNpcId: 'npc-maya',
    choices: [
      { label: 'Welcome home, my Wife Maya!', nextId: null },
    ],
  },
  npc_vikram: {
    id: 'npc_vikram',
    speaker: 'Vikram',
    text: 'Need tuning on your Tata SUV or Lamborghini? Drive safe out there—high-speed crashes will spark and rattle your ride!',
    choices: [
      { label: 'Got it Vikram, driving smooth!', nextId: null, rewardCoins: 40 },
    ],
  },
};

export const DEFAULT_GAME_SAVE: PersistedGameSave = {
  coins: 1200,
  selectedOutfitId: 'outfit-varsity',
  unlockedOutfitIds: ['outfit-varsity', 'outfit-halfpant'],
  ownedCarIds: ['car-lamborghini', 'car-bmw', 'car-mercedes', 'car-tata', 'car-obsidian-gtr'],
  muted: false,
};

export function clampDt(rawDt: number): number {
  if (!Number.isFinite(rawDt) || rawDt < 0) return 0;
  return Math.min(rawDt, 0.05);
}

export function resolveCircleRectCollision(
  cx: number,
  cy: number,
  radius: number,
  rect: Rect
): { x: number; y: number } {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) {
    return { x: cx, y: cy };
  }

  const dist = Math.sqrt(distSq);
  if (dist === 0) {
    const leftPen = cx - rect.x;
    const rightPen = rect.x + rect.w - cx;
    const topPen = cy - rect.y;
    const bottomPen = rect.y + rect.h - cy;
    const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
    if (minPen === leftPen) return { x: rect.x - radius, y: cy };
    if (minPen === rightPen) return { x: rect.x + rect.w + radius, y: cy };
    if (minPen === topPen) return { x: cx, y: rect.y - radius };
    return { x: cx, y: rect.y + rect.h + radius };
  }
  const overlap = radius - dist;
  return {
    x: cx + (dx / dist) * overlap,
    y: cy + (dy / dist) * overlap,
  };
}

export function movePlayerWithObstacles(
  x: number,
  y: number,
  vx: number,
  vy: number,
  dt: number,
  radius: number,
  bounds: { w: number; h: number },
  obstacles: Rect[]
): { x: number; y: number } {
  const safeDt = clampDt(dt);
  let nx = Math.max(radius + 16, Math.min(bounds.w - radius - 16, x + vx * safeDt));
  let ny = Math.max(radius + 16, Math.min(bounds.h - radius - 16, y + vy * safeDt));

  for (const obs of obstacles) {
    const resolved = resolveCircleRectCollision(nx, ny, radius, obs);
    nx = resolved.x;
    ny = resolved.y;
  }

  return { x: nx, y: ny };
}

export function detectNearbyInteraction(params: {
  zone: WorldZone;
  playerX: number;
  playerY: number;
  drivingCarId: string | null;
  cars: SpawnedCar[];
  gfPos?: { x: number; y: number };
  npcs?: CityNpc[];
  spouseName?: string;
}): NearbyInteraction {
  const {
    zone,
    playerX,
    playerY,
    drivingCarId,
    cars,
    gfPos = HOUSE_GF_POS,
    npcs = [],
    spouseName = 'Aisha',
  } = params;

  if (drivingCarId) {
    return { type: 'car', label: 'Exit Car', targetId: drivingCarId };
  }

  if (zone === 'house') {
    const distGf = Math.hypot(playerX - gfPos.x, playerY - gfPos.y);
    if (distGf < 78) {
      return { type: 'gf', label: `Talk to ${spouseName}` };
    }
    const distTv = Math.hypot(playerX - HOUSE_TV_POS.x, playerY - HOUSE_TV_POS.y);
    if (distTv < 92) {
      return { type: 'tv', label: 'Watch New Year TV' };
    }
    const distDress = Math.hypot(
      playerX - HOUSE_DRESSING_POS.x,
      playerY - HOUSE_DRESSING_POS.y
    );
    if (distDress < 68) {
      return { type: 'dressing', label: 'Wear Half-Pant' };
    }
    const distBath = Math.hypot(
      playerX - HOUSE_BATH_POS.x,
      playerY - HOUSE_BATH_POS.y
    );
    if (distBath < 72) {
      return { type: 'bath', label: 'Take Shower' };
    }
    const distDoor = Math.hypot(playerX - HOUSE_DOOR_POS.x, playerY - HOUSE_DOOR_POS.y);
    if (distDoor < 74) {
      return { type: 'door_exit', label: 'Exit to City' };
    }
    return { type: null, label: '' };
  }

  // City zone
  const distHome = Math.hypot(
    playerX - CITY_HOME_DOOR_POS.x,
    playerY - CITY_HOME_DOOR_POS.y
  );
  if (distHome < 74) {
    return { type: 'door_enter', label: 'Enter House' };
  }

  for (const npc of npcs) {
    const distNpc = Math.hypot(playerX - npc.x, playerY - npc.y);
    if (distNpc < 70) {
      return { type: 'npc', label: `Talk ${npc.name}`, targetId: npc.id };
    }
  }

  for (const car of cars) {
    const distCar = Math.hypot(playerX - car.x, playerY - car.y);
    if (distCar < 76) {
      return { type: 'car', label: `Drive ${car.name}`, targetId: car.instanceId };
    }
  }

  return { type: null, label: '' };
}

export function unlockOrEquipOutfit(
  save: PersistedGameSave,
  outfitId: string
): { save: PersistedGameSave; status: 'equipped' | 'unlocked' | 'insufficient_coins' } {
  const outfit = OUTFITS.find((o) => o.id === outfitId);
  if (!outfit) return { save, status: 'insufficient_coins' };

  if (save.unlockedOutfitIds.includes(outfitId)) {
    return {
      save: { ...save, selectedOutfitId: outfitId },
      status: 'equipped',
    };
  }

  if (save.coins < outfit.price) {
    return { save, status: 'insufficient_coins' };
  }

  return {
    save: {
      ...save,
      coins: save.coins - outfit.price,
      unlockedOutfitIds: [...save.unlockedOutfitIds, outfitId],
      selectedOutfitId: outfitId,
    },
    status: 'unlocked',
  };
}

export function orderCarFromCatalog(
  save: PersistedGameSave,
  catalogId: string
): {
  save: PersistedGameSave;
  car: CarCatalogItem | null;
  status: 'ordered' | 'insufficient_coins';
} {
  const car = CAR_CATALOG.find((c) => c.id === catalogId);
  if (!car) return { save, car: null, status: 'insufficient_coins' };

  const alreadyOwned = save.ownedCarIds.includes(catalogId);
  if (!alreadyOwned && save.coins < car.price) {
    return { save, car: null, status: 'insufficient_coins' };
  }

  const nextCoins = alreadyOwned ? save.coins : save.coins - car.price;
  const nextOwned = alreadyOwned
    ? save.ownedCarIds
    : [...save.ownedCarIds, catalogId];

  return {
    save: {
      ...save,
      coins: nextCoins,
      ownedCarIds: nextOwned,
    },
    car,
    status: 'ordered',
  };
}

export function stepCarPhysics(
  car: SpawnedCar,
  throttle: number, // -1..1
  steer: number, // -1..1
  dt: number,
  bounds: { w: number; h: number },
  obstacles: Rect[]
): SpawnedCar {
  const safeDt = clampDt(dt);
  const accel = 420;
  const friction = 2.6;

  let nextSpeed = car.speed + throttle * accel * safeDt;
  if (throttle === 0) {
    nextSpeed *= Math.max(0, 1 - friction * safeDt);
    if (Math.abs(nextSpeed) < 4) nextSpeed = 0;
  }
  nextSpeed = Math.max(-car.maxSpeed * 0.45, Math.min(car.maxSpeed, nextSpeed));

  const turnRate = 2.9 * (Math.abs(nextSpeed) > 12 ? 1 : 0.25);
  const directionSign = nextSpeed >= 0 ? 1 : -1;
  const nextAngle = car.angle + steer * turnRate * directionSign * safeDt;

  const vx = Math.cos(nextAngle) * nextSpeed;
  const vy = Math.sin(nextAngle) * nextSpeed;

  const moved = movePlayerWithObstacles(
    car.x,
    car.y,
    vx,
    vy,
    safeDt,
    26,
    bounds,
    obstacles
  );

  return {
    ...car,
    x: moved.x,
    y: moved.y,
    angle: nextAngle,
    speed: nextSpeed,
  };
}

export function cycleCameraMode(current: CameraViewMode): CameraViewMode {
  if (current === 'third_person') return 'first_person';
  if (current === 'first_person') return 'second_person';
  return 'third_person';
}

export function getCameraModeLabel(mode: CameraViewMode): string {
  if (mode === 'first_person') return '1st Person';
  if (mode === 'second_person') return '2nd Person';
  return '3rd Person';
}

export function clampTouchSensitivity(value: number): number {
  if (!Number.isFinite(value)) return 1.2;
  return Math.max(0.4, Math.min(2.5, Math.round(value * 10) / 10));
}

export function normalizeJoystickVector(
  dx: number,
  dy: number,
  maxRadius: number,
  deadzone = 0.12
): { x: number; y: number; magnitude: number } {
  if (maxRadius <= 0 || !Number.isFinite(dx) || !Number.isFinite(dy)) {
    return { x: 0, y: 0, magnitude: 0 };
  }
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { x: 0, y: 0, magnitude: 0 };
  const clampedDist = Math.min(dist, maxRadius);
  const normMag = clampedDist / maxRadius;
  if (normMag < deadzone) {
    return { x: 0, y: 0, magnitude: 0 };
  }
  const rescaledMag = (normMag - deadzone) / (1 - deadzone);
  const ux = dx / dist;
  const uy = dy / dist;
  return {
    x: ux * rescaledMag,
    y: uy * rescaledMag,
    magnitude: rescaledMag,
  };
}

export function stepCarPhysicsWithAccident(
  car: SpawnedCar,
  throttle: number,
  steer: number,
  dt: number,
  bounds: { w: number; h: number },
  obstacles: Rect[],
  otherObjects: { x: number; y: number; radius: number }[] = []
): { car: SpawnedCar; crashed: boolean; impactSpeed: number } {
  const safeDt = clampDt(dt);
  const preSpeed = Math.abs(car.speed);
  const stepped = stepCarPhysics(car, throttle, steer, safeDt, bounds, obstacles);

  // Check if building/wall collision drastically halted the moving car
  const expectedDist = Math.abs(stepped.speed) * safeDt;
  const actualDist = Math.hypot(stepped.x - car.x, stepped.y - car.y);
  let crashed = false;
  let impactSpeed = 0;

  if (preSpeed > 135 && expectedDist > 1 && actualDist < expectedDist * 0.35) {
    crashed = true;
    impactSpeed = preSpeed;
    stepped.speed = -car.speed * 0.4;
  }

  // Check collisions against other parked/traffic vehicles or props
  for (const obj of otherObjects) {
    const dx = stepped.x - obj.x;
    const dy = stepped.y - obj.y;
    const dist = Math.hypot(dx, dy);
    const minDist = 26 + obj.radius;
    if (dist < minDist) {
      const nx = dist > 0.01 ? dx / dist : 1;
      const ny = dist > 0.01 ? dy / dist : 0;
      stepped.x = obj.x + nx * (minDist + 2);
      stepped.y = obj.y + ny * (minDist + 2);
      if (preSpeed > 110) {
        crashed = true;
        impactSpeed = Math.max(impactSpeed, preSpeed);
        stepped.speed = -car.speed * 0.42;
      } else {
        stepped.speed *= 0.4;
      }
    }
  }

  return { car: stepped, crashed, impactSpeed };
}

export function proposeAndMarryNpc(
  partner: PartnerState,
  npc: CityNpc
): PartnerState {
  const alreadyMarried = partner.marriedPartnerNames.includes(npc.name);
  return {
    ...partner,
    spouseName: npc.name,
    spouseJacketColor: '#F43F5E',
    spousePantsColor: npc.pantsColor,
    marriedPartnerNames: alreadyMarried
      ? partner.marriedPartnerNames
      : [...partner.marriedPartnerNames, npc.name],
  };
}
