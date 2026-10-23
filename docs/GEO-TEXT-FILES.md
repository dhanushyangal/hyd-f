# GEO text files

The files agents and answer engines are meant to read instead of scraping chrome. Routing of the site itself is in `docs/SITE-PAGES.md`. Ranking rules are in `docs/SEO-GEO-RULES.md`.

All of these are served from the site root. They are not pages in the sitemap.

---

## `/llms.txt`

File: `public/llms.txt`.

Short directory. A model should be able to answer “what is Hydrilla / BlueFox / Hawan” from this file alone.

It contains:

1. The brand sentence as a blockquote.
2. One disambiguation line: Hydrilla is the product, Hawan Research Labs is the lab, BlueFox 3D is the family, BlueFox 1 is the current model.
3. Links to markdown mirrors, grouped:
   - **Product** — `/index.md`, `/features.md`, `/bluefox3d.md`, `/pricing.md`, `/docs.md`, `/faq.md`, `/api.md`
   - **Company** — `/about.md`, `/research.md`, `/team.md`, `/contact.md`, `/security.md`
   - **Learn** — `/blog`, `/compare` (HTML hubs)
   - **Optional** — `/changelog` if present; legal pages as HTML
4. Pointer to `https://hydrilla.ai/llms-full.txt`.

Not listed: `/brand`, `/app`, `/library`, Water, Rigging, checkout, auth.

Homepage mirror is `/index.md`, not `/.md`.

---

## `/llms-full.txt`

File: `public/llms-full.txt`.

The quote sheet. One fetch, the facts we are willing to have repeated.

Sections, in order:

**Entities**

- Hawan Research Labs — lab — `https://hydrilla.ai/research`
- Hydrilla — product — `https://hydrilla.ai/`
- BlueFox 3D family, BlueFox 1 current model — `https://hydrilla.ai/bluefox3d`
- “Do not collapse these names.”

**BlueFox 1 model card**

- Inputs: text prompt, reference image
- Outputs: segmented mesh; PBR maps (base color, metalness, roughness, normals)
- Exports via Hydrilla: GLB, FBX, OBJ, USDZ
- Intended: props, environments, visualization, concept-to-production
- Not intended: CAD, manufacturing drawings, print-ready engineering, finished heroes with no artist pass

**How it works**

1. Describe the asset or drop a reference image.
2. BlueFox 1 generates a segmented mesh with those four PBR maps.
3. Preview in the browser and inspect parts before download.
4. Export GLB, FBX, OBJ, or USDZ into the engine or DCC.

**Plans (public)**

| Plan | Price | Credits | Window | Extra |
| --- | --- | --- | --- | --- |
| Free | $0 | 100 | any time | GLB |
| Starter | $5 | 900 | any time | all four formats |
| Pro | $12 | 3,000 | any time | seats, REST API 10,000 calls/month, all formats |
| Slot | $3 | 900 | one chosen hour each day | all formats |
| Slot Pro | $8 | 3,000 | two chosen hours each day | all formats |

Credit math in the file: 30 credits from an uploaded image; 45 when the prompt also creates the source image. 100 credits ≈ 2 text models or 3 image models. 900 ≈ 20 or 30. 3,000 ≈ 66 or 100. Plans are monthly. Switching to or from Slot means cancelling the current paid plan first. Volume past Pro is `/enterprise`.

**Public pages**

Home, features, pricing, bluefox3d, usecase, docs, api, faq, about, research, blog, compare, security, team, careers, contact, enterprise, changelog. The file notes that those HTML URLs also have a `.md` mirror where `llms.txt` lists one.

**Contact and sameAs**

- `founders@hydrilla.ai`
- `https://cal.com/hydrilla`
- `https://x.com/hydrillaai`
- `https://www.linkedin.com/company/hydrilla-ai`
- `https://www.reddit.com/r/hydrilla`
- `https://www.instagram.com/hydrilla.ai`

When plan numbers change, update this file, `lib/pricing.ts`, and the pricing page together. The blog post `hydrilla-pricing-explained` is rewritten at request time from `lib/pricing.ts` so it cannot drift.

---

## Markdown mirrors (`/*.md`)

HTML is noisy. Agents get the same facts as `text/markdown`.

**Public URL**

- `https://hydrilla.ai/index.md` for home
- `https://hydrilla.ai/docs.md`, `https://hydrilla.ai/about.md`, and the same pattern for any other static page
- `https://hydrilla.ai/blog/how-bluefox-works.md`
- `https://hydrilla.ai/compare/hydrilla-vs-meshy.md`

**How the request is routed**

`next.config.js` rewrites, before the page router:

| Request | Internal |
| --- | --- |
| `/index.md` | `/md/index` |
| `/:file.md` | `/md/:file` |
| `/:dir/:file.md` | `/md/:dir/:file` |
| `/:dir/:subdir/:file.md` | `/md/:dir/:subdir/:file` |

Handler: `app/md/[[...path]]/route.ts`. Response header: `Content-Type: text/markdown; charset=utf-8`.

Body:

- Static pages: the `PAGE_MARKDOWN` map in `lib/markdown-pages.ts` (index, about, pricing, features, and the other marketing pages).
- Compare: `content/compare/<slug>.md` via `lib/content.ts`.
- Blog: the post HTML converted with `htmlToMarkdownLite()` in `lib/blog.ts`.

HTML pages point at the mirror with `alternates.types["text/markdown"]` inside `createPageMetadata()`. Noindex pages do not advertise a mirror.

`/md/` is in the robots disallow list so the rewrite target is not a second canonical. Sitemap entries are HTML only.

---

## What each text surface is for

| URL | Audience | Job |
| --- | --- | --- |
| `/llms.txt` | Any agent that looks for it the way it looks for `robots.txt` | Directory and name split |
| `/llms-full.txt` | A model that wants one quote sheet | Model card, plans, URL list, contact |
| `/*.md` | A model that already has a page URL | That page’s facts without nav and footer |
| HTML page | People and Google | Canonical, with JSON-LD and the visible H1 |
| `/robots.txt` | Every crawler | What not to fetch |
| `/sitemap.xml` | Search engines | What to index |

Keep the brand sentence identical across `llms.txt`, `llms-full.txt`, `lib/brand.ts` (`BRAND_SENTENCE`), the homepage description, and About.
