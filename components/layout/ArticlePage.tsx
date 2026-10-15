import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ArticlePad = "page" | "section" | "compact";

export function ArticlePage({
  title,
  subtitle,
  kicker,
  meta,
  pad = "page",
  asPage = true,
  headingId,
  wideTitle = false,
  children,
}: {
  title: string;
  subtitle?: string;
  kicker?: ReactNode;
  meta?: ReactNode;
  pad?: ArticlePad;
  asPage?: boolean;
  headingId?: string;
  wideTitle?: boolean;
  children: ReactNode;
}) {
  const Heading = asPage ? "h1" : "h2";

  return (
    <article className="article-page" data-pad={pad} aria-labelledby={headingId}>
      <header className="article-hero">
        {kicker ? <p className="article-kicker">{kicker}</p> : null}
        <Heading
          className="article-title"
          data-size={asPage ? "page" : "section"}
          data-wide={wideTitle ? "true" : undefined}
          id={headingId}
        >
          {title}
        </Heading>
        {subtitle ? <p className="article-subtitle">{subtitle}</p> : null}
        {meta}
      </header>
      {children}
    </article>
  );
}

export function ArticleSection({
  title,
  titleId,
  lead,
  children,
  className,
}: {
  title?: string;
  titleId?: string;
  lead?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("article-section", className)} aria-labelledby={title ? titleId : undefined}>
      {title ? (
        <div className="article-column">
          <h2 id={titleId} className="article-h2">
            {title}
          </h2>
          {lead ? <p className="article-body mt-4">{lead}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function ArticleColumn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("article-column", className)}>{children}</div>;
}
