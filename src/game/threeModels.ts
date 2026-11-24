import * as THREE from 'three';
import { Outfit } from './worldLogic';

export interface HumanoidRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  mouthMesh: THREE.Mesh;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  updateOutfit: (outfit: Outfit) => void;
  setResortMode?: (enabled: boolean) => void;
  setPartnerColors?: (jacketColor: string, pantsColor: string) => void;
}

export interface VehicleRig {
  group: THREE.Group;
  wheels: THREE.Mesh[];
}

export function createHumanoidModel(options: {
  outfit?: Outfit;
  isFemale?: boolean;
  shadowTexture?: THREE.Texture;
}): HumanoidRig {
  const { isFemale = false, shadowTexture } = options;
  const outfit: Outfit = options.outfit ?? {
    id: 'default',
    name: 'Default',
    price: 0,
    jacketColor: isFemale ? '#E11D48' : '#181C24',
    accentColor: '#F5A623',
    pantsColor: '#1E293B',
    glasses: !isFemale,
  };

  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  // Soft ground contact shadow disc
  if (shadowTexture) {
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.54, 24), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    group.add(shadow);
  }

  // Materials with realistic PBR variation
  const skinMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0xdfa280 : 0xd59672,
    roughness: 0.62,
    metalness: 0.02,
  });
  const jacketMat = new THREE.MeshStandardMaterial({
    color: outfit.jacketColor,
    roughness: 0.52,
    metalness: 0.12,
  });
  const innerShirtMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0xfff1f2 : 0xf8fafc,
    roughness: 0.72,
    metalness: 0.02,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: outfit.accentColor,
    roughness: 0.3,
    metalness: 0.55,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: outfit.pantsColor,
    roughness: 0.82,
    metalness: 0.04,
  });
  const calfMat = new THREE.MeshStandardMaterial({
    color: outfit.isHalfPant ? (isFemale ? 0xdfa280 : 0xd59672) : outfit.pantsColor,
    roughness: outfit.isHalfPant ? 0.62 : 0.82,
    metalness: outfit.isHalfPant ? 0.02 : 0.04,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0xf8fafc : 0xf1f5f9,
    roughness: 0.38,
    metalness: 0.08,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x121620,
    roughness: 0.72,
    metalness: 0.06,
  });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.08,
    metalness: 0.9,
  });
  const frameGoldMat = new THREE.MeshStandardMaterial({
    color: 0xf5a623,
    roughness: 0.2,
    metalness: 0.92,
  });
  const lipMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0xc84b68 : 0xa36455,
    roughness: 0.45,
    metalness: 0.05,
  });

  // 1. Sculpted Anatomical Legs (hip y = 0.82)
  const makeLeg = (xPos: number) => {
    const leg = new THREE.Group();
    leg.position.set(xPos, 0.82, 0);

    // Rounded hip ball
    const hip = new THREE.Mesh(
      new THREE.SphereGeometry(isFemale ? 0.095 : 0.105, 12, 10),
      pantsMat
    );
    leg.add(hip);

    // Tapered thigh (shorts when in Half-Pant / Resort Swimwear)
    const thigh = new THREE.Mesh(
      new THREE.CapsuleGeometry(isFemale ? 0.082 : 0.092, 0.25, 8, 14),
      pantsMat
    );
    thigh.position.y = -0.2;
    thigh.castShadow = true;
    leg.add(thigh);

    // Tapered shin/calf (skin when wearing half-pant, trousers otherwise)
    const shin = new THREE.Mesh(
      new THREE.CapsuleGeometry(isFemale ? 0.065 : 0.074, 0.26, 8, 14),
      calfMat
    );
    shin.position.y = -0.52;
    shin.castShadow = true;
    leg.add(shin);

    // Sculpted Sneaker (capsule upper + rounded sole + tongue accent)
    const shoeUpper = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.068, 0.145, 8, 14),
      shoeMat
    );
    shoeUpper.rotation.x = Math.PI / 2;
    shoeUpper.scale.set(1.04, 1, 0.84);
    shoeUpper.position.set(0, -0.74, 0.055);
    shoeUpper.castShadow = true;
    leg.add(shoeUpper);

    const shoeTongue = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.042, 0.05, 6, 8),
      accentMat
    );
    shoeTongue.position.set(0, -0.68, 0.045);
    shoeTongue.rotation.x = 0.3;
    leg.add(shoeTongue);

    const sole = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.072, 0.15, 6, 12),
      accentMat
    );
    sole.rotation.x = Math.PI / 2;
    sole.scale.set(1.06, 1, 0.35);
    sole.position.set(0, -0.785, 0.055);
    leg.add(sole);

    return leg;
  };

  const hipOffset = isFemale ? 0.115 : 0.135;
  const leftLeg = makeLeg(-hipOffset);
  const rightLeg = makeLeg(hipOffset);
  bodyGroup.add(leftLeg, rightLeg);

  // 2. Sculpted Pelvis & Organic Torso (LatheGeometry athletic/natural profile)
  const pelvis = new THREE.Mesh(
    new THREE.SphereGeometry(isFemale ? 0.19 : 0.21, 16, 12),
    pantsMat
  );
  pelvis.scale.set(1.12, 0.68, 0.78);
  pelvis.position.set(0, 0.84, 0);
  bodyGroup.add(pelvis);

  // Athletic tapered torso via LatheGeometry
  const torsoProfile = isFemale
    ? [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.16, 0.02),
        new THREE.Vector2(0.14, 0.22), // slender waist
        new THREE.Vector2(0.205, 0.44), // ribcage
        new THREE.Vector2(0.195, 0.56), // upper chest
        new THREE.Vector2(0.09, 0.62), // collarbone
        new THREE.Vector2(0.0, 0.63),
      ]
    : [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.18, 0.02),
        new THREE.Vector2(0.19, 0.2), // waist
        new THREE.Vector2(0.248, 0.46), // athletic chest
        new THREE.Vector2(0.238, 0.57), // broad upper shoulders
        new THREE.Vector2(0.1, 0.63),
        new THREE.Vector2(0.0, 0.64),
      ];

  const torsoGeo = new THREE.LatheGeometry(torsoProfile, 24);
  const torso = new THREE.Mesh(torsoGeo, jacketMat);
  torso.scale.set(1.18, 1.0, 0.72);
  torso.position.set(0, 0.84, 0);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Tailored Jacket Collar wrapping neck
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.115, 0.026, 8, 18, Math.PI * 1.4),
    jacketMat
  );
  collar.rotation.x = Math.PI / 2;
  collar.rotation.z = Math.PI * 0.8;
  collar.position.set(0, 1.44, -0.01);
  bodyGroup.add(collar);

  // Inner shirt V-placket & metallic lapel trim on chest (+Z front)
  const innerChest = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.07, 0.34, 8, 12),
    innerShirtMat
  );
  innerChest.scale.set(1.05, 1, 0.45);
  innerChest.position.set(0, 1.18, 0.13);
  bodyGroup.add(innerChest);

  // Open jacket lapels framing the shirt
  for (const side of [-1, 1]) {
    const lapel = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.028, 0.38, 6, 10),
      accentMat
    );
    lapel.position.set(side * 0.075, 1.18, 0.145);
    lapel.rotation.z = side * -0.14;
    bodyGroup.add(lapel);
  }

  // Gold / Silver chain or necklace
  const chain = new THREE.Mesh(
    new THREE.TorusGeometry(0.088, 0.012, 8, 20, Math.PI * 1.15),
    frameGoldMat
  );
  chain.position.set(0, 1.38, 0.09);
  chain.rotation.x = Math.PI * 0.62;
  chain.rotation.z = -Math.PI * 0.08;
  bodyGroup.add(chain);

  // Sculpted Belt with metallic buckle
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(
      isFemale ? 0.175 : 0.215,
      isFemale ? 0.185 : 0.21,
      0.06,
      20
    ),
    new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.35, metalness: 0.45 })
  );
  belt.scale.set(1.18, 1, 0.74);
  belt.position.set(0, 0.87, 0);
  bodyGroup.add(belt);

  const buckle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.03, 12),
    frameGoldMat
  );
  buckle.rotation.x = Math.PI / 2;
  buckle.position.set(0, 0.87, isFemale ? 0.14 : 0.16);
  bodyGroup.add(buckle);

  // 3. Articulated Rounded Arms (shoulder deltoid + upper arm + forearm + wristwatch/ring + hand)
  const makeArm = (xPos: number, isLeft: boolean) => {
    const arm = new THREE.Group();
    arm.position.set(xPos, 1.35, 0);

    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(isFemale ? 0.064 : 0.076, 12, 10),
      jacketMat
    );
    shoulder.position.y = -0.015;
    arm.add(shoulder);

    const upperArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(isFemale ? 0.056 : 0.066, 0.19, 8, 12),
      jacketMat
    );
    upperArm.position.y = -0.14;
    upperArm.castShadow = true;
    arm.add(upperArm);

    const forearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(isFemale ? 0.048 : 0.056, 0.19, 8, 12),
      isFemale ? skinMat : jacketMat
    );
    forearm.position.set(0, -0.36, 0.02);
    forearm.rotation.x = -0.08;
    forearm.castShadow = true;
    arm.add(forearm);

    if (isLeft) {
      // Luxury wristwatch / wedding bracelet detail
      const watch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.054, 0.054, 0.032, 14),
        frameGoldMat
      );
      watch.position.set(0, -0.44, 0.026);
      arm.add(watch);
    }

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(isFemale ? 0.052 : 0.06, 12, 10),
      skinMat
    );
    hand.scale.set(0.85, 1.15, 0.75);
    hand.position.set(0, -0.51, 0.035);
    arm.add(hand);

    return arm;
  };

  const armOffset = isFemale ? 0.215 : 0.255;
  const leftArm = makeArm(-armOffset, true);
  const rightArm = makeArm(armOffset, false);
  bodyGroup.add(leftArm, rightArm);

  // 4. Sculpted Realistic Head, Facial Features & Hair
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.46, 0);
  bodyGroup.add(headGroup);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.082, 0.14, 14),
    skinMat
  );
  neck.position.y = 0.06;
  headGroup.add(neck);

  // Cranium + tapered jawline
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.185, 20, 16), skinMat);
  cranium.position.y = 0.26;
  cranium.scale.set(0.9, 1.06, 0.96);
  cranium.castShadow = true;
  headGroup.add(cranium);

  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12), skinMat);
  jaw.position.set(0, 0.19, 0.03);
  jaw.scale.set(0.84, 0.82, 0.92);
  headGroup.add(jaw);

  // Subtle sculpted nose & ears
  const nose = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.035, 6, 8), skinMat);
  nose.position.set(0, 0.24, 0.182);
  nose.rotation.x = -0.25;
  headGroup.add(nose);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), skinMat);
    ear.scale.set(0.45, 1.0, 0.75);
    ear.position.set(side * 0.168, 0.25, 0);
    headGroup.add(ear);

    if (isFemale) {
      const earring = new THREE.Mesh(
        new THREE.TorusGeometry(0.022, 0.005, 6, 12),
        frameGoldMat
      );
      earring.rotation.y = Math.PI / 2;
      earring.position.set(side * 0.175, 0.205, 0.005);
      headGroup.add(earring);
    }
  }

  // Expressive Eyes (sclera + dark iris + eyebrows)
  const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const irisMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  for (const side of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), scleraMat);
    sclera.scale.set(1.15, 0.78, 0.55);
    sclera.position.set(side * 0.062, 0.275, 0.162);
    headGroup.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), irisMat);
    iris.position.set(side * 0.062, 0.275, 0.173);
    headGroup.add(iris);

    const brow = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.008, 0.042, 4, 6),
      hairMat
    );
    brow.rotation.z = Math.PI / 2 + side * 0.1;
    brow.position.set(side * 0.062, 0.312, 0.164);
    headGroup.add(brow);
  }

  // Animated talking mouth
  const mouthMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.01, 0.038, 6, 8),
    lipMat
  );
  mouthMesh.rotation.z = Math.PI / 2;
  mouthMesh.position.set(0, 0.178, 0.158);
  headGroup.add(mouthMesh);

  // Layered Hair Sculpture
  const hairBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.194, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hairBase.position.set(0, 0.28, -0.02);
  hairBase.scale.set(0.92, 1.02, 0.98);
  hairBase.rotation.x = -0.22;
  headGroup.add(hairBase);

  if (isFemale) {
    // Sleek long back hair + side framing strands + high bun
    const backHair = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.135, 0.24, 8, 14),
      hairMat
    );
    backHair.scale.set(1.1, 1, 0.65);
    backHair.position.set(0, 0.18, -0.11);
    headGroup.add(backHair);

    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), hairMat);
    bun.position.set(0, 0.44, -0.14);
    headGroup.add(bun);
  } else {
    // Styled Vice City swept pompadour hair crown
    const pomp = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.095, 0.15, 8, 12),
      hairMat
    );
    pomp.rotation.x = Math.PI / 2 - 0.35;
    pomp.scale.set(1.15, 0.8, 0.72);
    pomp.position.set(0, 0.415, 0.03);
    headGroup.add(pomp);
  }

  // Realistic Curved Dual-Lens Aviator Sunglasses
  const glassesGroup = new THREE.Group();
  glassesGroup.position.set(0, 0.275, 0.178);
  glassesGroup.visible = outfit.glasses;

  for (const side of [-1, 1]) {
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.038, 0.018, 14),
      lensMat
    );
    lens.rotation.x = Math.PI / 2;
    lens.scale.set(1.15, 1, 0.85);
    lens.position.set(side * 0.064, 0, 0.005);
    glassesGroup.add(lens);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.044, 0.0045, 6, 16),
      frameGoldMat
    );
    rim.scale.set(1.15, 0.85, 1);
    rim.position.set(side * 0.064, 0, 0.012);
    glassesGroup.add(rim);

    // Temple arm back toward ear
    const temple = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.16, 6),
      frameGoldMat
    );
    temple.rotation.x = Math.PI / 2;
    temple.position.set(side * 0.12, 0.01, -0.07);
    glassesGroup.add(temple);
  }

  const noseBridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.04, 6),
    frameGoldMat
  );
  noseBridge.rotation.z = Math.PI / 2;
  noseBridge.position.set(0, 0.014, 0.014);
  glassesGroup.add(noseBridge);
  headGroup.add(glassesGroup);

  const updateOutfit = (next: Outfit) => {
    jacketMat.color.set(next.jacketColor);
    accentMat.color.set(next.accentColor);
    pantsMat.color.set(next.pantsColor);
    if (next.isHalfPant) {
      calfMat.color.copy(skinMat.color);
      calfMat.roughness = 0.62;
    } else {
      calfMat.color.set(next.pantsColor);
      calfMat.roughness = 0.82;
    }
    glassesGroup.visible = next.glasses;
  };

  const setResortMode = (enabled: boolean) => {
    if (enabled) {
      jacketMat.color.set(isFemale ? '#FF4D94' : '#38BDF8');
      accentMat.color.set('#F5A623');
      pantsMat.color.set(isFemale ? '#EC4899' : '#0F172A');
      calfMat.color.copy(skinMat.color);
      calfMat.roughness = 0.62;
      glassesGroup.visible = false;
    } else {
      updateOutfit(outfit);
    }
  };

  const setPartnerColors = (jacketColor: string, pantsColor: string) => {
    jacketMat.color.set(jacketColor);
    pantsMat.color.set(pantsColor);
    calfMat.color.set(pantsColor);
    calfMat.roughness = 0.82;
    outfit.jacketColor = jacketColor;
    outfit.pantsColor = pantsColor;
  };

  return {
    group,
    bodyGroup,
    headGroup,
    mouthMesh,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    updateOutfit,
    setResortMode,
    setPartnerColors,
  };
}

