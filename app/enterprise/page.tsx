import Link from "next/link";
import {
  PickleArticlePage,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";
import { CONTACT_EMAIL, DEMO_URL } from "@/lib/brand";
import { WHY_HYDRILLA_MEDIA } from "@/lib/cloudinary";

const RELATED: PickleRelatedItem[] = [
  {
    title: "Security & Trust",
    subtitle: "How Hydrilla handles accounts, private workspaces, and exported files.",
    href: "/security",
    date: "Oct 1, 2026",
    author: "Hydrilla Team",
    thumbVariant: "privacy-enclave",
  },
  {
    title: "Hydrilla REST API",
    subtitle: "Programmatic BlueFox 1 generation for studio pipelines and internal tools.",
    href: "/api",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "api-stream",
  },
];

export default function EnterprisePage() {
  return (
    <PickleArticlePage
      kicker="Studios"
      kickerHref="/about"
      title="Hydrilla for Enterprise"
      subtitle="BlueFox 1 at studio volume: seats, API concurrency, and files that land in Unreal, Unity, or a DCC stack you already run."
      date="Oct 2026"
      author="Hydrilla Team"
      heroVideoSrc={WHY_HYDRILLA_MEDIA.bluefox.video}
      heroPosterSrc={WHY_HYDRILLA_MEDIA.bluefox.poster}
      ctaLabel="Book a demo"
      ctaHref={DEMO_URL}
      footnote={
        <>
          Prefer email? Write directly to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or review our{" "}
          <Link href="/security">Security &amp; Trust</Link> overview.
        </>
      }
      relatedItems={RELATED}
    >
      <div className="pickle-text">
        <p>
          Pro on the public site is the starting point: 3,000 credits a month,
          seats, and REST API access. Enterprise is for teams that need higher
          volume, a named engineering contact, and generation wired into an
          existing production stack.
        </p>
      </div>

      <section className="pickle-section">
        <div className="pickle-head-block">
          <h2 className="pickle-h2">What studios ask for</h2>
          <div className="pickle-text">
            <ul>
              <li>Higher credit pools and queue priority for production sprints</li>
              <li>Shared workspaces for art, lookdev, and production review</li>
              <li>Programmatic jobs through the Hydrilla REST API and MCP server</li>
              <li>GLB, FBX, OBJ, and USDZ that import cleanly into the engine or DCC tool</li>
              <li>A direct security review path and a founder or engineer to email</li>
            </ul>
          </div>
        </div>

        <figure className="pickle-figure">
          <div className="pickle-card-surface">
            <table className="pickle-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Pro (Self-Serve)</th>
                  <th>Enterprise (Studio)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Monthly credits</th>
                  <td>3,000 credits / month</td>
                  <td>Custom pooled studio volume</td>
                </tr>
                <tr>
                  <th>Generation model</th>
                  <td>BlueFox 1</td>
                  <td>BlueFox 1 + priority queue</td>
                </tr>
                <tr>
                  <th>Exports</th>
                  <td>GLB, FBX, OBJ, USDZ</td>
                  <td>GLB, FBX, OBJ, USDZ + Bridge</td>
                </tr>
                <tr>
                  <th>API &amp; DCC plugins</th>
                  <td>10,000 calls/mo + all plugins</td>
                  <td>Custom concurrency + pipeline support</td>
                </tr>
                <tr>
                  <th>Support &amp; reviews</th>
                  <td>Standard support</td>
                  <td>Named contact + vendor security review</td>
                </tr>
              </tbody>
            </table>
          </div>
          <figcaption className="pickle-caption">
            How self-serve Pro compares with custom Enterprise studio arrangements.
          </figcaption>
        </figure>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">How this differs from Pro</h2>
        <div className="pickle-text">
          <p>
            Pro is self-serve. Enterprise is a direct conversation: expected
            monthly volume, which engine you ship in, whether jobs should run
            from your backend, and who owns the account. We do not publish a
            fake SSO checklist.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">How to start</h2>
        <div className="pickle-text">
          <p>
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer">
              Book a demo
            </a>{" "}
            or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
            with studio size, engine, and expected monthly volume. If you
            already generate on the Pro plan, say so — that context is more
            useful than a generic RFP.
          </p>
        </div>
      </section>
    </PickleArticlePage>
  );
}
