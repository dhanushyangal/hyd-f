import Link from "next/link";
import {
  PickleArticlePage,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";
import { CONTACT_EMAIL } from "@/lib/brand";

const ROLES = [
  {
    title: "Engineering",
    tag: "Full-Stack · 3D Runtime · Infrastructure",
    body: "Full-stack, WebGL/Three.js 3D runtime, DCC plugins, and generation infrastructure. You will ship studio software that teams actually run in production.",
  },
  {
    title: "3D & Research",
    tag: "Hawan Research Labs · BlueFox",
    body: "Model quality, mesh structure, part segmentation, PBR materials, and evaluation. You care about assets that survive a real lighting setup.",
  },
  {
    title: "Go to Market",
    tag: "Studios · Partnerships · Creator Programs",
    body: "Studio relationships, creator programs, and the story of production-ready 3D. You talk directly to the people who ship games, film, and XR.",
  },
];

const RELATED: PickleRelatedItem[] = [
  {
    title: "About Hydrilla",
    subtitle: "Why Hydrilla, Hawan Research Labs, and BlueFox 3D exist.",
    href: "/about",
    date: "Oct 2026",
    author: "Hydrilla Team",
    thumbVariant: "pipeline-arch",
  },
  {
    title: "Hawan Research Labs",
    subtitle: "Notes on generative 3D, segmented topology, and PBR synthesis.",
    href: "/research",
    date: "Oct 2026",
    author: "Hawan Research Labs",
    thumbVariant: "critter-rig",
  },
];

export default function CareersPage() {
  return (
    <PickleArticlePage
      kicker="Company"
      kickerHref="/about"
      title="Careers at Hydrilla"
      subtitle="Join Hydrilla and Hawan Research Labs. The work is meshes, exports, and a studio product teams can trust."
      date="We are hiring"
      author="Hydrilla & Hawan Research Labs"
      heroThumbVariant="critter-rig"
      ctaLabel={`Apply via ${CONTACT_EMAIL}`}
      ctaHref={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Careers / Hydrilla")}`}
      footnote={
        <>
          Want to meet the founders first?{" "}
          <Link href="/team">See the team</Link> or{" "}
          <Link href="/contact">reach out directly</Link>.
        </>
      }
      relatedItems={RELATED}
    >
      <div className="pickle-text">
        <p>
          We hire people who care about generative 3D and production pipelines.
          Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with
          a short note and links to your work.
        </p>
        <p>
          We are a focused team at Hydrilla and Hawan Research Labs, building
          BlueFox 1. The work is concrete: faster generation, cleaner meshes,
          exports that land in real pipelines, and a studio product teams can
          trust.
        </p>
        <p>
          If you want to work on 3D, generative models, and production software
          rather than slideware, we want to hear from you.
        </p>
      </div>

      <section className="pickle-section">
        <div className="pickle-head-block">
          <h2 className="pickle-h2">Who we hire</h2>
          <div className="pickle-text">
            <p>
              We hire across three tracks. Every role touches the actual studio
              product or the BlueFox model family.
            </p>
          </div>
        </div>

        <figure className="pickle-figure">
          <div className="pickle-card-surface">
            <table className="pickle-table">
              <thead>
                <tr>
                  <th>Track</th>
                  <th>Focus</th>
                  <th>What you will build</th>
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role.title}>
                    <th>{role.title}</th>
                    <td>{role.tag}</td>
                    <td>{role.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <figcaption className="pickle-caption">
            Open tracks across Hydrilla Studio and Hawan Research Labs.
          </figcaption>
        </figure>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">How to apply</h2>
        <div className="pickle-text">
          <p>
            We do not keep a long public board of numbered reqs. Send a note
            with what you want to work on, a few links to things you have built
            or researched, and where you are based.
          </p>
          <p>
            Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with
            the subject line “Careers / [your name]”.
          </p>
        </div>
      </section>
    </PickleArticlePage>
  );
}
