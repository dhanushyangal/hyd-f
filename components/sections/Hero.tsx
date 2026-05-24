"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { MotionValue } from "framer-motion";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { PromptBox } from "../PromptBox";
import { SignUpButton, useAuth } from "@clerk/nextjs";

// Above-the-fold: load immediately for fast FCP/LCP
import Showcase from "./Showcase";

// Below-the-fold: code-split to reduce initial bundle and improve INP/TTI
const IndustrySection = dynamic(() => import("./IndustrySection").then((m) => m.default), { ssr: true });
const HowItWorks = dynamic(() => import("./HowItWorks").then((m) => m.default), { ssr: true });
const AppShowcase = dynamic(() => import("./AppShowcase").then((m) => m.default), { ssr: true });
const FeaturesSection = dynamic(() => import("./FeaturesSection").then((m) => m.default), { ssr: true });
const WhyHydrilla = dynamic(() => import("./WhyHydrilla").then((m) => m.default), { ssr: true });
const PricingSection = dynamic(() => import("./PricingSection").then((m) => m.default), { ssr: true });
const FAQSection = dynamic(() => import("./FAQSection").then((m) => m.default), { ssr: true });

const HERO_PROMPT_KEY = "hero_prompt";

const ROTATING_PROMPTS = [
  "Make a sword with fire",
  "A vintage camera on a wooden table",
  "A cute robot character for a game",
];

const ROTATE_INTERVAL_MS = 3800;

type HeroMode = "create" | "demo";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HERO_BACKDROP_VIDEO = "/herohydrilla.mp4";
const HERO_BACKDROP_POSTER = "/herohydrillasrc.jpg";

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
    addEventListener?: (type: "change", fn: () => void) => void;
    removeEventListener?: (type: "change", fn: () => void) => void;
  };
};

/**
 * Hero backdrop: always load JPG first (LCP). MP4 mounts only after the poster image has loaded
 * and the network is not slow / save-data. Video fades in on first frame; slow connections never fetch video.
 */