export function animateHumanoid(
  rig: HumanoidRig,
  options: { speed: number; talking: boolean; kissing?: boolean; time: number }
) {
  const { speed, talking, kissing = false, time } = options;

  if (kissing) {
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    rig.bodyGroup.position.y = Math.sin(time * 2) * 0.01;
    // Gentle romantic lean & raised embrace arms (PG-13)
    rig.leftArm.rotation.x = -0.85;
    rig.rightArm.rotation.x = -0.85;
    rig.leftArm.rotation.z = 0.25;
    rig.rightArm.rotation.z = -0.25;
    rig.headGroup.rotation.x = 0.14;
    rig.headGroup.rotation.z = 0.12;
    rig.mouthMesh.scale.y = 0.85;
  } else if (speed > 0.2) {
    const stride = Math.sin(time * 9.5) * 0.62;
    rig.leftLeg.rotation.x = stride;
    rig.rightLeg.rotation.x = -stride;
    rig.leftArm.rotation.x = -stride * 0.72;
    rig.rightArm.rotation.x = stride * 0.72;
    rig.leftArm.rotation.z = 0;
    rig.rightArm.rotation.z = 0;
    rig.bodyGroup.position.y = Math.abs(Math.cos(time * 9.5)) * 0.035;
    rig.headGroup.rotation.x = 0;
    rig.headGroup.rotation.z = 0;
    rig.mouthMesh.scale.y = 1;
  } else if (talking) {
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    rig.leftArm.rotation.z = 0;
    rig.rightArm.rotation.z = 0;
    rig.bodyGroup.position.y = Math.sin(time * 2.5) * 0.01;
    rig.rightArm.rotation.x = -0.58 + Math.sin(time * 5.2) * 0.24;
    rig.leftArm.rotation.x = -0.25 + Math.cos(time * 4.1) * 0.16;
    rig.headGroup.rotation.x = Math.sin(time * 6.5) * 0.08;
    rig.headGroup.rotation.y = Math.sin(time * 2.4) * 0.15;
    rig.headGroup.rotation.z = 0;
    rig.mouthMesh.scale.y = 1.1 + Math.abs(Math.sin(time * 13)) * 1.4;
  } else {
    rig.leftLeg.rotation.x *= 0.85;
    rig.rightLeg.rotation.x *= 0.85;
    rig.leftArm.rotation.x *= 0.85;
    rig.rightArm.rotation.x *= 0.85;
    rig.leftArm.rotation.z *= 0.85;
    rig.rightArm.rotation.z *= 0.85;
    rig.bodyGroup.position.y = Math.sin(time * 2.2) * 0.015;
    rig.headGroup.rotation.x = 0;
    rig.headGroup.rotation.y = Math.sin(time * 1.1) * 0.06;
    rig.headGroup.rotation.z = 0;
    rig.mouthMesh.scale.y = 1;
  }
}

