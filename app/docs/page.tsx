import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PickleArticlePage,
  PickleVideoPlayer,
  PickleVisualThumb,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";
import { createPageMetadata, getDocsJsonLd } from "@/lib/seo";
import { WHY_HYDRILLA_MEDIA } from "@/lib/cloudinary";

export const metadata = createPageMetadata({
  title: "Docs | Get started with Hydrilla",
  description:
    "Get started with Hydrilla: create a workspace, generate with BlueFox 1 from text or image, preview, and export GLB, FBX, OBJ, or USDZ.",
  path: "/docs",
  absoluteTitle: true,
});

const TOC = [
  { href: "#getting-started", label: "Getting started" },
  { href: "#text-to-3d", label: "Text to 3D" },
  { href: "#image-to-3d", label: "Image to 3D" },
  { href: "#preview", label: "Preview" },
  { href: "#export", label: "Export formats" },
  { href: "#workspaces", label: "Workspaces and credits" },
  { href: "#api", label: "API" },
];

const RELATED: PickleRelatedItem[] = [
  {
    title: "Hydrilla REST API",
    subtitle: "Submit text-to-3D and image-to-3D jobs from your own studio pipeline.",
    href: "/api",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "api-stream",
  },
  {
    title: "DCC & Engine Integrations",
    subtitle: "Connect Blender, Unity, Unreal Engine, Godot 4, and MCP agents.",
    href: "/integrations",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "unity-engine",
  },
];

