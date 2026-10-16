import dynamic from "next/dynamic";
import Hero from "../components/sections/Hero";
import HomeBelowFold from "../components/sections/HomeBelowFold";
import { JsonLd } from "@/components/seo/JsonLd";
import { HOME_TITLE, createPageMetadata, getHomepageJsonLd } from "@/lib/seo";
const Footer = dynamic(() => import("../components/layout/Footer"), {
  loading: () => <div className="min-h-[280px] w-full bg-white" aria-hidden />,
});

export const metadata = createPageMetadata({
  title: HOME_TITLE,
  path: "/",
  absoluteTitle: true,
});

/** CDN can serve a fresh prerender for an hour — cuts cold TTFB on `/`. */
export const revalidate = 3600;

export default function Home() {
  return (
    <>
      <JsonLd data={getHomepageJsonLd()} />
      <Hero />
      {/* Text sections SSR for crawlers; Showcase / AppShowcase stay client-only. */}
      <HomeBelowFold />
      <Footer />
    </>
  );
}
