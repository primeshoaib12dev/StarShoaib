import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AlertTriangle,
  Camera,
  Car,
  Heart,
  Home,
  Menu,
  Play,
  SlidersHorizontal,
  Smartphone,
  Tv,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DialogueBox } from './DialogueBox';
import { NewYearTvModal } from './NewYearTvModal';
import { PhoneModal } from './PhoneModal';
import {
  CITY_BOUNDS,
  CITY_BUILDINGS,
  CITY_CAR_SPAWN_POS,
  CITY_HOME_DOOR_POS,
  CITY_NPCS,
  CameraViewMode,
  CarCatalogItem,
  CoinPickup,
  DEFAULT_PARTNER_STATE,
  GF_DIALOGUE_TREE,
  HOUSE_BATH_POS,
  HOUSE_BOUNDS,
  HOUSE_DOOR_POS,
  HOUSE_DRESSING_POS,
  HOUSE_GF_POS,
  HOUSE_OBSTACLES,
  HOUSE_TV_POS,
  INITIAL_CITY_COINS,
  NearbyInteraction,
  OUTFITS,
  PartnerState,
  PersistedGameSave,
  SpawnedCar,
  WorldZone,
  clampDt,
  clampTouchSensitivity,
  cycleCameraMode,
  detectNearbyInteraction,
  getCameraModeLabel,
  movePlayerWithObstacles,
  normalizeJoystickVector,
  proposeAndMarryNpc,
  stepCarPhysicsWithAccident,
} from '../game/worldLogic';
import {
  HumanoidRig,
  VehicleRig,
  animateHumanoid,
  createBabyCribModel,
  createCoinMesh,
  createFlowerBushModel,
  createGardenLanternModel,
  createHeartMesh,
  createHumanoidModel,
  createPalmTreeModel,
  createVehicleModel,
} from '../game/threeModels';
import {
  createAsphaltTexture,
  createBuildingFacadeTexture,
  createContactShadowTexture,
  createNewYearTvScreenTexture,
  createViceSignTexture,
  createWoodFloorTexture,
  detectSoftwareWebGL,
} from '../game/threeTextures';
import { soundEngine } from '../utils/audioEngine';

interface GameWorld3DProps {
  save: PersistedGameSave;
  paused: boolean;
  onSetPaused: (paused: boolean) => void;
  onAddCoins: (amount: number) => void;
  onSelectOutfit: (outfitId: string) => {
    status: 'equipped' | 'unlocked' | 'insufficient_coins';
  };
  onOrderCar: (catalogId: string) => {
    status: 'ordered' | 'insufficient_coins';
    car?: CarCatalogItem | null;
  };
  onToggleMute: () => void;
  onBackToLobby: () => void;
}

const HOUSE_SCALE = 0.03; // 720x520 -> 21.6m x 15.6m Vice City apartment
const CITY_SCALE = 0.08; // 1600x1200 -> 128m x 96m Vice City district
const JOYSTICK_MAX_RADIUS = 38;

// Reusable scratch vectors outside RAF (zero GC)
const _camTarget = new THREE.Vector3();
const _camGoal = new THREE.Vector3();

const INITIAL_DRIVEWAY_CARS: SpawnedCar[] = [
  {
    instanceId: 'starter-lambo',
    catalogId: 'car-lamborghini',
    name: 'Lamborghini Revuelto',
    color: '#F5A623',
    accent: '#0B0D10',
    maxSpeed: 420,
    x: CITY_CAR_SPAWN_POS.x,
    y: CITY_CAR_SPAWN_POS.y,
    angle: 0,
    speed: 0,
  },
  {
    instanceId: 'starter-bmw',
    catalogId: 'car-bmw',
    name: 'BMW M4 Coupe',
    color: '#2563EB',
    accent: '#E2E8F0',
    maxSpeed: 375,
    x: CITY_CAR_SPAWN_POS.x + 120,
    y: CITY_CAR_SPAWN_POS.y,
    angle: 0,
    speed: 0,
  },
  {
    instanceId: 'starter-mercedes',
    catalogId: 'car-mercedes',
    name: 'Mercedes-AMG GT',
    color: '#CBD5E1',
    accent: '#0B0D10',
    maxSpeed: 390,
    x: CITY_CAR_SPAWN_POS.x + 240,
    y: CITY_CAR_SPAWN_POS.y,
    angle: 0,
    speed: 0,
  },
  {
    instanceId: 'starter-tata',
    catalogId: 'car-tata',
    name: 'Tata Harrier EV',
    color: '#10B981',
    accent: '#F8FAFC',
    maxSpeed: 330,
    x: CITY_CAR_SPAWN_POS.x + 360,
    y: CITY_CAR_SPAWN_POS.y,
    angle: 0,
    speed: 0,
  },
];

