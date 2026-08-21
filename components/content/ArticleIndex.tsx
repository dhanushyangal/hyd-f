import Link from "next/link";
import type { Article } from "@/lib/content";

export function ArticleIndex({
  groups,
}: {
  groups: { cluster: string; articles: Article[] }[];
}) {
  return (
    <div className="mx-auto max-w-[42rem] px-5 py-14 sm:px-6 sm:py-16">
      {groups.map((group) => (
        <section key={group.cluster} className="mb-12 last:mb-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            {group.cluster}
          </h2>
          <ul className="mt-4 space-y-6">
            {group.articles.map((post) => (
              <li
                key={post.slug}
                className="border-b border-neutral-200 pb-6 last:border-0 last:pb-0"
              >
                <p className="text-[12px] tabular-nums text-neutral-400">
                  {post.datePublished}
                </p>
                <Link
                  href={post.path}
                  className="mt-1 block text-[20px] font-semibold tracking-[-0.03em] text-neutral-950 hover:underline"
                >
                  {post.title}
                </Link>
                <p className="mt-2 text-[16px] leading-7 text-neutral-600">
                  {post.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
