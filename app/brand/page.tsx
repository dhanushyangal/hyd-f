import { MarketingPage } from "@/components/layout/MarketingPage";
import { MarketingArticle, ProseHeading } from "@/components/content/MarkdownBody";
import { BRAND_SENTENCE, CONTACT_EMAIL, MODEL_NAME, RESEARCH_LAB, SITE_URL } from "@/lib/brand";
import { TEAM_MEMBERS } from "@/lib/team";

/** Google Ads sitelink assets — paste these on the brand campaign. Not shown in site nav. */
const SITELINKS = [
  {
    title: "Pricing",
    url: `${SITE_URL}/pricing`,
    lines: "Free plan. No credit card needed. Creator from $9/mo.",
  },
  {
    title: "BlueFox 3D",
    url: `${SITE_URL}/bluefox3d`,
    lines: "Text and image to production meshes. PBR, GLB, FBX, OBJ, USDZ.",
  },
  {
    title: "Features",
    url: `${SITE_URL}/features`,
    lines: "Generate, preview, and export into Unity, Unreal, and Blender.",
  },
  {
    title: "Docs",
    url: `${SITE_URL}/docs`,
    lines: "First prompt to a production export. Workspaces and credits.",
  },
  {
    title: "Use cases",
    url: `${SITE_URL}/usecase`,
    lines: "Games, film, architecture, XR, and product visualization.",
  },
  {
    title: "API",
    url: `${SITE_URL}/api`,
    lines: "Same BlueFox 1 model, programmatic for studio pipelines.",
  },
  {
    title: "About",
    url: `${SITE_URL}/about`,
    lines: "Hydrilla and Hawan Research Labs. The team behind BlueFox.",
  },
  {
    title: "Contact",
    url: `${SITE_URL}/contact`,
    lines: "Talk to the founders. Book a demo.",
  },
];

export default function BrandPage() {
  const founders = TEAM_MEMBERS.filter((member) =>
    member.role.toLowerCase().includes("founder")
  );

  return (
    <MarketingPage
      eyebrow="Press"
      title="Press kit"
      description="Names, logo, and boilerplate. Use this page for press and Google Ads sitelinks. It is not in the site navigation."
      formats={false}
    >
      <MarketingArticle>
        <ProseHeading>Names</ProseHeading>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          <li>
            <span className="font-semibold text-neutral-950">{RESEARCH_LAB}</span>: research lab
          </li>
          <li>
            <span className="font-semibold text-neutral-950">Hydrilla</span>: product
          </li>
          <li>
            <span className="font-semibold text-neutral-950">{MODEL_NAME}</span>: model (page title: BlueFox 3D)
          </li>
        </ul>

        <ProseHeading>Boilerplate</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          {BRAND_SENTENCE}
        </p>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          {RESEARCH_LAB} builds {MODEL_NAME}. Hydrilla is the studio around it.
        </p>

        <ProseHeading>Logo</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Mark:{" "}
          <a href="/hyd01.png" className="font-semibold text-neutral-950 underline underline-offset-2">
            /hyd01.png
          </a>
          . Wordmark: Hydrilla.
        </p>

        <ProseHeading>Founders</ProseHeading>
        <ul className="mt-4 space-y-2 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          {founders.map((person) => (
            <li key={person.id}>
              <span className="font-semibold text-neutral-950">{person.name}</span>
              {` · ${person.role}`}
              {person.connect ? (
                <>
                  {" · "}
                  <a
                    href={person.connect}
                    className="font-semibold text-neutral-950 underline underline-offset-2"
                  >
                    LinkedIn
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>

        <ProseHeading>Google Ads sitelinks</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Use these eight links as sitelink assets on the hydrilla / hydrilla ai campaign.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {SITELINKS.map((link) => (
            <div key={link.title} className="border border-neutral-200 p-4">
              <p className="text-[15px] font-semibold text-neutral-950">{link.title}</p>
              <p className="mt-1 break-all text-[12px] text-neutral-400">{link.url}</p>
              <p className="mt-2 text-[14px] leading-5 text-neutral-600">{link.lines}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Press: {CONTACT_EMAIL}
        </p>
      </MarketingArticle>
    </MarketingPage>
  );
}
