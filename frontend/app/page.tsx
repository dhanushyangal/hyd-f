import dynamic from "next/dynamic";
import Hero from "../components/sections/Hero";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeAuthRedirect } from "@/components/HomeAuthRedirect";
import { createPageMetadata, getHomepageJsonLd } from "@/lib/seo";

const Footer = dynamic(() => import("../components/layout/Footer"), {
  ssr: true,
  loading: () => <div className="min-h-[280px] w-full bg-white" aria-hidden />,
});

export const metadata = createPageMetadata({
  title: "Hydrilla AI | Production-Ready 3D Assets, Generated Fast",
  path: "/",
  absoluteTitle: true,
});

export default function Home() {
  return (
    <>
      <JsonLd data={getHomepageJsonLd()} />
      <HomeAuthRedirect />
      <Hero />
      {/* Site footer — deferred JS; poster-only until near viewport */}
      <Footer />
    </>
  );
}
