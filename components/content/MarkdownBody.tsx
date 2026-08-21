import type { ReactNode } from "react";

const DISPLAY =
  "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif";

export function ProseHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      className="mt-14 text-[22px] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-[26px]"
      style={{ fontFamily: DISPLAY }}
    >
      {children}
    </h2>
  );
}

export function MarkdownBody({ html }: { html: string }) {
  return (
    <div
      className="markdown-body mx-auto max-w-[42rem] px-5 py-14 text-[16px] leading-7 text-neutral-700 sm:px-6 sm:py-16 sm:text-[17px]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MarketingArticle({ children }: { children: ReactNode }) {
  return (
    <article className="mx-auto max-w-[42rem] px-5 py-14 sm:px-6 sm:py-16">{children}</article>
  );
}