export default function DocsPage() {
  return (
    <>
      <JsonLd data={getDocsJsonLd()} />
      <PickleArticlePage
        kicker="Documentation"
        title="Get started with Hydrilla"
        subtitle="From first prompt to a production export in Unity, Unreal, or Blender."
        date="Aug 19, 2026"
        author="Hydrilla Team"
        heroThumbVariant="docs-flow"
        ctaLabel="Open Studio"
        ctaHref="/app/studio"
        footnote="Looking for full REST endpoint specifications and interactive Try-It consoles? Visit docs.hydrilla.ai or contact founders@hydrilla.ai."
        relatedItems={RELATED}
      >
        {/* Table of contents in Pickle summary card style */}
        <nav
          aria-label="On this page"
          className="pickle-card-surface"
          style={{ width: "min(600px, 100%)", padding: "24px 28px", borderRadius: "24px" }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "15px",
              fontWeight: 566,
              color: "#000",
              letterSpacing: "-0.15px",
            }}
          >
            On this page
          </p>
          <ol
            style={{
              margin: 0,
              paddingLeft: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "6px 24px",
              fontSize: "15px",
              lineHeight: 1.8,
            }}
          >
            {TOC.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  style={{
                    color: "rgba(0,0,0,0.68)",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <section id="getting-started" className="pickle-head-block scroll-mt-28">
          <h2 className="pickle-h2">Getting started</h2>
          <div className="pickle-text">
            <ol>
              <li>Create an account and open a workspace.</li>
              <li>
                Start a generation with a text prompt or a reference image (BlueFox 1).
              </li>
              <li>
                Wait for the mesh. Inspect parts, PBR, and silhouette in the browser
                preview.
              </li>
              <li>
                Export GLB (Free) or GLB, FBX, OBJ, and USDZ (Starter and Pro).
              </li>
              <li>Import into Unity, Unreal, Blender, or your DCC.</li>
            </ol>
            <p style={{ marginTop: "1.45em" }}>
              Explore{" "}
              <Link href="/features">Features</Link>
              {" · "}
              <Link href="/pricing">Pricing</Link>
              {" · "}
              <Link href="/api">API</Link>
              {" · "}
              <Link href="/faq">FAQ</Link>.
            </p>
          </div>
        </section>

        <section id="text-to-3d" className="pickle-section scroll-mt-28">
          <div className="pickle-head-block">
            <h2 className="pickle-h2">Text to 3D</h2>
            <div className="pickle-text">
              <p>
                Type a prompt that names the subject, style, and any production
                constraints: a game-ready prop, a cinematic character, an
                interior piece. BlueFox 1 turns that description into a
                structured mesh with parts you can continue editing.
              </p>
              <p>
                Hydrilla first renders a reference image with OpenAI or Gemini.
                Pick Low for quick drafts or High for more detail, and choose a
                square, landscape, or portrait frame. Refine the image with an
                Edit prompt until it looks right, then generate the 3D model.
              </p>
              <p>
                Be specific about scale and use. “Low-poly crate for Unity” and
                “hero prop with PBR wear” produce different starting points.
              </p>
            </div>
          </div>

          <PickleVideoPlayer
            src={WHY_HYDRILLA_MEDIA.bluefox.video}
            poster={WHY_HYDRILLA_MEDIA.bluefox.poster}
            variant="inline"
          />
        </section>

        <section id="image-to-3d" className="pickle-head-block scroll-mt-28">
          <h2 className="pickle-h2">Image to 3D</h2>
          <div className="pickle-text">
            <p>
              Drop a reference image when you already have a look. Hydrilla
              uses the image as visual input so the generated asset tracks
              silhouette, materials, and style instead of guessing from text
              alone.
            </p>
            <p>
              You can combine a short prompt with a reference when you need
              both a look and a production note (engine, poly budget, or
              export target).
            </p>
          </div>
        </section>

        <section id="preview" className="pickle-section scroll-mt-28">
          <div className="pickle-head-block">
            <h2 className="pickle-h2">Preview</h2>
            <div className="pickle-text">
              <p>
                Orbit the model in the browser before you download. Check
                topology, materials, and silhouettes under lighting so issues
                show up before the file hits your DCC tool or engine.
              </p>
              <p>
                Meshes arrive segmented into logical parts, which keeps material
                assignment and cleanup precise instead of starting from a solid
                blob.
              </p>
            </div>
          </div>

          <figure className="pickle-figure">
            <div className="pickle-player-frame" data-variant="inline">
              <div className="pickle-player-media">
                <PickleVisualThumb variant="critter-rig" />
              </div>
            </div>
            <figcaption className="pickle-caption">
              Meshes arrive segmented into logical parts with four PBR channels ready for inspection.
            </figcaption>
          </figure>
        </section>

        <section id="export" className="pickle-section scroll-mt-28">
          <div className="pickle-head-block">
            <h2 className="pickle-h2">Export formats</h2>
            <div className="pickle-text">
              <p>
                Hydrilla exports GLB, FBX, OBJ, and USDZ. Use GLB for web and
                many real-time pipelines, FBX and OBJ for DCC and engines, and
                USDZ for AR viewers.
              </p>
              <p>
                Topology and UVs are produced for production handoff into Unity,
                Unreal, Blender, and AR tools, without rebuilding the asset
                from scratch.
              </p>
            </div>
          </div>

          <figure className="pickle-figure">
            <div className="pickle-card-surface">
              <table className="pickle-table">
                <thead>
                  <tr>
                    <th>Format</th>
                    <th>Plans</th>
                    <th>Primary pipeline target</th>
                    <th>Included maps</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>GLB</th>
                    <td>Free, Starter, Pro</td>
                    <td>Blender, Unity, WebGL, Three.js, Godot 4</td>
                    <td>Base color, metalness, roughness, normal</td>
                  </tr>
                  <tr>
                    <th>FBX</th>
                    <td>Starter, Pro</td>
                    <td>Unreal Engine, Maya, 3ds Max, Houdini</td>
                    <td>Embedded PBR textures + part hierarchy</td>
                  </tr>
                  <tr>
                    <th>OBJ</th>
                    <td>Starter, Pro</td>
                    <td>ZBrush, Substance Painter, universal DCC ingest</td>
                    <td>Mesh + MTL + PBR texture maps</td>
                  </tr>
                  <tr>
                    <th>USDZ</th>
                    <td>Starter, Pro</td>
                    <td>Apple VisionOS, iOS Quick Look, Omniverse</td>
                    <td>USD stage + PBR material bindings</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <figcaption className="pickle-caption">
              Four production export formats generated from a single BlueFox 1 synthesis run.
            </figcaption>
          </figure>
        </section>

        <section id="workspaces" className="pickle-head-block scroll-mt-28">
          <h2 className="pickle-h2">Workspaces and credits</h2>
          <div className="pickle-text">
            <p>
              Workspaces keep generations, versions, and team delivery in one
              place. Organize drafts, share review, and move from first output
              to a client-ready file without scattering assets across folders.
            </p>
            <p>
              Usage is metered in credits. At default quality, a model from an
              uploaded image costs 30 credits. Starting from text also creates
              the source image, bringing the default total to 45 credits. Free
              includes 100 credits; Starter and Slot include 900; Pro and Slot
              Pro include 3,000. Slot plans use the same credit budgets during
              a chosen daily generation window.
            </p>
          </div>
        </section>

        <section id="api" className="pickle-head-block scroll-mt-28">
          <h2 className="pickle-h2">API</h2>
          <div className="pickle-text">
            <p>
              Studios that need programmatic generation can integrate Hydrilla
              into an existing pipeline. Authentication is account-based; the
              public API surface is documented for partners and Pro accounts.
            </p>
            <p>
              <Link href="/api">Read the API overview</Link> or email{" "}
              <a href="mailto:founders@hydrilla.ai">founders@hydrilla.ai</a> if
              you need pipeline access.
            </p>
          </div>
        </section>
      </PickleArticlePage>
    </>
  );
}
