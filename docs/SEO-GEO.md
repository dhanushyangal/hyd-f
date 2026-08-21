# Hydrilla SEO & GEO inventory

This document is the live map of what hydrilla.ai indexes, what it hides, and why. GEO here means **generative engine optimization**: making Hydrilla, Hawan Research Labs, and BlueFox 1 easy for ChatGPT, Claude, Perplexity, and similar systems to quote correctly.

Canonical sentence (homepage, About, JSON-LD, `llms.txt`):

> Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products.

English only. No hreflang. No thin 40-post blog.

---

## 1. Three named entities

Keep these separate in copy, schema, and LLM files. Same pattern as a lab shipping a product powered by a named model.

| Name | What it is | Public page |
| --- | --- | --- |
| **Hawan Research Labs** | Research lab that builds the model | `/research` |
| **Hydrilla** | Product: studio, workspaces, credits, preview, API | `/` |
| **BlueFox** / **BlueFox 1** | Model family / current model. Marketing title: **BlueFox 3D** | `/bluefox3d` |

Do **not** use in public copy: Bluefox3D-v1, internal ids (`trilles`), “Hydrilla AI Organization”, or backend hosts as canonical URLs.

Do **not** index Water (BYOK), Rigging, or Hunyuan 3D as marketing products.

---

## 2. Index policy

Two layers:

1. **`robots.txt`** (`app/robots.ts`) tells crawlers which path prefixes to skip.
2. **`<meta name="robots">`** via `createPageMetadata({ noIndex: true })` on authenticated or private layouts.

### Index (sitemap + follow)

Public marketing, docs, blog, compare, legal. Listed in `PUBLIC_ROUTES` plus every article under `content/blog/` and `content/compare/`.

### Noindex + robots disallow

These exist as product UI. They should not rank.

| Path prefix | Why it is hidden |
| --- | --- |
| `/app/` | Signed-in studio |
| `/workspace/` | Signed-in workspace |
| `/generate/` | Redirects to workspace; heavy generate UI |
| `/generations/` | User generations |
| `/library/` | User library |
| `/checkout/` | Payment flow |
| `/rigging/` | Internal / not a public product |
| `/sign-in/`, `/sign-up/` | Auth |
| `/viewer/` | Asset viewer |
| `/earlyaccess/` | Campaign / gated |
| `/md/` | Internal rewrite target for `.md` mirrors (public URL is `/*.md`, not `/md/`) |
| `/brand` | Press kit + Ads sitelink paste sheet. **noindex**, **robots Disallow**, not in nav, footer, sitemap, or `llms.txt` |

Googlebot still sees `noindex` on `/brand`. Robots also Disallows `/brand` so it is not a ranking URL. The page remains live for humans who have the link.

---

## 3. Indexed pages (what they are for)

### Product

| URL | Why it exists | What it has |
| --- | --- | --- |
| `/` | Rank for Hydrilla / AI 3D generation. Entity home. | Brand sentence, product thesis, homepage JSON-LD (Organization + ResearchOrganization + two SoftwareApplications) |
| `/features` | Sitelink + “what does it do”. | Generate, preview, export. FAQ answers for formats and engines. |
| `/bluefox3d` | Rank the **model**, not only the company. | BlueFox 1 capabilities, PBR, exports. `SoftwareApplication` JSON-LD. Unique OG when set. |
| `/pricing` | High-intent sitelink. | Free / Creator / Studio. Offer JSON-LD. |
| `/api` | Studio / developer sitelink. | Job-based generation, partner access. |
| `/docs` | “How do I start” sitelink. | Getting started, text/image to 3D, preview, exports, workspaces, API. `TechArticle` JSON-LD. |
| `/enterprise` | Volume buyers, not self-serve Studio. | Seats, API, security review path. |
| `/changelog` | Freshness signal + honest ship log. | Dated product entries (not marketing-graph copy). |

### Solutions

| URL | Why it exists | What it has |
| --- | --- | --- |
| `/usecase` | Hub for industry queries. | Links to five pipelines. |
| `/usecase/gamedev` | “AI 3D for games / Unity / Unreal”. | Game-specific workflow. |
| `/usecase/filmproduction` | Film / animation / VFX. | Concept to mesh. |
| `/usecase/architecture` | Viz / interiors. | Furniture and space dressing. |
| `/usecase/arvr` | XR + USDZ. | Lighter assets, AR viewers. |
| `/usecase/productdesign` | Product viz / commerce. | SKU-ready 3D. |

### Company / trust

| URL | Why it exists | What it has |
| --- | --- | --- |
| `/about` | Entity page. Who builds what. | Lab vs product vs model. Canonical brand sentence. `AboutPage` JSON-LD. |
| `/research` | Lab entity + model card for LLMs. | Inputs, outputs, limits. `ResearchOrganization` JSON-LD. |
| `/team` | People / Knowledge Graph. | Visible names, roles, LinkedIn. `Person` JSON-LD. |
| `/careers` | Hiring + brand. | Roles and how to apply. |
| `/contact` | Sitelink. Demos and studios. | Form, Cal.com, founders email. |
| `/security` | Enterprise trust. | Accounts (Clerk), assets, exports, review path. |
| `/faq` | Answer-engine bait. | Buyer FAQs. `FAQPage` JSON-LD. |

