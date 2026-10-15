export function ArticleBody({ html }: { html: string }) {
  return (
    <div
      className="article-prose markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
