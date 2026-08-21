import Footer from "@/components/layout/Footer";
import PricingSection from "@/components/sections/PricingSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getPricingJsonLd } from "@/lib/seo";
import { faqByQuestions } from "@/lib/faq";

export const metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Free $0, Creator $9/mo, Studio $25/mo. Credits, GLB on Free, all formats on paid plans. Cancel anytime.",
  path: "/pricing",
});

const PRICING_FAQ = faqByQuestions([
  "Is there a free plan available?",
  "Can I change or cancel my plan anytime?",
  "What formats does Hydrilla export?",
]);

export default function PricingPage() {
  return (
    <>
      <JsonLd data={getPricingJsonLd()} />
      <div className="pt-24 md:pt-28">
        <PricingSection pageHeading />
      </div>
      <section className="bg-white px-5 pb-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-[22px] font-semibold tracking-[-0.03em] text-neutral-950"
            style={{
              fontFamily:
                "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            Pricing questions
          </h2>
          <dl className="mt-8 space-y-8">
            {PRICING_FAQ.map((item) => (
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
        </div>
      </section>
      <Footer />
    </>
  );
}
