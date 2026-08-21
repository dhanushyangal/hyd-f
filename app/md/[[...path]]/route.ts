import { getMarkdownForSlug } from "@/lib/markdown-pages";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { path } = await context.params;
  const markdown = getMarkdownForSlug(path || ["index"]);

  if (!markdown) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
