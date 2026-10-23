import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import { BRAND_SENTENCE, CONTACT_EMAIL, MODEL_NAME, RESEARCH_LAB, SITE_URL } from "@/lib/brand";
import { TEAM_MEMBERS } from "@/lib/team";

const SITELINKS = [
  {
    title: "Pricing",
    url: `${SITE_URL}/pricing`,
    lines: "Free plan. No credit card needed. Starter from $5/mo.",
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

const BRAND_ASSETS = [
  {
    name: "Hydrilla Symbol",
    file: "/hyd01.png",
    dark: false,
    type: "symbol",
  },
  {
    name: "Hydrilla Symbol (Dark)",
    file: "/hyd01.png",
    dark: true,
    type: "symbol",
  },
  {
    name: "Hydrilla Wordmark",
    file: "/logo-hydrilla/hydsvgblack.svg",
    dark: false,
    type: "wordmark",
  },
  {
    name: "Hydrilla Wordmark (Light)",
    file: "/logo-hydrilla/hydsvg.svg",
    dark: true,
    type: "wordmark",
  },
];

export default function BrandPage() {
  const founders = TEAM_MEMBERS.filter((member) =>
    member.role.toLowerCase().includes("founder")
  );

  return (
    <>
      <div className="pickle-research-page">
        {/* Hero matching pickle press-kit-D3fhMOfk.css */}
        <header className="pickle-research-hero">
          <h1 className="pickle-research-title">Press kit</h1>
          <p className="pickle-research-description">
            Official marks, canonical naming, boilerplate, and reference links for{" "}
            {RESEARCH_LAB}, Hydrilla, and {MODEL_NAME}.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <a href="/hyd01.png" download className="pickle-pill-solid">
              Download Brand Mark
            </a>
            <p className="text-[17px] text-black">
              Press inquiries:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-black/60 underline underline-offset-4 hover:text-black"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </header>

        {/* Brand Marks 4-column grid matching _brandGrid_1o42w_142 */}
        <section className="pickle-research-container" style={{ marginTop: "80px" }}>
          <h2 className="pickle-h2" style={{ width: "100%", marginBottom: "36px" }}>
            Brand marks
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BRAND_ASSETS.map((asset) => (
              <div key={asset.name} className="flex flex-col gap-3.5">
                <div
                  className={`flex aspect-[248/200] items-center justify-center overflow-hidden rounded-[20px] p-8 ${
                    asset.dark ? "bg-[#1d1d1f]" : "bg-[#f5f5f7]"
                  }`}
                >
                  <img
                    src={asset.file}
                    alt={asset.name}
                    className={
                      asset.type === "symbol"
                        ? "h-20 w-20 object-contain"
                        : "h-10 w-auto max-w-[82%] object-contain"
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="m-0 text-[16px] font-medium text-black">
                    {asset.name}
                  </p>
                  <a
                    href={asset.file}
                    download
                    className="text-[14px] font-medium text-[#0066cc] no-underline hover:underline"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Canonical Names & Boilerplate */}
        <section className="pickle-research-container" style={{ marginTop: "80px" }}>
          <h2 className="pickle-h2" style={{ width: "100%", marginBottom: "28px" }}>
            Canonical naming &amp; boilerplate
          </h2>
          <div className="pickle-card-surface">
            <table className="pickle-table">
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Role</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>{RESEARCH_LAB}</th>
                  <td>Research Lab</td>
                  <td>The research lab that builds the generative 3D models behind Hydrilla.</td>
                </tr>
                <tr>
                  <th>Hydrilla</th>
                  <td>Product &amp; Studio</td>
                  <td>{BRAND_SENTENCE}</td>
                </tr>
                <tr>
                  <th>{MODEL_NAME}</th>
                  <td>Current 3D Model</td>
                  <td>First model in the BlueFox 3D family. Generates segmented meshes with PBR maps.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Founders */}
        <section className="pickle-research-container" style={{ marginTop: "80px" }}>
          <h2 className="pickle-h2" style={{ width: "100%", marginBottom: "28px" }}>
            Founders
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {founders.map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-4 rounded-[20px] bg-[#f5f5f7] p-5"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-black/10">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="m-0 text-[17px] font-medium text-black">
                    {person.name}
                  </p>
                  <p className="m-0 text-[14px] text-black/55">{person.role}</p>
                  {person.connect ? (
                    <a
                      href={person.connect}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-[13px] font-medium text-[#0066cc] no-underline hover:underline"
                    >
                      LinkedIn →
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sitelinks */}
        <section className="pickle-research-container" style={{ marginTop: "80px" }}>
          <h2 className="pickle-h2" style={{ width: "100%", marginBottom: "16px" }}>
            Canonical directory &amp; sitelinks
          </h2>
          <p className="pickle-research-description" style={{ marginBottom: "36px" }}>
            Official URLs and descriptions for press citations and campaign sitelinks.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {SITELINKS.map((link) => (
              <Link
                key={link.title}
                href={link.url.replace(SITE_URL, "") || "/"}
                className="flex flex-col justify-between rounded-[24px] bg-[#f5f5f7] p-7 no-underline transition-colors hover:bg-[#ededf0]"
              >
                <div>
                  <h3 className="m-0 text-[22px] font-medium tracking-[-0.22px] text-black">
                    {link.title}
                  </h3>
                  <p className="mt-2 mb-0 text-[16px] leading-[1.45] text-black/60">
                    {link.lines}
                  </p>
                </div>
                <p className="mt-4 mb-0 text-[13px] font-mono text-black/40">
                  {link.url}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
