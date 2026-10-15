import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { getIntegration, INTEGRATIONS } from "@/lib/integrations";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

const DISPLAY =
  "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif";

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

  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: `${item.name} | Hydrilla Integrations`,
          description: item.summary,
          path: `/integrations/${item.slug}`,
        })}
      />
      <MarketingPage
        eyebrow="Integrations"
        eyebrowHref="/integrations"
        title={item.name}
        description={item.summary}
        formats={false}
        heroRule={false}
        related={[
          { label: "All integrations", href: "/integrations", hint: "Plugins and Bridge" },
          { label: "API keys", href: "/app/api-keys", hint: "hyd_live_ keys" },
          { label: "API", href: "/api", hint: "REST overview" },
        ]}
      >
        <article className="mx-auto max-w-[42rem] px-5 pb-16 sm:px-6">
          <p className="text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
            {item.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={primaryHref}
              className="inline-flex items-center rounded-xl bg-[#111] px-5 py-3 text-[15px] font-semibold text-white hover:bg-neutral-800"
            >
              {primaryLabel}
            </a>
            {item.downloadPath ? (
              <Link
                href={`/integrations/connect?app=${encodeURIComponent(item.bridgeTarget)}`}
                className="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-950 hover:bg-neutral-50"
              >
                Sign in for plugins
              </Link>
            ) : (
              <Link
                href="/app/api-keys"
                className="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-950 hover:bg-neutral-50"
              >
                API keys
              </Link>
            )}
          </div>

          {guideSteps.length > 0 ? (
            <section className="mt-14">
              <h2
                className="text-[22px] font-semibold tracking-[-0.03em] text-neutral-950"
                style={{ fontFamily: DISPLAY }}
              >
                Setup guide
              </h2>
              <p className="mt-2 text-[15px] leading-6 text-neutral-600">
                Follow these steps after downloading the plugin zip.
              </p>
              <ol className="mt-8 space-y-12">
                {guideSteps.map((step, index) => (
                  <li key={step.title} className="list-none">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-semibold text-neutral-950"
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="text-[18px] font-semibold tracking-[-0.02em] text-neutral-950"
                          style={{ fontFamily: DISPLAY }}
                        >
                          {step.title}
                        </h3>
                        <p className="mt-2 text-[15px] leading-6 text-neutral-700">
                          {step.body}
                        </p>
                        {step.imageSrc ? (
                          <figure className="mt-5 overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)]">
                            <Image
                              src={step.imageSrc}
                              alt={step.imageAlt || step.title}
                              width={1024}
                              height={886}
                              className="h-auto w-full"
                              sizes="(max-width: 672px) 100vw, 42rem"
                              priority={index === 0}
                            />
                          </figure>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <>
              <h2
                className="mt-12 text-[22px] font-semibold tracking-[-0.03em] text-neutral-950"
                style={{ fontFamily: DISPLAY }}
              >
                Install
              </h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-[16px] leading-7 text-neutral-700">
                {item.installSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          )}

          {item.slug === "blender" ? (
            <section className="mt-14">
              <h2
                className="text-[22px] font-semibold tracking-[-0.03em] text-neutral-950"
                style={{ fontFamily: DISPLAY }}
              >
                After install
              </h2>
              <ol className="mt-5 space-y-4 text-[15px] leading-6 text-neutral-700">
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[12px] font-semibold text-neutral-950">
                    1
                  </span>
                  <span>
                    Click <span className="font-semibold text-neutral-950">Run Bridge</span> in
                    the Hydrilla panel.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[12px] font-semibold text-neutral-950">
                    2
                  </span>
                  <span>
                    Click <span className="font-semibold text-neutral-950">Sign in</span>, finish
                    login in the browser, then{" "}
                    <span className="font-semibold text-neutral-950">Sync</span>. Keep the Connect
                    tab open while generating.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[12px] font-semibold text-neutral-950">
                    3
                  </span>
                  <span>
                    Generate from text or image — or use{" "}
                    <span className="font-semibold text-neutral-950">Send to DCC</span> from
                    Studio.
                  </span>
                </li>
              </ol>
            </section>
          ) : null}

          {item.status === "coming_soon" ? (
            <p className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-[15px] leading-6 text-neutral-700">
              This connector is on the roadmap. Use GLB export or the REST API today, then check
              back for a native package.
            </p>
          ) : null}
        </article>
      </MarketingPage>
    </>
  );
}
