import { continueItemsToLinks, fetchBlogContinue } from "@/lib/blog";
import {
  PickleResearchCard,
  type PickleThumbVariant,
} from "@/components/layout/PicklePage";

const THUMBS: PickleThumbVariant[] = [
  "pipeline-arch",
  "critter-rig",
  "docs-flow",
  "compare-tripo",
];

export async function BlogContinueSection({ excludeSlug }: { excludeSlug?: string }) {
  const items = await fetchBlogContinue(excludeSlug);
  const related = continueItemsToLinks(items);
  if (!related.length) return null;

  return (
    <nav
      aria-label="Continue reading"
      className="pickle-research-container"
      style={{ marginTop: "96px" }}
    >
      <h2 className="pickle-h2" style={{ width: "100%", marginBottom: "36px" }}>
        Continue reading
      </h2>
      <ul className="pickle-research-grid" style={{ width: "100%", marginTop: 0 }}>
        {related.slice(0, 4).map((item, idx) => (
          <PickleResearchCard
            key={item.href}
            item={{
              title: item.label,
              subtitle: item.hint ? `${item.hint} · Production 3D notes` : "Production 3D notes",
              href: item.href,
              date: "Aug 19, 2026",
              author: "Hydrilla Team",
              thumbVariant: THUMBS[idx % THUMBS.length],
            }}
          />
        ))}
      </ul>
    </nav>
  );
}
