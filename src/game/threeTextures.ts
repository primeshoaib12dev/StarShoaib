import * as THREE from 'three';

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.65)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWoodFloorTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3A281E';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 32) {
    ctx.fillStyle = y % 64 === 0 ? '#442F23' : '#35241B';
    ctx.fillRect(0, y, 256, 30);
    ctx.fillStyle = '#241811';
    ctx.fillRect(0, y + 30, 256, 2);
    const splitX = ((y * 3) % 180) + 32;
    ctx.fillRect(splitX, y, 2, 30);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 5);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createAsphaltTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1D222B';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle asphalt grain
  for (let i = 0; i < 900; i++) {
    const x = (i * 73) % 256;
    const y = (i * 137) % 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.16)';
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 12);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createBuildingFacadeTexture(
  baseHex: string,
  windowHex: string,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Art Deco horizontal trim
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, 12, 256, 6);
  ctx.fillRect(0, 238, 256, 6);

  // Lit Vice City windows grid
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const lit = (row + col * 3) % 3 !== 0;
      ctx.fillStyle = lit ? windowHex : '#121722';
      ctx.fillRect(22 + col * 58, 34 + row * 52, 34, 30);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createViceSignTexture(
  text: string,
  bgColor: string,
  textColor: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 112);

  ctx.fillStyle = textColor;
  ctx.font = '800 54px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createNewYearTvScreenTexture(): {
  texture: THREE.CanvasTexture;
  update: (time: number) => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 144;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const update = (time: number) => {
    ctx.fillStyle = '#090C18';
    ctx.fillRect(0, 0, 256, 144);

    // Animated starbursts
    const colors = ['#F5A623', '#FF4D94', '#38BDF8', '#FDE047'];
    for (let i = 0; i < 4; i++) {
      const phase = (time * 0.9 + i * 0.25) % 1;
      const cx = 42 + i * 56;
      const cy = 36 + (i % 2) * 20;
      const r = phase * 26;
      ctx.strokeStyle = colors[i];
      ctx.globalAlpha = 1 - phase;
      ctx.lineWidth = 2;
      for (let a = 0; a < 8; a++) {
        const ang = (Math.PI * 2 * a) / 8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r * 0.3, cy + Math.sin(ang) * r * 0.3);
        ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HAPPY NEW YEAR!', 128, 102);
    ctx.fillStyle = '#F5A623';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('SHOAIB CITY LIVE', 128, 122);

    texture.needsUpdate = true;
  };

  update(0);
  return { texture, update };
}

export function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}
