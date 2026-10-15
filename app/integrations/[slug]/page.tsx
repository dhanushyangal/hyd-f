import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { getIntegration, INTEGRATIONS } from "@/lib/integrations";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
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

          <h2
            className="mt-12 text-[22px] font-semibold tracking-[-0.03em] text-neutral-950"
            style={{
              fontFamily:
                "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            Install
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-[16px] leading-7 text-neutral-700">
            {item.installSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={primaryHref}
              className="inline-flex items-center rounded-xl bg-[#111] px-5 py-3 text-[15px] font-semibold text-white hover:bg-neutral-800"
            >
              {primaryLabel}
            </a>
            <Link
              href="/app/api-keys"
              className="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-950 hover:bg-neutral-50"
            >
              API keys
            </Link>
          </div>

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
