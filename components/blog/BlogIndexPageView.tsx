import { Suspense } from "react";
import Footer from "@/components/layout/Footer";
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
    <ul className="pickle-research-grid" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="pickle-research-card">
          <div className="pickle-research-thumbnail animate-pulse bg-[#f5f5f7]" />
          <div className="mt-5 h-7 w-3/4 animate-pulse rounded-lg bg-[#f5f5f7]" />
          <div className="mt-2.5 h-5 w-full animate-pulse rounded-lg bg-[#f5f5f7]" />
          <div className="mt-3.5 h-4 w-1/3 animate-pulse rounded-lg bg-[#f5f5f7]" />
        </li>
      ))}
    </ul>
  );
}

export function BlogGridSkeleton() {
  return (
    <>
      <div className="pickle-research-page">
        <header className="pickle-research-hero">
          <h1 id="blog-heading" className="pickle-research-title">
            Blog
          </h1>
          <p className="pickle-research-description">
            Notes from the Hydrilla team on BlueFox 1, production exports, and 3D pipelines.
          </p>
        </header>
        <BlogListSkeleton />
      </div>
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
      <div className="pickle-research-page">
        <header className="pickle-research-hero">
          <h1 id="blog-heading" className="pickle-research-title">
            Blog
          </h1>
          <p className="pickle-research-description">
            Notes from the Hydrilla team on BlueFox 1, production exports, and 3D pipelines.
          </p>
        </header>
        <Suspense fallback={<BlogListSkeleton />}>
          <BlogIndexGrid page={page} categorySlug={categorySlug} />
        </Suspense>
        <Suspense fallback={null}>
          <BlogContinueSection />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
