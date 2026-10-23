# Site pages and routing

Live map of hydrilla.ai routes: which category they sit in, whether they rank, the `<title>` Google sees, and the heading a person sees on the page.

Source of truth for “is this URL in the sitemap?” is `PUBLIC_ROUTES` in `lib/seo.ts`, plus blog posts, compare articles, and integration slugs added in `app/sitemap.ts`.

Canonical host: `https://hydrilla.ai` (`SITE_URL` in `lib/brand.ts`). English only. Title template is `%s | Hydrilla` unless a page sets `absoluteTitle`.

Visible headings below are the current page H1. Metadata titles are the `<title>` from `createPageMetadata` (page or layout).

---

## How a public URL is built

1. `app/<path>/page.tsx` renders the page. Some pages put metadata on the page; others put it on `layout.tsx`.
2. `createPageMetadata()` in `lib/seo.ts` sets canonical, description, Open Graph, Twitter, and `index,follow` (or `noindex,nofollow`).
3. Indexed pages also advertise a markdown mirror: `alternates.types["text/markdown"]` → `https://hydrilla.ai/<path>.md` (homepage is `/index.md`).
4. `next.config.js` rewrites `/*.md` to `app/md/[[...path]]/route.ts`. `/md/` itself is disallowed in robots so it is not a second URL.
5. `app/sitemap.ts` emits `PUBLIC_ROUTES`, then `/integrations/:slug`, blog slugs, and `content/compare/*.md`.

---

## Product

Indexed. Footer column “Product”, plus home and pricing.

| Path | Sitemap | Metadata title | Visible H1 | What the page says |
| --- | --- | --- | --- | --- |
| `/` | 1.0 weekly | `Hydrilla \| Production-Ready 3D Assets, Generated Fast` (absolute) | Homepage hero | Brand sentence. Text or image in, segmented mesh with PBR out, export into a real pipeline. |
| `/features` | 0.9 weekly | `Features \| Hydrilla` | From first prompt to production. | Generate, preview, export. FAQ answers for formats, engines, and inputs. |
| `/bluefox3d` | 0.9 monthly | `BlueFox 3D \| BlueFox 1 generative 3D model` (absolute) | BlueFox 3D | Model family page. BlueFox 1 turns text or a reference into a segmented mesh with PBR, then Hydrilla exports it. |
| `/pricing` | 0.9 weekly | Pricing title from the pricing page | Pricing hero | Free, Starter, Pro, Slot, Slot Pro. Credits, formats, seats, API. |
| `/docs` | 0.8 monthly | `Docs \| Get started with Hydrilla` (absolute) | Get started with Hydrilla | Getting started, text to 3D, image to 3D, preview, GLB/FBX/OBJ/USDZ, workspaces and credits, API. |
| `/api` | 0.7 monthly | `Hydrilla API \| Hydrilla` | Hydrilla REST API | Pro includes REST (10,000 calls/month). Jobs, status, downloads. Partner volume via contact. |
| `/integrations` | 0.8 weekly | `Integrations — Blender, Unity, Unreal, MCP \| Hydrilla` | Integrations | Blender, Unity, Unreal, Godot, MCP, REST. Local Bridge on `127.0.0.1:7345`. |
| `/integrations/blender` | 0.7 monthly | `Blender integration \| Hydrilla` | Blender | Install-from-disk guide and Bridge steps. |
| `/integrations/unity` | 0.7 monthly | `Unity integration \| Hydrilla` | Unity | Editor window, API key, GLB into `Assets/Hydrilla`. |
| `/integrations/unreal` | 0.7 monthly | `Unreal Engine integration \| Hydrilla` | Unreal Engine | Python plugin, GLB into `Content/Hydrilla`. |
| `/integrations/godot` | 0.7 monthly | `Godot integration \| Hydrilla` | Godot | Godot 4 plugin, meshes under `res://hydrilla/`. |
| `/integrations/mcp` | 0.7 monthly | `MCP Server integration \| Hydrilla` | MCP Server | stdio MCP server over the REST API. |
| `/integrations/api` | 0.7 monthly | `REST API integration \| Hydrilla` | REST API | Same task contract the plugins use. |
| `/enterprise` | 0.7 monthly | `Hydrilla Enterprise — Studio Pipelines, Seats, and API \| Hydrilla` (absolute) | Hydrilla for Enterprise | Volume, seats, API, a named contact. Pro is self-serve; Enterprise is a conversation. |
| `/changelog` | 0.6 weekly | `Hydrilla Changelog — Product Updates \| Hydrilla` (absolute) | Changelog | Dated notes: BlueFox 1 in studio, Bridge, REST API, docs. |
| `/rigging` | no | `Rigging \| Hydrilla` | App surface | Not a public product. `noindex` and robots disallow. |

Metadata descriptions (search snippet, not the on-page italic line):

