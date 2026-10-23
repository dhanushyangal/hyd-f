# SEO and GEO rules

Rules the public site keeps. GEO means generative engine optimization: Hydrilla, Hawan Research Labs, and BlueFox 1 should be easy for Google and for ChatGPT, Claude, and Perplexity to quote without mixing the names up.

Page-by-page URLs and headings are in `docs/SITE-PAGES.md`. The text files agents fetch are in `docs/GEO-TEXT-FILES.md`.

---

## 1. Three names, never collapsed

| Name | What it is | Page |
| --- | --- | --- |
| Hawan Research Labs | Research lab that builds the model | `/research` |
| Hydrilla | Product: studio, workspaces, credits, preview, API | `/` |
| BlueFox / BlueFox 1 | Model family / current model. Marketing title: BlueFox 3D | `/bluefox3d` |

One sentence, reused on the homepage, About, JSON-LD, `llms.txt`, and `llms-full.txt`:

> Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products.

Public copy does not use: `Bluefox3D-v1`, internal ids (`trilles`), “Hydrilla AI Organization”, or a backend host as the canonical URL.

Do not index Water (BYOK), Rigging, or Hunyuan 3D as marketing products.

---

## 2. What is allowed to rank

Two gates. A URL ranks only if it passes both.

1. `app/robots.ts` — crawlers may fetch it.
2. `createPageMetadata()` — `index, follow` (the default). `noIndex: true` emits `noindex, nofollow`.

Indexed set:

- `PUBLIC_ROUTES` in `lib/seo.ts`
- every integration in `lib/integrations.ts` (`/integrations/:slug`)
- every blog slug from the blog API
- every file in `content/compare/`

Not indexed: `/app/`, `/workspace/`, `/generate/`, `/generations/`, `/library/`, `/checkout/`, `/rigging/`, `/sign-in/`, `/sign-up/`, `/viewer/`, `/earlyaccess/`, `/md/`, `/brand`.

`/brand` is a special case. The page is live (press kit and Ads sitelink sheet). It is `noindex`, disallowed in robots, and absent from nav, sitemap, and `llms.txt`.

English only. No hreflang. No thin post farm. Blog stays a short cluster: BlueFox, Pipeline, Plans.

---

## 3. Titles, descriptions, canonicals

`createPageMetadata()` in `lib/seo.ts` sets, for every public page:

- canonical = the HTML URL (`https://hydrilla.ai` + path)
- description (falls back to the brand sentence)
- Open Graph `en_US`, site name Hydrilla, 1200×630 image
- Twitter card `summary_large_image`, `@hydrillaai`
- robots `index, follow`, Googlebot large image preview, unlimited snippet and video
- markdown alternate (`text/markdown`) on indexable pages only

Root template in `app/layout.tsx`: `%s | Hydrilla`.

Pages that must not become “Hydrilla | Hydrilla” pass `absoluteTitle: true`. That set today: home, BlueFox, docs, blog index, compare index and articles, about, research, careers, contact, enterprise, changelog.

Search Console verification is `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` on the root layout when the env var is set.

Descriptions are written as answers, not slogans. Compare pages do not claim “better quality.” They name the lab, the model, the exports, and tell the reader to verify the other product.

---

## 4. Robots

`app/robots.ts` → `/robots.txt`.

- `User-agent: *` — allow `/`, disallow the prefixes in section 2
- The same allow/disallow repeated for: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Bingbot, Applebot
- `Sitemap: https://hydrilla.ai/sitemap.xml`
- `Host: https://hydrilla.ai`

Named AI crawlers exist because `*` is not always honored. They may read the public graph. They may not read `/app/`.

---

## 5. Sitemap

`app/sitemap.ts` → `/sitemap.xml`.

Order: `PUBLIC_ROUTES`, then integration slugs (priority 0.7, monthly), blog slugs (0.65, monthly), compare articles (0.75, monthly).

Priorities on `PUBLIC_ROUTES`:

| Priority | Paths |
| --- | --- |
| 1.0 weekly | `/` |
| 0.9 weekly | `/pricing`, `/features` |
| 0.9 monthly | `/bluefox3d` |
| 0.8 | `/usecase`, `/faq`, `/contact`, `/docs`, `/integrations`, `/about`, `/research`, `/blog`, `/compare` |
| 0.7 | five use cases, `/api`, `/enterprise` |
| 0.6 | `/security`, `/changelog` (weekly), `/team`, `/careers` |
| 0.3 yearly | privacy, terms, cookies |

`lastModified` is the page or layout file mtime, the article date, or the blog `updatedAt`.

Not in the sitemap: noindex routes, `/brand`, `.md` mirrors. The HTML URL is the canonical.

---

## 6. Structured data

`<script type="application/ld+json">` via `components/seo/JsonLd.tsx`. Builders live in `lib/seo.ts`.

| Page | Types |
| --- | --- |
| `/` | `ResearchOrganization` (Hawan), `Organization` (Hydrilla), `WebSite`, two `SoftwareApplication` nodes (Hydrilla product and BlueFox), founders as `Person` |
| `/about` | `AboutPage` |
| `/research` | `ResearchOrganization` |
| `/bluefox3d` | `SoftwareApplication` |
| `/pricing` | `Offer` nodes for the public plans |
| `/docs` | `TechArticle` |
| `/faq` | `FAQPage` |
| `/team` | `Person` |
| `/blog/:slug`, `/compare/:slug` | `Article` with `datePublished` |
| Most other public pages | `WebPage` + `BreadcrumbList` |

Entity `@id`s (`lib/brand.ts`):

- `https://hydrilla.ai/#organization`
- `https://hydrilla.ai/#website`
- `https://hydrilla.ai/#software`
- `https://hydrilla.ai/research#organization`
- `https://hydrilla.ai/bluefox3d#software`

`sameAs`: X, LinkedIn, Reddit, Instagram. Contact email in schema and on the contact page: `founders@hydrilla.ai`.

---

## 7. On-page rules that help both Google and answer engines

- One H1. The first lines state who it is for and what file you leave with.
- Lab, product, and model stay in separate sentences.
- Exports are named: GLB, FBX, OBJ, USDZ. Free is GLB. Paid plans add FBX, OBJ, USDZ.
- Limits are stated: not CAD, not manufacturing drawings, not a finished hero with no artist pass.
- Compare tables say “confirm on their site” for the other product’s prices and formats.
- Related links sit on the page (same cluster first) so the next URL is in the HTML, not only in the nav.
- FAQ answers are real sentences, also exposed as `FAQPage` JSON-LD.
- Dates are visible on articles (compare frontmatter, blog `publishedAt`, legal “14 Jul 2026”).

---

## 8. What we do not do

- No fake SSO or compliance checklist on Enterprise.
- No second indexable URL for the same page (`.md` is an alternate, `/md/` is disallowed).
- No indexing of user libraries, checkout, or the studio.
- No public use of internal model ids.
- `/brand` is not a ranking URL.

Off-site work (Search Console, Ads sitelinks, citations) is outside this repo. The eight sitelink rows pasted for Ads live on `/brand` and are listed in `docs/SITE-PAGES.md`.