### Learn (clusters, not a thin blog farm)

| URL | Cluster | Why it exists |
| --- | --- | --- |
| `/blog` | Hub | Index of guides, grouped BlueFox / Pipeline / Plans. |
| `/blog/how-bluefox-works` | BlueFox | How generation actually works. |
| `/blog/text-to-3d` | BlueFox | Text input. |
| `/blog/image-to-3d` | BlueFox | Image input. |
| `/blog/export-formats` | Pipeline | GLB, FBX, OBJ, USDZ. |
| `/blog/hydrilla-for-unity` | Pipeline | Unity handoff. |
| `/blog/hydrilla-for-unreal` | Pipeline | Unreal handoff. |
| `/blog/hydrilla-for-blender` | Pipeline | Blender handoff. |
| `/blog/hydrilla-pricing-explained` | Plans | Plan math in prose. |
| `/compare` | Hub | “Hydrilla vs …” queries. |
| `/compare/best-ai-3d-generators` | Compare | Category roundup. |
| `/compare/hydrilla-vs-meshy` | Compare | Honest table vs Meshy. |
| `/compare/hydrilla-vs-luma` | Compare | vs Luma. |
| `/compare/hydrilla-vs-tripo` | Compare | vs Tripo. |

Each article has `Article` JSON-LD, a date, and related links (same cluster first).

### Legal (indexed, low priority)

`/privacy-policy`, `/terms-and-conditions`, `/cookie-policy`

Needed for trust and App Store / ads compliance. Sitemap priority `0.3`, yearly.

---

## 4. Hidden or redirected (not in sitemap)

| URL | Status | Why |
| --- | --- | --- |
| `/brand` | Live, **noindex**, unlisted | Press names + 8 Google Ads sitelink rows. |
| `/case-study` | **301** → `/usecase` | Old thin page. Folded so equity goes to use cases. |
| `/3d-ai` | **301** → `/bluefox3d` | Old model URL. |
| `/science-technology` | **301** → `/bluefox3d` | Old research-ish URL. |
| `/roadmap` | **301** → `/about` | Old page. |
| `/generate` | **302** → `/workspace` | Product path, not marketing. |

---

## 5. `llms.txt` and `llms-full.txt`

Standard GEO files at the site root. Crawlers and agents look for `/llms.txt` the way they look for `/robots.txt`.

### `/llms.txt`

**Why:** Short directory for models. Answer “what is Hydrilla / BlueFox / Hawan” without scraping HTML.

**What it has:**

- Brand sentence
- Entity disambiguation (product ≠ model ≠ lab)
- Links to markdown mirrors (`.md`) for Product, Company, Learn
- Pointer to `/llms-full.txt`
- Changelog and legal as optional (legal HTML, not `.md` required for ranking)

Not listed: `/brand`, app routes, Water, Rigging.

### `/llms-full.txt`

**Why:** Longer quote sheet when a model wants facts in one fetch.

**What it has:**

- The three entities and URLs
- BlueFox 1 inputs / outputs / exports / limits
- Four-step loop
- Plan prices and credits
- Public URL list
- Contact + `sameAs` socials

---

## 6. Markdown page mirrors (GEO)

**Why:** HTML is noisy. Agents prefer `text/markdown`. Same facts as the HTML page, fewer chrome.

**How:**

- Public URL: `https://hydrilla.ai/docs.md`, `https://hydrilla.ai/blog/how-bluefox-works.md`, homepage `https://hydrilla.ai/index.md`
- Next rewrite: `/*.md` → `/md/...`
- Handler: `app/md/[[...path]]/route.ts`
- Source: `lib/markdown-pages.ts` for static pages; `content/blog` and `content/compare` for articles
- HTML pages advertise the mirror: `alternates.types["text/markdown"]` in metadata (skipped on noindex pages)
- `/md/` is **disallowed** in robots so the rewrite target is not a second indexable URL

---

## 7. Robots, sitemap, canonicals

### `robots.txt`

- `User-agent: *` allow `/`, disallow app prefixes listed above
- Explicit allow for AI crawlers: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Bingbot, Applebot
- `Sitemap: https://hydrilla.ai/sitemap.xml`
- `Host: https://hydrilla.ai`

**Why name AI crawlers:** default `*` is not always enough. Search-oriented bots should be invited to the public graph and kept out of `/app/`.

### `sitemap.xml`

Built from `PUBLIC_ROUTES` + all blog/compare articles. Priorities: home `1.0`, pricing/features/bluefox `0.9`, docs/faq/blog/compare `0.8`, legal `0.3`.

**Not in sitemap:** noindex routes, `/brand`, `.md` mirrors (canonical is HTML).

### Canonicals and titles

