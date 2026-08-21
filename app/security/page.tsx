import Link from "next/link";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { MarketingArticle, ProseHeading } from "@/components/content/MarkdownBody";
import { CONTACT_EMAIL } from "@/lib/brand";

export default function SecurityPage() {
  return (
    <MarketingPage
      eyebrow="Trust"
      title="Security"
      description="How Hydrilla handles accounts, generated assets, and exports for studio pipelines."
      formats={false}
      related={[
        { label: "Enterprise", href: "/enterprise", hint: "Volume, seats, API" },
        { label: "Privacy", href: "/privacy-policy", hint: "What we collect" },
        { label: "Contact", href: "/contact", hint: "Questionnaires and reviews" },
      ]}
    >
      <MarketingArticle>
        <p className="text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Hydrilla is a web studio. You sign in, generate with BlueFox 1, and
          download files you own under the Terms of Service. This page is the
          public trust summary, not a substitute for a signed DPA.
        </p>

        <ProseHeading>Accounts</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Authentication is handled by Clerk. Sessions are user-specific.
          Workspace, generation, and library routes are authenticated and not
          indexed.
        </p>

        <ProseHeading>Assets</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Generated meshes and maps are stored for your account so you can
          preview, iterate, and export. Creator and Studio keep generated
          assets and exports private to your account or workspace, as stated
          on Pricing. We do not sell customer assets as a dataset.
        </p>

        <ProseHeading>Exports</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Downloads are GLB, FBX, OBJ, and USDZ files you take into Unity,
          Unreal, Blender, or AR viewers. Once exported, those files live in
          your pipeline.
        </p>

        <ProseHeading>Reviews</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Studios that need a questionnaire, vendor review, or a named contact
          should email us. We answer from the facts on this page and the
          privacy policy rather than a marketing PDF.
        </p>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Security questionnaires and enterprise reviews:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-neutral-950 underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>
          {" · "}
          <Link href="/enterprise" className="font-semibold text-neutral-950 underline underline-offset-2">
            Enterprise
          </Link>
          {" · "}
          <Link href="/privacy-policy" className="font-semibold text-neutral-950 underline underline-offset-2">
            Privacy
          </Link>
        </p>
      </MarketingArticle>
    </MarketingPage>
  );
}
