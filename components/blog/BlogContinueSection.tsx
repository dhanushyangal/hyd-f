import Link from "next/link";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { continueItemsToLinks, fetchBlogContinue } from "@/lib/blog";

export async function BlogContinueSection({ excludeSlug }: { excludeSlug?: string }) {
  const items = await fetchBlogContinue(excludeSlug);
  const related = continueItemsToLinks(items);
  if (!related.length) return null;

  return (
    <nav className="mkt-related" aria-label="Related">
      <p className="mkt-related-label">Continue</p>
      <ul>
        {related.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>
              <span className="mkt-related-title">{item.label}</span>
              {item.hint ? <span className="mkt-related-hint">{item.hint}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
