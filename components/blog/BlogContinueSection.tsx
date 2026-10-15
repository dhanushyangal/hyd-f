import Link from "next/link";
import { ArticleColumn } from "@/components/layout/ArticlePage";
import { continueItemsToLinks, fetchBlogContinue } from "@/lib/blog";

export async function BlogContinueSection({ excludeSlug }: { excludeSlug?: string }) {
  const items = await fetchBlogContinue(excludeSlug);
  const related = continueItemsToLinks(items);
  if (!related.length) return null;

  return (
    <nav className="article-continue" aria-label="Continue reading">
      <ArticleColumn>
        <h2 className="article-h3">Continue</h2>
        <ul>
          {related.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <span>{item.label}</span>
                {item.hint ? <span className="article-continue-hint">{item.hint}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </ArticleColumn>
    </nav>
  );
}
