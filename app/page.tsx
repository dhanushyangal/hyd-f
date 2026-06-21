import Hero from "../components/sections/Hero";
import Footer from "../components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeAuthRedirect } from "@/components/HomeAuthRedirect";
import { createPageMetadata, getHomepageJsonLd } from "@/lib/seo";

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
      <Footer />
    </>
  );
}
