import dynamic from "next/dynamic";
import Hero from "../components/sections/Hero";
import HomeBelowFold from "../components/sections/HomeBelowFold";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeAuthRedirect } from "@/components/HomeAuthRedirect";
import { createPageMetadata, getHomepageJsonLd } from "@/lib/seo";
import { HERO_POSTER_PRELOAD_URL } from "@/lib/cloudinary";

const Footer = dynamic(() => import("../components/layout/Footer"), {
  loading: () => <div className="min-h-[280px] w-full bg-white" aria-hidden />,
});

export const metadata = createPageMetadata({
  title: "Hydrilla AI | Production-Ready 3D Assets, Generated Fast",
  path: "/",
  absoluteTitle: true,
});

/** CDN can serve a fresh prerender for an hour — cuts cold TTFB on `/`. */
export const revalidate = 3600;

export default function Home() {
  return (
    <>
      {/* Homepage-only LCP preload (root layout keeps dns-prefetch/preconnect). */}
      <link rel="preload" as="image" href={HERO_POSTER_PRELOAD_URL} fetchPriority="high" />
      <JsonLd data={getHomepageJsonLd()} />
      <HomeAuthRedirect />
      <Hero />
      {/* Client island: image-heavy sections use dynamic(ssr:false) internally */}
      <HomeBelowFold />
      <Footer />
    </>
  );
}
