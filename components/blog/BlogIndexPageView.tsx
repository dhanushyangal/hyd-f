import { Suspense } from "react";
import Footer from "@/components/layout/Footer";
import { ArticleColumn, ArticlePage } from "@/components/layout/ArticlePage";
import { JsonLd } from "@/components/seo/JsonLd";
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

function BlogListSkeleton() {
  return (
    <ArticleColumn className="article-empty" aria-hidden>
      <div className="space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 border-b border-black/10 pb-8">
            <div className="h-7 w-3/4 rounded bg-[#eff4fb]" />
            <div className="h-4 w-full rounded bg-[#eff4fb]" />
            <div className="h-4 w-1/3 rounded bg-[#eff4fb]" />
          </div>
        ))}
      </div>
    </ArticleColumn>
  );
}

export function BlogGridSkeleton() {
  return (
    <>
      <ArticlePage
        headingId="blog-heading"
        title="Blog"
        subtitle="Notes on BlueFox, exports, and production 3D."
      >
        <BlogListSkeleton />
      </ArticlePage>
      <Footer />
    </>
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
      <ArticlePage
        headingId="blog-heading"
        title="Blog"
        subtitle="Notes on BlueFox, exports, and production 3D."
      >
        <Suspense fallback={<BlogListSkeleton />}>
          <BlogIndexGrid page={page} categorySlug={categorySlug} />
        </Suspense>
        <Suspense fallback={null}>
          <BlogContinueSection />
        </Suspense>
      </ArticlePage>
      <Footer />
    </>
  );
}
