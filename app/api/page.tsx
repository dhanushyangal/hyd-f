import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { MarketingArticle, ProseHeading } from "@/components/content/MarkdownBody";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/brand";

export const metadata = createPageMetadata({
  title: "Hydrilla API",
  description:
    "Studio plans include REST API access for programmatic generation. Partner and volume access via contact. Email founders@hydrilla.ai.",
  path: "/api",
});

export default function ApiPage() {
  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Hydrilla API",
          description:
            "Studio plans include REST API access for programmatic generation. Partner and volume access via contact.",
          path: "/api",
        })}
      />
      <MarketingPage
      eyebrow="Developers"
      title="Hydrilla API"
      description="API access is available on Studio and by partner arrangement. Same BlueFox 1 model, same production exports."
      related={[
        { label: "Docs", href: "/docs", hint: "Getting started in the studio" },
        { label: "Enterprise", href: "/enterprise", hint: "Volume and seats" },
        { label: "Contact", href: "/contact", hint: "Request access" },
      ]}
    >
      <MarketingArticle>
        <section className="space-y-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          <p>
            Studio plans include REST API access (10,000 calls/month on Studio)
            for programmatic generation in existing pipelines. Partner and
            volume access via{" "}
            <Link href="/contact" className="font-semibold text-neutral-950 underline underline-offset-2">
              Contact
            </Link>
            . Email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-neutral-950 underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <p>
            The Hydrilla API is for teams that want text-to-3D and image-to-3D
            inside an existing production stack: asset libraries, DCC tools,
            game engines, or internal review tools.
          </p>
          <p>
            You submit a generation job, poll status, then download a mesh and
            maps in GLB, FBX, OBJ, or USDZ. Preview still lives in the Hydrilla
            studio when you need a visual check before ingest.
          </p>
        </section>

        <ProseHeading>What you can integrate</ProseHeading>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          <li>Text and image inputs for BlueFox 1 generation jobs</li>
          <li>Job status for queued, processing, completed, and failed runs</li>
          <li>Production exports for engine and DCC handoff</li>
          <li>Account-based authentication for studio access</li>
        </ul>

        <ProseHeading>Access</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          API access is available on Studio and by partner arrangement. We do not
          publish a public OpenAPI on this page. Start in the product, then
          request pipeline access if you need jobs from your own backend.
        </p>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          For early access, email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-neutral-950 underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          with your studio, use case, and expected volume, or use the
          contact form.
        </p>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center rounded-xl bg-[#111] px-5 py-3 text-[15px] font-semibold text-white hover:bg-neutral-800"
          >
            Request API access
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-950 hover:bg-neutral-50"
          >
            Docs
          </Link>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-950 hover:bg-neutral-50"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </MarketingArticle>
    </MarketingPage>
    </>
  );
}
