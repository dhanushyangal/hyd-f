import Footer from "@/components/layout/Footer";

export default function BlogArticleLoading() {
  return (
    <>
      <article className="article-page" data-pad="page" aria-hidden>
        <header className="article-hero">
          <div className="h-4 w-16 rounded bg-[#eff4fb]" />
          <div className="h-12 w-full rounded bg-[#eff4fb] sm:h-16" />
          <div className="h-5 w-3/4 rounded bg-[#eff4fb]" />
        </header>
        <div className="article-cover" />
        <div className="article-prose space-y-3">
          <div className="h-4 w-full rounded bg-[#eff4fb]" />
          <div className="h-4 w-full rounded bg-[#eff4fb]" />
          <div className="h-4 w-5/6 rounded bg-[#eff4fb]" />
          <div className="h-4 w-2/3 rounded bg-[#eff4fb]" />
        </div>
      </article>
      <Footer />
    </>
  );
}
