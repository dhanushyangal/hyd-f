"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion } from "motion/react";
import { savePendingHeroPrompt } from "@/lib/pendingHeroPrompt";
import { PromptBox } from "../PromptBox";
import { HeroStage } from "./HeroStage";

const ROTATING_PROMPTS = [
  "Make a sword with fire",
  "A vintage camera on a wooden table",
  "A cute robot character for a game",
];

const ROTATE_INTERVAL_MS = 3800;

const FONT_DISPLAY =
  '"Iowan Old Style", "Palatino Linotype", Palatino, "Times New Roman", Times, serif';
const FONT_BODY =
  '"Helvetica Now Text", var(--font-dm-sans), Arial, Helvetica, sans-serif';

export default function Hero() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % ROTATING_PROMPTS.length);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const handleSubmit = () => {
    const value = prompt.trim();
    if (!value || !isLoaded) return;

    savePendingHeroPrompt(value);

    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=" + encodeURIComponent("/app/studio"));
      return;
    }

    router.push("/app/studio");
  };

  const rise = reduceMotion
    ? { duration: 0 }
    : { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section className="relative w-full overflow-x-hidden bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(215,228,248,0.9),transparent_58%)]" />
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,rgba(0,12,31,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,12,31,0.045)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_18%,transparent_72%)]" />
        <motion.div
          className="absolute top-16 left-1/2 h-[420px] w-[min(880px,92vw)] -translate-x-1/2 rounded-full bg-[#d5e4f8]/70 blur-3xl"
          animate={reduceMotion ? undefined : { y: [0, 22, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[42%] -left-24 h-72 w-72 rounded-full bg-[#e4eefb] blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 28, 0], y: [0, -16, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[30%] -right-20 h-80 w-80 rounded-full bg-[#c9daf3]/55 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, -24, 0], y: [0, 18, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative mx-auto flex w-full flex-col items-center gap-6 pt-24 pb-4 sm:gap-7 sm:pt-28 sm:pb-6 md:gap-9 md:pt-32 md:pb-14 lg:pt-36 xl:pb-16">
        <motion.div
          className="flex w-full flex-col items-center gap-5 px-4 text-center sm:gap-6 sm:px-6 md:px-8 lg:px-10"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={rise}
        >
          <h1
            className="text-balance font-medium text-[#000c1f]"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(3.4rem, calc(2.15rem + 5vw), 6.5rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.03em",
            }}
          >
            Create 3D Assets
          </h1>

          <p
            className="max-w-xl text-pretty text-lg leading-snug tracking-[-0.015em] text-[#000c1f]/68 sm:text-xl md:text-[1.65rem]"
            style={{ fontFamily: FONT_BODY }}
          >
            AI-powered 3D generation for creators, studios, and platforms.
          </p>
        </motion.div>

        <motion.div
          className="w-full px-0 min-[690px]:px-[clamp(0px,calc((100vw-690px)*0.32),1.5rem)] md:px-6 lg:px-8 xl:px-10"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...rise, delay: reduceMotion ? 0 : 0.08 }}
        >
          <div className="mx-auto w-full md:max-w-3xl lg:max-w-4xl xl:max-w-4xl">
            <HeroStage reduceMotion={reduceMotion}>
              <PromptBox
                value={prompt}
                onChange={setPrompt}
                onSubmit={handleSubmit}
                placeholder={`Try ‘${ROTATING_PROMPTS[placeholderIndex]}’`}
                variant="hero"
                disabled={false}
              />
            </HeroStage>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
