import Footer from "@/components/layout/Footer";
import PricingSection from "@/components/sections/PricingSection";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Flexible plans for indie creators, studios, and enterprise teams. Start free and scale with production-ready AI 3D generation.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <div className="pt-24 md:pt-28">
        <PricingSection />
      </div>
      <Footer />
    </>
  );
}
