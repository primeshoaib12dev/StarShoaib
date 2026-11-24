import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CITY_BOUNDS,
  CITY_BUILDINGS,
  CITY_HOME_DOOR_POS,
  CITY_NPCS,
  DEFAULT_GAME_SAVE,
  DEFAULT_PARTNER_STATE,
  HOUSE_BATH_POS,
  HOUSE_DOOR_POS,
  HOUSE_DRESSING_POS,
  HOUSE_GF_POS,
  HOUSE_TV_POS,
  SpawnedCar,
  clampDt,
  clampTouchSensitivity,
  cycleCameraMode,
  detectNearbyInteraction,
  getCameraModeLabel,
  movePlayerWithObstacles,
  normalizeJoystickVector,
  orderCarFromCatalog,
  proposeAndMarryNpc,
  stepCarPhysics,
  stepCarPhysicsWithAccident,
  unlockOrEquipOutfit,
} from './worldLogic';

test('clampDt caps huge frame steps to <= 0.05s', () => {
  assert.equal(clampDt(0.5), 0.05);
  assert.equal(clampDt(-1), 0);
  assert.equal(clampDt(0.016), 0.016);
});

test('unlockOrEquipOutfit unlocks affordable outfits and rejects too expensive ones', () => {
  const richSave = { ...DEFAULT_GAME_SAVE, coins: 500 };
  const res1 = unlockOrEquipOutfit(richSave, 'outfit-mafia'); // price 400
  assert.equal(res1.status, 'unlocked');
  assert.equal(res1.save.coins, 100);
  assert.equal(res1.save.selectedOutfitId, 'outfit-mafia');

  // Re-equipping owned outfit costs 0 coins
  const res2 = unlockOrEquipOutfit(res1.save, 'outfit-varsity');
  assert.equal(res2.status, 'equipped');
  assert.equal(res2.save.coins, 100);

  // Too expensive
  const res3 = unlockOrEquipOutfit(res2.save, 'outfit-boss'); // price 1000
  assert.equal(res3.status, 'insufficient_coins');
  assert.equal(res3.save.coins, 100);
});

test('orderCarFromCatalog deducts coins once and delivers car', () => {
  const save = { ...DEFAULT_GAME_SAVE, coins: 500 };
  const res = orderCarFromCatalog(save, 'car-amber-bike'); // price 350
  assert.equal(res.status, 'ordered');
  assert.equal(res.save.coins, 150);
  assert.ok(res.save.ownedCarIds.includes('car-amber-bike'));

  // Re-ordering owned car is free
  const resFree = orderCarFromCatalog(res.save, 'car-amber-bike');
  assert.equal(resFree.status, 'ordered');
  assert.equal(resFree.save.coins, 150);
});

test('detectNearbyInteraction detects GF, TV, Doors, and City Cars', () => {
  const nearGf = detectNearbyInteraction({
    zone: 'house',
    playerX: HOUSE_GF_POS.x + 15,
    playerY: HOUSE_GF_POS.y,
    drivingCarId: null,
    cars: [],
  });
  assert.equal(nearGf.type, 'gf');

  const nearTv = detectNearbyInteraction({
    zone: 'house',
    playerX: HOUSE_TV_POS.x,
    playerY: HOUSE_TV_POS.y + 40,
    drivingCarId: null,
    cars: [],
  });
  assert.equal(nearTv.type, 'tv');

  const nearExit = detectNearbyInteraction({
    zone: 'house',
    playerX: HOUSE_DOOR_POS.x,
    playerY: HOUSE_DOOR_POS.y - 20,
    drivingCarId: null,
    cars: [],
  });
  assert.equal(nearExit.type, 'door_exit');

  const nearHome = detectNearbyInteraction({
    zone: 'city',
    playerX: CITY_HOME_DOOR_POS.x,
    playerY: CITY_HOME_DOOR_POS.y + 10,
    drivingCarId: null,
    cars: [],
  });
  assert.equal(nearHome.type, 'door_enter');

  const sampleCar: SpawnedCar = {
    instanceId: 'car-1',
    catalogId: 'car-obsidian-gtr',
    name: 'Obsidian GT-R',
    color: '#111',
    accent: '#f5a623',
    maxSpeed: 340,
    x: 600,
    y: 400,
    angle: 0,
    speed: 0,
  };
  const nearCar = detectNearbyInteraction({
    zone: 'city',
    playerX: 615,
    playerY: 410,
    drivingCarId: null,
    cars: [sampleCar],
  });
  assert.equal(nearCar.type, 'car');
  assert.equal(nearCar.targetId, 'car-1');
});

