import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PickleArticlePage,
  type PickleRelatedItem,
  type PickleThumbVariant,
} from "@/components/layout/PicklePage";
import { getIntegration, INTEGRATIONS } from "@/lib/integrations";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

const THUMB_BY_SLUG: Record<string, PickleThumbVariant> = {
  blender: "pipeline-arch",
  unity: "unity-engine",
  unreal: "unreal-engine",
  godot: "godot-engine",
  mcp: "privacy-enclave",
  api: "api-stream",
};

export function generateStaticParams() {
  return INTEGRATIONS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = getIntegration(slug);
  if (!item) {
    return {};
  }
  return createPageMetadata({
    title: `${item.name} integration`,
    description: item.summary,
    path: `/integrations/${item.slug}`,
  });
}

export default async function IntegrationDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = getIntegration(slug);
  if (!item) {
    notFound();
  }

  const downloadHref = item.downloadPath;
  const primaryHref = downloadHref || item.docsAnchor || "/app/api-keys";
  const primaryLabel = downloadHref
    ? "Download plugin"
    : item.docsAnchor
      ? "Open API docs"
      : "Get API key";
  const guideSteps = item.guideSteps || [];

  const related: PickleRelatedItem[] = INTEGRATIONS.filter((i) => i.slug !== item.slug)
    .slice(0, 2)
    .map((rel) => ({
      title: rel.name,
      subtitle: rel.summary,
      href: `/integrations/${rel.slug}`,
      date: "Available",
      author: "Hydrilla Integrations",
      imageSrc: rel.guideSteps?.[0]?.imageSrc || null,
      thumbVariant: THUMB_BY_SLUG[rel.slug] || "pipeline-arch",
    }));

  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: `${item.name} | Hydrilla Integrations`,
          description: item.summary,
          path: `/integrations/${item.slug}`,
        })}
      />
      <PickleArticlePage
        kicker="Integrations"
        kickerHref="/integrations"
        title={item.name}
        subtitle={item.summary}
        date="Available"
        author="Hydrilla Team"
        heroPosterSrc={guideSteps[0]?.imageSrc}
        heroThumbVariant={!guideSteps[0]?.imageSrc ? (THUMB_BY_SLUG[item.slug] || "pipeline-arch") : undefined}
        relatedItems={related}
        relatedHeading="Other integrations"
      >
        <div className="pickle-head-block">
          <div className="pickle-text">
            <p>{item.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a href={primaryHref} className="pickle-pill-solid">
              {primaryLabel}
            </a>
            {item.downloadPath ? (
              <Link
                href={`/integrations/connect?app=${encodeURIComponent(item.bridgeTarget)}`}
                className="pickle-glass-pill"
                style={{ height: "48px", fontSize: "17px", padding: "0 22px" }}
              >
                Sign in for plugins
              </Link>
            ) : (
              <Link
                href="/app/api-keys"
                className="pickle-glass-pill"
                style={{ height: "48px", fontSize: "17px", padding: "0 22px" }}
              >
                API keys
              </Link>
            )}
          </div>
        </div>

        {guideSteps.length > 0 ? (
          <section className="pickle-section-wide">
            <div className="pickle-head-block">
              <h2 className="pickle-h2">Setup guide</h2>
              <div className="pickle-text">
                <p>Follow these steps after downloading the plugin package.</p>
              </div>
            </div>

            <div className="pickle-subsections">
              {guideSteps.map((step, index) => (
                <div key={step.title} className="pickle-subsection">
                  <h3 className="pickle-h3">
                    {index + 1}. {step.title}
                  </h3>
                  <div className="pickle-sub-body">
                    <div className="pickle-text">
                      <p>{step.body}</p>
                    </div>
                    {step.imageSrc ? (
                      <figure className="pickle-figure">
                        <div
                          className="overflow-hidden bg-[#f5f5f7]"
                          style={{
                            borderRadius: "36px",
                            boxShadow:
                              "0 1px 1.5px rgba(0,0,0,0.05), 0 6px 3px rgba(0,0,0,0.04), 0 13px 4px rgba(0,0,0,0.03)",
                          }}
                        >
                          <Image
                            src={step.imageSrc}
                            alt={step.imageAlt || step.title}
                            width={1024}
                            height={886}
                            className="block h-auto w-full"
                            sizes="(max-width: 700px) 100vw, 980px"
                            priority={index === 0}
                          />
                        </div>
                        <figcaption className="pickle-caption">
                          {step.imageAlt || step.title}
                        </figcaption>
                      </figure>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="pickle-head-block">
            <h2 className="pickle-h2">Install</h2>
            <div className="pickle-text">
              <ol>
                {item.installSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {item.slug === "blender" ? (
          <section className="pickle-head-block">
            <h2 className="pickle-h2">After install</h2>
            <div className="pickle-text">
              <ol>
                <li>
                  Click <strong>Run Bridge</strong> in the Hydrilla panel.
                </li>
                <li>
                  Click <strong>Sign in</strong>, finish login in the browser, then{" "}
                  <strong>Sync</strong>. Keep the Connect tab open while generating.
                </li>
                <li>
                  Generate from text or image — or use <strong>Send to DCC</strong>{" "}
                  from Studio.
                </li>
              </ol>
            </div>
          </section>
        ) : null}
      </PickleArticlePage>
    </>
  );
}