- Features: text-to-3D, image-to-3D, segmented meshes, PBR, preview, GLB/FBX/OBJ/USDZ.
- BlueFox: “BlueFox 3D is Hawan Research Labs’ generative 3D model family…”
- Docs: create a workspace, generate with BlueFox 1, preview, export.
- API: Pro REST access; partner volume via contact; `founders@hydrilla.ai`.
- Enterprise: volume, seats, BlueFox 1 API, custom plans.
- Changelog: what shipped in Hydrilla and BlueFox 1.

---

## Solutions (use cases)

Indexed. Footer column “Use Cases”. Nav group “Solutions”.

| Path | Priority | Metadata title | What the page is for |
| --- | --- | --- | --- |
| `/usecase` | 0.8 | `AI 3D Use Cases for Games, Film, Architecture & XR \| Hydrilla` | Hub. Five pipelines. |
| `/usecase/gamedev` | 0.7 | Game development title from the page | Props and characters for Unity and Unreal. |
| `/usecase/filmproduction` | 0.7 | Film page title | Concept, previs, lookdev. |
| `/usecase/architecture` | 0.7 | Architecture page title | Spatial models and interiors. |
| `/usecase/arvr` | 0.7 | AR/VR page title | Lighter meshes, USDZ, immersive apps. |
| `/usecase/productdesign` | 0.7 | Product viz title | Catalog-ready product models. |

Hub description: how Hydrilla and BlueFox generate production-ready 3D for games, film, architecture, AR/VR, and product visualization.

Old `/case-study` 301s here.

---

## Compare

Indexed. Footer column “Compare”. Articles live in `content/compare/*.md`.

| Path | Priority | Metadata title | Visible H1 |
| --- | --- | --- | --- |
| `/compare` | 0.8 | `Hydrilla vs Meshy, Luma, Tripo — AI 3D Comparisons` (absolute) | Compare |
| `/compare/hydrilla-vs-meshy` | 0.75 | `Hydrilla vs Meshy` (absolute) | How does Hydrilla compare to Meshy? |
| `/compare/hydrilla-vs-tripo` | 0.75 | `Hydrilla vs Tripo` (absolute) | How does Hydrilla compare to Tripo? |
| `/compare/hydrilla-vs-luma` | 0.75 | `Hydrilla vs Luma` (absolute) | How does Hydrilla compare to Luma? |
| `/compare/best-ai-3d-generators` | 0.75 | `Best AI 3D generators` (absolute) | What is the best AI 3D generator for production assets? |

Index lede: side-by-side notes on BlueFox 1 versus Meshy, Tripo, and Luma for production pipelines. Articles are tables of inputs, exports, and who the file is for. They do not claim a quality score. Dates on the cards are 19 Aug 2026.

---

## Resources

Indexed, except the signed-in library and the connect tab.

| Path | Index | Metadata title | Visible H1 |
| --- | --- | --- | --- |
| `/docs` | yes | see Product | Get started with Hydrilla |
| `/api` | yes | see Product | Hydrilla REST API |
| `/integrations` | yes | see Product | Integrations |
| `/faq` | yes, 0.8 | `FAQ \| Hydrilla` | Frequently asked questions |
| `/blog` | yes, 0.8 weekly | `Hydrilla Blog — BlueFox, Pipelines, and 3D Generation` (absolute) | Blog |
| `/blog/page/:page` | follows blog | same family | Blog |
| `/blog/category/:category` | follows blog | same family | Blog |
| `/blog/category/:category/page/:page` | follows blog | same family | Blog |
| `/blog/:slug` | yes, 0.65 | post SEO title, absolute | post headline |
| `/library` | **no** | `Library \| Hydrilla` | 3D Asset Library |
| `/integrations/connect` | **no** | `Connect DCC plugin \| Hydrilla` | Sign in for {app} |

FAQ snippet: answers about 3D generation, BlueFox, pricing, exports, studio workflows.

Blog snippet: guides on text-to-3D, image-to-3D, Unity, Unreal, Blender, and how BlueFox 1 produces meshes.

Blog index lede: notes from the Hydrilla team on BlueFox 1, production exports, and 3D pipelines.

Posts currently served by the blog API (category in parentheses):

| Slug | Title | Category |
| --- | --- | --- |
| `/blog/how-bluefox-works` | How BlueFox works in Hydrilla | BlueFox |
| `/blog/text-to-3d` | Text to 3D in Hydrilla | BlueFox |
| `/blog/image-to-3d` | Image to 3D in Hydrilla | BlueFox |
| `/blog/export-formats` | Hydrilla export formats | Pipeline |
| `/blog/hydrilla-for-unity` | Hydrilla for Unity | Pipeline |
| `/blog/hydrilla-for-unreal` | Hydrilla for Unreal | Pipeline |
| `/blog/hydrilla-for-blender` | Hydrilla for Blender | Pipeline |
| `/blog/hydrilla-pricing-explained` | Hydrilla pricing explained | Plans |

