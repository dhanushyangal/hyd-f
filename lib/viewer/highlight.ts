/**
 * Selected-part highlight shared by ThreeViewer and the Water sandbox: a soft fresnel rim
 * plus a thin crease outline. The sandbox receives this object over postMessage.
 */

export type SelectionHighlightSpec = {
  color: string;
  /** Rim glow strength at grazing angles. */
  rimStrength: number;
  /** Faint tint over the whole part so flat faces still read as selected. */
  fill: number;
  /** Seconds per breathing cycle. */
  pulsePeriod: number;
  /** Crease angle (degrees) for the outline. */
  edgeThreshold: number;
  edgeOpacity: number;
  vertexShader: string;
  fragmentShader: string;
};

export const SELECTION_HIGHLIGHT: SelectionHighlightSpec = {
  color: "#0ea5e9",
  rimStrength: 0.85,
  fill: 0.07,
  pulsePeriod: 2.6,
  edgeThreshold: 35,
  edgeOpacity: 0.7,
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vViewDir = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uRim;
    uniform float uFill;
    uniform float uTime;
    uniform float uPeriod;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      float facing = abs(dot(normalize(vNormal), normalize(vViewDir)));
      float rim = pow(1.0 - facing, 2.4);
      float pulse = 0.82 + 0.18 * sin(uTime * 6.2831853 / uPeriod);
      gl_FragColor = vec4(uColor, clamp((rim * uRim + uFill) * pulse, 0.0, 1.0));
      #include <colorspace_fragment>
    }
  `,
};
