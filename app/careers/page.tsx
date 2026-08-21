import { MarketingPage } from "@/components/layout/MarketingPage";
import { MarketingArticle, ProseHeading } from "@/components/content/MarkdownBody";
import { CONTACT_EMAIL } from "@/lib/brand";

const ROLES = [
  {
    title: "Engineering",
    body: "Full-stack, 3D runtime, and generation infrastructure. You will ship product that studios actually run in production.",
  },
  {
    title: "3D and research",
    body: "Model quality, mesh structure, materials, and evaluation. You care about assets that survive a real lighting setup.",
  },
  {
    title: "Go to market",
    body: "Studio relationships, creator programs, and the story of production-ready 3D. You talk to the people who ship games, film, and XR.",
  },
];

export default function CareersPage() {
  return (
    <MarketingPage
      eyebrow="Company"
      title="Careers"
      description="Join Hydrilla and Hawan Research Labs. The work is meshes, exports, and a studio product teams can run."
      formats={false}
      related={[
        { label: "Team", href: "/team", hint: "Who is already here" },
        { label: "About", href: "/about", hint: "Lab, product, model" },
        { label: "Contact", href: "/contact", hint: "Talk to the founders" },
      ]}
    >
      <MarketingArticle>
        <section className="space-y-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          <p>
            We hire people who care about generative 3D and production
            pipelines. Write to{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-neutral-950 underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            with a short note and work.
          </p>
          <p>
            We are a small team at Hydrilla and Hawan Research Labs, building
            BlueFox 1. The work is concrete: faster generation, cleaner meshes,
            exports that land in real pipelines, and a studio product teams can
            trust.
          </p>
          <p>
            If you want to work on 3D, generative models, and production
            software rather than slideware, we want to hear from you.
          </p>
        </section>

        <ProseHeading>Who we hire</ProseHeading>
        <div className="mt-6 grid gap-3">
          {ROLES.map((role) => (
            <div key={role.title} className="border border-neutral-200 bg-white p-5">
              <h3 className="text-[15px] font-semibold tracking-tight text-neutral-950">
                {role.title}
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-neutral-600">
                {role.body}
              </p>
            </div>
          ))}
        </div>

        <ProseHeading>How to apply</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          We do not keep a long public board of numbered reqs. Send a note
          with what you want to work on, a few links, and where you are based.
        </p>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-neutral-950 underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          with the subject line “Careers / [your name]”.
        </p>
      </MarketingArticle>
    </MarketingPage>
  );
}