`/blog?category=` and `/blog?page=` 301 to `/blog/category/:category` and `/blog/page/:page`.

`/library` and `/integrations/connect` stay out of the sitemap. Connect is the local Bridge sign-in tab.

---

## Company

Indexed, except `/brand`. Footer column “Company”. Nav group “Company”. Team was not moved onto the article layout; every other company page was.

| Path | Index | Metadata title | Visible H1 |
| --- | --- | --- | --- |
| `/about` | 0.8 | `About Hydrilla, Hawan Research Labs, and BlueFox \| Hydrilla` (absolute) | About Hydrilla |
| `/research` | 0.8 | `Hawan Research Labs \| BlueFox 3D research` (absolute) | Research |
| `/team` | 0.6 | `Team \| Hydrilla` | Team |
| `/careers` | 0.6 | `Careers at Hydrilla — Engineering, Research, GTM` (absolute) | Careers at Hydrilla |
| `/contact` | 0.8 | `Contact Hydrilla — Demos, Studios, and Support` (absolute) | Contact Us |
| `/security` | 0.6 | `Security \| Hydrilla` | How Hydrilla protects your studio assets |
| `/enterprise` | 0.7 | see Product | Hydrilla for Enterprise |
| `/brand` | **no** | `Press kit \| Hydrilla` | Press kit |

On-page ledes:

- About: “Hydrilla is the product. Hawan Research Labs is the lab. BlueFox 3D is the model family.”
- Research: notes on generative 3D that keeps structure, exports cleanly, and keeps studio assets private. Includes the BlueFox 1 model card.
- Team: the people at Hydrilla and Hawan Research Labs building BlueFox 1.
- Careers: engineering, 3D and research, go to market. Apply to `founders@hydrilla.ai`.
- Contact: form, Cal.com (`https://cal.com/hydrilla`), `founders@hydrilla.ai`.
- Security: accounts (Clerk), private assets, exports, vendor reviews.
- Brand: marks, boilerplate, founders, eight sitelink rows. Live for people with the link. Not in nav, footer, sitemap, or `llms.txt`.

`/hawan` 301s to `/research`.

---

## Legal

Indexed at priority 0.3, change frequency yearly. Footer column “Legal”.

| Path | Metadata title | Visible H1 | Snippet |
| --- | --- | --- | --- |
| `/privacy-policy` | `Privacy Policy \| Hydrilla` | Privacy Policy | How we collect, use, and protect data. Last updated 14 Jul 2026. |
| `/terms-and-conditions` | `Terms of Service \| Hydrilla` | Terms of Service | Terms for the 3D platform. Same date. |
| `/cookie-policy` | `Cookie Policy \| Hydrilla` | Cookie Policy | Essential, functional, and analytics cookies. Same date. |

Short aliases: `/privacy` → privacy policy, `/terms` → terms. Both are 301.

---

## Signed-in and utility (not indexed)

`noindex, nofollow` and a robots `Disallow`. They are product UI.

| Prefix | Why it is hidden |
| --- | --- |
| `/app/` | Studio |
| `/workspace/` | Workspace |
| `/generate/` | 302 to `/workspace` |
| `/generations/` | User generations |
| `/library/` | User library |
| `/checkout/` | Payment |
| `/rigging/` | Not a public product |
| `/sign-in/`, `/sign-up/` | Auth |
| `/viewer/` | Asset viewer |
| `/earlyaccess/` | Gated |
| `/md/` | Rewrite target for `.md` mirrors |
| `/brand` | Press kit |

---

## Redirects

From `next.config.js`. Permanent unless noted.

| From | To |
| --- | --- |
| `/generate` | `/workspace` (302) |
| `/3d-ai`, `/science-technology`, `/bluefox`, `/bluefox-3d`, `/models` | `/bluefox3d` |
| `/roadmap` | `/about` |
| `/case-study` | `/usecase` |
| `/hawan` | `/research` |
| `/privacy` | `/privacy-policy` |
| `/terms` | `/terms-and-conditions` |
| `/blog?category=` | `/blog/category/:category` |
| `/blog?page=` | `/blog/page/:page` |

Trailing-slash copies of those sources redirect the same way.

---

## Footer and nav, as shipped

Footer (`lib/nav.ts` → `FOOTER_NAV`):

- **Use Cases** — five verticals and `/usecase`
- **Product** — BlueFox, text/image to 3D, rigging, preview, exports, features, pricing, changelog
- **Compare** — Meshy, Tripo, Luma, best-of, `/compare`
- **Resources** — docs, API, integrations, library, blog, FAQ
- **Company** — contact, about, research, team, careers, enterprise, security, brand
- **Integrations** — Blender, Unity, Unreal, Godot, MCP, Studio Bridge
- **Legal** — privacy, terms, cookies, security

Primary nav: Product, Solutions, Resources, Company, Pricing.