export function createVehicleModel(options: {
  color: string;
  accent: string;
  isBike?: boolean;
  catalogId?: string;
  shadowTexture?: THREE.Texture;
}): VehicleRig {
  const { color, accent, isBike = false, catalogId = '', shadowTexture } = options;
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const isSuv = catalogId === 'car-tata';
  const isLambo = catalogId === 'car-lamborghini';
  const isBmw = catalogId === 'car-bmw';
  const isMerc = catalogId === 'car-mercedes';

  if (shadowTexture) {
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(isBike ? 1.8 : 2.9, isBike ? 3.2 : 5.3),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);
  }

  const paintMat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.22,
    metalness: 0.74,
    clearcoat: 0.92,
    clearcoatRoughness: 0.1,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.25,
    metalness: 0.85,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0b1120,
    roughness: 0.1,
    metalness: 0.85,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111318,
    roughness: 0.88,
    metalness: 0.05,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.22,
    metalness: 0.9,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfde68a,
    emissiveIntensity: 1.8,
  });
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.5,
  });

  if (isBike) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 2.2), paintMat);
    frame.position.set(0, 0.62, 0);
    frame.castShadow = true;
    group.add(frame);

    const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.9), trimMat);
    fairing.position.set(0, 0.78, 0.55);
    group.add(fairing);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.35), glassMat);
    windshield.position.set(0, 1.05, 0.68);
    windshield.rotation.x = -0.5;
    group.add(windshield);

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.24, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    for (const wz of [-0.78, 0.78]) {
      const w = new THREE.Mesh(wheelGeo, tireMat);
      w.position.set(0, 0.38, wz);
      w.castShadow = true;
      wheels.push(w);
      group.add(w);
    }

    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.08), headlightMat);
    hl.position.set(0, 0.78, 1.08);
    group.add(hl);
  } else {
    const hullH = isSuv ? 0.72 : isLambo ? 0.5 : 0.58;
    const lowerHull = new THREE.Mesh(
      new THREE.BoxGeometry(isLambo ? 2.2 : 2.08, hullH, 4.45),
      paintMat
    );
    lowerHull.position.set(0, isSuv ? 0.68 : 0.56, 0);
    lowerHull.castShadow = true;
    group.add(lowerHull);

    // Brand-specific front hood/grille & roof styling
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(isLambo ? 0.5 : 0.38, hullH + 0.02, 4.46),
      trimMat
    );
    stripe.position.set(0, isSuv ? 0.69 : 0.57, 0);
    group.add(stripe);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(isSuv ? 1.88 : 1.72, isSuv ? 0.62 : 0.44, isSuv ? 2.55 : 2.0),
      glassMat
    );
    cabin.position.set(0, isSuv ? 1.32 : 1.04, isSuv ? -0.25 : -0.15);
    cabin.castShadow = true;
    group.add(cabin);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(isSuv ? 1.82 : 1.62, 0.09, isSuv ? 2.35 : 1.42),
      paintMat
    );
    roof.position.set(0, isSuv ? 1.65 : 1.28, isSuv ? -0.28 : -0.2);
    group.add(roof);

    if (isLambo) {
      // Aggressive Supercar Rear Wing & Side Intakes
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.09, 0.4), trimMat);
      wing.position.set(0, 1.08, -2.06);
      group.add(wing);
    } else if (isBmw) {
      // Twin-kidney front grille accent
      for (const gx of [-0.22, 0.22]) {
        const kidney = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.06), trimMat);
        kidney.position.set(gx, 0.58, 2.24);
        group.add(kidney);
      }
    } else if (isMerc) {
      // Mercedes front star crest + wide chrome grille bar
      const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 12), rimMat);
      crest.rotation.x = Math.PI / 2;
      crest.position.set(0, 0.58, 2.24);
      group.add(crest);
    } else if (isSuv) {
      // Tata SUV Roof Rails & Skid Plate
      for (const rx of [-0.72, 0.72]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.1), rimMat);
        rail.position.set(rx, 1.72, -0.25);
        group.add(rail);
      }
    } else {
      const spoiler = new THREE.Mesh(
        new THREE.BoxGeometry(1.95, 0.08, 0.32),
        trimMat
      );
      spoiler.position.set(0, 1.02, -2.02);
      group.add(spoiler);
    }

    for (const side of [-0.72, 0.72]) {
      const hl = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.14, 0.08),
        headlightMat
      );
      hl.position.set(side, isSuv ? 0.72 : 0.6, 2.24);
      group.add(hl);

      const tl = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.14, 0.08),
        taillightMat
      );
      tl.position.set(side, isSuv ? 0.76 : 0.64, -2.24);
      group.add(tl);
    }

    const wheelRadius = isSuv ? 0.44 : 0.38;
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.28, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.58, wheelRadius * 0.58, 0.3, 12);
    rimGeo.rotateZ(Math.PI / 2);

    const wheelCoords: [number, number][] = [
      [-1.05, 1.4],
      [1.05, 1.4],
      [-1.05, -1.4],
      [1.05, -1.4],
    ];
    for (const [wx, wz] of wheelCoords) {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.position.set(wx, wheelRadius, wz);
      tire.castShadow = true;
      const rim = new THREE.Mesh(rimGeo, rimMat);
      tire.add(rim);
      wheels.push(tire);
      group.add(tire);
    }
  }

  return { group, wheels };
}

