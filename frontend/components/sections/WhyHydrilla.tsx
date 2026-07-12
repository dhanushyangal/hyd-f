"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { BlurReveal } from "@/components/ui/BlurReveal";
import { WHY_HYDRILLA_MEDIA } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

const FONT = "var(--font-dm-sans), 'DM Sans', sans-serif";
const FONT_DISPLAY =
  "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif";

const RADIUS = "rounded-[28px] sm:rounded-[32px]";
const GAP = "gap-3 sm:gap-3.5 lg:gap-4";

const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const TITLE_SHADOW =
  "0 1px 1px rgba(0,0,0,0.55), 0 2px 12px rgba(0,0,0,0.4)";

function useInViewPlay(enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "120px 0px", threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return { ref, active };
}

function MediaVideo({
  src,
  poster,
  className,
  priority = false,
}: {
  src: string;
  poster: string;
  className?: string;
  priority?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { ref: wrapRef, active } = useInViewPlay(!reduceMotion);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;

    if (active) {
      video.muted = true;
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [active, reduceMotion]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <Image
        src={poster}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 40vw"
        className="object-cover"
        unoptimized
      />
      {!reduceMotion ? (
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            playing ? "opacity-100" : "opacity-0",
            className
          )}
          src={active ? src : undefined}
          poster={poster}
          muted
          loop
          playsInline
          preload={priority ? "metadata" : "none"}
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      ) : null}
    </div>
  );
}

function BentoShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "relative isolate overflow-hidden bg-neutral-950",
        RADIUS,
        className
      )}
    >
      {children}
    </article>
  );
}

function BigTitle({
  children,
  tone = "light",
  size = "md",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "w-full text-center font-bold leading-[1.05] tracking-[-0.04em] text-balance antialiased",
        size === "sm" && "text-[clamp(1.15rem,5.2vw,1.65rem)] md:text-[clamp(1.35rem,2.5vw,1.85rem)]",
        size === "md" && "text-[clamp(1.3rem,5.8vw,1.9rem)] md:text-[clamp(1.6rem,3vw,2.25rem)]",
        size === "lg" && "text-[clamp(1.55rem,6.5vw,2.35rem)] md:text-[clamp(1.95rem,3.6vw,2.85rem)]",
        size === "hero" && "text-[clamp(2.35rem,11vw,4.75rem)]",
        tone === "light" ? "text-white" : "text-[#111]",
        className
      )}
      style={{
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        textShadow: tone === "light" ? TITLE_SHADOW : undefined,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {children}
    </h3>
  );
}

function ImageCard({
  title,
  src,
  alt,
  className,
  size = "md",
}: {
  title: string;
  src: string;
  alt: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
}) {
  return (
    <BentoShell className={cn("h-full w-full", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
        className="object-cover"
        unoptimized
      />
      <div className="relative z-10 flex h-full w-full items-center justify-center px-3.5 py-4 sm:px-6 sm:py-6">
        <BigTitle size={size}>{title}</BigTitle>
      </div>
    </BentoShell>
  );
}

function VideoCard({
  title,
  video,
  poster,
  className,
  size = "md",
  priority = false,
}: {
  title: string;
  video: string;
  poster: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
  priority?: boolean;
}) {
  return (
    <BentoShell className={cn("h-full w-full", className)}>
      <MediaVideo src={video} poster={poster} priority={priority} />
      <div className="relative z-10 flex h-full w-full items-center justify-center px-3.5 py-4 sm:px-6 sm:py-6">
        <BigTitle size={size}>{title}</BigTitle>
      </div>
    </BentoShell>
  );
}

function BlueFoxHero({ className }: { className?: string }) {
  return (
    <BentoShell className={cn("h-full w-full min-h-[320px]", className)}>
      <MediaVideo
        src={WHY_HYDRILLA_MEDIA.bluefox.video}
        poster={WHY_HYDRILLA_MEDIA.bluefox.poster}
        priority
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(0,0,0,0.22)_100%)]"
      />
      <div className="relative z-10 flex h-full min-h-[inherit] w-full flex-col items-center px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex w-full flex-1 items-center justify-center">
          <BigTitle size="hero" className="max-w-[10ch] text-white">
            BlueFox 1
          </BigTitle>
        </div>
        <p
          className="w-full shrink-0 pt-3 text-center text-[13px] font-semibold tracking-[-0.01em] text-white sm:text-sm"
          style={{
            fontFamily: FONT,
            textShadow: TITLE_SHADOW,
          }}
        >
          Generate 3D with BlueFox
        </p>
      </div>
    </BentoShell>
  );
}

