import Link from "next/link";
import Image from "next/image";
import type { BlogListPost } from "@/lib/blog";
import { blogPostPath, formatBlogDate } from "@/lib/blog";

export function BlogPostCard({ post }: { post: BlogListPost }) {
  const href = blogPostPath(post.slug);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-neutral-100">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              {post.category}
            </span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
          <span className="font-semibold uppercase tracking-[0.12em] text-neutral-500">{post.category}</span>
          {post.publishedAt ? (
            <>
              <span aria-hidden>·</span>
              <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
            </>
          ) : null}
          {post.author ? (
            <>
              <span aria-hidden>·</span>
              <span>{post.author}</span>
            </>
          ) : null}
        </div>
        <Link href={href} className="mt-2 block">
          <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-neutral-950 transition-colors group-hover:text-neutral-700 hover:underline sm:text-[20px]">
            {post.title}
          </h2>
        </Link>
        <Link href={href} className="mt-2 block flex-1">
          <p className="text-[15px] leading-6 text-neutral-600 line-clamp-3 transition-colors hover:text-neutral-800">
            {post.excerpt}
          </p>
        </Link>
        <Link
          href={href}
          className="mt-4 text-[14px] font-medium text-neutral-950 underline-offset-4 hover:underline"
        >
          Read more
        </Link>
      </div>
    </article>
  );
}

export function BlogFeaturedPost({ post }: { post: BlogListPost }) {
  const href = blogPostPath(post.slug);

  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <div className="grid gap-0 md:grid-cols-2">
        <Link
          href={href}
          className="relative block aspect-[16/10] min-h-[200px] bg-neutral-100 md:aspect-auto md:min-h-[280px]"
        >
          {post.coverImage ? (
            <Image src={post.coverImage} alt="" fill className="object-cover" sizes="50vw" priority />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-700 md:min-h-[280px]">
              <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">
                Featured
              </span>
            </div>
          )}
        </Link>
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Latest</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-neutral-400">
            <span className="font-semibold uppercase tracking-[0.12em] text-neutral-500">{post.category}</span>
            {post.publishedAt ? (
              <>
                <span aria-hidden>·</span>
                <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
              </>
            ) : null}
          </div>
          <Link href={href} className="mt-3 block">
            <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-neutral-950 hover:underline sm:text-[28px]">
              {post.title}
            </h2>
          </Link>
          <Link href={href} className="mt-3 block">
            <p className="text-[16px] leading-7 text-neutral-600 transition-colors hover:text-neutral-800">
              {post.excerpt}
            </p>
          </Link>
          <Link
            href={href}
            className="mt-5 inline-flex text-[14px] font-medium text-neutral-950 underline-offset-4 hover:underline"
          >
            Read article
          </Link>
        </div>
      </div>
    </article>
  );
}