export function createPalmTreeModel(): THREE.Group {
  const tree = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x7c5338,
    roughness: 0.9,
    metalness: 0.02,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.62,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24 - i * 0.03, 0.28 - i * 0.03, 1.4, 8),
      trunkMat
    );
    seg.position.set(i * 0.12, 0.7 + i * 1.32, 0);
    seg.rotation.z = -0.08 * i;
    seg.castShadow = true;
    tree.add(seg);
  }

  const crown = new THREE.Group();
  crown.position.set(0.36, 5.4, 0);
  for (let f = 0; f < 6; f++) {
    const frond = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 2.2), leafMat);
    frond.position.set(0, -0.1, 1.05);
    frond.rotation.x = 0.25;
    const pivot = new THREE.Group();
    pivot.rotation.y = (Math.PI * 2 * f) / 6;
    pivot.add(frond);
    crown.add(pivot);
  }
  tree.add(crown);

  return tree;
}

export function createFlowerBushModel(bloomHex = 0xff4d94): THREE.Group {
  const bush = new THREE.Group();
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.85,
  });
  const bloomMat = new THREE.MeshStandardMaterial({
    color: bloomHex,
    emissive: bloomHex,
    emissiveIntensity: 0.18,
    roughness: 0.55,
  });

  const mainMound = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 10), leafMat);
  mainMound.scale.set(1.2, 0.78, 1.1);
  mainMound.position.y = 0.42;
  bush.add(mainMound);

  const offsets: [number, number, number][] = [
    [-0.3, 0.65, 0.22],
    [0.25, 0.7, 0.15],
    [0.0, 0.75, -0.22],
    [-0.18, 0.52, -0.32],
    [0.32, 0.55, -0.1],
  ];
  for (const [bx, by, bz] of offsets) {
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), bloomMat);
    flower.position.set(bx, by, bz);
    bush.add(flower);
  }

  return bush;
}

