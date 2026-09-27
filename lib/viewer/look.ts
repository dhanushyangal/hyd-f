/**
 * Viewer look + part materials shared by ThreeViewer (Cloud GLB) and the Water sandbox.
 * The sandbox cannot import this module, so it receives `ResolvedViewerLook` numbers only.
 */

export type ViewerEnvLighting = "studio" | "outdoor" | "neutral";
export type ViewerMaterialType = "standard" | "matcap" | "toon" | "lambert" | "normal";
export type ViewerMaterialRoughness = "smooth" | "medium" | "rough";
export type ViewerCameraMode = "perspective" | "isometric";

export type ViewerLook = {
  lighting: ViewerEnvLighting;
  lightIntensity: number;
  brightness: number;
  background: boolean;
  grid: boolean;
  shadow: boolean;
  autoRotate: boolean;
  materialType: ViewerMaterialType;
  materialRoughness: ViewerMaterialRoughness;
  wireframe: boolean;
  cameraMode: ViewerCameraMode;
  distortion: number;
};

export type LightRig = { ambient: number; hemi: number; key: number; fill: number; rim: number };

const LIGHTING_PRESETS: Record<
  ViewerEnvLighting,
  { rig: LightRig; lightIntensity: number; brightness: number }
> = {
  neutral: { rig: { ambient: 0.4, hemi: 0.5, key: 1.0, fill: 0.3, rim: 0.2 }, lightIntensity: 1, brightness: 1 },
  studio: { rig: { ambient: 0.6, hemi: 0.55, key: 1.2, fill: 0.35, rim: 0.25 }, lightIntensity: 1.2, brightness: 1.15 },
  outdoor: { rig: { ambient: 0.7, hemi: 0.6, key: 1.4, fill: 0.4, rim: 0.3 }, lightIntensity: 1.4, brightness: 1.25 },
};

const ROUGHNESS: Record<ViewerMaterialRoughness, number> = { smooth: 0.2, medium: 0.5, rough: 0.9 };

export const DEFAULT_VIEWER_LOOK: ViewerLook = {
  lighting: "studio",
  lightIntensity: LIGHTING_PRESETS.studio.lightIntensity,
  brightness: LIGHTING_PRESETS.studio.brightness,
  background: true,
  grid: false,
  shadow: true,
  autoRotate: false,
  materialType: "standard",
  materialRoughness: "medium",
  wireframe: false,
  cameraMode: "perspective",
  distortion: 0.28,
};

/** Switching preset resets intensity/exposure to that preset unless the patch sets them. */
export function applyLookPatch(prev: ViewerLook, patch: Partial<ViewerLook>): ViewerLook {
  const next = { ...prev, ...patch };
  if (patch.lighting && patch.lighting !== prev.lighting) {
    const preset = LIGHTING_PRESETS[patch.lighting];
    next.lightIntensity = patch.lightIntensity ?? preset.lightIntensity;
    next.brightness = patch.brightness ?? preset.brightness;
  }
  return next;
}

export type ResolvedViewerLook = {
  exposure: number;
  background: string | null;
  grid: boolean;
  shadow: boolean;
  autoRotate: boolean;
  wireframe: boolean;
  lights: LightRig;
  camera: { ortho: boolean; fov: number; frustum: number };
  materialType: ViewerMaterialType;
  roughness: number;
};

export const VIEWER_BACKGROUND = "#ffffff";

export function resolveViewerLook(look: ViewerLook): ResolvedViewerLook {
  const scale = Math.max(0.3, Math.min(2, look.lightIntensity));
  const rig = LIGHTING_PRESETS[look.lighting].rig;
  return {
    exposure: look.brightness,
    background: look.background ? VIEWER_BACKGROUND : null,
    grid: look.grid,
    shadow: look.shadow,
    autoRotate: look.autoRotate,
    wireframe: look.wireframe,
    lights: {
      ambient: rig.ambient * scale,
      hemi: rig.hemi * scale,
      key: rig.key * scale,
      fill: rig.fill * scale,
      rim: rig.rim * scale,
    },
    camera: {
      ortho: look.cameraMode === "isometric",
      fov: 32 + Math.min(1, Math.max(0, look.distortion)) * 48,
      frustum: 2.2,
    },
    materialType: look.materialType,
    roughness: ROUGHNESS[look.materialRoughness],
  };
}

export type PartMaterial = { color: string; roughness: number; metalness: number };
/** Keyed by mesh name. Only parts listed here are overridden; others keep their authored look. */
export type PartMaterialMap = Record<string, PartMaterial>;

export const DEFAULT_PART_MATERIAL: PartMaterial = { color: "#888888", roughness: 0.5, metalness: 0 };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function encodeSrgb(linear: number) {
  const c = clamp01(linear);
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function decodeSrgb(encoded: number) {
  return encoded <= 0.04045 ? encoded / 12.92 : Math.pow((encoded + 0.055) / 1.055, 2.4);
}

function hexFromSrgb(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function parseChannel(token: string, percentScale = 1) {
  return token.endsWith("%") ? (parseFloat(token) / 100) * percentScale : parseFloat(token);
}

/**
 * Normalize picker output (hex, `oklch()`, `color(display-p3 …)`) to `#rrggbb`.
 * THREE.Color and the scene API only accept hex/sRGB.
 */
export function toHexColor(value: string): string | null {
  const v = value.trim().toLowerCase();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hex) {
    const h = hex[1];
    return h.length === 3 ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` : `#${h.slice(0, 6)}`;
  }

  const oklch = v.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*(?:\/\s*[\d.]+%?\s*)?\)$/);
  if (oklch) {
    const L = parseChannel(oklch[1]);
    const C = parseChannel(oklch[2], 0.4);
    const H = (parseFloat(oklch[3]) * Math.PI) / 180;
    const a = C * Math.cos(H);
    const b = C * Math.sin(H);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return hexFromSrgb(
      encodeSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      encodeSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      encodeSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
    );
  }

  const p3 = v.match(/^color\(\s*display-p3\s+([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)\s*(?:\/\s*[\d.]+%?\s*)?\)$/);
  if (p3) {
    const [r, g, b] = [p3[1], p3[2], p3[3]].map((t) => decodeSrgb(parseChannel(t)));
    return hexFromSrgb(
      encodeSrgb(1.2249401 * r - 0.2249404 * g),
      encodeSrgb(-0.0420569 * r + 1.0420571 * g),
      encodeSrgb(-0.0196376 * r - 0.0786361 * g + 1.0982735 * b)
    );
  }

  return null;
}

/** Keep only well-formed entries (saved scene JSON, sandbox messages). */
export function sanitizePartMaterials(raw: unknown): PartMaterialMap {
  if (!raw || typeof raw !== "object") return {};
  const out: PartMaterialMap = {};
  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!name || !value || typeof value !== "object") continue;
    const o = value as Record<string, unknown>;
    const color = typeof o.color === "string" ? toHexColor(o.color) : null;
    out[name] = {
      color: color ?? DEFAULT_PART_MATERIAL.color,
      roughness: typeof o.roughness === "number" ? clamp01(o.roughness) : DEFAULT_PART_MATERIAL.roughness,
      metalness: typeof o.metalness === "number" ? clamp01(o.metalness) : DEFAULT_PART_MATERIAL.metalness,
    };
  }
  return out;
}