function HeroBackdropMedia({ reduceMotion }: { reduceMotion: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [connectionSlow, setConnectionSlow] = useState<boolean | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const c = (navigator as NavigatorWithConnection).connection;
    if (!c) {
      setConnectionSlow(false);
      return;
    }
    const update = () => {
      if (c.saveData) {
        setConnectionSlow(true);
        return;
      }
      const t = c.effectiveType ?? "";
      // No video on slow / metered-style labels (includes 3g — hero video is heavy).
      setConnectionSlow(
        t === "slow-2g" || t === "2g" || t === "3g"
      );
    };
    update();
    c.addEventListener?.("change", update);
    return () => c.removeEventListener?.("change", update);
  }, []);

  const networkAllowsVideo =
    !reduceMotion && connectionSlow !== true && !videoFailed;

  /** JPG must finish first; only then mount & fetch MP4 (saves bandwidth on slow nets: we never mount video). */
  const shouldMountVideo = posterLoaded && networkAllowsVideo;

  // Muted autoplay still needs an explicit play() on many mobile browsers after mount.
  useLayoutEffect(() => {
    if (!shouldMountVideo) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");

    const kickPlay = () => {
      void v.play().catch(() => {
        /* retry after more data */
      });
    };
    kickPlay();
    v.addEventListener("loadeddata", kickPlay);
    v.addEventListener("canplay", kickPlay);
    return () => {
      v.removeEventListener("loadeddata", kickPlay);
      v.removeEventListener("canplay", kickPlay);
    };
  }, [shouldMountVideo]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Layer 1: poster always — first paint and fallback if video never runs */}
      <img
        src={HERO_BACKDROP_POSTER}
        alt=""
        className="absolute inset-0 z-0 h-full w-full object-cover scale-[1.02]"
        fetchPriority="high"
        decoding="async"
        loading="eager"
        onLoad={() => setPosterLoaded(true)}
      />
      {/* Layer 2: video only after JPG loaded + fast connection; hidden until actually playing */}
      {shouldMountVideo ? (
        <video
          ref={videoRef}
          className={`absolute inset-0 z-10 h-full w-full object-cover scale-[1.02] transition-opacity duration-700 ease-out ${
            videoPlaying ? "opacity-100" : "opacity-0"
          }`}
          src={HERO_BACKDROP_VIDEO}
          poster={HERO_BACKDROP_POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onPlaying={() => setVideoPlaying(true)}
          onError={() => {
            setVideoFailed(true);
            setVideoPlaying(false);
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * 3D tilt driven by pointer position on the *full hero section* (passed in as motion values),
 * so movement is felt across the whole viewport, not only when the cursor is over the logo box.
 */
function HeroHeadline3D({
  children,
  rotateX,
  rotateY,
  reduce,
}: {
  children: React.ReactNode;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  reduce: boolean;
}) {
  return (
    <div className="w-full [perspective:1200px] flex flex-col items-center gap-3 sm:gap-4 lg:[perspective:1400px]">
      <motion.div
        className="w-full flex flex-col items-center gap-3 sm:gap-4 will-change-transform"
        style={
          reduce
            ? { transformStyle: "preserve-3d" }
            : {
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }
        }
      >
        <div className="w-full flex flex-col items-center gap-3 sm:gap-4 [transform:translateZ(32px)] lg:[transform:translateZ(48px)]">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const tiltSpringX = useSpring(tiltX, { stiffness: 120, damping: 32, mass: 0.32 });
  const tiltSpringY = useSpring(tiltY, { stiffness: 120, damping: 32, mass: 0.32 });
  const headlineRotateX = useTransform(tiltSpringY, [-0.5, 0.5], [9, -9]);
  const headlineRotateY = useTransform(tiltSpringX, [-0.5, 0.5], [-12, 12]);

  const onHeroPointerMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduceMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    tiltX.set(Math.max(-0.5, Math.min(0.5, nx * 1.2)));
    tiltY.set(Math.max(-0.5, Math.min(0.5, ny * 1.2)));
  };

  const onHeroPointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<HeroMode>("create");
  const [demoEmail, setDemoEmail] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % ROTATING_PROMPTS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    if (!isLoaded) return;
    if (!isSignedIn) {
      try {
        sessionStorage.setItem(HERO_PROMPT_KEY, prompt.trim());
      } catch (_) {}
      router.push("/sign-in?redirect_url=" + encodeURIComponent("/workspace"));
      return;
    }
    try {
      sessionStorage.setItem(HERO_PROMPT_KEY, prompt.trim());
    } catch (_) {}
    router.push("/generate");
  };

  const DEMO_MEETING_URL = "https://cal.com/hydrilla";

  const handleDemoSubmit = () => {
    if (!emailRegex.test(demoEmail.trim())) return;
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=" + encodeURIComponent("/app/demo-meeting"));
      return;
    }
    if (typeof window !== "undefined") {
      window.location.href = DEMO_MEETING_URL;
    }
  };

  const canSubmitDemo = emailRegex.test(demoEmail.trim());

  return (
    <>
      <section
        className="relative min-h-screen w-full overflow-hidden bg-transparent"
        onMouseMove={onHeroPointerMove}
        onMouseLeave={onHeroPointerLeave}
      >
        <HeroBackdropMedia reduceMotion={reduceMotion ?? false} />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 md:px-8 lg:px-10 py-24 sm:py-32">
          <div className="mx-auto w-full max-w-2xl lg:max-w-3xl flex flex-col items-center gap-4 sm:gap-5 lg:gap-6">
            <h1 className="sr-only">Build 3D Better</h1>

            <HeroHeadline3D rotateX={headlineRotateX} rotateY={headlineRotateY} reduce={reduceMotion ?? false}>
              <motion.svg
                viewBox="0 0 1706 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full max-w-2xl lg:max-w-3xl h-[clamp(38px,7vw,58px)] lg:h-[clamp(46px,5.5vw,84px)] shrink-0 drop-shadow-[0_12px_28px_rgba(14,165,233,0.08),0_8px_18px_rgba(15,23,42,0.05)]"
                aria-hidden
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={reduceMotion ? false : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <defs>
                  <linearGradient id="hero-headline-gradient" x1="-12.375" y1="102.3" x2="1707.62" y2="102.3" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0a0a0a" />
                    <stop offset="1" stopColor="#3a4556" />
                  </linearGradient>
                </defs>
                <path
                  d="M4.91738e-07 195.8V3.29979H78.925C92.3083 3.29979 103.583 5.40813 112.75 9.62479C121.917 13.8415 128.792 19.7081 133.375 27.2248C138.142 34.5581 140.525 43.0831 140.525 52.7998C140.525 62.5165 138.417 70.6748 134.2 77.2748C129.983 83.8748 124.392 89.0081 117.425 92.6748C110.642 96.1581 103.217 98.1748 95.15 98.7248L99.275 95.6998C108.075 96.0665 115.867 98.4498 122.65 102.85C129.617 107.066 135.025 112.75 138.875 119.9C142.908 127.05 144.925 134.841 144.925 143.275C144.925 153.541 142.45 162.616 137.5 170.5C132.733 178.383 125.583 184.616 116.05 189.2C106.7 193.6 95.2417 195.8 81.675 195.8H4.91738e-07ZM37.125 165.55H75.625C85.7083 165.55 93.5 163.258 99 158.675C104.5 154.091 107.25 147.491 107.25 138.875C107.25 130.258 104.408 123.566 98.725 118.8C93.0417 113.85 85.1583 111.375 75.075 111.375H37.125V165.55ZM37.125 83.5998H72.875C82.5917 83.5998 90.0167 81.3998 95.15 76.9998C100.283 72.5998 102.85 66.3665 102.85 58.2998C102.85 50.4165 100.283 44.2748 95.15 39.8748C90.0167 35.2915 82.5 32.9998 72.6 32.9998H37.125V83.5998ZM207.505 199.1C196.321 199.1 186.788 196.716 178.905 191.95C171.021 187.183 164.971 180.125 160.755 170.775C156.538 161.241 154.43 149.6 154.43 135.85V59.3998H191.28V132.55C191.28 143.916 193.571 152.625 198.155 158.675C202.921 164.725 210.255 167.75 220.155 167.75C226.571 167.75 232.163 166.283 236.93 163.35C241.88 160.233 245.73 155.833 248.48 150.15C251.23 144.466 252.605 137.683 252.605 129.8V59.3998H289.73V195.8H258.105L254.805 174.075H253.705C249.488 181.775 243.53 187.916 235.83 192.5C228.313 196.9 218.871 199.1 207.505 199.1ZM307.985 195.8V59.3998H345.11V195.8H307.985ZM326.685 42.0748C319.902 42.0748 314.31 40.1498 309.91 36.2998C305.693 32.2665 303.585 27.2248 303.585 21.1748C303.585 15.1248 305.693 10.0831 309.91 6.04979C314.31 2.01646 319.902 -0.000198722 326.685 -0.000198722C333.468 -0.000198722 338.968 2.01646 343.185 6.04979C347.402 10.0831 349.51 15.1248 349.51 21.1748C349.51 27.0415 347.402 31.9915 343.185 36.0248C338.968 40.0581 333.468 42.0748 326.685 42.0748ZM364.654 195.8V3.29979H401.779V195.8H364.654ZM476.472 199.1C463.639 199.1 452.455 196.075 442.922 190.025C433.389 183.791 425.964 175.266 420.647 164.45C415.33 153.633 412.672 141.35 412.672 127.6C412.672 113.85 415.33 101.566 420.647 90.7498C425.964 79.9331 433.48 71.4998 443.197 65.4498C452.914 59.2165 464.464 56.0998 477.847 56.0998C488.48 56.0998 497.647 58.2081 505.347 62.4248C513.23 66.4581 519.464 71.3165 524.047 76.9998V3.29979H561.172V195.8H529.822L527.897 171.875H526.797C523.314 177.558 519.097 182.416 514.147 186.45C509.197 190.483 503.605 193.6 497.372 195.8C491.139 198 484.172 199.1 476.472 199.1ZM487.472 168.575C494.989 168.575 501.497 166.833 506.997 163.35C512.68 159.866 516.989 155.1 519.922 149.05C523.039 142.816 524.597 135.575 524.597 127.325C524.597 119.258 523.039 112.2 519.922 106.15C516.989 99.9165 512.68 95.0581 506.997 91.5748C501.314 88.0915 494.714 86.3498 487.197 86.3498C479.864 86.3498 473.355 88.0915 467.672 91.5748C462.172 95.0581 457.864 99.9165 454.747 106.15C451.814 112.2 450.347 119.258 450.347 127.325C450.347 135.575 451.814 142.816 454.747 149.05C457.864 155.1 462.172 159.866 467.672 163.35C473.355 166.833 479.955 168.575 487.472 168.575ZM691.122 199.1C678.656 199.1 667.197 196.808 656.747 192.225C646.297 187.641 637.956 180.675 631.722 171.325C625.489 161.975 622.189 150.15 621.822 135.85H658.122C658.306 141.9 659.681 147.4 662.247 152.35C664.997 157.116 668.756 160.966 673.522 163.9C678.472 166.65 684.339 168.025 691.122 168.025C697.539 168.025 703.039 166.741 707.622 164.175C712.206 161.608 715.689 158.216 718.072 154C720.456 149.783 721.647 144.925 721.647 139.425C721.647 132.825 720.089 127.416 716.972 123.2C713.856 118.8 709.456 115.5 703.772 113.3C698.272 110.916 691.856 109.725 684.522 109.725H670.222V79.1998H684.522C693.506 79.1998 701.022 77.1831 707.072 73.1498C713.122 68.9331 716.147 62.6081 716.147 54.1748C716.147 47.3915 713.856 41.8915 709.272 37.6748C704.872 33.4581 698.731 31.3498 690.847 31.3498C682.231 31.3498 675.447 33.9165 670.497 39.0498C665.731 44.1831 663.072 50.5081 662.522 58.0248H626.497C627.047 45.9248 630.072 35.5665 635.572 26.9498C641.072 18.1498 648.497 11.4581 657.847 6.87479C667.381 2.29147 678.472 -0.000198722 691.122 -0.000198722C704.322 -0.000198722 715.506 2.38313 724.672 7.14979C733.839 11.7331 740.806 17.9665 745.572 25.8498C750.339 33.5498 752.722 42.0748 752.722 51.4248C752.722 58.7581 751.256 65.3581 748.322 71.2248C745.572 76.9081 741.814 81.6748 737.047 85.5248C732.464 89.3748 727.331 92.2165 721.647 94.0498C728.797 95.3331 735.031 98.0831 740.347 102.3C745.847 106.516 750.156 111.925 753.272 118.525C756.389 124.941 757.947 132.366 757.947 140.8C757.947 151.25 755.381 160.966 750.247 169.95C745.114 178.75 737.597 185.808 727.697 191.125C717.797 196.441 705.606 199.1 691.122 199.1ZM771.815 195.8V3.29979H838.64C861.007 3.29979 879.524 7.33313 894.19 15.3998C908.857 23.2831 919.674 34.4665 926.64 48.9498C933.79 63.2498 937.365 80.1165 937.365 99.5498C937.365 118.983 933.79 135.941 926.64 150.425C919.674 164.725 908.857 175.908 894.19 183.975C879.707 191.858 861.19 195.8 838.64 195.8H771.815ZM808.94 163.9H836.715C852.482 163.9 864.949 161.333 874.115 156.2C883.282 151.066 889.79 143.733 893.64 134.2C897.49 124.483 899.415 112.933 899.415 99.5498C899.415 85.9831 897.49 74.4331 893.64 64.8998C889.79 55.1831 883.282 47.7581 874.115 42.6248C864.949 37.4915 852.482 34.9248 836.715 34.9248H808.94V163.9ZM997.82 195.8V3.29979H1076.75C1090.13 3.29979 1101.4 5.40813 1110.57 9.62479C1119.74 13.8415 1126.61 19.7081 1131.2 27.2248C1135.96 34.5581 1138.35 43.0831 1138.35 52.7998C1138.35 62.5165 1136.24 70.6748 1132.02 77.2748C1127.8 83.8748 1122.21 89.0081 1115.25 92.6748C1108.46 96.1581 1101.04 98.1748 1092.97 98.7248L1097.1 95.6998C1105.9 96.0665 1113.69 98.4498 1120.47 102.85C1127.44 107.066 1132.85 112.75 1136.7 119.9C1140.73 127.05 1142.75 134.841 1142.75 143.275C1142.75 153.541 1140.27 162.616 1135.32 170.5C1130.55 178.383 1123.4 184.616 1113.87 189.2C1104.52 193.6 1093.06 195.8 1079.5 195.8H997.82ZM1034.95 165.55H1073.45C1083.53 165.55 1091.32 163.258 1096.82 158.675C1102.32 154.091 1105.07 147.491 1105.07 138.875C1105.07 130.258 1102.23 123.566 1096.55 118.8C1090.86 113.85 1082.98 111.375 1072.9 111.375H1034.95V165.55ZM1034.95 83.5998H1070.7C1080.41 83.5998 1087.84 81.3998 1092.97 76.9998C1098.1 72.5998 1100.67 66.3665 1100.67 58.2998C1100.67 50.4165 1098.1 44.2748 1092.97 39.8748C1087.84 35.2915 1080.32 32.9998 1070.42 32.9998H1034.95V83.5998ZM1220.73 199.1C1206.79 199.1 1194.42 196.166 1183.6 190.3C1172.97 184.433 1164.63 176.183 1158.58 165.55C1152.53 154.916 1149.5 142.725 1149.5 128.975C1149.5 114.675 1152.43 102.116 1158.3 91.2998C1164.35 80.2998 1172.69 71.6831 1183.33 65.4498C1194.14 59.2165 1206.61 56.0998 1220.73 56.0998C1234.48 56.0998 1246.48 59.0331 1256.75 64.8998C1267.02 70.7665 1275.08 78.8331 1280.95 89.0998C1286.82 99.1831 1289.75 110.641 1289.75 123.475C1289.75 125.308 1289.66 127.416 1289.48 129.8C1289.48 132 1289.38 134.291 1289.2 136.675H1175.9V113.85H1252.08C1251.53 105.233 1248.32 98.3581 1242.45 93.2248C1236.77 88.0915 1229.62 85.5248 1221 85.5248C1214.58 85.5248 1208.72 86.9915 1203.4 89.9248C1198.08 92.6748 1193.87 96.9831 1190.75 102.85C1187.63 108.533 1186.08 115.775 1186.08 124.575V132.55C1186.08 140.066 1187.54 146.575 1190.48 152.075C1193.41 157.391 1197.44 161.516 1202.58 164.45C1207.89 167.383 1213.85 168.85 1220.45 168.85C1227.23 168.85 1232.92 167.383 1237.5 164.45C1242.08 161.333 1245.57 157.391 1247.95 152.625H1285.63C1283.06 161.241 1278.75 169.125 1272.7 176.275C1266.65 183.241 1259.23 188.833 1250.43 193.05C1241.63 197.083 1231.73 199.1 1220.73 199.1ZM1358.18 195.8C1348.47 195.8 1339.94 194.333 1332.61 191.4C1325.46 188.283 1319.87 183.241 1315.83 176.275C1311.8 169.125 1309.78 159.408 1309.78 147.125V89.0998H1286.41V59.3998H1309.78L1313.91 22.2748H1346.91V59.3998H1383.21V89.0998H1346.91V147.675C1346.91 154.275 1348.28 158.858 1351.03 161.425C1353.78 163.808 1358.46 165 1365.06 165H1382.38V195.8H1358.18ZM1449.57 195.8C1439.85 195.8 1431.33 194.333 1423.99 191.4C1416.84 188.283 1411.25 183.241 1407.22 176.275C1403.18 169.125 1401.17 159.408 1401.17 147.125V89.0998H1377.79V59.3998H1401.17L1405.29 22.2748H1438.29V59.3998H1474.59V89.0998H1438.29V147.675C1438.29 154.275 1439.67 158.858 1442.42 161.425C1445.17 163.808 1449.84 165 1456.44 165H1473.77V195.8H1449.57ZM1542.41 199.1C1528.48 199.1 1516.1 196.166 1505.29 190.3C1494.65 184.433 1486.31 176.183 1480.26 165.55C1474.21 154.916 1471.19 142.725 1471.19 128.975C1471.19 114.675 1474.12 102.116 1479.99 91.2998C1486.04 80.2998 1494.38 71.6831 1505.01 65.4498C1515.83 59.2165 1528.29 56.0998 1542.41 56.0998C1556.16 56.0998 1568.17 59.0331 1578.44 64.8998C1588.7 70.7665 1596.77 78.8331 1602.64 89.0998C1608.5 99.1831 1611.44 110.641 1611.44 123.475C1611.44 125.308 1611.34 127.416 1611.16 129.8C1611.16 132 1611.07 134.291 1610.89 136.675H1497.59V113.85H1573.76C1573.21 105.233 1570 98.3581 1564.14 93.2248C1558.45 88.0915 1551.3 85.5248 1542.69 85.5248C1536.27 85.5248 1530.4 86.9915 1525.09 89.9248C1519.77 92.6748 1515.55 96.9831 1512.44 102.85C1509.32 108.533 1507.76 115.775 1507.76 124.575V132.55C1507.76 140.066 1509.23 146.575 1512.16 152.075C1515.09 157.391 1519.13 161.516 1524.26 164.45C1529.58 167.383 1535.54 168.85 1542.14 168.85C1548.92 168.85 1554.6 167.383 1559.19 164.45C1563.77 161.333 1567.25 157.391 1569.64 152.625H1607.31C1604.74 161.241 1600.44 169.125 1594.39 176.275C1588.34 183.241 1580.91 188.833 1572.11 193.05C1563.31 197.083 1553.41 199.1 1542.41 199.1ZM1619.6 195.8V59.3998H1651.22L1654.52 89.3748H1655.62C1659.66 79.6581 1664.06 72.5081 1668.82 67.9248C1673.59 63.1581 1679 60.0415 1685.05 58.5748C1691.28 56.9248 1698.25 56.0998 1705.95 56.0998V95.4248H1695.77C1689.54 95.4248 1683.95 96.1581 1679 97.6248C1674.23 98.9081 1670.2 101.108 1666.9 104.225C1663.6 107.158 1661.03 111.1 1659.2 116.05C1657.55 121 1656.72 126.958 1656.72 133.925V195.8H1619.6Z"
                  fill="url(#hero-headline-gradient)"
                />
              </motion.svg>

              <motion.p
                className="text-neutral-600 text-center max-w-md sm:max-w-lg font-medium tracking-tight text-xs sm:text-sm md:text-base lg:text-lg leading-snug px-1"
                style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={reduceMotion ? false : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                AI-powered 3D generation for creators, studios, and platforms.
              </motion.p>
            </HeroHeadline3D>

            {/* Segmented control: Create | Book Demo — liquid glass */}
            <motion.div
              className="flex p-1 rounded-full border border-white/35 bg-white/15 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.35)] [transform-style:preserve-3d]"
              initial={reduceMotion ? false : { opacity: 0, y: 12, rotateX: 8 }}
              animate={reduceMotion ? false : { opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "center top" }}
            >
              <button
                type="button"
                onClick={() => setMode("create")}
                className="relative px-5 sm:px-6 py-2.5 rounded-full text-sm font-medium text-neutral-800 transition-colors duration-200 hover:text-neutral-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {mode === "create" && (
                  <motion.div
                    layoutId="hero-segment"
                    className="absolute inset-0 rounded-full border border-white/45 bg-white/35 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">Create</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("demo")}
                className="relative px-5 sm:px-6 py-2.5 rounded-full text-sm font-medium text-neutral-800 transition-colors duration-200 hover:text-neutral-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {mode === "demo" && (
                  <motion.div
                    layoutId="hero-segment"
                    className="absolute inset-0 rounded-full border border-white/45 bg-white/35 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">Book Demo</span>
              </button>
            </motion.div>

            <div className="w-full flex flex-col items-center gap-4">
              <AnimatePresence mode="wait">
                {mode === "create" ? (
                  <motion.div
                    key="create"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="w-full flex justify-center"
                  >
                    <PromptBox
                      value={prompt}
                      onChange={setPrompt}
                      onSubmit={handleSubmit}
                      placeholder={ROTATING_PROMPTS[placeholderIndex]}
                      variant="hero"
                      disabled={false}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="demo"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-[min(90vw,720px)]"
                  >
                    <div className="rounded-2xl pt-5 pb-3 px-6 sm:pt-6 sm:pb-4 sm:px-8 min-h-[72px] border border-white/35 bg-white/15 backdrop-blur-2xl shadow-[0_12px_48px_-16px_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.35)] flex flex-col sm:flex-row gap-3 items-center">
                      <input
                        type="email"
                        value={demoEmail}
                        onChange={(e) => setDemoEmail(e.target.value)}
                        placeholder="Enter your business email"
                        className="flex-1 min-w-0 w-full h-12 rounded-xl border border-white/30 bg-white/20 backdrop-blur-md px-4 py-3 text-[15px] sm:text-[17px] font-normal text-neutral-900 placeholder:text-neutral-600 outline-none focus:border-white/50 focus:bg-white/30 transition-[border-color,background-color] duration-200 font-dm-sans"
                        aria-label="Business email"
                      />
                      <motion.button
                        type="button"
                        onClick={handleDemoSubmit}
                        disabled={!canSubmitDemo}
                        whileHover={canSubmitDemo ? { scale: 1.02 } : {}}
                        whileTap={canSubmitDemo ? { scale: 0.98 } : {}}
                        className="shrink-0 h-12 px-6 rounded-xl text-sm font-semibold font-dm-sans transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950 border border-neutral-900"
                      >
                        Request Demo
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <MissionSection />

      <div id="solutions">
        <Suspense fallback={<div className="min-h-[320px]" aria-hidden />}>
          <IndustrySection />
        </Suspense>
      </div>

      <Suspense fallback={<div className="min-h-[280px]" aria-hidden />}>
        <HowItWorks />
      </Suspense>

      <Showcase />

      <Suspense fallback={<div className="min-h-[200px]" aria-hidden />}>
        <AppShowcase />
      </Suspense>

      <div id="features">
        <Suspense fallback={<div className="min-h-[320px]" aria-hidden />}>
          <FeaturesSection />
        </Suspense>
      </div>

      <Suspense fallback={<div className="min-h-[200px]" aria-hidden />}>
        <WhyHydrilla />
      </Suspense>

      <div id="pricing">
        <Suspense fallback={<div className="min-h-[400px]" aria-hidden />}>
          <PricingSection />
        </Suspense>
      </div>

      <Suspense fallback={<div className="min-h-[300px]" aria-hidden />}>
        <FAQSection />
      </Suspense>

      {/* CTA section — light theme, below FAQ */}
      <section
        className="relative w-full bg-[#faf9f7] py-16 sm:py-20 md:py-24"
        style={{ boxSizing: "border-box", WebkitFontSmoothing: "antialiased" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] tracking-tight leading-tight mb-6"
            style={{ fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif" }}
          >
            Ready to raise your 3D game?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-base sm:text-lg text-neutral-600 mb-10 max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
          >
            Start creating production-ready 3D assets, or book a demo with our team.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5"
          >
            <SignUpButton mode="modal" forceRedirectUrl="/app/studio">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#111] text-white text-base font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
              >
                Start creating
              </button>
            </SignUpButton>
            <a
              href="https://cal.com/hydrilla"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-[#111] bg-transparent text-[#111] text-base font-semibold hover:bg-[#111] hover:text-white transition-colors"
              style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
            >
              Book Demo
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}

/** Mission: directly below hero. Text fills from grey to black on scroll. */
function MissionSection() {
  const ref = useRef<HTMLElement>(null);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const winH = window.innerHeight;
      const fullH = rect.height;
      const visible = Math.min(rect.bottom, winH) - Math.max(rect.top, 0);
      const progress = fullH > 0 ? Math.min(1, Math.max(0, visible / fullH)) : 0;
      setFill(progress);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const grey = 115;
  const black = 17;
  const r = Math.round(black + (grey - black) * (1 - fill));
  const color = `rgb(${r},${r},${r})`;

  return (
    <section
      ref={ref}
      className="relative w-full bg-gradient-to-b from-white to-neutral-100 py-20 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8"
    >
      <div className="max-w-6xl mx-auto">
        <p
          className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight transition-colors duration-150"
          style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif", color }}
        >
          Our mission is to build intelligent workflows that accelerate animation and 3D production.
        </p>
      </div>
    </section>
  );
}
