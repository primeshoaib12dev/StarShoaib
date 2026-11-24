import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Outfit } from '../game/worldLogic';
import {
  HumanoidRig,
  animateHumanoid,
  createHumanoidModel,
} from '../game/threeModels';
import {
  createContactShadowTexture,
  detectSoftwareWebGL,
} from '../game/threeTextures';

interface Lobby3DPreviewProps {
  outfit: Outfit;
}

export const Lobby3DPreview: React.FC<Lobby3DPreviewProps> = ({ outfit }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<HumanoidRig | null>(null);
  const renderNowRef = useRef<(() => void) | null>(null);
  const outfitRef = useRef<Outfit>(outfit);
  outfitRef.current = outfit;

  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.updateOutfit(outfit);
      renderNowRef.current?.();
    }
  }, [outfit]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 260;
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 30);
    camera.position.set(0, 1.22, 2.95);
    camera.lookAt(0, 0.96, 0);

    // Neutral studio key + Vice City pink/cyan rim lights so outfit colors stay accurate
    const hemi = new THREE.HemisphereLight(0xf1f5f9, 0x1e293b, 0.95);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e8, 1.85);
    keyLight.position.set(2.4, 3.8, 3.2);
    scene.add(keyLight);

    const pinkRim = new THREE.DirectionalLight(0xff4d94, 0.95);
    pinkRim.position.set(2.8, 2.2, -2.2);
    scene.add(pinkRim);

    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 1.15);
    cyanRim.position.set(-2.8, 2.5, -2.5);
    scene.add(cyanRim);

    // Ground turntable disc
    const discGeo = new THREE.CylinderGeometry(0.95, 1.02, 0.08, 32);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x14181f,
      roughness: 0.35,
      metalness: 0.6,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = -0.04;
    scene.add(disc);

    const ringGeo = new THREE.RingGeometry(0.92, 0.96, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf5a623,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    const shadowTex = createContactShadowTexture();
    const rig = createHumanoidModel({
      outfit: outfitRef.current,
      shadowTexture: shadowTex,
    });
    rigRef.current = rig;
    scene.add(rig.group);

    let dragStartX = 0;
    let isDragging = false;
    let userYaw = 0.25;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      dragStartX = e.clientX;
      userYaw += dx * 0.012;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 260;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();

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
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!isDragging) {
        userYaw += dt * 0.45;
      }
      rig.group.rotation.y = userYaw;
      animateHumanoid(rig, { speed: 0, talking: false, time: now / 1000 });

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    renderNowRef.current = () => {
      if (!disposed) {
        renderer.render(scene, camera);
      }
    };

    tick();

    return () => {
      disposed = true;
      renderNowRef.current = null;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      shadowTex.dispose();
      discGeo.dispose();
      discMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="lobby-3d-preview"
      className="w-full h-56 sm:h-64 cursor-grab active:cursor-grabbing select-none touch-pan-y"
      aria-label={`Interactive 3D preview of Shoaib wearing ${outfit.name}`}
    />
  );
};