export default function WhyHydrilla() {
  return (
    <section
      id="why-hydrilla"
      className="relative w-full overflow-hidden bg-white px-3 py-16 sm:px-4 sm:py-20 md:px-5 lg:px-6 lg:py-24 xl:px-8"
      style={{ fontFamily: FONT }}
      aria-labelledby="why-hydrilla-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-white"
      />

      <div className="relative w-full">
        <header className="mb-8 max-w-2xl sm:mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Why Hydrilla
          </p>
          <BlurReveal
            as="h2"
            id="why-hydrilla-heading"
            className="mt-3 text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.035em] text-[#111]"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            Production-ready assets.
          </BlurReveal>
          <p className="sr-only">
            Hydrilla generates production-ready 3D assets like BlueFox 1 with
            clean topology, PBR materials, multi-format export, and real-time
            preview so teams ship without cleanup.
          </p>
        </header>

        {/* Mobile — Krea-style: equal pairs, BlueFox centered in the stack */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
          className={cn("grid w-full grid-cols-2 md:hidden", GAP)}
        >
          <motion.div variants={reveal} className="aspect-square">
            <VideoCard
              title="10×"
              video={WHY_HYDRILLA_MEDIA.tenX.video}
              poster={WHY_HYDRILLA_MEDIA.tenX.poster}
              size="lg"
            />
          </motion.div>

          <motion.div variants={reveal} className="aspect-square">
            <VideoCard
              title="Fast"
              video={WHY_HYDRILLA_MEDIA.fast.video}
              poster={WHY_HYDRILLA_MEDIA.fast.poster}
              size="lg"
            />
          </motion.div>

          <motion.div variants={reveal} className="col-span-2">
            <VideoCard
              title="Clean Mesh"
              video={WHY_HYDRILLA_MEDIA.disc.video}
              poster={WHY_HYDRILLA_MEDIA.disc.poster}
              className="min-h-[168px]"
              size="lg"
            />
          </motion.div>

          <motion.div variants={reveal} className="col-span-2">
            <BlueFoxHero className="aspect-[5/6] min-h-[340px] w-full" />
          </motion.div>

          <motion.div variants={reveal} className="aspect-square">
            <VideoCard
              title="3D Models"
              video={WHY_HYDRILLA_MEDIA.model.video}
              poster={WHY_HYDRILLA_MEDIA.model.poster}
              size="md"
            />
          </motion.div>

          <motion.div variants={reveal} className="aspect-square">
            <VideoCard
              title="Blender"
              video={WHY_HYDRILLA_MEDIA.blender.video}
              poster={WHY_HYDRILLA_MEDIA.blender.poster}
              size="md"
            />
          </motion.div>

          <motion.div variants={reveal} className="col-span-2">
            <VideoCard
              title="Text-to-3D"
              video={WHY_HYDRILLA_MEDIA.threeD.video}
              poster={WHY_HYDRILLA_MEDIA.threeD.poster}
              className="min-h-[168px]"
              size="lg"
            />
          </motion.div>

          <motion.div variants={reveal} className="aspect-square">
            <VideoCard
              title="3D Assets"
              video={WHY_HYDRILLA_MEDIA.assets.video}
              poster={WHY_HYDRILLA_MEDIA.assets.poster}
              size="md"
            />
          </motion.div>

          <motion.div variants={reveal} className="aspect-square">
            <ImageCard
              title="Studio"
              src={WHY_HYDRILLA_MEDIA.cta}
              alt="Hydrilla studio workflow"
              size="md"
            />
          </motion.div>

          <motion.div variants={reveal} className="col-span-2">
            <VideoCard
              title="Multi Export"
              video={WHY_HYDRILLA_MEDIA.multi.video}
              poster={WHY_HYDRILLA_MEDIA.multi.poster}
              className="min-h-[168px]"
              size="lg"
            />
          </motion.div>
        </motion.div>

        {/* Desktop */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04 } },
          }}
          className={cn(
            "hidden w-full md:grid md:grid-cols-12 md:auto-rows-[minmax(180px,auto)] lg:auto-rows-[minmax(200px,auto)] xl:auto-rows-[minmax(220px,auto)]",
            GAP
          )}
        >
          <motion.div variants={reveal} className="md:col-span-5">
            <VideoCard
              title="Fast"
              video={WHY_HYDRILLA_MEDIA.fast.video}
              poster={WHY_HYDRILLA_MEDIA.fast.poster}
              className="h-full min-h-[170px]"
              size="lg"
            />
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-2">
            <VideoCard
              title="10×"
              video={WHY_HYDRILLA_MEDIA.tenX.video}
              poster={WHY_HYDRILLA_MEDIA.tenX.poster}
              className="h-full min-h-[170px]"
              size="hero"
            />
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-5">
            <VideoCard
              title="Clean Mesh"
              video={WHY_HYDRILLA_MEDIA.disc.video}
              poster={WHY_HYDRILLA_MEDIA.disc.poster}
              className="h-full min-h-[170px]"
              size="lg"
            />
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-3 md:row-span-2">
            <div className={cn("grid h-full grid-rows-2", GAP)}>
              <VideoCard
                title="PBR Materials"
                video={WHY_HYDRILLA_MEDIA.texture.video}
                poster={WHY_HYDRILLA_MEDIA.texture.poster}
                className="min-h-[150px]"
                size="lg"
              />
              <VideoCard
                title="Quad Mesh"
                video={WHY_HYDRILLA_MEDIA.mesh.video}
                poster={WHY_HYDRILLA_MEDIA.mesh.poster}
                className="min-h-[150px]"
                size="lg"
              />
            </div>
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-6 md:row-span-2">
            <BlueFoxHero className="h-full min-h-[480px] lg:min-h-[560px] xl:min-h-[640px]" />
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-3 md:row-span-2">
            <div className={cn("grid h-full grid-rows-2", GAP)}>
              <VideoCard
                title="3D Models"
                video={WHY_HYDRILLA_MEDIA.model.video}
                poster={WHY_HYDRILLA_MEDIA.model.poster}
                className="min-h-[150px]"
                size="md"
              />
              <VideoCard
                title="Blender"
                video={WHY_HYDRILLA_MEDIA.blender.video}
                poster={WHY_HYDRILLA_MEDIA.blender.poster}
                className="min-h-[160px]"
                size="md"
              />
            </div>
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-3">
            <ImageCard
              title="PBR"
              src={WHY_HYDRILLA_MEDIA.fish}
              alt="Hydrilla PBR-ready asset"
              className="h-full min-h-[170px]"
              size="md"
            />
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-3">
            <ImageCard
              title="3D Pipeline"
              src={WHY_HYDRILLA_MEDIA.bike}
              alt="Hydrilla pipeline-ready bike asset"
              className="h-full min-h-[170px]"
              size="md"
            />
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-3">
            <VideoCard
              title="Real-Time"
              video={WHY_HYDRILLA_MEDIA.rockey.video}
              poster={WHY_HYDRILLA_MEDIA.rockey.poster}
              className="h-full min-h-[170px]"
              size="md"
            />
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-3">
            <VideoCard
              title="3D Assets"
              video={WHY_HYDRILLA_MEDIA.assets.video}
              poster={WHY_HYDRILLA_MEDIA.assets.poster}
              className="h-full min-h-[170px]"
              size="md"
            />
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-4">
            <VideoCard
              title="Text-to-3D"
              video={WHY_HYDRILLA_MEDIA.threeD.video}
              poster={WHY_HYDRILLA_MEDIA.threeD.poster}
              className="h-full min-h-[170px]"
              size="lg"
            />
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-4">
            <VideoCard
              title="Multi Export"
              video={WHY_HYDRILLA_MEDIA.multi.video}
              poster={WHY_HYDRILLA_MEDIA.multi.poster}
              className="h-full min-h-[170px]"
              size="lg"
            />
          </motion.div>

          <motion.div variants={reveal} className="md:col-span-4">
            <ImageCard
              title="Studio"
              src={WHY_HYDRILLA_MEDIA.cta}
              alt="Hydrilla studio workflow"
              className="h-full min-h-[170px]"
              size="lg"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
