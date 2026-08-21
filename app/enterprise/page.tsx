import Link from "next/link";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { MarketingArticle, ProseHeading } from "@/components/content/MarkdownBody";
import { CONTACT_EMAIL, DEMO_URL } from "@/lib/brand";

export default function EnterprisePage() {
  return (
    <MarketingPage
      eyebrow="Studios"
      title="Enterprise"
      description="BlueFox 1 at studio volume: seats, API, and files that land in Unreal, Unity, or a DCC stack you already run."
      related={[
        { label: "Security", href: "/security", hint: "Accounts, assets, reviews" },
        { label: "API", href: "/api", hint: "Programmatic jobs" },
        { label: "Pricing", href: "/pricing", hint: "Public Studio plan" },
      ]}
    >
      <MarketingArticle>
        <p className="text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Studio on the public site is the starting point: 4,000 credits a
          month, seats, and API access. Enterprise is for teams that need
          volume, a named contact, and generation inside an existing production
          stack.
        </p>

        <ProseHeading>What studios ask for</ProseHeading>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          <li>Higher credit pools and queue priority for production sprints</li>
          <li>Shared workspaces for art, lookdev, and production</li>
          <li>Programmatic jobs through the Hydrilla API</li>
          <li>GLB, FBX, OBJ, and USDZ that import into the engine or DCC tool</li>
          <li>A security review path and a person to email</li>
        </ul>

        <ProseHeading>How this differs from Studio</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Studio is self-serve. Enterprise is a conversation: expected monthly
          volume, which engine you ship in, whether jobs should run from your
          backend, and who owns the account. We do not publish a fake SSO
          checklist.
        </p>

        <ProseHeading>How to start</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Book a demo or email the founders with studio size, engine, and
          expected monthly volume. If you already generate on the Studio plan,
          say so. That context is more useful than a generic RFP.
        </p>

        <div className="mt-14 flex flex-wrap gap-3">
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-xl bg-[#111] px-5 py-3 text-[15px] font-semibold text-white hover:bg-neutral-800"
          >
            Book a demo
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-950 hover:bg-neutral-50"
          >
            {CONTACT_EMAIL}
          </a>
          <Link
            href="/security"
            className="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-950 hover:bg-neutral-50"
          >
            Security
          </Link>
        </div>
      </MarketingArticle>
    </MarketingPage>
  );
}