test('movePlayerWithObstacles and stepCarPhysics keep actors out of buildings', () => {
  // Building 0 is at x: 120..380, y: 110..280
  const moved = movePlayerWithObstacles(
    110,
    180,
    600,
    0,
    0.05,
    16,
    CITY_BOUNDS,
    CITY_BUILDINGS
  );
  // Should be pushed back outside x <= 120 - 16 = 104
  assert.ok(moved.x <= 105);

  const car: SpawnedCar = {
    instanceId: 'c1',
    catalogId: 'car-obsidian-gtr',
    name: 'Obsidian GT-R',
    color: '#111',
    accent: '#f5a623',
    maxSpeed: 340,
    x: 450,
    y: 420,
    angle: 0,
    speed: 0,
  };
  const nextCar = stepCarPhysics(car, 1, 0, 0.05, CITY_BOUNDS, CITY_BUILDINGS);
  assert.ok(nextCar.speed > 0);
  assert.ok(nextCar.x > car.x);
});

test('camera mode cycling, labels, and touch sensitivity clamping work properly', () => {
  assert.equal(cycleCameraMode('third_person'), 'first_person');
  assert.equal(cycleCameraMode('first_person'), 'second_person');
  assert.equal(cycleCameraMode('second_person'), 'third_person');

  assert.equal(getCameraModeLabel('first_person'), '1st Person');
  assert.equal(getCameraModeLabel('second_person'), '2nd Person');
  assert.equal(getCameraModeLabel('third_person'), '3rd Person');

  assert.equal(clampTouchSensitivity(0.1), 0.4);
  assert.equal(clampTouchSensitivity(5.0), 2.5);
  assert.equal(clampTouchSensitivity(1.36), 1.4);
});

test('normalizeJoystickVector handles deadzone and clamps maximum radius', () => {
  const dead = normalizeJoystickVector(2, 2, 48, 0.12);
  assert.equal(dead.x, 0);
  assert.equal(dead.y, 0);
  assert.equal(dead.magnitude, 0);

  const fullRight = normalizeJoystickVector(120, 0, 48, 0.12);
  assert.ok(Math.abs(fullRight.x - 1) < 1e-6);
  assert.equal(fullRight.y, 0);
  assert.ok(Math.abs(fullRight.magnitude - 1) < 1e-6);

  const diag = normalizeJoystickVector(34, -34, 48, 0.12);
  assert.ok(diag.x > 0 && diag.y < 0);
  assert.ok(diag.magnitude <= 1.0001);
});

test('detectNearbyInteraction detects dressing room, shower bath, and city NPCs', () => {
  const nearDress = detectNearbyInteraction({
    zone: 'house',
    playerX: HOUSE_DRESSING_POS.x,
    playerY: HOUSE_DRESSING_POS.y,
    drivingCarId: null,
    cars: [],
  });
  assert.equal(nearDress.type, 'dressing');

  const nearBath = detectNearbyInteraction({
    zone: 'house',
    playerX: HOUSE_BATH_POS.x,
    playerY: HOUSE_BATH_POS.y,
    drivingCarId: null,
    cars: [],
  });
  assert.equal(nearBath.type, 'bath');

  const nearNpc = detectNearbyInteraction({
    zone: 'city',
    playerX: CITY_NPCS[0].x + 10,
    playerY: CITY_NPCS[0].y,
    drivingCarId: null,
    cars: [],
    npcs: CITY_NPCS,
  });
  assert.equal(nearNpc.type, 'npc');
  assert.equal(nearNpc.targetId, CITY_NPCS[0].id);
});

test('stepCarPhysicsWithAccident triggers crash and bounce on high-speed impact', () => {
  const fastCar: SpawnedCar = {
    instanceId: 'lambo',
    catalogId: 'car-lamborghini',
    name: 'Lamborghini Revuelto',
    color: '#F5A623',
    accent: '#0B0D10',
    maxSpeed: 420,
    x: 420,
    y: 420,
    angle: 0,
    speed: 320,
  };
  const hitRes = stepCarPhysicsWithAccident(
    fastCar,
    1,
    0,
    0.05,
    CITY_BOUNDS,
    CITY_BUILDINGS,
    [{ x: 445, y: 420, radius: 22 }]
  );
  assert.equal(hitRes.crashed, true);
  assert.ok(hitRes.impactSpeed > 150);
  assert.ok(hitRes.car.speed < 0);
});

test('proposeAndMarryNpc updates spouseName and married list, and detectNearbyInteraction uses spouseName', () => {
  const zara = CITY_NPCS.find((n) => n.name === 'Zara')!;
  const updated = proposeAndMarryNpc(DEFAULT_PARTNER_STATE, zara);
  assert.equal(updated.spouseName, 'Zara');
  assert.ok(updated.marriedPartnerNames.includes('Aisha'));
  assert.ok(updated.marriedPartnerNames.includes('Zara'));

  const nearWife = detectNearbyInteraction({
    zone: 'house',
    playerX: HOUSE_GF_POS.x + 10,
    playerY: HOUSE_GF_POS.y,
    drivingCarId: null,
    cars: [],
    spouseName: updated.spouseName,
  });
  assert.equal(nearWife.type, 'gf');
  assert.equal(nearWife.label, 'Talk to Zara');
});