export function createGardenLanternModel(): THREE.Group {
  const lantern = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.75,
  });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf5a623,
    emissiveIntensity: 1.6,
  });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.6, 8), postMat);
  post.position.y = 0.8;
  lantern.add(post);

  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), bulbMat);
  globe.position.y = 1.68;
  lantern.add(globe);

  return lantern;
}

export function createCoinMesh(): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(0.45, 0.45, 0.14, 18);
  geo.rotateX(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf5a623,
    emissive: 0xb45309,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.92,
  });
  const coin = new THREE.Mesh(geo, mat);
  coin.position.y = 0.9;
  return coin;
}

export function createHeartMesh(): THREE.Group {
  const heart = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xff4d94,
    emissive: 0xe11d48,
    emissiveIntensity: 0.65,
    roughness: 0.25,
    metalness: 0.2,
  });
  const left = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), mat);
  left.position.set(-0.1, 0.08, 0);
  const right = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), mat);
  right.position.set(0.1, 0.08, 0);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.21, 0.28, 12), mat);
  tip.rotation.x = Math.PI;
  tip.position.set(0, -0.08, 0);
  heart.add(left, right, tip);
  return heart;
}

export function createBabyCribModel(): THREE.Group {
  const crib = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.55,
    metalness: 0.08,
  });
  const mattressMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.85,
  });
  const blanketMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    roughness: 0.8,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf1c2a5,
    roughness: 0.65,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.95), woodMat);
  base.position.y = 0.35;
  crib.add(base);

  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.14, 0.86), mattressMat);
  mattress.position.y = 0.48;
  crib.add(mattress);

  for (const [px, pz] of [
    [-0.72, -0.44],
    [0.72, -0.44],
    [-0.72, 0.44],
    [0.72, 0.44],
  ]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.92, 10), woodMat);
    post.position.set(px, 0.46, pz);
    crib.add(post);
  }

  for (let i = -3; i <= 3; i++) {
    for (const sz of [-0.44, 0.44]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 8), woodMat);
      rail.position.set(i * 0.2, 0.64, sz);
      crib.add(rail);
    }
  }

  const topRailF = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.06, 0.06), woodMat);
  topRailF.position.set(0, 0.88, 0.44);
  const topRailB = topRailF.clone();
  topRailB.position.z = -0.44;
  crib.add(topRailF, topRailB);

  // Cute Swaddled Baby sleeping peacefully in the crib
  const swaddle = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.34, 8, 12), blanketMat);
  swaddle.rotation.z = Math.PI / 2;
  swaddle.position.set(0.05, 0.62, 0);
  crib.add(swaddle);

  const babyHead = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 12), skinMat);
  babyHead.position.set(-0.24, 0.64, 0);
  crib.add(babyHead);

  return crib;
}

