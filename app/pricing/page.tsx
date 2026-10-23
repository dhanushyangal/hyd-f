import Footer from "@/components/layout/Footer";
import PricingSection from "@/components/sections/PricingSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getPricingJsonLd } from "@/lib/seo";
import { PRICING_META_DESCRIPTION } from "@/lib/pricing";

export const metadata = createPageMetadata({
  title: "Pricing: Free, Starter, Pro, and Hourly Plans",
  description: PRICING_META_DESCRIPTION,
  path: "/pricing",
  keywords: [
    "Hydrilla pricing",
    "AI 3D generator pricing",
    "text to 3D pricing",
    "image to 3D pricing",
  ],
});

export default function PricingPage() {
  return (
    <>
      <JsonLd data={getPricingJsonLd()} />
      <PricingSection pageHeading />
      <Footer />
    </>
  );
}
