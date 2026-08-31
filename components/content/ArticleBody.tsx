export function ArticleBody({ html }: { html: string }) {
  return (
    <div
      className="markdown-body mx-auto max-w-[42rem] px-5 py-14 text-[16px] leading-7 text-neutral-700 sm:px-6 sm:py-16 sm:text-[17px]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