export const GameWorld3D: React.FC<GameWorld3DProps> = ({
  save,
  paused,
  onSetPaused,
  onAddCoins,
  onSelectOutfit,
  onOrderCar,
  onToggleMute,
  onBackToLobby,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const landscapeKnobRef = useRef<HTMLDivElement | null>(null);
  const portraitKnobRef = useRef<HTMLDivElement | null>(null);

  const [zone, setZone] = useState<WorldZone>('house');
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('third_person');
  const [touchSensitivity, setTouchSensitivity] = useState<number>(1.2);
  const [showCamSettings, setShowCamSettings] = useState<boolean>(false);
  const [accidentBanner, setAccidentBanner] = useState<boolean>(false);
  const [partnerState, setPartnerState] = useState<PartnerState>(() => {
    try {
      const raw = window.localStorage.getItem('shoaibstar-family-state-v1');
      if (!raw) return DEFAULT_PARTNER_STATE;
      const parsed = JSON.parse(raw) as Partial<PartnerState>;
      return { ...DEFAULT_PARTNER_STATE, ...parsed, hasBaby: Boolean(parsed.hasBaby), marriedPartnerNames: Array.isArray(parsed.marriedPartnerNames) ? parsed.marriedPartnerNames : DEFAULT_PARTNER_STATE.marriedPartnerNames };
    } catch { return DEFAULT_PARTNER_STATE; }
  });
  const [cutsceneMode, setCutsceneMode] = useState<'welcome' | 'baby' | 'wedding' | null>(null);
  const [nearby, setNearby] = useState<NearbyInteraction>({ type: null, label: '' });
  const [dialogueId, setDialogueId] = useState<string | null>(null);
  const [isTvOpen, setIsTvOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(
    '16:9 Vice Safehouse! Talk to your Wife Aisha, visit Dressing & Bath, or drive Lamborghini, BMW, Mercedes & Tata outside.'
  );

  const zoneRef = useRef<WorldZone>('house');
  const pausedRef = useRef<boolean>(paused);
  const overlayOpenRef = useRef<boolean>(false);
  const talkingActiveRef = useRef<boolean>(false);
  const cutsceneRef = useRef<'welcome' | 'baby' | 'wedding' | null>(null);
  const partnerStateRef = useRef<PartnerState>(DEFAULT_PARTNER_STATE);
  const outfitRef = useRef(OUTFITS[0]);
  const playerRigRef = useRef<HumanoidRig | null>(null);
  const gfRigRef = useRef<HumanoidRig | null>(null);
  const gfPosRef = useRef<{ x: number; y: number }>({ ...HOUSE_GF_POS });
  const showerActiveRef = useRef<boolean>(false);
  const crashEffectTimerRef = useRef<number>(0);

  // Camera state refs read inside RAF without re-mounting WebGL
  const cameraModeRef = useRef<CameraViewMode>('third_person');
  const sensitivityRef = useRef<number>(1.2);
  const camYawRef = useRef<number>(0);
  const camPitchRef = useRef<number>(0.18);

  const playerRef = useRef({
    x: 350,
    y: 310,
    angle: -Math.PI / 2,
    speed: 0,
  });
  const drivingCarIdRef = useRef<string | null>(null);
  const carsRef = useRef<SpawnedCar[]>(INITIAL_DRIVEWAY_CARS.map((c) => ({ ...c })));
  const pendingCarsRef = useRef<SpawnedCar[]>([]);
  const coinsRef = useRef<CoinPickup[]>(
    INITIAL_CITY_COINS.map((c) => ({ ...c }))
  );

  const keysRef = useRef<Set<string>>(new Set());
  const joyVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const joyPointerIdRef = useRef<number | null>(null);
  const onAddCoinsRef = useRef(onAddCoins);
  onAddCoinsRef.current = onAddCoins;
  const onSelectOutfitRef = useRef(onSelectOutfit);
  onSelectOutfitRef.current = onSelectOutfit;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    sensitivityRef.current = touchSensitivity;
  }, [touchSensitivity]);

  useEffect(() => {
    talkingActiveRef.current = Boolean(dialogueId);
    overlayOpenRef.current = Boolean(
      dialogueId || isTvOpen || isPhoneOpen || paused || cutsceneMode
    );
  }, [dialogueId, isTvOpen, isPhoneOpen, paused, cutsceneMode]);

  useEffect(() => {
    cutsceneRef.current = cutsceneMode;
    if (!cutsceneMode) return;
    const t = window.setTimeout(() => {
      setCutsceneMode(null);
      gfPosRef.current = { ...HOUSE_GF_POS };
    }, 3600);
    return () => window.clearTimeout(t);
  }, [cutsceneMode]);

  useEffect(() => {
    partnerStateRef.current = partnerState;
    try { window.localStorage.setItem('shoaibstar-family-state-v1', JSON.stringify(partnerState)); } catch { /* storage may be unavailable */ }
  }, [partnerState]);

  useEffect(() => {
    const nextOutfit =
      OUTFITS.find((o) => o.id === save.selectedOutfitId) ?? OUTFITS[0];
    outfitRef.current = nextOutfit;
    if (playerRigRef.current) {
      playerRigRef.current.updateOutfit(nextOutfit);
    }
  }, [save.selectedOutfitId]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4200);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    if (!accidentBanner) return;
    const t = window.setTimeout(() => setAccidentBanner(false), 2600);
    return () => window.clearTimeout(t);
  }, [accidentBanner]);

  const startDialogueNode = useCallback((nodeId: string) => {
    const node = GF_DIALOGUE_TREE[nodeId];
    if (!node) return;
    const spokenText =
      nodeId === 'start'
        ? node.text.replace('Aisha', partnerStateRef.current.spouseName)
        : node.text;
    soundEngine.speakLine(spokenText, node.speaker);
    setDialogueId(nodeId);
  }, []);

  const triggerAction = useCallback(() => {
    if (pausedRef.current || dialogueId || isTvOpen || isPhoneOpen || cutsceneRef.current) return;

    const currentNearby = detectNearbyInteraction({
      zone: zoneRef.current,
      playerX: playerRef.current.x,
      playerY: playerRef.current.y,
      drivingCarId: drivingCarIdRef.current,
      cars: carsRef.current,
      gfPos: gfPosRef.current,
      npcs: CITY_NPCS,
      spouseName: partnerStateRef.current.spouseName,
    });

    if (currentNearby.type === 'gf') {
      startDialogueNode('start');
      return;
    }

    if (currentNearby.type === 'npc' && currentNearby.targetId) {
      const npc = CITY_NPCS.find((n) => n.id === currentNearby.targetId);
      if (npc) {
        startDialogueNode(npc.dialogueId);
      }
      return;
    }

    if (currentNearby.type === 'tv') {
      soundEngine.playNewYearFirework();
      setIsTvOpen(true);
      return;
    }

    if (currentNearby.type === 'dressing') {
      onSelectOutfitRef.current('outfit-halfpant');
      soundEngine.playClick();
      setToastMsg('Switched to Half-Pant lounge shorts in the Dressing Room!');
      return;
    }

    if (currentNearby.type === 'bath') {
      onSelectOutfitRef.current('outfit-halfpant');
      showerActiveRef.current = !showerActiveRef.current;
      soundEngine.playWaterShower();
      setToastMsg(
        showerActiveRef.current
          ? 'Shower ON! Wearing Half-Pant lounge shorts.'
          : 'Shower turned OFF.'
      );
      return;
    }

    if (currentNearby.type === 'door_exit') {
      soundEngine.playDoor();
      showerActiveRef.current = false;
      gfRigRef.current?.setResortMode?.(false);
      gfPosRef.current = { ...HOUSE_GF_POS };
      zoneRef.current = 'city';
      setZone('city');
      playerRef.current = {
        x: CITY_HOME_DOOR_POS.x,
        y: CITY_HOME_DOOR_POS.y + 32,
        angle: Math.PI / 2,
        speed: 0,
      };
      camYawRef.current = Math.PI * 0.56;
      camPitchRef.current = 0.16;
      setToastMsg('Outside in Villa Garden! Lamborghini, BMW, Mercedes & Tata ready.');
      return;
    }

    if (currentNearby.type === 'door_enter') {
      soundEngine.playDoor();
      drivingCarIdRef.current = null;
      zoneRef.current = 'house';
      setZone('house');
      playerRef.current = {
        x: HOUSE_DOOR_POS.x,
        y: HOUSE_DOOR_POS.y - 46,
        angle: -Math.PI / 2,
        speed: 0,
      };
      camYawRef.current = 0;
      camPitchRef.current = 0.18;
      setToastMsg('Entered your Vice Safehouse.');
      return;
    }

    if (currentNearby.type === 'car' && currentNearby.targetId) {
      if (drivingCarIdRef.current) {
        const car = carsRef.current.find(
          (c) => c.instanceId === drivingCarIdRef.current
        );
        if (car) {
          car.speed = 0;
          playerRef.current.x = car.x + 36;
          playerRef.current.y = car.y;
        }
        drivingCarIdRef.current = null;
        soundEngine.playClick();
        setToastMsg('Exited vehicle.');
      } else {
        drivingCarIdRef.current = currentNearby.targetId;
        soundEngine.playCarStart();
        setToastMsg('Driving! Watch intersections to avoid accidents.');
      }
    }
  }, [dialogueId, isTvOpen, isPhoneOpen, startDialogueNode]);

  // Keyboard & Blur Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (e.key === 'p' || e.key === 'P') {
          if (!pausedRef.current && !dialogueId && !isTvOpen) {
            setIsPhoneOpen((prev) => !prev);
            soundEngine.playClick();
            return;
          }
        }
        if (dialogueId || isTvOpen || isPhoneOpen || showCamSettings) {
          setDialogueId(null);
          setIsTvOpen(false);
          setIsPhoneOpen(false);
          setShowCamSettings(false);
          return;
        }
        onSetPaused(!pausedRef.current);
        return;
      }

      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        if (!overlayOpenRef.current) {
          e.preventDefault();
          triggerAction();
          return;
        }
      }

      if (e.key === 'v' || e.key === 'V') {
        if (!overlayOpenRef.current) {
          setCameraMode((prev) => cycleCameraMode(prev));
          soundEngine.playClick();
          return;
        }
      }

      keysRef.current.add(e.key.toLowerCase());
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const clearInputs = () => {
      keysRef.current.clear();
      joyVecRef.current = { x: 0, y: 0 };
      joyPointerIdRef.current = null;
      if (landscapeKnobRef.current) {
        landscapeKnobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
      }
      if (portraitKnobRef.current) {
        portraitKnobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', clearInputs);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', clearInputs);
    };
  }, [dialogueId, isTvOpen, isPhoneOpen, showCamSettings, onSetPaused, triggerAction]);

  // Virtual Analog Joystick Handlers
  const updateJoystickFromPointer = (
    base: HTMLDivElement,
    clientX: number,
    clientY: number
  ) => {
    const rect = base.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const norm = normalizeJoystickVector(dx, dy, JOYSTICK_MAX_RADIUS, 0.12);
    joyVecRef.current = { x: norm.x, y: norm.y };

    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, JOYSTICK_MAX_RADIUS);
    const kx = dist > 0 ? (dx / dist) * clampedDist : 0;
    const ky = dist > 0 ? (dy / dist) * clampedDist : 0;
    const knob = base.querySelector<HTMLDivElement>('[data-knob="true"]');
    if (knob) {
      knob.style.transform = `translate3d(${kx.toFixed(1)}px, ${ky.toFixed(1)}px, 0px)`;
    }
  };

  const handleJoystickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    joyPointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateJoystickFromPointer(e.currentTarget, e.clientX, e.clientY);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    updateJoystickFromPointer(e.currentTarget, e.clientX, e.clientY);
  };

  const handleJoystickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    joyPointerIdRef.current = null;
    joyVecRef.current = { x: 0, y: 0 };
    const knob = e.currentTarget.querySelector<HTMLDivElement>('[data-knob="true"]');
    if (knob) {
      knob.style.transform = 'translate3d(0px, 0px, 0px)';
    }
  };

  // Three.js Scene & Simulation Mount (16:9 container-sized via ResizeObserver)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const initW = Math.max(320, container.clientWidth || 960);
    const initH = Math.max(180, container.clientHeight || 540);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(initW, initH, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x1f1433);
    scene.background = skyColor;
    scene.fog = new THREE.FogExp2(0x1f1433, 0.0082);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(54, initW / initH, 0.1, 260);

    const hemiLight = new THREE.HemisphereLight(0xff94c2, 0x1e293b, 0.92);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffcf99, 1.85);
    sunLight.position.set(35, 55, 25);
    if (!isSoftwareGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(1024, 1024);
      sunLight.shadow.camera.near = 5;
      sunLight.shadow.camera.far = 140;
      const d = 45;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(-30, 22, -35);
    scene.add(rimLight);

    const shadowTex = createContactShadowTexture();
    const woodTex = createWoodFloorTexture(maxAniso);
    const asphaltTex = createAsphaltTexture(maxAniso);
    const tvScreen = createNewYearTvScreenTexture();

    // ================= HOUSE + DRESSING & BATHROOM + BALCONY GARDEN =================
    const houseGroup = new THREE.Group();
    scene.add(houseGroup);

    const hw = HOUSE_BOUNDS.w * HOUSE_SCALE;
    const hh = HOUSE_BOUNDS.h * HOUSE_SCALE;

    const houseFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(hw, hh),
      new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0xffffff,
        roughness: 0.72,
        metalness: 0.05,
      })
    );
    houseFloor.rotation.x = -Math.PI / 2;
    houseFloor.position.set(hw / 2, 0, hh / 2);
    houseFloor.receiveShadow = true;
    houseGroup.add(houseFloor);

    // Vice City Living Room Rug
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 4.8),
      new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.92 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(255 * HOUSE_SCALE, 0.02, 165 * HOUSE_SCALE);
    rug.receiveShadow = true;
    houseGroup.add(rug);

    // Bathroom & Dressing Suite Tile Floor (bottom-right room)
    const bathFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, 6.4),
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.28,
        metalness: 0.1,
      })
    );
    bathFloor.rotation.x = -Math.PI / 2;
    bathFloor.position.set(615 * HOUSE_SCALE, 0.022, 410 * HOUSE_SCALE);
    houseGroup.add(bathFloor);

    // Dressing Wardrobe Closet
    const wardrobe = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.3, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x3b2a20, roughness: 0.55 })
    );
    wardrobe.position.set(570 * HOUSE_SCALE, 1.15, 275 * HOUSE_SCALE);
    houseGroup.add(wardrobe);

    const wardrobeSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.42),
      new THREE.MeshBasicMaterial({
        map: createViceSignTexture('DRESS / HALF-PANT', '#0B0D10', '#38BDF8'),
        side: THREE.DoubleSide,
      })
    );
    wardrobeSign.position.set(570 * HOUSE_SCALE, 2.55, 275 * HOUSE_SCALE + 0.42);
    houseGroup.add(wardrobeSign);

    // Shower Glass Enclosure + Chrome Head + Animated Water Droplets
    const showerBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.14, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 })
    );
    showerBase.position.set(HOUSE_BATH_POS.x * HOUSE_SCALE, 0.07, HOUSE_BATH_POS.y * HOUSE_SCALE);
    houseGroup.add(showerBase);

    const showerGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 2.3, 2.4),
      new THREE.MeshPhysicalMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.32,
        roughness: 0.06,
      })
    );
    showerGlass.position.set(
      HOUSE_BATH_POS.x * HOUSE_SCALE - 1.2,
      1.2,
      HOUSE_BATH_POS.y * HOUSE_SCALE
    );
    houseGroup.add(showerGlass);

    const showerSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.42),
      new THREE.MeshBasicMaterial({
        map: createViceSignTexture('SHOWER & SPA', '#0B0D10', '#FF4D94'),
        side: THREE.DoubleSide,
      })
    );
    showerSign.position.set(
      HOUSE_BATH_POS.x * HOUSE_SCALE,
      2.65,
      HOUSE_BATH_POS.y * HOUSE_SCALE - 1.1
    );
    showerSign.rotation.y = Math.PI;
    houseGroup.add(showerSign);

    const showerDrops: THREE.Mesh[] = [];
    const dropGeo = new THREE.SphereGeometry(0.035, 6, 6);
    const dropMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
    for (let i = 0; i < 14; i++) {
      const d = new THREE.Mesh(dropGeo, dropMat);
      d.position.set(
        HOUSE_BATH_POS.x * HOUSE_SCALE + ((i % 4) - 1.5) * 0.32,
        0.4 + ((i * 0.37) % 1.8),
        HOUSE_BATH_POS.y * HOUSE_SCALE + (Math.floor(i / 4) - 1.5) * 0.3
      );
      d.visible = false;
      showerDrops.push(d);
      houseGroup.add(d);
    }

    // House Walls + Panoramic Garden Window
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x262035,
      roughness: 0.78,
      metalness: 0.06,
    });
    const wallHeight = 3.7;

    const backLeftWall = new THREE.Mesh(
      new THREE.BoxGeometry(11.4, wallHeight, 0.3),
      wallMat
    );
    backLeftWall.position.set(5.7, wallHeight / 2, 0);
    houseGroup.add(backLeftWall);

    const backRightWallLower = new THREE.Mesh(
      new THREE.BoxGeometry(hw - 11.4, 0.9, 0.3),
      wallMat
    );
    backRightWallLower.position.set(11.4 + (hw - 11.4) / 2, 0.45, 0);
    houseGroup.add(backRightWallLower);

    const backRightWallUpper = new THREE.Mesh(
      new THREE.BoxGeometry(hw - 11.4, 0.6, 0.3),
      wallMat
    );
    backRightWallUpper.position.set(11.4 + (hw - 11.4) / 2, wallHeight - 0.3, 0);
    houseGroup.add(backRightWallUpper);

    const glassWindow = new THREE.Mesh(
      new THREE.PlaneGeometry(hw - 11.8, 2.2),
      new THREE.MeshPhysicalMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.22,
        roughness: 0.08,
        metalness: 0.1,
        side: THREE.DoubleSide,
      })
    );
    glassWindow.position.set(11.4 + (hw - 11.4) / 2, 2.0, 0);
    houseGroup.add(glassWindow);

    const terraceGrass = new THREE.Mesh(
      new THREE.PlaneGeometry(hw + 4, 6.5),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 })
    );
    terraceGrass.rotation.x = -Math.PI / 2;
    terraceGrass.position.set(hw / 2, -0.01, -3.4);
    houseGroup.add(terraceGrass);

    for (const [gx, gz] of [
      [13.2, -1.8],
      [17.8, -2.1],
      [15.6, -4.2],
    ]) {
      const bush = createFlowerBushModel(0xff4d94);
      bush.position.set(gx, 0, gz);
      houseGroup.add(bush);
    }
    const terracePalm = createPalmTreeModel();
    terracePalm.position.set(19.5, 0, -3.2);
    houseGroup.add(terracePalm);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallHeight, hh), wallMat);
    leftWall.position.set(0, wallHeight / 2, hh / 2);
    houseGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallHeight, hh), wallMat);
    rightWall.position.set(hw, wallHeight / 2, hh / 2);
    houseGroup.add(rightWall);

    const doorX = HOUSE_DOOR_POS.x * HOUSE_SCALE;
    const leftFrontW = doorX - 1.3;
    const frontLeft = new THREE.Mesh(
      new THREE.BoxGeometry(leftFrontW, wallHeight, 0.3),
      wallMat
    );
    frontLeft.position.set(leftFrontW / 2, wallHeight / 2, hh);
    houseGroup.add(frontLeft);

    const rightFrontW = hw - (doorX + 1.3);
    const frontRight = new THREE.Mesh(
      new THREE.BoxGeometry(rightFrontW, wallHeight, 0.3),
      wallMat
    );
    frontRight.position.set(doorX + 1.3 + rightFrontW / 2, wallHeight / 2, hh);
    houseGroup.add(frontRight);

    const exitSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 0.7),
      new THREE.MeshBasicMaterial({
        map: createViceSignTexture('GARDEN & CARS', '#14181F', '#F5A623'),
        side: THREE.DoubleSide,
      })
    );
    exitSign.position.set(doorX, 2.8, hh - 0.2);
    houseGroup.add(exitSign);

    for (const obs of HOUSE_OBSTACLES) {
      const fw = obs.w * HOUSE_SCALE;
      const fd = obs.h * HOUSE_SCALE;
      const fx = (obs.x + obs.w / 2) * HOUSE_SCALE;
      const fz = (obs.y + obs.h / 2) * HOUSE_SCALE;
      const fh =
        obs.label === 'Sofa'
          ? 0.85
          : obs.label === 'Table'
            ? 0.48
            : obs.label === 'Bed'
              ? 0.72
              : obs.label === 'Bath Partition'
                ? 2.6
                : 1.02;
      const col =
        obs.label === 'Sofa'
          ? 0xbe185d
          : obs.label === 'Bed'
            ? 0x7c2d12
            : obs.label === 'Bath Partition'
              ? 0x334155
              : obs.label === 'Kitchen'
                ? 0x334155
                : 0x473528;

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(fw, fh, fd),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.65 })
      );
      mesh.position.set(fx, fh / 2, fz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      houseGroup.add(mesh);

      if (obs.label === 'Sofa') {
        const backrest = new THREE.Mesh(
          new THREE.BoxGeometry(fw, 0.55, 0.35),
          new THREE.MeshStandardMaterial({ color: 0x9d174d, roughness: 0.7 })
        );
        backrest.position.set(fx, fh + 0.2, fz + fd / 2 - 0.18);
        houseGroup.add(backrest);
      }
    }

    const potPlant = createFlowerBushModel(0xf5a623);
    potPlant.scale.setScalar(0.65);
    potPlant.position.set(1.6, 0, 1.4);
    houseGroup.add(potPlant);

    // Upgraded Safehouse Architecture: Wall Picture Art, Bedside Lamps, Bathroom Mirror & Nursery Crib
    const artFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.35, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.3, metalness: 0.7 })
    );
    artFrame.position.set(3.2, 2.2, 0.2);
    houseGroup.add(artFrame);

    const artCanvas = new THREE.Mesh(
      new THREE.PlaneGeometry(1.95, 1.1),
      new THREE.MeshBasicMaterial({
        map: createViceSignTexture('SHOAIB & FAMILY', '#1B1430', '#FF4D94'),
      })
    );
    artCanvas.position.set(3.2, 2.2, 0.25);
    houseGroup.add(artCanvas);

    // Bathroom Vanity Mirror & Chrome Sink
    const bathMirror = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.08, metalness: 0.92 })
    );
    bathMirror.position.set(17.5, 1.85, 15.42);
    bathMirror.rotation.y = Math.PI;
    houseGroup.add(bathMirror);

    // Bedside Warm Lamp
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 0.45, 10),
      new THREE.MeshStandardMaterial({ color: 0xf5a623, metalness: 0.8 })
    );
    lampBase.position.set(1.2, 0.22, 12.2);
    houseGroup.add(lampBase);

    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.32, 12),
      new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.9,
      })
    );
    lampShade.position.set(1.2, 0.62, 12.2);
    houseGroup.add(lampShade);

    // 3D Nursery Baby Crib (appears when Baby Family Milestone completes)
    const babyCrib = createBabyCribModel();
    babyCrib.position.set(7.4, 0, 13.4);
    babyCrib.visible = partnerStateRef.current.hasBaby;
    houseGroup.add(babyCrib);

    // Floating 3D Hearts Pool for PG-13 Kiss & Wedding Cutscenes
    const heartsGroup = new THREE.Group();
    heartsGroup.visible = false;
    const heartMeshes: THREE.Group[] = [];
    for (let i = 0; i < 6; i++) {
      const h = createHeartMesh();
      h.scale.setScalar(0.36);
      h.position.set(((i % 3) - 1) * 0.46, 1.95 + i * 0.14, ((i % 2) - 0.5) * 0.28);
      heartMeshes.push(h);
      heartsGroup.add(h);
    }
    houseGroup.add(heartsGroup);

    const tvFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 1.9, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.25, metalness: 0.8 })
    );
    tvFrame.position.set(HOUSE_TV_POS.x * HOUSE_SCALE, 1.95, 0.35);
    houseGroup.add(tvFrame);

    const tvDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(3.15, 1.65),
      new THREE.MeshBasicMaterial({ map: tvScreen.texture })
    );
    tvDisplay.position.set(HOUSE_TV_POS.x * HOUSE_SCALE, 1.95, 0.44);
    houseGroup.add(tvDisplay);

    const gfRig = createHumanoidModel({
      isFemale: true,
      shadowTexture: shadowTex,
    });
    gfRigRef.current = gfRig;
    gfRig.group.position.set(
      HOUSE_GF_POS.x * HOUSE_SCALE,
      0,
      HOUSE_GF_POS.y * HOUSE_SCALE
    );
    houseGroup.add(gfRig.group);

    // ================= VICE CITY + GARDEN + CARS + NPCS + ACCIDENT FX =================
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    const cw = CITY_BOUNDS.w * CITY_SCALE;
    const ch = CITY_BOUNDS.h * CITY_SCALE;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({
        map: asphaltTex,
        color: 0xffffff,
        roughness: 0.88,
        metalness: 0.04,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(cw / 2, 0, ch / 2);
    ground.receiveShadow = true;
    cityGroup.add(ground);

    const villaLawn = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 24),
      new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.92 })
    );
    villaLawn.rotation.x = -Math.PI / 2;
    villaLawn.position.set(18, 0.02, 16);
    villaLawn.receiveShadow = true;
    cityGroup.add(villaLawn);

    const walkway = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 8.5),
      new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.82 })
    );
    walkway.rotation.x = -Math.PI / 2;
    walkway.position.set(CITY_HOME_DOOR_POS.x * CITY_SCALE, 0.03, 25.2);
    cityGroup.add(walkway);

    const poolDeck = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 11.5),
      new THREE.MeshStandardMaterial({ color: 0x9a7b56, roughness: 0.78 })
    );
    poolDeck.rotation.x = -Math.PI / 2;
    poolDeck.position.set(5.2, 0.03, 15.8);
    cityGroup.add(poolDeck);

    const poolWater = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 8.2),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.35,
        roughness: 0.14,
        metalness: 0.5,
      })
    );
    poolWater.rotation.x = -Math.PI / 2;
    poolWater.position.set(5.2, 0.04, 15.8);
    cityGroup.add(poolWater);

    const umbrellaPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7 })
    );
    umbrellaPole.position.set(7.6, 1.2, 12.2);
    cityGroup.add(umbrellaPole);

    const umbrellaTop = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 0.55, 10),
      new THREE.MeshStandardMaterial({ color: 0xff4d94, roughness: 0.65 })
    );
    umbrellaTop.position.set(7.6, 2.45, 12.2);
    cityGroup.add(umbrellaTop);

    for (const [bx, bz, col] of [
      [14.2, 23.8, 0xff4d94],
      [16.8, 23.8, 0xf5a623],
      [23.4, 23.8, 0xff4d94],
      [26.2, 23.8, 0xf5a623],
      [3.0, 8.0, 0xff4d94],
      [3.0, 22.8, 0xf5a623],
      [32.0, 12.0, 0xff4d94],
      [32.0, 21.0, 0xf5a623],
    ]) {
      const bush = createFlowerBushModel(col);
      bush.position.set(bx, 0, bz);
      cityGroup.add(bush);
    }

    for (const [lx, lz] of [
      [17.8, 25.0],
      [22.2, 25.0],
      [9.0, 24.5],
      [29.5, 24.5],
    ]) {
      const lantern = createGardenLanternModel();
      lantern.position.set(lx, 0, lz);
      cityGroup.add(lantern);
    }

    const beach = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 420),
      new THREE.MeshStandardMaterial({ color: 0xd6b888, roughness: 0.92 })
    );
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(cw + 48, 0.015, ch / 2);
    cityGroup.add(beach);

    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 420),
      new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.16,
        metalness: 0.55,
      })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(cw + 165, 0.01, ch / 2);
    cityGroup.add(ocean);

    const laneMat = new THREE.MeshBasicMaterial({ color: 0xf5a623 });
    for (let lx = 4; lx < cw; lx += 8) {
      const dash1 = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.25), laneMat);
      dash1.rotation.x = -Math.PI / 2;
      dash1.position.set(lx, 0.025, 415 * CITY_SCALE);
      cityGroup.add(dash1);

      const dash2 = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.25), laneMat);
      dash2.rotation.x = -Math.PI / 2;
      dash2.position.set(lx, 0.025, 845 * CITY_SCALE);
      cityGroup.add(dash2);
    }

    const park = new THREE.Mesh(
      new THREE.PlaneGeometry(340 * CITY_SCALE, 280 * CITY_SCALE),
      new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 })
    );
    park.rotation.x = -Math.PI / 2;
    park.position.set(690 * CITY_SCALE, 0.025, 620 * CITY_SCALE);
    park.receiveShadow = true;
    cityGroup.add(park);

    const vicePalette: Record<
      string,
      { wall: string; win: string; neon: string; h: number }
    > = {
      'SHOAIB HOUSE': { wall: '#2a223b', win: '#fbbf24', neon: '#F5A623', h: 7.5 },
      'STAR DINER': { wall: '#4a1d3a', win: '#38bdf8', neon: '#FF4D94', h: 8.5 },
      'SHOAIB CLUB': { wall: '#1f2347', win: '#ff4d94', neon: '#38BDF8', h: 12 },
      'STAR TOWER': { wall: '#1b263b', win: '#fde047', neon: '#F5A623', h: 24 },
      FOUNTAIN: { wall: '#0284c7', win: '#38bdf8', neon: '#38BDF8', h: 1.3 },
      'GARAGE HUB': { wall: '#262936', win: '#f59e0b', neon: '#F5A623', h: 9.5 },
    };

    for (const b of CITY_BUILDINGS) {
      const bw = b.w * CITY_SCALE;
      const bd = b.h * CITY_SCALE;
      const bx = (b.x + b.w / 2) * CITY_SCALE;
      const bz = (b.y + b.h / 2) * CITY_SCALE;
      const style = vicePalette[b.label ?? ''] ?? {
        wall: '#242938',
        win: '#fde047',
        neon: '#F5A623',
        h: 10,
      };

      const facadeTex = createBuildingFacadeTexture(style.wall, style.win, maxAniso);
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(bw, style.h, bd),
        new THREE.MeshStandardMaterial({
          map: facadeTex,
          color: 0xffffff,
          roughness: 0.65,
          metalness: 0.1,
        })
      );
      bMesh.position.set(bx, style.h / 2, bz);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      cityGroup.add(bMesh);

      if (b.label && b.label !== 'FOUNTAIN') {
        const neonTrim = new THREE.Mesh(
          new THREE.BoxGeometry(bw + 0.25, 0.22, bd + 0.25),
          new THREE.MeshBasicMaterial({ color: style.neon })
        );
        neonTrim.position.set(bx, style.h + 0.1, bz);
        cityGroup.add(neonTrim);

        // Upgraded Architectural Penthouse Crown & Commercial Awnings
        const roofCrown = new THREE.Mesh(
          new THREE.BoxGeometry(bw * 0.65, 1.15, bd * 0.65),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.35 })
        );
        roofCrown.position.set(bx, style.h + 0.72, bz);
        cityGroup.add(roofCrown);

        if (b.label !== 'SHOAIB HOUSE') {
          const canopy = new THREE.Mesh(
            new THREE.BoxGeometry(bw * 0.36, 0.16, 0.9),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 })
          );
          canopy.position.set(bx, 2.9, bz + bd / 2 + 0.45);
          cityGroup.add(canopy);
        }

        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(Math.min(bw * 0.7, 9), 2.1),
          new THREE.MeshBasicMaterial({
            map: createViceSignTexture(b.label, '#0B0D10', style.neon),
          })
        );
        sign.position.set(bx, Math.min(style.h - 1.4, 5.4), bz + bd / 2 + 0.08);
        cityGroup.add(sign);
      }
    }

    for (const [px, pz] of [
      [55, 165],
      [95, 325],
      [410, 295],
      [530, 325],
      [1020, 325],
      [535, 735],
      [840, 505],
      [1390, 325],
      [1480, 580],
      [1480, 780],
    ]) {
      const palm = createPalmTreeModel();
      palm.position.set(px * CITY_SCALE, 0, pz * CITY_SCALE);
      cityGroup.add(palm);
    }

    // Talkable 3D City NPCs
    const npcRigs: { npc: (typeof CITY_NPCS)[number]; rig: HumanoidRig }[] = [];
    for (const npc of CITY_NPCS) {
      const rig = createHumanoidModel({
        isFemale: npc.isFemale,
        shadowTexture: shadowTex,
        outfit: {
          id: npc.id,
          name: npc.name,
          price: 0,
          jacketColor: npc.jacketColor,
          accentColor: '#F5A623',
          pantsColor: npc.pantsColor,
          glasses: false,
        },
      });
      rig.group.position.set(npc.x * CITY_SCALE, 0, npc.y * CITY_SCALE);
      npcRigs.push({ npc, rig });
      cityGroup.add(rig.group);
    }

    const coinMeshes = new Map<string, THREE.Mesh>();
    for (const c of coinsRef.current) {
      if (c.collected) continue;
      const cm = createCoinMesh();
      cm.position.set(c.x * CITY_SCALE, 0.9, c.y * CITY_SCALE);
      coinMeshes.set(c.id, cm);
      cityGroup.add(cm);
    }

    const carRigs = new Map<string, VehicleRig>();
    const ensureCarRig = (car: SpawnedCar) => {
      if (carRigs.has(car.instanceId)) return carRigs.get(car.instanceId)!;
      const rig = createVehicleModel({
        color: car.color,
        accent: car.accent,
        isBike: car.catalogId === 'car-amber-bike',
        catalogId: car.catalogId,
        shadowTexture: shadowTex,
      });
      carRigs.set(car.instanceId, rig);
      cityGroup.add(rig.group);
      return rig;
    };

    for (const car of carsRef.current) {
      ensureCarRig(car);
    }

    // Ambient Traffic 3D Cars (participate in accident collisions!)
    const trafficCars = [
      {
        x2d: 180,
        y2d: 405,
        vx2d: 110,
        vy2d: 0,
        rig: createVehicleModel({
          color: '#ec4899',
          accent: '#ffffff',
          catalogId: 'car-bmw',
          shadowTexture: shadowTex,
        }),
      },
      {
        x2d: 1320,
        y2d: 455,
        vx2d: -125,
        vy2d: 0,
        rig: createVehicleModel({
          color: '#06b6d4',
          accent: '#fef08a',
          catalogId: 'car-mercedes',
          shadowTexture: shadowTex,
        }),
      },
      {
        x2d: 465,
        y2d: 200,
        vx2d: 0,
        vy2d: 115,
        rig: createVehicleModel({
          color: '#f59e0b',
          accent: '#0b0d10',
          catalogId: 'car-tata',
          shadowTexture: shadowTex,
        }),
      },
    ];
    for (const tc of trafficCars) {
      tc.rig.group.position.set(tc.x2d * CITY_SCALE, 0, tc.y2d * CITY_SCALE);
      tc.rig.group.rotation.y = Math.atan2(tc.vx2d, tc.vy2d);
      cityGroup.add(tc.rig.group);
    }

    // Crash Accident Smoke/Spark Burst Group (reused pool)
    const crashBurst = new THREE.Group();
    crashBurst.visible = false;
    const smokeMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xf59e0b : 0x64748b,
        transparent: true,
        opacity: 0.85,
      });
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.38 + (i % 2) * 0.2, 8, 8),
        mat
      );
      puff.position.set(
        ((i % 3) - 1) * 0.5,
        0.7 + i * 0.25,
        ((Math.floor(i / 2) % 3) - 1) * 0.4
      );
      smokeMeshes.push(puff);
      crashBurst.add(puff);
    }
    cityGroup.add(crashBurst);

    // ================= PLAYER 3D RIG =================
    const playerRig = createHumanoidModel({
      outfit: outfitRef.current,
      shadowTexture: shadowTex,
    });
    playerRigRef.current = playerRig;
    scene.add(playerRig.group);

    let draggingCam = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    const onPointerDown = (e: PointerEvent) => {
      draggingCam = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingCam) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      const sens = sensitivityRef.current * 0.0065;
      camYawRef.current += dx * sens;
      camPitchRef.current = Math.max(
        -0.35,
        Math.min(0.65, camPitchRef.current + dy * sens * 0.7)
      );
    };
    const onPointerUp = () => {
      draggingCam = false;
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // 16:9 Container ResizeObserver
    const syncSize = () => {
      if (!container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(180, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(syncSize);
    ro.observe(container);
    window.addEventListener('resize', syncSize);

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let hudSyncTimer = 0;
    let tvUpdateTimer = 0;
    let lastNearbyKey = '';

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 24);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 4);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 24);
        }
      };
      frameId = window.setTimeout(poll, 4);
    }

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = clampDt((now - lastTime) / 1000);
      lastTime = now;
      const elapsed = now / 1000;

      while (pendingCarsRef.current.length > 0) {
        const nc = pendingCarsRef.current.shift()!;
        ensureCarRig(nc);
      }

      const activeZone = zoneRef.current;
      houseGroup.visible = activeZone === 'house';
      cityGroup.visible = activeZone === 'city';
      const scale = activeZone === 'house' ? HOUSE_SCALE : CITY_SCALE;

      if (!pausedRef.current && !overlayOpenRef.current) {
        const k = keysRef.current;
        const j = joyVecRef.current;
        const keyRight = k.has('d') || k.has('arrowright') ? 1 : 0;
        const keyLeft = k.has('a') || k.has('arrowleft') ? 1 : 0;
        const keyDown = k.has('s') || k.has('arrowdown') ? 1 : 0;
        const keyUp = k.has('w') || k.has('arrowup') ? 1 : 0;

        const ix = Math.max(-1, Math.min(1, keyRight - keyLeft + j.x));
        const iy = Math.max(-1, Math.min(1, keyDown - keyUp + j.y));
        const inputMag = Math.min(1, Math.hypot(ix, iy));

        if (drivingCarIdRef.current && activeZone === 'city') {
          const car = carsRef.current.find(
            (c) => c.instanceId === drivingCarIdRef.current
          );
          if (car) {
            const throttle = -iy;
            const steer = ix;
            const otherCars = [
              ...carsRef.current
                .filter((c) => c.instanceId !== car.instanceId)
                .map((c) => ({ x: c.x, y: c.y, radius: 24 })),
              ...trafficCars.map((tc) => ({ x: tc.x2d, y: tc.y2d, radius: 24 })),
            ];
            const res = stepCarPhysicsWithAccident(
              car,
              throttle,
              steer,
              dt,
              CITY_BOUNDS,
              CITY_BUILDINGS,
              otherCars
            );
            Object.assign(car, res.car);
            playerRef.current.x = car.x;
            playerRef.current.y = car.y;
            playerRef.current.angle = car.angle;
            playerRef.current.speed = Math.abs(car.speed);

            if (res.crashed) {
              soundEngine.playCrash();
              crashEffectTimerRef.current = 2.4;
              crashBurst.position.set(car.x * CITY_SCALE, 0.2, car.y * CITY_SCALE);
              crashBurst.visible = true;
              setAccidentBanner(true);
              setToastMsg('ACCIDENT! Collision on Ocean Drive — slow down at corners!');
            }
          }
        } else if (inputMag > 0.05) {
          const yaw = camYawRef.current;
          const forwardComp = -iy;
          const rightComp = ix;
          const vx2d =
            forwardComp * Math.sin(yaw) + rightComp * Math.cos(yaw);
          const vy2d =
            forwardComp * -Math.cos(yaw) + rightComp * Math.sin(yaw);
          const worldAng = Math.atan2(vy2d, vx2d);
          const speed = 215 * inputMag;
          const vx = Math.cos(worldAng) * speed;
          const vy = Math.sin(worldAng) * speed;

          const bounds = activeZone === 'house' ? HOUSE_BOUNDS : CITY_BOUNDS;
          const obs = activeZone === 'house' ? HOUSE_OBSTACLES : CITY_BUILDINGS;
          const moved = movePlayerWithObstacles(
            playerRef.current.x,
            playerRef.current.y,
            vx,
            vy,
            dt,
            16,
            bounds,
            obs
          );
          playerRef.current.x = moved.x;
          playerRef.current.y = moved.y;
          playerRef.current.angle = worldAng;
          playerRef.current.speed = speed;
        } else {
          playerRef.current.speed = 0;
        }

        // City Coins & Traffic
        if (activeZone === 'city') {
          for (const coin of coinsRef.current) {
            if (coin.collected) continue;
            const dist = Math.hypot(
              playerRef.current.x - coin.x,
              playerRef.current.y - coin.y
            );
            if (dist < 34) {
              coin.collected = true;
              const cm = coinMeshes.get(coin.id);
              if (cm) cm.visible = false;
              soundEngine.playCoin();
              onAddCoinsRef.current(coin.amount);
              setToastMsg(`+${coin.amount} Coins collected!`);
            }
          }

          for (const tc of trafficCars) {
            tc.x2d += tc.vx2d * dt;
            tc.y2d += tc.vy2d * dt;
            if (tc.x2d > CITY_BOUNDS.w + 100) tc.x2d = -100;
            if (tc.x2d < -100) tc.x2d = CITY_BOUNDS.w + 100;
            if (tc.y2d > CITY_BOUNDS.h + 100) tc.y2d = -100;
            if (tc.y2d < -100) tc.y2d = CITY_BOUNDS.h + 100;
            tc.rig.group.position.set(tc.x2d * CITY_SCALE, 0, tc.y2d * CITY_SCALE);
            for (const wh of tc.rig.wheels) {
              wh.rotation.x += dt * 7;
            }
          }
        }
      }

      // Animate Shower Droplets in Bathroom
      if (activeZone === 'house') {
        for (let i = 0; i < showerDrops.length; i++) {
          const drop = showerDrops[i];
          drop.visible = showerActiveRef.current;
          if (showerActiveRef.current) {
            drop.position.y -= dt * 2.8;
            if (drop.position.y < 0.25) {
              drop.position.y = 2.15;
            }
          }
        }
      }

      // Animate Accident Smoke/Spark Burst
      if (crashEffectTimerRef.current > 0) {
        crashEffectTimerRef.current = Math.max(0, crashEffectTimerRef.current - dt);
        crashBurst.visible = crashEffectTimerRef.current > 0 && activeZone === 'city';
        for (let i = 0; i < smokeMeshes.length; i++) {
          const p = smokeMeshes[i];
          p.position.y = 0.6 + ((elapsed * 2.4 + i * 0.4) % 1.8);
          p.scale.setScalar(0.7 + ((elapsed * 1.5 + i * 0.2) % 0.8));
        }
      }

      // Sync Baby Crib & Cutscene Hearts
      if (activeZone === 'house') {
        babyCrib.visible = partnerStateRef.current.hasBaby;
        const activeCutscene = cutsceneRef.current;
        heartsGroup.visible = activeCutscene === 'wedding';
        if (heartsGroup.visible) {
          heartsGroup.position.set(
            (playerRef.current.x + gfPosRef.current.x) * 0.5 * HOUSE_SCALE,
            0,
            (playerRef.current.y + gfPosRef.current.y) * 0.5 * HOUSE_SCALE
          );
          for (let i = 0; i < heartMeshes.length; i++) {
            const hm = heartMeshes[i];
            hm.position.y = 1.9 + ((elapsed * 0.65 + i * 0.25) % 0.95);
            hm.rotation.y = elapsed * 2.2 + i;
          }
        }
      }

      // Sync Wife position
      const gfx = gfPosRef.current.x * HOUSE_SCALE;
      const gfz = gfPosRef.current.y * HOUSE_SCALE;
      gfRig.group.position.set(gfx, 0, gfz);

      // Sync 3D Player Rig
      const px = playerRef.current.x * scale;
      const pz = playerRef.current.y * scale;
      const isWelcomeCutscene = cutsceneRef.current === 'welcome' && activeZone === 'house';
      const isWeddingCutscene = cutsceneRef.current === 'wedding' && activeZone === 'house';
      const isCutsceneOrbit = isWelcomeCutscene || isWeddingCutscene;
      const isFirstPersonFoot =
        cameraModeRef.current === 'first_person' &&
        !drivingCarIdRef.current &&
        !talkingActiveRef.current &&
        !isCutsceneOrbit;
      playerRig.group.visible = !drivingCarIdRef.current && !isFirstPersonFoot;
      playerRig.group.position.set(px, 0, pz);

      if ((talkingActiveRef.current || isCutsceneOrbit) && activeZone === 'house') {
        playerRig.group.rotation.y = Math.atan2(gfx - px, gfz - pz);
        gfRig.group.rotation.y = Math.atan2(px - gfx, pz - gfz);
      } else {
        playerRig.group.rotation.y = Math.atan2(
          Math.cos(playerRef.current.angle),
          Math.sin(playerRef.current.angle)
        );
        gfRig.group.rotation.y = Math.sin(elapsed * 0.7) * 0.35;
      }

      animateHumanoid(playerRig, {
        speed: playerRef.current.speed,
        talking: talkingActiveRef.current,
        kissing: false,
        time: elapsed,
      });
      animateHumanoid(gfRig, {
        speed: 0,
        talking: talkingActiveRef.current,
        kissing: false,
        time: elapsed + 1.1,
      });

      // Animate City NPCs & Cars
      if (activeZone === 'city') {
        for (let i = 0; i < npcRigs.length; i++) {
          const item = npcRigs[i];
          item.rig.group.rotation.y = Math.atan2(
            px - item.npc.x * CITY_SCALE,
            pz - item.npc.y * CITY_SCALE
          );
          animateHumanoid(item.rig, {
            speed: 0,
            talking: talkingActiveRef.current,
            time: elapsed + i * 0.8,
          });
        }

        for (const car of carsRef.current) {
          const rig = ensureCarRig(car);
          rig.group.position.set(car.x * CITY_SCALE, 0, car.y * CITY_SCALE);
          rig.group.rotation.y = Math.atan2(
            Math.cos(car.angle),
            Math.sin(car.angle)
          );
          for (const wh of rig.wheels) {
            wh.rotation.x += car.speed * dt * 0.04;
          }
        }

        for (const cm of coinMeshes.values()) {
          if (cm.visible) cm.rotation.y += dt * 2.8;
        }
      }

      tvUpdateTimer += dt;
      if (activeZone === 'house' && tvUpdateTimer > 0.12) {
        tvUpdateTimer = 0;
        tvScreen.update(elapsed);
      }

      // Camera Rig
      const mode = cameraModeRef.current;
      const pitch = camPitchRef.current;
      const yaw = camYawRef.current;

      if (isCutsceneOrbit) {
        const midX = (px + gfx) / 2;
        const midZ = (pz + gfz) / 2;
        const orbitAng = elapsed * 0.45;
        _camTarget.set(midX, 1.25, midZ);
        _camGoal.set(
          Math.max(1.1, Math.min(hw - 1.1, midX + Math.sin(orbitAng) * 0.65)),
          1.56,
          Math.max(1.1, Math.min(hh - 1.1, midZ + 2.35))
        );
      } else if (talkingActiveRef.current && activeZone === 'house') {
        const midX = (px + gfx) / 2;
        const midZ = (pz + gfz) / 2;
        const inBathZone = midX > 15.0 && midZ > 9.0;
        if (inBathZone) {
          _camTarget.set(midX, 0.95, midZ);
          _camGoal.set(
            Math.max(1.2, Math.min(hw - 1.2, midX - 0.85)),
            2.15,
            Math.max(1.2, midZ - 3.1)
          );
        } else {
          const talkDist = camera.aspect < 1.1 ? 4.0 : 3.1;
          _camTarget.set(midX, 0.88, midZ);
          _camGoal.set(
            Math.max(1.2, Math.min(hw - 1.2, midX - 0.6)),
            1.82,
            Math.max(1.2, Math.min(hh - 1.1, midZ + talkDist))
          );
        }
      } else if (mode === 'first_person') {
        const fwdX = Math.sin(yaw);
        const fwdZ = -Math.cos(yaw);
        const eyeY = drivingCarIdRef.current ? 1.48 : 1.65;
        _camGoal.set(
          px + (drivingCarIdRef.current ? fwdX * 0.6 : 0),
          eyeY,
          pz + (drivingCarIdRef.current ? fwdZ * 0.6 : 0)
        );
        _camTarget.set(
          _camGoal.x + fwdX * 8,
          eyeY - Math.sin(pitch) * 6,
          _camGoal.z + fwdZ * 8
        );
      } else if (mode === 'second_person') {
        const sideYaw = yaw + 0.55;
        const dist = drivingCarIdRef.current ? 5.8 : 3.2;
        const camH = 1.65 + pitch * 2.2;
        _camTarget.set(px, 1.15, pz);
        _camGoal.set(
          px - Math.sin(sideYaw) * dist,
          camH,
          pz + Math.cos(sideYaw) * dist
        );
      } else {
        const driving = Boolean(drivingCarIdRef.current) && activeZone === 'city';
        const dist = driving ? 9.8 : activeZone === 'house' ? 5.0 : 7.0;
        const baseH = driving ? 3.8 : activeZone === 'house' ? 2.55 : 3.1;
        const activeYaw = driving
          ? Math.atan2(
              Math.cos(playerRef.current.angle),
              -Math.sin(playerRef.current.angle)
            )
          : yaw;
        const fwdX = Math.sin(activeYaw);
        const fwdZ = -Math.cos(activeYaw);
        _camTarget.set(px + fwdX * 2.2, 1.35 - pitch * 1.4, pz + fwdZ * 2.2);
        _camGoal.set(
          px - fwdX * dist,
          baseH + pitch * 3.2,
          pz - fwdZ * dist
        );
      }

      if (activeZone === 'house' && mode !== 'first_person') {
        _camGoal.x = Math.max(0.85, Math.min(hw - 0.85, _camGoal.x));
        _camGoal.z = Math.max(0.85, Math.min(hh - 0.85, _camGoal.z));
      }

      if (mode === 'first_person' && !talkingActiveRef.current && !isCutsceneOrbit) {
        camera.position.copy(_camGoal);
      } else {
        const dampRate = talkingActiveRef.current || isCutsceneOrbit ? 18 : 9;
        const alpha = 1 - Math.exp(-dampRate * dt);
        camera.position.lerp(_camGoal, alpha);
      }
      camera.lookAt(_camTarget);

      const targetFov =
        drivingCarIdRef.current && mode !== 'first_person'
          ? 54 + Math.min(12, playerRef.current.speed * 0.035)
          : mode === 'first_person'
            ? 66
            : 54;
      if (Math.abs(camera.fov - targetFov) > 0.1) {
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 6, dt);
        camera.updateProjectionMatrix();
      }

      hudSyncTimer += dt;
      if (hudSyncTimer >= 0.08) {
        hudSyncTimer = 0;
        const found = detectNearbyInteraction({
          zone: zoneRef.current,
          playerX: playerRef.current.x,
          playerY: playerRef.current.y,
          drivingCarId: drivingCarIdRef.current,
          cars: carsRef.current,
          gfPos: gfPosRef.current,
          npcs: CITY_NPCS,
          spouseName: partnerStateRef.current.spouseName,
        });
        const key = `${found.type ?? ''}:${found.label}:${found.targetId ?? ''}`;
        if (key !== lastNearbyKey) {
          lastNearbyKey = key;
          setNearby(found);
        }
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', syncSize);
      shadowTex.dispose();
      woodTex.dispose();
      asphaltTex.dispose();
      tvScreen.texture.dispose();
      renderer.dispose();
    };
  }, []);

  const handleDialogueChoice = (nextId: string | null, rewardCoins?: number) => {
    if (rewardCoins && rewardCoins > 0) {
      onAddCoins(rewardCoins);
      soundEngine.playCoin();
      setToastMsg(`+${rewardCoins} Coins bonus!`);
    }
    if (nextId && GF_DIALOGUE_TREE[nextId]) {
      const nextNode = GF_DIALOGUE_TREE[nextId];
      if (nextNode.action === 'bathroom_freshen') {
        onSelectOutfit('outfit-halfpant');
        gfRigRef.current?.setResortMode?.(true);
        gfPosRef.current = { x: HOUSE_BATH_POS.x - 36, y: HOUSE_BATH_POS.y - 25 };
        playerRef.current = {
          x: HOUSE_BATH_POS.x - 10,
          y: HOUSE_BATH_POS.y + 18,
          angle: -Math.PI / 2,
          speed: 0,
        };
        showerActiveRef.current = true;
        soundEngine.playWaterShower();
        setToastMsg('Freshening up in Bathroom Spa (Half-Pant & Resort Swimwear)!');
      } else if (nextNode.action === 'welcome_cutscene') {
        gfPosRef.current = { x: 400, y: 270 };
        playerRef.current = { x: 368, y: 270, angle: 0, speed: 0 };
        soundEngine.playClick();
        setCutsceneMode('welcome');
        setDialogueId(null);
        setToastMsg(`Family welcome celebration with ${partnerStateRef.current.spouseName}!`);
        return;
      } else if (nextNode.action === 'family_baby_cutscene') {
        const updatedPartner = { ...partnerStateRef.current, hasBaby: true };
        partnerStateRef.current = updatedPartner;
        setPartnerState(updatedPartner);
        try { window.localStorage.setItem('shoaibstar-family-state-v1', JSON.stringify(updatedPartner)); } catch { /* storage may be unavailable */ }
        soundEngine.playWeddingCelebration();
        setCutsceneMode('baby');
        setDialogueId(null);
        setToastMsg('Family Milestone: Nursery Crib & Baby welcomed home!');
        return;
      } else if (nextNode.action === 'bring_home_marry' && nextNode.targetNpcId) {
        const npc = CITY_NPCS.find((n) => n.id === nextNode.targetNpcId);
        if (npc) {
          const updated = proposeAndMarryNpc(partnerStateRef.current, npc);
          setPartnerState(updated);
          partnerStateRef.current = updated;
          gfRigRef.current?.setPartnerColors?.(
            updated.spouseJacketColor,
            updated.spousePantsColor
          );
          drivingCarIdRef.current = null;
          zoneRef.current = 'house';
          setZone('house');
          gfPosRef.current = { x: 400, y: 265 };
          playerRef.current = { x: 365, y: 265, angle: 0, speed: 0 };
          soundEngine.playWeddingCelebration();
          setCutsceneMode('wedding');
          setDialogueId(null);
          setToastMsg(`Saadi Celebration! Brought ${npc.name} home as Wife!`);
          return;
        }
      }
      soundEngine.speakLine(nextNode.text, nextNode.speaker);
    } else {
      soundEngine.playClick();
    }
    setDialogueId(nextId);
  };

  const handlePhoneOrderCar = (catalogId: string) => {
    const res = onOrderCar(catalogId);
    if (res.status === 'ordered' && res.car) {
      soundEngine.playPhoneRing();
      const existing = carsRef.current.find((c) => c.catalogId === res.car!.id);
      if (existing) {
        existing.x = CITY_CAR_SPAWN_POS.x + 120;
        existing.y = CITY_CAR_SPAWN_POS.y + 75;
        existing.angle = 0;
        existing.speed = 0;
      } else {
        const offset = carsRef.current.length * 115;
        const spawned: SpawnedCar = {
          instanceId: `ord-${Date.now()}`,
          catalogId: res.car.id,
          name: res.car.name,
          color: res.car.color,
          accent: res.car.accent,
          maxSpeed: res.car.maxSpeed,
          x: CITY_CAR_SPAWN_POS.x + offset,
          y: CITY_CAR_SPAWN_POS.y + 75,
          angle: 0,
          speed: 0,
        };
        carsRef.current.push(spawned);
        pendingCarsRef.current.push(spawned);
      }
      setToastMsg(`${res.car.name} delivered to your garden driveway!`);
      return { status: 'ordered' as const, carName: res.car.name };
    }
    return { status: 'insufficient_coins' as const };
  };

  const activeDialogue = dialogueId ? GF_DIALOGUE_TREE[dialogueId] : null;
  const camLabel = getCameraModeLabel(cameraMode);

  return (
    <div
      data-testid="game-world"
      data-zone={zone}
      data-camera-mode={cameraMode}
      data-aspect="16:9"
      className="fixed inset-0 w-screen h-screen bg-[#07080A] flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* 16:9 Horizontal Widescreen Stage */}
      <div className="relative w-full max-w-[min(100vw,calc(100vh*16/9))] aspect-video bg-[#1F1433] overflow-hidden shadow-2xl border border-white/10">
        {/* Isolated 16:9 WebGL Canvas Container */}
        <div ref={mountRef} className="absolute inset-0 z-0 touch-none" />

        {/* Top HUD inside 16:9 Viewport */}
        <div className="absolute inset-x-0 top-0 z-10 pointer-events-none flex items-start justify-between gap-2 p-2.5 sm:p-4">
          <div className="pointer-events-auto flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 rounded-xl bg-[#0B0D10]/90 border border-[#FF4D94]/40 px-2.5 sm:px-3.5 py-1.5 shadow-lg whitespace-nowrap w-fit">
              <span className="font-display text-xs sm:text-base font-bold text-white tracking-wide">
                {zone === 'house' ? 'SAFEHOUSE' : 'GARDEN & CITY'}
              </span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span
                data-testid="hud-coins"
                className="font-display text-xs sm:text-base font-bold text-[#F5A623] tabular-nums"
              >
                {save.coins.toLocaleString()} C
              </span>
            </div>

            {accidentBanner && (
              <div
                role="alert"
                className="rounded-xl bg-red-600/95 border border-amber-300 px-3 py-1.5 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-xl"
              >
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                <span>CAR ACCIDENT!</span>
              </div>
            )}

            {cutsceneMode && (
              <div
                role="status"
                className="rounded-xl bg-[#0B0D10]/95 border border-[#FF4D94] px-3.5 py-2 text-xs sm:text-sm font-bold text-white flex items-center gap-2 shadow-2xl"
              >
                <Heart className="w-4 h-4 text-[#FF4D94] fill-current shrink-0" aria-hidden="true" />
                <span>
                  {cutsceneMode === 'welcome'
                    ? `Family Welcome · Shoaib & ${partnerState.spouseName}`
                    : cutsceneMode === 'baby'
                      ? 'Family Milestone · Nursery Crib & Baby Welcomed Home!'
                      : `Wedding Celebration (Saadi) · Wife ${partnerState.spouseName}!`}
                </span>
              </div>
            )}

            {toastMsg && !accidentBanner && !cutsceneMode && (
              <div className="hidden sm:block max-w-sm rounded-xl bg-[#0B0D10]/90 border border-[#F5A623]/40 px-3 py-1.5 text-xs font-medium text-slate-100 shadow">
                {toastMsg}
              </div>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setCameraMode((prev) => cycleCameraMode(prev));
              }}
              aria-label={`Switch Camera View (currently ${camLabel})`}
              className="min-h-[38px] sm:min-h-[42px] px-2.5 rounded-xl bg-[#0B0D10]/90 hover:bg-[#14181F] border border-white/15 text-white flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shadow-lg"
            >
              <Camera className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
              <span>{camLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowCamSettings((prev) => !prev);
              }}
              aria-label="Touch Camera Sensitivity"
              aria-expanded={showCamSettings}
              className={`min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px] rounded-xl bg-[#0B0D10]/90 hover:bg-[#14181F] border flex items-center justify-center shadow-lg ${
                showCamSettings ? 'border-[#F5A623] text-[#F5A623]' : 'border-white/15 text-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={save.muted ? 'Unmute Audio' : 'Mute Audio'}
              className="min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px] rounded-xl bg-[#0B0D10]/90 hover:bg-[#14181F] border border-white/15 text-slate-100 flex items-center justify-center shadow-lg"
            >
              {save.muted ? (
                <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#F5A623]" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onSetPaused(true)}
              aria-label="Menu and Pause"
              className="min-h-[38px] px-2.5 sm:min-h-[42px] rounded-xl bg-[#0B0D10]/90 hover:bg-[#14181F] border border-white/15 text-white flex items-center justify-center gap-1.5 text-xs font-bold shadow-lg"
            >
              <Menu className="w-4 h-4 text-[#F5A623]" aria-hidden="true" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>

        {/* Touch Camera Sensitivity Popover */}
        {showCamSettings && (
          <div
            role="region"
            aria-label="Touch Camera Sensitivity Settings"
            className="absolute right-3 top-14 z-20 w-60 rounded-2xl bg-[#14181F] border border-[#F5A623]/40 p-3 shadow-2xl space-y-2 pointer-events-auto"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Touch Look Sensitivity</span>
              <span className="text-[#F5A623] tabular-nums">
                {touchSensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.5}
              step={0.1}
              value={touchSensitivity}
              aria-label="Touch camera sensitivity slider"
              onChange={(e) =>
                setTouchSensitivity(clampTouchSensitivity(Number(e.target.value)))
              }
              className="w-full accent-[#F5A623]"
            />
            <div className="flex items-center justify-between gap-1.5">
              {[
                { label: 'Low', val: 0.7 },
                { label: 'Med', val: 1.2 },
                { label: 'High', val: 2.0 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setTouchSensitivity(preset.val)}
                  className={`flex-1 min-h-[32px] rounded-lg text-xs font-semibold border transition-colors ${
                    Math.abs(touchSensitivity - preset.val) < 0.15
                      ? 'bg-[#F5A623] text-[#0B0D10] border-[#F5A623]'
                      : 'bg-[#0B0D10] text-slate-300 border-white/15'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Landscape Overlay Controls (inside 16:9 stage on widescreen/desktop) */}
        <div className="hidden landscape:flex absolute inset-x-0 bottom-0 z-10 pointer-events-none items-end justify-between gap-3 p-3 sm:p-5">
          <div
            data-testid="virtual-joystick"
            role="application"
            aria-label="Movement joystick"
            onPointerDown={handleJoystickPointerDown}
            onPointerMove={handleJoystickPointerMove}
            onPointerUp={handleJoystickPointerUp}
            onPointerCancel={handleJoystickPointerUp}
            className="pointer-events-auto relative w-[112px] h-[112px] rounded-full bg-[#0B0D10]/75 border-2 border-white/25 shadow-2xl flex items-center justify-center touch-none select-none shrink-0"
          >
            <div
              aria-hidden="true"
              className="w-[64px] h-[64px] rounded-full border border-white/15 pointer-events-none"
            />
            <div
              ref={landscapeKnobRef}
              data-knob="true"
              aria-hidden="true"
              className="absolute w-11 h-11 rounded-full bg-[#F5A623] border-2 border-white/80 shadow-lg pointer-events-none transition-transform duration-75 ease-out"
            />
          </div>

          <div className="pointer-events-auto flex flex-col items-end gap-2 shrink-0">
            {zone === 'house' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectOutfit('outfit-halfpant');
                    soundEngine.playClick();
                    setToastMsg('Switched to Half-Pant shorts!');
                  }}
                  className="min-h-[42px] px-3 rounded-xl bg-[#0B0D10]/90 hover:bg-[#14181F] border border-white/15 text-xs font-semibold text-white whitespace-nowrap shadow-lg"
                >
                  Half-Pant
                </button>
                <button
                  type="button"
                  onClick={() => startDialogueNode('start')}
                  className="min-h-[42px] px-3.5 rounded-xl bg-[#0B0D10]/90 hover:bg-[#14181F] border border-white/15 text-xs font-semibold text-white whitespace-nowrap shadow-lg"
                >
                  Talk Wife
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playNewYearFirework();
                    setIsTvOpen(true);
                  }}
                  className="min-h-[42px] px-3.5 rounded-xl bg-[#0B0D10]/90 hover:bg-[#14181F] border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap shadow-lg"
                >
                  <Tv className="w-3.5 h-3.5 text-[#F5A623]" aria-hidden="true" />
                  <span>TV</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setIsPhoneOpen(true);
                }}
                aria-label="Smartphone Order Car"
                className="min-h-[46px] px-3.5 rounded-2xl bg-[#14181F] hover:bg-[#1E2430] border border-white/20 text-white flex items-center justify-center gap-1.5 text-xs font-bold whitespace-nowrap shadow-xl"
              >
                <Smartphone className="w-4 h-4 text-[#F5A623]" aria-hidden="true" />
                <span>Phone</span>
              </button>

              <button
                type="button"
                onClick={triggerAction}
                disabled={!nearby.type}
                className={`min-h-[46px] px-4 rounded-2xl font-display text-base sm:text-lg font-extrabold tracking-wide flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 shadow-xl transition-colors ${
                  nearby.type
                    ? 'bg-[#F5A623] text-[#0B0D10] hover:bg-[#e29518]'
                    : 'bg-[#14181F]/80 text-slate-500 border border-white/10'
                }`}
              >
                {nearby.type === 'car' && (
                  <Car className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{nearby.type ? nearby.label : 'Action'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Portrait Mobile Controller Deck Below 16:9 Screen (keeps 16:9 gameplay 100% unobstructed) */}
      <div className="flex landscape:hidden w-full max-w-md px-4 pt-4 pb-safe flex-col gap-3">
        {toastMsg && (
          <div className="rounded-xl bg-[#14181F] border border-[#F5A623]/30 px-3 py-2 text-xs text-slate-200 text-center">
            {toastMsg}
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div
            data-testid="virtual-joystick-portrait"
            role="application"
            aria-label="Portrait movement joystick"
            onPointerDown={handleJoystickPointerDown}
            onPointerMove={handleJoystickPointerMove}
            onPointerUp={handleJoystickPointerUp}
            onPointerCancel={handleJoystickPointerUp}
            className="relative w-[112px] h-[112px] rounded-full bg-[#14181F] border-2 border-white/20 shadow-xl flex items-center justify-center touch-none select-none shrink-0"
          >
            <div
              aria-hidden="true"
              className="w-[64px] h-[64px] rounded-full border border-white/15 pointer-events-none"
            />
            <div
              ref={portraitKnobRef}
              data-knob="true"
              aria-hidden="true"
              className="absolute w-11 h-11 rounded-full bg-[#F5A623] border-2 border-white/80 shadow-lg pointer-events-none"
            />
          </div>

          <div className="flex flex-col items-end gap-2">
            {zone === 'house' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onSelectOutfit('outfit-halfpant');
                    soundEngine.playClick();
                    setToastMsg('Switched to Half-Pant shorts!');
                  }}
                  className="min-h-[42px] px-2.5 rounded-xl bg-[#14181F] border border-white/15 text-xs font-semibold text-white"
                >
                  Half-Pant
                </button>
                <button
                  type="button"
                  onClick={() => startDialogueNode('start')}
                  className="min-h-[42px] px-2.5 rounded-xl bg-[#14181F] border border-white/15 text-xs font-semibold text-white"
                >
                  Talk Wife
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playNewYearFirework();
                    setIsTvOpen(true);
                  }}
                  className="min-h-[42px] px-2.5 rounded-xl bg-[#14181F] border border-white/15 text-xs font-semibold text-white"
                >
                  TV
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setIsPhoneOpen(true);
                }}
                aria-label="Phone Order Car"
                className="min-h-[46px] px-3 rounded-2xl bg-[#14181F] border border-white/20 text-white flex items-center gap-1.5 text-xs font-bold"
              >
                <Smartphone className="w-4 h-4 text-[#F5A623]" aria-hidden="true" />
                <span>Phone</span>
              </button>

              <button
                type="button"
                onClick={triggerAction}
                disabled={!nearby.type}
                className={`min-h-[46px] px-4 rounded-2xl font-display text-base font-extrabold flex items-center gap-1.5 whitespace-nowrap ${
                  nearby.type
                    ? 'bg-[#F5A623] text-[#0B0D10]'
                    : 'bg-[#14181F] text-slate-500 border border-white/10'
                }`}
              >
                <span>{nearby.type ? nearby.label : 'Action'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real Talk Dialogue */}
      {activeDialogue && (
        <DialogueBox
          node={activeDialogue}
          spouseName={partnerState.spouseName}
          onSelectChoice={handleDialogueChoice}
          onClose={() => setDialogueId(null)}
        />
      )}

      {/* Living Room New Year TV */}
      {isTvOpen && <NewYearTvModal onClose={() => setIsTvOpen(false)} />}

      {/* In-Game Smartphone */}
      {isPhoneOpen && (
        <PhoneModal
          save={save}
          onOrderCar={handlePhoneOrderCar}
          onSelectOutfit={onSelectOutfit}
          onToggleMute={onToggleMute}
          onClose={() => setIsPhoneOpen(false)}
        />
      )}

      {/* Menu / Pause Modal -> Return to Home Screen */}
      {paused && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 pointer-events-auto"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#14181F] border border-white/15 p-6 text-center space-y-5 shadow-2xl">
            <div>
              <p className="text-xs font-semibold text-[#F5A623]">ShoaibStar Vice City</p>
              <h2
                id="pause-title"
                className="mt-1 font-display text-4xl font-extrabold text-white"
              >
                Game Menu
              </h2>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onSetPaused(false)}
                className="w-full min-h-[48px] rounded-xl bg-[#F5A623] hover:bg-[#e29518] text-[#0B0D10] font-bold text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Resume Game</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSetPaused(false);
                  onBackToLobby();
                }}
                className="w-full min-h-[48px] rounded-xl bg-white/8 hover:bg-white/12 border border-white/15 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4 text-[#F5A623]" aria-hidden="true" />
                <span>Home Screen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
