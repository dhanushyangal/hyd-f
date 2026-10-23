import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PickleArticlePage,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/brand";

export const metadata = createPageMetadata({
  title: "Hydrilla API",
  description:
    "Pro plans include REST API access for programmatic generation. Partner and volume access via contact. Email founders@hydrilla.ai.",
  path: "/api",
});

const RELATED: PickleRelatedItem[] = [
  {
    title: "Documentation",
    subtitle: "From first prompt in the studio to a production GLB, FBX, OBJ, or USDZ export.",
    href: "/docs",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "docs-flow",
  },
  {
    title: "DCC & Engine Integrations",
    subtitle: "Native add-ons for Blender, Unity, Unreal Engine, Godot 4, and MCP.",
    href: "/integrations",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "unity-engine",
  },
];

export default function ApiPage() {
  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Hydrilla API",
          description:
            "Pro plans include REST API access for programmatic generation. Partner and volume access via contact.",
          path: "/api",
        })}
      />
      <PickleArticlePage
        kicker="Developers"
        kickerHref="/docs"
        title="Hydrilla REST API"
        subtitle="Programmatic BlueFox 1 generation for studio asset pipelines, engines, and internal tools."
        date="Aug 19, 2026"
        author="Hydrilla Team"
        heroThumbVariant="api-stream"
        ctaLabel="Get API Key"
        ctaHref="/app/api-keys"
        footnote={
          <>
            Need higher concurrency or dedicated enterprise rate limits? Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or visit{" "}
            <Link href="/enterprise">Enterprise</Link>.
          </>
        }
        relatedItems={RELATED}
      >
        <div className="pickle-text">
          <p>
            Pro plans include REST API access (10,000 calls/month on Pro) for
            programmatic generation in existing pipelines. Partner and volume
            access is available via{" "}
            <Link href="/contact">Contact</Link> or by emailing{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
          <p>
            The Hydrilla API is built for teams that want text-to-3D and
            image-to-3D inside an existing production stack: asset libraries,
            DCC tools, game engines, or internal review tools.
          </p>
          <p>
            You submit a generation job, poll status, then download a segmented
            mesh and PBR maps in GLB, FBX, OBJ, or USDZ. Preview still lives in
            the Hydrilla studio when you need a visual check before ingest.
          </p>
        </div>

        <section className="pickle-section">
          <div className="pickle-head-block">
            <h2 className="pickle-h2">What you can integrate</h2>
            <div className="pickle-text">
              <ul>
                <li>Text and image inputs for BlueFox 1 generation jobs</li>
                <li>Job status polling for queued, processing, completed, and failed runs</li>
                <li>Production exports (GLB, FBX, OBJ, USDZ) for engine and DCC handoff</li>
                <li>Account-scoped Bearer authentication with <code>hyd_live_</code> keys</li>
              </ul>
            </div>
          </div>

          <figure className="pickle-figure">
            <div className="pickle-card-surface">
              <table className="pickle-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th><code>/v1/3d/text-to-3d</code></th>
                    <td>POST</td>
                    <td>Submit a text prompt to synthesize a segmented 3D mesh with PBR maps.</td>
                  </tr>
                  <tr>
                    <th><code>/v1/3d/image-to-3d</code></th>
                    <td>POST</td>
                    <td>Submit a reference image URL or upload for silhouette-locked 3D generation.</td>
                  </tr>
                  <tr>
                    <th><code>/v1/3d/tasks/:id</code></th>
                    <td>GET</td>
                    <td>Poll task status (<code>WAIT</code>, <code>RUN</code>, <code>DONE</code>, <code>FAIL</code>) and retrieve signed export URLs.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <figcaption className="pickle-caption">
              Core task endpoints shared by the REST API, MCP server, and DCC plugins.
            </figcaption>
          </figure>
        </section>

        <section className="pickle-head-block">
          <h2 className="pickle-h2">Access &amp; authentication</h2>
          <div className="pickle-text">
            <p>
              API access is available on Pro and by partner arrangement. Create
              a <code>hyd_live_</code> key in{" "}
              <Link href="/app/api-keys">API Keys</Link>, or explore the full
              endpoint reference at{" "}
              <a href="https://docs.hydrilla.ai" target="_blank" rel="noreferrer">
                docs.hydrilla.ai
              </a>
              .
            </p>
            <p>
              For volume or custom studio integration, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with your
              studio, use case, and expected monthly volume, or use the{" "}
              <Link href="/contact">contact form</Link>.
            </p>
          </div>
        </section>
      </PickleArticlePage>
    </>
  );
}
