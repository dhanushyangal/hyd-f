import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { MarketingArticle, ProseHeading } from "@/components/content/MarkdownBody";
import { createPageMetadata, getDocsJsonLd } from "@/lib/seo";

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

export default function DocsPage() {
  return (
    <>
      <JsonLd data={getDocsJsonLd()} />
      <MarketingPage
        eyebrow="Documentation"
        title="Get started"
        description="From first prompt to a production export. This is the public getting-started guide for Hydrilla."
        related={[
          { label: "Export formats", href: "/blog/export-formats", hint: "GLB, FBX, OBJ, USDZ" },
          { label: "API", href: "/api", hint: "Jobs from your pipeline" },
          { label: "FAQ", href: "/faq", hint: "Pricing and exports" },
        ]}
      >
        <MarketingArticle>
          <nav aria-label="On this page" className="border border-neutral-200 bg-[#fafafa] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              On this page
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {TOC.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-[14px] font-medium text-neutral-800 underline-offset-2 hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <DocSection id="getting-started" title="Getting started">
            <ol className="list-decimal space-y-3 pl-5">
              <li>Create an account and open a workspace.</li>
              <li>
                Start a generation with a text prompt or a reference image (BlueFox 1).
              </li>
              <li>
                Wait for the mesh. Inspect parts, PBR, and silhouette in the browser
                preview.
              </li>
              <li>
                Export GLB (Free) or GLB/FBX/OBJ/USDZ (Creator/Studio).
              </li>
              <li>Import into Unity, Unreal, Blender, or your DCC.</li>
            </ol>
            <p>
              <Link href="/features" className="font-semibold text-neutral-950 underline underline-offset-2">
                Features
              </Link>
              {" · "}
              <Link href="/pricing" className="font-semibold text-neutral-950 underline underline-offset-2">
                Pricing
              </Link>
              {" · "}
              <Link href="/api" className="font-semibold text-neutral-950 underline underline-offset-2">
                API
              </Link>
              {" · "}
              <Link href="/faq" className="font-semibold text-neutral-950 underline underline-offset-2">
                FAQ
              </Link>
            </p>
          </DocSection>

          <DocSection id="text-to-3d" title="Text to 3D">
            <p>
              Type a prompt that names the subject, style, and any production
              constraints: a game-ready prop, a cinematic character, an
              interior piece. BlueFox 1 turns that description into a
              structured mesh with parts you can continue editing.
            </p>
            <p>
              Be specific about scale and use. “Low-poly crate for Unity” and
              “hero prop with PBR wear” produce different starting points.
            </p>
          </DocSection>

          <DocSection id="image-to-3d" title="Image to 3D">
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
          </DocSection>

          <DocSection id="preview" title="Preview">
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
          </DocSection>

          <DocSection id="export" title="Export formats">
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
          </DocSection>

          <DocSection id="workspaces" title="Workspaces and credits">
            <p>
              Workspaces keep generations, versions, and team delivery in one
              place. Organize drafts, share review, and move from first output
              to a client-ready file without scattering assets across folders.
            </p>
            <p>
              Usage is metered in credits. The free plan includes a monthly
              credit allotment so you can evaluate the pipeline; Creator and
              Studio raise volume and unlock additional export options. Plans
              can be changed from account settings.
            </p>
          </DocSection>

          <DocSection id="api" title="API">
            <p>
              Studios that need programmatic generation can integrate Hydrilla
              into an existing pipeline. Authentication is account-based; the
              public API surface is documented for partners and early access.
            </p>
            <p>
              <Link href="/api" className="font-semibold text-neutral-950 underline underline-offset-2">
                Read the API overview
              </Link>
              {" "}or email{" "}
              <a
                href="mailto:founders@hydrilla.ai"
                className="font-semibold text-neutral-950 underline underline-offset-2"
              >
                founders@hydrilla.ai
              </a>{" "}
              if you need pipeline access.
            </p>
          </DocSection>
        </MarketingArticle>
      </MarketingPage>
    </>
  );
}

function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <ProseHeading>{title}</ProseHeading>
      <div className="mt-4 space-y-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
        {children}
      </div>
    </section>
  );
}
