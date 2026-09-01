import { BlogIndexPageView } from "@/components/blog/BlogIndexPageView";
import { blogIndexMetadata } from "@/components/blog/BlogIndexPageView";

export const revalidate = 3600;
export const metadata = blogIndexMetadata;

export default function BlogIndexPage() {
  return <BlogIndexPageView />;
}
