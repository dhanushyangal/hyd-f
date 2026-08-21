import FeaturesSection from "@/components/sections/FeaturesSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { createPageMetadata, FEATURES_META, getWebPageJsonLd } from "@/lib/seo";
import { faqByQuestions } from "@/lib/faq";

export const metadata = createPageMetadata({
  title: "Features",
  description: FEATURES_META,
  path: "/features",
  keywords: [
    "Hydrilla features",
    "text to 3D",
    "image to 3D",
    "PBR 3D export",
    "BlueFox 1",
  ],
});

const FEATURE_FAQ = faqByQuestions([
  "What formats does Hydrilla export?",
  "Which engines and tools?",
  "What inputs does Hydrilla support?",
]);

export default function FeaturesPage() {
  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Features | Hydrilla",
          description: FEATURES_META,
          path: "/features",
        })}
      />
      <MarketingPage
        eyebrow="Product"
        title="From first prompt to production."
        description="Text-to-3D and image-to-3D, segmented meshes, PBR materials, in-browser preview, and GLB, FBX, OBJ, and USDZ exports for Unity, Unreal, and Blender."
        related={[
          { label: "BlueFox 3D", href: "/bluefox3d", hint: "What the model produces" },
          { label: "Docs", href: "/docs", hint: "First prompt to export" },
          { label: "Use cases", href: "/usecase", hint: "Games, film, XR, product" },
        ]}
      >
        <FeaturesSection hideHeader />
        <section className="mx-auto max-w-[42rem] px-5 pb-4 sm:px-6">
          <h2
            className="text-[22px] font-semibold tracking-[-0.03em] text-neutral-950"
            style={{
              fontFamily:
                "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            Questions this page answers
          </h2>
          <dl className="mt-8 space-y-8">
            {FEATURE_FAQ.map((item) => (
              <div key={item.question}>
                <dt className="text-[16px] font-semibold text-neutral-950">
                  {item.question}
                </dt>
                <dd className="mt-2 text-[16px] leading-7 text-neutral-700">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </MarketingPage>
    </>
  );
}
