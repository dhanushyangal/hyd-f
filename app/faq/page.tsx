import FAQSection from "../../components/sections/FAQSection";
import { MarketingPage } from "@/components/layout/MarketingPage";

export default function FAQPage() {
  return (
    <MarketingPage
      eyebrow="FAQ"
      title="Pricing, exports, BlueFox, pipelines"
      description="Short answers for creators and studios evaluating Hydrilla: plans, formats, engines, and who builds the model."
      formats={false}
      related={[
        { label: "Docs", href: "/docs", hint: "Getting started" },
        { label: "Pricing", href: "/pricing", hint: "Free, Creator, Studio" },
        { label: "Compare", href: "/compare", hint: "Vs Meshy, Luma, Tripo" },
      ]}
    >
      <FAQSection hideHeader />
    </MarketingPage>
  );
}