Every public page: `createPageMetadata()` sets canonical HTML URL, Open Graph, Twitter card, and `index,follow` (or `noindex,nofollow`).

Root title template: `%s | Hydrilla`. Homepage and sitelink-style pages use `absoluteTitle` so Google does not see “Hydrilla | Hydrilla”.

Google Search Console: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` on the root layout when set.

---

## 8. Structured data (JSON-LD)

Emitted as `<script type="application/ld+json">` from `components/seo/JsonLd.tsx`.

| Type | Where | Why |
| --- | --- | --- |
| `Organization` | Homepage | Hydrilla as the company. Logo, email, `sameAs`, founders. |
| `ResearchOrganization` | Homepage + `/research` | Hawan as parent / lab. |
| `SoftwareApplication` (Hydrilla) | Homepage | Product entity. |
| `SoftwareApplication` (BlueFox 1) | Homepage + `/bluefox3d` | Model entity, distinct `@id`. |
| `WebSite` | Homepage | Site node. |
| `WebPage` + `BreadcrumbList` | Most marketing pages | Hierarchy. |
| `AboutPage` | `/about` | About intent. |
| `FAQPage` | `/faq` | Rich results + answer engines. |
| `Offer` on pricing | `/pricing` | Free / Creator / Studio prices. |
| `TechArticle` | `/docs` | Docs as an article, not a random webpage. |
| `Article` | Blog + compare posts | Dates, publisher Hydrilla. |
| `Person` | `/team` + founders on home | People graph. |

Stable `@id`s in `lib/brand.ts`:

- Hydrilla org: `https://hydrilla.ai/#organization`
- Website: `https://hydrilla.ai/#website`
- Product: `https://hydrilla.ai/#software`
- Hawan: `https://hydrilla.ai/research#organization`
- BlueFox: `https://hydrilla.ai/bluefox3d#software`

---

## 9. On-page SEO / GEO techniques

| Technique | Why | What we ship |
| --- | --- | --- |
| One brand sentence everywhere | Models copy conflicting bios | Locked in `lib/brand.ts` |
| Distinct titles per sitelink | Google Ads / organic sitelinks need unique labels | Pricing, BlueFox 3D, Features, Docs, Use cases, API, About, Contact |
| Nav + footer match those labels | Internal links reinforce sitelink candidates | `lib/nav.ts` — FAQ in the top nav; Blog is footer/index only. Footer How It Works → `/features`; About → `/about`; Product Visualization is listed |
| FAQ written as real questions | “What is BlueFox?”, “Does Hydrilla export FBX?” | `lib/faq.ts` + FAQPage schema |
| Comparison cluster | Capture “Hydrilla vs Meshy” without 40 thin posts | 4 compare articles |
| Pipeline cluster | Capture Unity / Unreal / Blender + formats | 4 pipeline posts |
| Related links (“Continue”) | Pass equity and give models the next URL | `MarketingPage` + `getRelatedArticles` |
| Honest limits on Research | Stop models from over-claiming | Model card: not CAD, not finished hero |
| `.md` alternates | Agent-readable twin of HTML | Rewrites + markdown content-type |
| 301 old URLs | Do not split equity | `/case-study`, `/3d-ai`, `/roadmap`, `/science-technology` |
| Index only what should rank | Avoid duplicate / empty / logged-in URLs | robots + noindex layouts |
| `sameAs` socials | Entity matching | X, LinkedIn, Reddit, Instagram |
| `lang="en"` | Language, not hreflang | Root layout |

---

## 10. Off-site (not in this repo, still part of the plan)

These support the on-site graph. They are not automatic.

- Google Search Console property + sitemap submit
- Google Ads sitelink assets (copy lives on hidden `/brand`)
- Consistent profiles: LinkedIn company, X, Crunchbase, Wikidata when ready

---

## 11. Source files

| File | Role |
| --- | --- |
| `lib/brand.ts` | Names, brand sentence, entity `@id`s |
| `lib/seo.ts` | Sitemap routes, metadata helper, JSON-LD |
| `lib/nav.ts` | Navbar and footer |
| `lib/faq.ts` | FAQ answers |
| `lib/content.ts` | Blog/compare loader, clusters, related posts |
| `lib/markdown-pages.ts` | `.md` bodies |
| `app/robots.ts` | robots.txt |
| `app/sitemap.ts` | sitemap.xml |
| `app/md/[[...path]]/route.ts` | Markdown HTTP |
| `public/llms.txt` | Short LLM index |
| `public/llms-full.txt` | Long LLM summary |
| `content/blog/*`, `content/compare/*` | Article source |
| `next.config.js` | Redirects + `.md` rewrites |

---

## 12. Quick “should this URL rank?” test

1. Would we want it as a Google sitelink or a ChatGPT citation? **Index it.**
2. Is it a logged-in tool, checkout, or duplicate of another page? **Noindex / disallow.**
3. Is it press-only (`/brand`)? **Live, noindex, unlisted.**
4. Can an agent quote it without HTML? Prefer a `.md` twin + `llms.txt` link.
