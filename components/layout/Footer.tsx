"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/brand";
import { FOOTER_NAV } from "@/lib/nav";

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/hydrilla-ai",
    icon: (
      <svg className="footer-social-svg" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/hydrillaai",
    icon: (
      <svg className="footer-social-svg" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Reddit",
    href: "https://www.reddit.com/r/hydrilla",
    icon: (
      <svg className="footer-social-svg" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/hydrilla.ai",
    icon: (
      <svg className="footer-social-svg" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "Discord",
    href: "https://discord.gg/XEcDxTbTcU",
    icon: (
      <svg className="footer-social-svg" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
      </svg>
    ),
  },
];

/**
 * Exact glyph paths from /public/logo-hydrilla/hydsvgblack.svg (viewBox 0 0 937 274).
 * Kept in their native coordinate system so there are zero added gaps between letters.
 */
const HYDRILLA_GLYPHS = [
  {
    id: "H",
    cx: 86.4,
    cy: 108.6,
    d: "M132.3 213.6V3.59996H172.8V213.6H132.3ZM5.36442e-07 213.6V3.59996H40.5V213.6H5.36442e-07ZM35.1 122.7V90H139.2V122.7H35.1Z",
  },
  {
    id: "y",
    cx: 263.7,
    cy: 169.2,
    d: "M214.205 273.6L248.105 196.8H239.705L178.805 64.8H222.905L265.805 161.4H267.005L305.405 64.8H348.605L257.105 273.6H214.205Z",
  },
  {
    id: "d",
    cx: 416.8,
    cy: 110.4,
    d: "M405.366 217.2C391.366 217.2 379.166 213.9 368.766 207.3C358.366 200.5 350.266 191.2 344.466 179.4C338.666 167.6 335.766 154.2 335.766 139.2C335.766 124.2 338.666 110.8 344.466 99C350.266 87.2 358.466 78 369.066 71.4C379.666 64.6 392.266 61.2 406.866 61.2C418.466 61.2 428.466 63.5 436.866 68.1C445.466 72.5 452.266 77.8 457.266 84V3.59996H497.766V213.6H463.566L461.466 187.5H460.266C456.466 193.7 451.866 199 446.466 203.4C441.066 207.8 434.966 211.2 428.166 213.6C421.366 216 413.766 217.2 405.366 217.2ZM417.366 183.9C425.566 183.9 432.666 182 438.666 178.2C444.866 174.4 449.566 169.2 452.766 162.6C456.166 155.8 457.866 147.9 457.866 138.9C457.866 130.1 456.166 122.4 452.766 115.8C449.566 109 444.866 103.7 438.666 99.9C432.466 96.1 425.266 94.2 417.066 94.2C409.066 94.2 401.966 96.1 395.766 99.9C389.766 103.7 385.066 109 381.666 115.8C378.466 122.4 376.866 130.1 376.866 138.9C376.866 147.9 378.466 155.8 381.666 162.6C385.066 169.2 389.766 174.4 395.766 178.2C401.966 182 409.166 183.9 417.366 183.9Z",
  },
  {
    id: "r",
    cx: 561.5,
    cy: 137.4,
    d: "M514.371 213.6V64.8H548.871L552.471 97.5H553.671C558.071 86.9 562.871 79.1 568.071 74.1C573.271 68.9 579.171 65.5 585.771 63.9C592.571 62.1 600.171 61.2 608.571 61.2V104.1H597.471C590.671 104.1 584.571 104.9 579.171 106.5C573.971 107.9 569.571 110.3 565.971 113.7C562.371 116.9 559.571 121.2 557.571 126.6C555.771 132 554.871 138.5 554.871 146.1V213.6H514.371Z",
  },
  {
    id: "i",
    cx: 638.2,
    cy: 108.6,
    d: "M617.984 213.6V64.8H658.484V213.6H617.984ZM638.384 45.9C630.984 45.9 624.884 43.8 620.084 39.6C615.484 35.2 613.184 29.7 613.184 23.1C613.184 16.5 615.484 11 620.084 6.59996C624.884 2.19997 630.984 -2.81334e-05 638.384 -2.81334e-05C645.784 -2.81334e-05 651.784 2.19997 656.384 6.59996C660.984 11 663.284 16.5 663.284 23.1C663.284 29.5 660.984 34.9 656.384 39.3C651.784 43.7 645.784 45.9 638.384 45.9Z",
  },
  {
    id: "l1",
    cx: 700.0,
    cy: 108.6,
    d: "M679.805 213.6V3.59996H720.305V213.6H679.805Z",
  },
  {
    id: "l2",
    cx: 759.9,
    cy: 108.6,
    d: "M739.652 213.6V3.59996H780.152V213.6H739.652Z",
  },
  {
    id: "a",
    cx: 864.9,
    cy: 139.2,
    d: "M845.135 217.2C833.335 217.2 823.535 215.2 815.735 211.2C808.135 207.2 802.535 201.8 798.935 195C795.335 188.2 793.535 180.7 793.535 172.5C793.535 163.3 795.835 155.2 800.435 148.2C805.235 141.2 812.435 135.8 822.035 132C831.635 128 843.735 126 858.335 126H895.835C895.835 118.6 894.735 112.5 892.535 107.7C890.535 102.9 887.335 99.3 882.935 96.9C878.735 94.5 873.335 93.3 866.735 93.3C858.935 93.3 852.235 95.1 846.635 98.7C841.235 102.1 837.835 107.5 836.435 114.9H797.135C798.335 103.9 801.935 94.4 807.935 86.4C814.135 78.4 822.235 72.2 832.235 67.8C842.435 63.4 853.935 61.2 866.735 61.2C881.135 61.2 893.535 63.6 903.935 68.4C914.335 73 922.335 79.9 927.935 89.1C933.535 98.1 936.335 109.1 936.335 122.1V213.6H902.735L898.535 190.5H897.335C894.135 194.9 890.635 198.8 886.835 202.2C883.235 205.6 879.235 208.4 874.835 210.6C870.435 212.8 865.735 214.4 860.735 215.4C855.735 216.6 850.535 217.2 845.135 217.2ZM858.335 186C863.935 186 868.735 185.1 872.735 183.3C876.935 181.3 880.535 178.7 883.535 175.5C886.535 172.3 888.835 168.6 890.435 164.4C892.235 160 893.435 155.5 894.035 150.9H862.835C856.635 150.9 851.535 151.7 847.535 153.3C843.735 154.7 840.935 156.8 839.135 159.6C837.335 162.2 836.435 165.3 836.435 168.9C836.435 172.5 837.335 175.6 839.135 178.2C840.935 180.8 843.535 182.8 846.935 184.2C850.335 185.4 854.135 186 858.335 186Z",
  },
] as const;

const EXTRUSION_LAYERS = [
  { depth: 1.0, fill: "#6e717a" },
  { depth: 0.91, fill: "#61646d" },
  { depth: 0.82, fill: "#555861" },
  { depth: 0.73, fill: "#494c54" },
  { depth: 0.64, fill: "#3e4048" },
  { depth: 0.55, fill: "#34363d" },
  { depth: 0.46, fill: "#2a2c32" },
  { depth: 0.37, fill: "#212328" },
  { depth: 0.28, fill: "#191a1f" },
  { depth: 0.19, fill: "#121317" },
  { depth: 0.1, fill: "#0c0d10" },
] as const;

/**
 * Production wordmark viewport & vertical offset.
 * DEFAULT_TEXT_Y_OFFSET = 38 shifts the wordmark cleanly toward the bottom edge
 * while the viewBox trims the excess top whitespace so the spacing between the
 * bottom bar and the wordmark is tight and balanced.
 */
const DEFAULT_TEXT_Y_OFFSET = 38;
const WORDMARK_VIEWBOX = "0 18 937 180";

/**
 * Giant edge-to-edge black Hydrilla SVG wordmark (@public/logo-hydrilla/hydsvgblack.svg)
 * with sculpted 3D depth at rest, spring-physics magnetic wave on hover, dynamic 3D
 * extrusion, and cursor-tracking specular lighting across the black letterforms.
 * Zero horizontal shifts or scaling, so zero gaps are ever added between letters.
 */
function HydrillaWordmark3D() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const glyphGroupRefs = useRef<Array<SVGGElement | null>>([]);
  const shadowPathRefs = useRef<Array<SVGPathElement | null>>([]);
  const sliceRefs = useRef<Array<Array<SVGPathElement | null>>>(
    HYDRILLA_GLYPHS.map(() => [])
  );
  const sheenGradRef = useRef<SVGRadialGradientElement | null>(null);
  const rimGradRef = useRef<SVGLinearGradientElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = reduceMotionQuery.matches;

    const pointer = {
      tx: 0.5,
      ty: 0.35,
      x: 0.5,
      y: 0.35,
      hoverTarget: 0,
      hover: 0,
    };

    const springs = HYDRILLA_GLYPHS.map(() => ({
      liftY: 0,
      vLiftY: 0,
      extX: 0,
      vExtX: 0,
      extY: 4.5,
      vExtY: 0,
    }));

    let rafId = 0;

    const renderFrame = () => {
      const h = reduceMotion ? 0 : pointer.hover;
      const mx = pointer.x * 2 - 1;
      const my = pointer.y * 2 - 1;

      // Whole-wordmark 3D perspective tilt
      const tiltX = (-my * 8.5 * h).toFixed(2);
      const tiltY = (mx * 7.5 * h).toFixed(2);
      wrap.style.setProperty("--wm-rx", `${tiltX}deg`);
      wrap.style.setProperty("--wm-ry", `${tiltY}deg`);

      const svgCursorX = pointer.x * 937;
      const svgCursorY = pointer.y * 274;

      // Update cursor-tracking specular spotlight on the black letter faces
      if (sheenGradRef.current) {
        sheenGradRef.current.setAttribute("cx", svgCursorX.toFixed(1));
        sheenGradRef.current.setAttribute("cy", svgCursorY.toFixed(1));
        sheenGradRef.current.setAttribute("fx", svgCursorX.toFixed(1));
        sheenGradRef.current.setAttribute("fy", svgCursorY.toFixed(1));
        const radius = 260 + h * 110;
        sheenGradRef.current.setAttribute("r", radius.toFixed(1));
      }

      if (rimGradRef.current) {
        const angleX1 = (50 - mx * 35).toFixed(1);
        const angleX2 = (50 + mx * 35).toFixed(1);
        rimGradRef.current.setAttribute("x1", `${angleX1}%`);
        rimGradRef.current.setAttribute("x2", `${angleX2}%`);
      }

      let anyActive =
        Math.abs(pointer.tx - pointer.x) > 0.0008 ||
        Math.abs(pointer.ty - pointer.y) > 0.0008 ||
        Math.abs(pointer.hoverTarget - pointer.hover) > 0.001;

      for (let i = 0; i < HYDRILLA_GLYPHS.length; i++) {
        const g = HYDRILLA_GLYPHS[i];
        const sp = springs[i];
        const groupEl = glyphGroupRefs.current[i];
        const shadowEl = shadowPathRefs.current[i];
        const slices = sliceRefs.current[i];

        // Distance of cursor to this glyph in normalized SVG space
        const dx = (svgCursorX - g.cx) / 937;
        const dy = (svgCursorY - g.cy) / 274;
        const proximity = Math.exp(-(dx * dx * 13.5 + dy * dy * 2.2)) * h;

        // Target vertical lift only (zero X shift & zero scale so letter kerning never changes)
        const targetLiftY = reduceMotion ? 0 : -(proximity * 22 + h * 2.5);

        // Resting 3D extrusion (0, 4.5) morphs into dynamic directional 3D extrusion on hover
        const targetExtX = reduceMotion
          ? 0
          : (-dx * 26 - mx * 7) * (0.35 + proximity * 0.65) * h;
        const targetExtY = reduceMotion
          ? 4.5
          : 4.5 + (6.5 + proximity * 11.5 - my * 4.5) * h;

        // Spring integration for snappy, tactile response
        const stiffness = 0.18;
        const damping = 0.74;

        sp.vLiftY = (sp.vLiftY + (targetLiftY - sp.liftY) * stiffness) * damping;
        sp.liftY += sp.vLiftY;

        sp.vExtX = (sp.vExtX + (targetExtX - sp.extX) * stiffness) * damping;
        sp.extX += sp.vExtX;

        sp.vExtY = (sp.vExtY + (targetExtY - sp.extY) * stiffness) * damping;
        sp.extY += sp.vExtY;

        if (
          Math.abs(sp.vLiftY) > 0.01 ||
          Math.abs(sp.vExtX) > 0.01 ||
          Math.abs(sp.vExtY) > 0.01 ||
          Math.abs(targetLiftY - sp.liftY) > 0.02 ||
          Math.abs(targetExtX - sp.extX) > 0.02 ||
          Math.abs(targetExtY - sp.extY) > 0.02
        ) {
          anyActive = true;
        }

        if (groupEl) {
          groupEl.setAttribute("transform", `translate(0, ${sp.liftY.toFixed(2)})`);
        }

        if (shadowEl) {
          const shX = sp.extX * 1.35;
          const shY = sp.extY * 1.45 + 3.5;
          const shOpacity = 0.11 + 0.12 * (0.35 + proximity * 0.65) * h;
          shadowEl.setAttribute("transform", `translate(${shX.toFixed(2)}, ${shY.toFixed(2)})`);
          shadowEl.setAttribute("opacity", shOpacity.toFixed(3));
        }

        if (slices) {
          for (let s = 0; s < EXTRUSION_LAYERS.length; s++) {
            const sliceEl = slices[s];
            if (!sliceEl) continue;
            const depth = EXTRUSION_LAYERS[s].depth;
            sliceEl.setAttribute(
              "transform",
              `translate(${(sp.extX * depth).toFixed(2)}, ${(sp.extY * depth).toFixed(2)})`
            );
          }
        }
      }

      return anyActive;
    };

    const tick = () => {
      rafId = 0;
      pointer.x += (pointer.tx - pointer.x) * 0.2;
      pointer.y += (pointer.ty - pointer.y) * 0.2;
      pointer.hover += (pointer.hoverTarget - pointer.hover) * 0.14;

      const keepGoing = renderFrame();
      if (keepGoing) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const scheduleTick = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointer.tx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      pointer.ty = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      pointer.hoverTarget = 1;
      scheduleTick();
    };

    const onPointerLeave = () => {
      pointer.tx = 0.5;
      pointer.ty = 0.35;
      pointer.hoverTarget = 0;
      scheduleTick();
    };

    const onReducedMotion = () => {
      reduceMotion = reduceMotionQuery.matches;
      scheduleTick();
    };

    reduceMotionQuery.addEventListener("change", onReducedMotion);
    wrap.addEventListener("pointerenter", onPointerMove);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerleave", onPointerLeave);

    renderFrame();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      reduceMotionQuery.removeEventListener("change", onReducedMotion);
      wrap.removeEventListener("pointerenter", onPointerMove);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className="footer-wordmark-3d" aria-label="Hydrilla" role="img">
      <svg
        viewBox={WORDMARK_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="footer-wordmark-svg"
        preserveAspectRatio="xMidYMin slice"
        aria-hidden="true"
      >
        <defs>
          {/* Soft floor shadow blur */}
          <filter id="hyd-wm-shadow-blur" x="-15%" y="-15%" width="130%" height="140%">
            <feGaussianBlur stdDeviation="5.5" />
          </filter>

          {/* Dynamic cursor-tracking specular sheen across the black letter faces */}
          <radialGradient
            ref={sheenGradRef}
            id="hyd-wm-cursor-sheen"
            gradientUnits="userSpaceOnUse"
            cx="468.5"
            cy="95"
            fx="468.5"
            fy="95"
            r="280"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
            <stop offset="38%" stopColor="#9ec5ff" stopOpacity="0.14" />
            <stop offset="72%" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Top-lit machined obsidian bevel rim gradient */}
          <linearGradient
            ref={rimGradRef}
            id="hyd-wm-rim-grad"
            x1="35%"
            y1="0%"
            x2="65%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.62" />
            <stop offset="28%" stopColor="#cbd5e1" stopOpacity="0.22" />
            <stop offset="65%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.25" />
          </linearGradient>

          {/* Subtle vertical obsidian sheen so the black face has rich depth even at rest */}
          <linearGradient id="hyd-wm-obsidian-base" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#18181c" />
            <stop offset="22%" stopColor="#09090b" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          {HYDRILLA_GLYPHS.map((glyph) => (
            <clipPath key={`clip-${glyph.id}`} id={`hyd-wm-clip-${glyph.id}`}>
              <path d={glyph.d} />
            </clipPath>
          ))}
        </defs>

        <g transform={`translate(0, ${DEFAULT_TEXT_Y_OFFSET})`}>
          {HYDRILLA_GLYPHS.map((glyph, i) => (
            <g
              key={glyph.id}
              ref={(el) => {
                glyphGroupRefs.current[i] = el;
              }}
              className="footer-wordmark-glyph"
            >
              {/* Soft ambient 3D floor shadow */}
              <path
                ref={(el) => {
                  shadowPathRefs.current[i] = el;
                }}
                d={glyph.d}
                fill="#000000"
                opacity="0.11"
                filter="url(#hyd-wm-shadow-blur)"
              />

              {/* Solid 11-layer architectural 3D extrusion block */}
              {EXTRUSION_LAYERS.map((slice, sIndex) => (
                <path
                  key={`${glyph.id}-slice-${sIndex}`}
                  ref={(el) => {
                    if (!sliceRefs.current[i]) sliceRefs.current[i] = [];
                    sliceRefs.current[i][sIndex] = el;
                  }}
                  d={glyph.d}
                  fill={slice.fill}
                />
              ))}

              {/* Sculpted black front face from @public/logo-hydrilla/hydsvgblack.svg */}
              <g clipPath={`url(#hyd-wm-clip-${glyph.id})`}>
                <path d={glyph.d} fill="url(#hyd-wm-obsidian-base)" />
                <path d={glyph.d} fill="url(#hyd-wm-cursor-sheen)" />
                <path
                  d={glyph.d}
                  fill="none"
                  stroke="url(#hyd-wm-rim-grad)"
                  strokeWidth="3.2"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default function Footer() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // Fallback: open mailto if clipboard fails
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  };

  return (
    <footer className="footer-stage" id="site-footer" role="contentinfo">
      {/* Scenic backdrop (/ruinshydrilla.jpg) framing the top, left, and right */}
      <div className="footer-backdrop" aria-hidden="true">
        <Image
          src="/ruinshydrilla.jpg"
          alt=""
          fill
          sizes="100vw"
          className="footer-backdrop-img"
          quality={90}
        />
      </div>

      {/* Pure white Enterprise footer sheet */}
      <div className="footer-card">
        <nav className="footer-grid" aria-label="Footer navigation">
          {FOOTER_NAV.map((col) => (
            <div
              key={col.heading}
              className="footer-col"
              data-row={col.row ?? 1}
              data-col={col.col ?? 1}
            >
              <h2 className="footer-col-heading">{col.heading}</h2>
              <ul className="footer-link-list">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.label}`} className="footer-link-item">
                    <Link href={link.href} className="footer-link">
                      <span>{link.label}</span>
                      {link.badge ? (
                        <span className="footer-badge">{link.badge}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Get in touch — spans empty Row 2 center columns on desktop, full width on mobile */}
          <div className="footer-col footer-contact-col" data-row={2} data-col={2}>
            <h2 className="footer-col-heading">Get in touch</h2>
            <div className="footer-email-group">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="footer-email-link"
                aria-label={`Email ${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="footer-email-copy-btn"
                aria-label={copiedEmail ? "Email address copied" : "Copy email address"}
              >
                {copiedEmail ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                )}
                <span>{copiedEmail ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <Link href="/" className="footer-brand" aria-label="Hydrilla Home">
            <span className="footer-brand-mark">
              <Image
                src="/hyd01.png"
                alt=""
                fill
                sizes="40px"
                className="object-contain"
              />
            </span>
            <img
              src="/logo-hydrilla/hydsvgblack.svg"
              alt="Hydrilla"
              className="footer-brand-wordmark"
            />
          </Link>

          <div className="footer-credits">
            <p className="footer-copy">©2026 Hydrilla AI Pvt Ltd.</p>
          </div>

          <div className="footer-socials" aria-label="Social links">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="footer-social-btn"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Big full-bleed black Hydrilla SVG wordmark flush at the bottom */}
        <HydrillaWordmark3D />
      </div>

      <style>{`
        .footer-stage {
          --_layout---card--large: 3rem;
          --_layout---radius--large: 3rem;
          --_theme--appearance---heading: #1b1a18;
          --_theme--appearance---paragraph: color-mix(in srgb, #1b1a18 68%, transparent);
          --_theme--appearance---border: #e6e4e0;
          --_swatches---tile-bg: #f4f3f0;
          --_swatches---tile-bg-hover: #e7e5e0;
          --_swatches---badge-bg: #fcbe11;
          --_swatches---badge-text: #1b1a18;
          --loam---fluid-min: 20;
          --loam---fluid-max: 90;
          --loam---eyebrow-min: 0.7;
          --loam---eyebrow-max: 0.8;

          position: relative;
          isolation: isolate;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          background-color: #6ea3d8;
          padding-top: clamp(3.5rem, 6.5vw, 6rem);
          padding-left: clamp(1rem, 4.5vw, 5.25rem);
          padding-right: clamp(1rem, 4.5vw, 5.25rem);
          padding-bottom: 0;
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          font-family: "RoobertVF", "Roobert", var(--font-dm-sans), "DM Sans", Inter, sans-serif;
          font-feature-settings: "ss03" 1, "ss10" 1, "ss11" 1, "ss12" 1;
          color: #1b1a18;
        }

        .footer-backdrop {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          overflow: hidden;
        }

        .footer-backdrop-img {
          object-fit: cover;
          object-position: center 38%;
          transform: scale(1.01);
        }

        .footer-card {
          box-sizing: border-box;
          width: 100%;
          max-width: 82rem;
          margin: 0 auto;
          background-color: #ffffff;
          border-top-left-radius: var(--_layout---radius--large);
          border-top-right-radius: var(--_layout---radius--large);
          padding-top: var(--_layout---card--large);
          padding-right: var(--_layout---card--large);
          padding-left: var(--_layout---card--large);
          padding-bottom: 0;
          display: flex;
          flex-flow: column;
          row-gap: 3.5rem;
          overflow: hidden;
          box-shadow:
            0 -16px 48px rgba(0, 12, 31, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.92);
        }

        .footer-grid {
          box-sizing: border-box;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          grid-column-gap: 3rem;
          grid-row-gap: 4rem;
          align-items: start;
        }

        /* Explicit placement on desktop so Row 2 mirrors the reference (left, center span, right) */
        @media (min-width: 1024px) {
          .footer-col[data-row="1"][data-col="1"] { grid-row: 1; grid-column: 1; }
          .footer-col[data-row="1"][data-col="2"] { grid-row: 1; grid-column: 2; }
          .footer-col[data-row="1"][data-col="3"] { grid-row: 1; grid-column: 3; }
          .footer-col[data-row="1"][data-col="4"] { grid-row: 1; grid-column: 4; }
          .footer-col[data-row="1"][data-col="5"] { grid-row: 1; grid-column: 5; }
          .footer-col[data-row="2"][data-col="1"] { grid-row: 2; grid-column: 1; }
          .footer-col[data-row="2"][data-col="2"] { grid-row: 2; grid-column: 2 / span 3; }
          .footer-col[data-row="2"][data-col="5"] { grid-row: 2; grid-column: 5; }
        }

        .footer-col {
          min-width: 0;
        }

        .footer-col-heading {
          margin: 0 0 1.5em;
          font-family: var(--font-geist-mono), "Roobert mono", var(--font-dm-sans), Arial, sans-serif;
          font-size: clamp(
            calc(var(--loam---eyebrow-min) * 1rem),
            calc(
              (var(--loam---eyebrow-min) - ((var(--loam---eyebrow-max) - var(--loam---eyebrow-min)) / (var(--loam---fluid-max) - var(--loam---fluid-min)) * var(--loam---fluid-min))) * 1rem +
              ((var(--loam---eyebrow-max) - var(--loam---eyebrow-min)) / (var(--loam---fluid-max) - var(--loam---fluid-min))) * 100vw
            ),
            calc(var(--loam---eyebrow-max) * 1rem)
          );
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--_theme--appearance---heading);
        }

        .footer-link-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          row-gap: 0.8rem;
        }

        .footer-link-item {
          margin: 0;
          padding: 0;
        }

        .footer-link {
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.45rem;
          font-family: "RoobertVF", "Roobert", var(--font-dm-sans), "DM Sans", Inter, sans-serif;
          font-size: 0.875rem;
          font-weight: 400;
          line-height: 1.35;
          letter-spacing: -0.005em;
          color: var(--_theme--appearance---paragraph);
          text-decoration: none;
          transition: color 0.16s ease;
        }

        .footer-link:hover {
          color: #000000;
        }

        .footer-link:focus-visible {
          outline: 2px solid #395afa;
          outline-offset: 3px;
          border-radius: 0.25rem;
        }

        .footer-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.16rem 0.45rem;
          border-radius: 0.3rem;
          background-color: var(--_swatches---badge-bg);
          color: var(--_swatches---badge-text);
          font-family: "RoobertVF", "Roobert", var(--font-dm-sans), "DM Sans", sans-serif;
          font-size: 0.6875rem;
          font-weight: 600;
          line-height: 1.1;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }

        .footer-contact-col {
          width: 100%;
        }

        .footer-email-group {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          flex-wrap: wrap;
        }

        .footer-email-link {
          display: inline-flex;
          align-items: center;
          height: 2.5rem;
          padding: 0 0.9rem;
          border-radius: 0.5rem;
          background-color: var(--_swatches---tile-bg);
          color: var(--_theme--appearance---heading);
          font-family: "RoobertVF", "Roobert", var(--font-dm-sans), "DM Sans", Inter, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1;
          letter-spacing: -0.01em;
          text-decoration: none;
          white-space: nowrap;
          transition: background-color 0.16s ease, color 0.16s ease;
        }

        .footer-email-link:hover {
          background-color: var(--_swatches---tile-bg-hover);
          color: #000000;
        }

        .footer-email-link:focus-visible {
          outline: 2px solid #395afa;
          outline-offset: 2px;
        }

        .footer-email-copy-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          height: 2.5rem;
          padding: 0 0.8rem;
          border: 0;
          border-radius: 0.5rem;
          background-color: var(--_swatches---tile-bg);
          color: var(--_theme--appearance---paragraph);
          font-family: "RoobertVF", "Roobert", var(--font-dm-sans), "DM Sans", Inter, sans-serif;
          font-size: 0.8125rem;
          font-weight: 500;
          line-height: 1;
          letter-spacing: -0.005em;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.16s ease, color 0.16s ease, transform 0.14s ease;
        }

        .footer-email-copy-btn svg {
          width: 0.9rem;
          height: 0.9rem;
          flex-shrink: 0;
        }

        .footer-email-copy-btn:hover {
          background-color: var(--_swatches---tile-bg-hover);
          color: var(--_theme--appearance---heading);
        }

        .footer-email-copy-btn:active {
          transform: scale(0.97);
        }

        .footer-email-copy-btn:focus-visible {
          outline: 2px solid #395afa;
          outline-offset: 2px;
        }

        .footer-bottom {
          box-sizing: border-box;
          border-top: 1px solid var(--_theme--appearance---border);
          padding-top: 2.25rem;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          column-gap: 1.5rem;
          row-gap: 1.5rem;
        }

        .footer-brand {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          justify-self: start;
          text-decoration: none;
          color: #1b1a18;
        }

        .footer-brand:focus-visible {
          outline: 2px solid #395afa;
          outline-offset: 4px;
          border-radius: 0.5rem;
        }

        .footer-brand-mark {
          position: relative;
          width: 2.5rem;
          height: 2.5rem;
          flex-shrink: 0;
        }

        .footer-brand-wordmark {
          display: block;
          height: 2.05rem;
          width: auto;
          transform: translateY(1px);
        }

        .footer-credits {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.25rem;
        }

        .footer-copy {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 400;
          line-height: 1.4;
          color: #55534e;
        }

        .footer-socials {
          display: flex;
          align-items: center;
          justify-self: end;
          gap: 0.5rem;
        }

        .footer-social-btn {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          background-color: var(--_swatches---tile-bg);
          color: #1b1a18;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: background-color 0.16s ease, transform 0.16s ease, color 0.16s ease;
        }

        .footer-social-btn:hover {
          background-color: var(--_swatches---tile-bg-hover);
          color: #000000;
          transform: translateY(-1px);
        }

        .footer-social-btn:active {
          transform: translateY(0) scale(0.97);
        }

        .footer-social-btn:focus-visible {
          outline: 2px solid #395afa;
          outline-offset: 3px;
        }

        .footer-social-svg {
          width: 1.125rem;
          height: 1.125rem;
        }

        /* =====================================================================
           Giant edge-to-edge Black Hydrilla Wordmark (@public/logo-hydrilla/hydsvgblack.svg)
           Flush with the edges and bottom of the white footer card (half-cropped)
           ===================================================================== */
        .footer-wordmark-3d {
          --wm-rx: 0deg;
          --wm-ry: 0deg;

          position: relative;
          margin-left: calc(var(--_layout---card--large) * -1);
          margin-right: calc(var(--_layout---card--large) * -1);
          margin-top: -1.75rem;
          margin-bottom: -1px;
          padding: 0 1.25rem;
          box-sizing: border-box;
          perspective: 1200px;
          overflow: hidden;
          user-select: none;
        }

        .footer-wordmark-svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: hidden;
          transform-style: preserve-3d;
          transform: rotateX(var(--wm-rx)) rotateY(var(--wm-ry));
          will-change: transform;
        }

        .footer-wordmark-glyph {
          will-change: transform;
        }

        /* Tablet layout */
        @media (max-width: 1023px) {
          .footer-stage {
            --_layout---card--large: 2.25rem;
            --_layout---radius--large: 2.25rem;
            padding-top: 3.25rem;
            padding-left: 1.25rem;
            padding-right: 1.25rem;
          }

          .footer-card {
            row-gap: 2.5rem;
          }

          .footer-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            grid-column-gap: 2.25rem;
            grid-row-gap: 2.5rem;
          }

          .footer-contact-col {
            grid-column: span 2;
          }

          .footer-bottom {
            grid-template-columns: 1fr;
            justify-items: center;
            text-align: center;
            row-gap: 1.25rem;
            padding-top: 1.75rem;
          }

          .footer-brand {
            justify-self: center;
          }

          .footer-socials {
            justify-self: center;
          }

          .footer-wordmark-3d {
            margin-top: -1rem;
          }
        }

        /* Mobile layout — matches the supplied mobile specification */
        @media (max-width: 639px) {
          .footer-stage {
            --_layout---card--large: 1.75rem;
            --_layout---radius--large: 1.75rem;
            padding-top: 2.75rem;
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }

          .footer-card {
            padding-top: var(--_layout---card--large);
            padding-right: var(--_layout---card--large);
            padding-left: var(--_layout---card--large);
            padding-bottom: 0;
            row-gap: 2rem;
          }

          .footer-grid {
            grid-template-rows: auto;
            grid-auto-columns: 1fr;
            display: grid;
            grid-column-gap: 1.5rem;
            grid-row-gap: 1.75rem;
            grid-template-columns: 1fr 1fr;
            place-items: start;
          }

          .footer-contact-col {
            grid-column: 1 / -1;
            width: 100%;
          }

          .footer-email-group {
            display: flex;
            width: 100%;
            gap: 0.5rem;
          }

          .footer-email-link {
            flex: 1;
            justify-content: center;
            height: 2.65rem;
          }

          .footer-email-copy-btn {
            height: 2.65rem;
            padding: 0 0.95rem;
          }

          .footer-link {
            font-size: 0.87rem;
            line-height: 1.3;
          }

          .footer-bottom {
            padding-top: 1.5rem;
            row-gap: 1.15rem;
          }

          .footer-brand-mark {
            width: 2.25rem;
            height: 2.25rem;
          }

          .footer-brand-wordmark {
            height: 1.85rem;
          }

          .footer-copy {
            font-size: 0.8125rem;
          }

          .footer-wordmark-3d {
            margin-top: -0.75rem;
            padding: 0 0.35rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .footer-link,
          .footer-email-link,
          .footer-email-copy-btn,
          .footer-social-btn {
            transition: none;
          }
        }
      `}</style>
    </footer>
  );
}
