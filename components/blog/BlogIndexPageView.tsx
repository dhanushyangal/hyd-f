import { Suspense } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { BlogContinueSection } from "@/components/blog/BlogContinueSection";
import { BlogIndexGrid } from "@/components/blog/BlogIndexGrid";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const blogIndexMetadata = createPageMetadata({
  title: "Hydrilla Blog — BlueFox, Pipelines, and 3D Generation",
  description:
    "Guides on text-to-3D, image-to-3D, Unity, Unreal, Blender, and how BlueFox 1 produces production meshes.",
  path: "/blog",
  absoluteTitle: true,
});

export function BlogGridSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-5 py-10 sm:px-6 sm:py-14" aria-hidden>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-neutral-100" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-neutral-100" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}

type BlogIndexPageViewProps = {
  page?: number;
  categorySlug?: string;
};

export function BlogIndexPageView({ page = 1, categorySlug }: BlogIndexPageViewProps) {
  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Hydrilla Blog — BlueFox, Pipelines, and 3D Generation",
          description: blogIndexMetadata.description as string,
          path: "/blog",
        })}
      />
      <MarketingPage
        eyebrow="Resources"
        title="Blog"
        description="Answer-first notes on BlueFox, exports, and production 3D. Written so a person or a model can quote them."
        formats={false}
        useBodyFontForTitle
      >
        <Suspense fallback={<BlogGridSkeleton />}>
          <BlogIndexGrid page={page} categorySlug={categorySlug} />
        </Suspense>
        <Suspense fallback={null}>
          <BlogContinueSection />
        </Suspense>
      </MarketingPage>
    </>
  );
}
