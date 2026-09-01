import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = process.env.BLOG_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Revalidation not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let paths: string[] = [];
  try {
    const body = (await req.json()) as { paths?: string[] };
    paths = Array.isArray(body.paths) ? body.paths : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  for (const path of paths) {
    if (typeof path === "string" && path.startsWith("/blog")) {
      revalidatePath(path);
    }
  }

  return NextResponse.json({ revalidated: true, paths });
}
