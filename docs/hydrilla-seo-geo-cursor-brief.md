# Hydrilla.ai SEO + GEO implementation brief

Give this file to Cursor. Implement **all** of it in the hydrilla.ai repo. Do not invent a parallel content strategy. Do not farm a 40-post blog. Do not market Water, Rigging, or Hunyuan 3D as public products.

**Goal:** Search engines and answer engines (Google, ChatGPT, Claude, Perplexity, Gemini) can correctly name and recommend three entities, and can quote real facts instead of “coming soon.”

**Audience:** 3D artists, technical artists, indie teams, and studios.

---

## 0. Non-negotiables

1. One brand sentence, verbatim, everywhere it belongs (homepage body, About, Research, BlueFox 3D, FAQ Q1, JSON-LD descriptions, `llms.txt`, `llms-full.txt`):

   > Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products.

2. Three named entities. Never collapse them.

   | Name | What it is | Canonical URL |
   | --- | --- | --- |
   | **Hawan Research Labs** | Research lab that builds the model | `https://hydrilla.ai/research` |
   | **Hydrilla** | Product: studio, workspaces, credits, preview, API | `https://hydrilla.ai/` |
   | **BlueFox 3D** / **BlueFox 1** | Model family / current model. Marketing title **BlueFox 3D**. Model id **BlueFox 1**. | `https://hydrilla.ai/bluefox3d` |

3. Spelling lock (use these exact strings in public copy and schema):
   - Hydrilla (not HydrillaAI as a word; “Hydrilla AI” is allowed as a display name)
   - Hawan Research Labs (plural Labs, always)
   - BlueFox 3D (not Bluefox3D, not Bluefox 3d, not Bluefox3D-v1)
   - BlueFox 1 (not v1 in public copy)
   - Email: `founders@hydrilla.ai` only. Never `founders@hydrilla.co` on the site.

4. Do **not** use in public copy: Bluefox3D-v1, internal ids (`trilles`), “Hydrilla AI Organization”, backend hosts as canonical URLs, “plugin for Meshy/Rodin.”

5. Do **not** index: `/app/`, `/workspace/`, `/generate/`, `/generations/`, `/library/`, `/checkout/`, `/rigging/`, `/sign-in/`, `/sign-up/`, `/viewer/`, `/earlyaccess/`, `/md/`, `/brand`.

6. English only. No hreflang. No thin blog farm.

7. If a page is still a stub (“coming soon”), it must be `noindex, nofollow` and **removed from the sitemap**. Indexing emptiness is worse than a 404.

8. Marketing pages must be **server-rendered**. Do not hide body copy, FAQ answers, or the brand sentence in client-only JS. Claude-User and many LLM fetchers do not run JavaScript.

9. Do not invent metrics (hours saved, polycounts, benchmark scores). If a number is not already on `/pricing` or in this brief, omit it.

10. Do not add Wikipedia/Wikidata pages from this task. Off-site listings (G2, Capterra, LinkedIn copy) are out of repo scope except `sameAs` URLs already used.

---

## 1. Repo map (edit these; do not invent a second SEO system)

| File | Role |
| --- | --- |
| `lib/brand.ts` | Names, brand sentence, entity `@id`s, sameAs, email |
| `lib/seo.ts` | `PUBLIC_ROUTES`, `createPageMetadata()`, JSON-LD helpers |
| `lib/nav.ts` | Navbar and footer |
| `lib/faq.ts` | FAQ Q&A used by `/faq` **and** FAQPage JSON-LD |
| `lib/content.ts` | Blog/compare loader, clusters, related posts |
| `lib/markdown-pages.ts` | `.md` bodies for static pages |
| `components/seo/JsonLd.tsx` | `<script type="application/ld+json">` |
| `app/robots.ts` | robots.txt |
| `app/sitemap.ts` | sitemap.xml |
| `app/md/[[...path]]/route.ts` | Markdown HTTP (`/*.md` → `/md/...`) |
| `public/llms.txt` | Short LLM index |
| `public/llms-full.txt` | Long LLM quote sheet |
| `content/blog/*` | Blog MDX/MD |
| `content/compare/*` | Compare MDX/MD |
| `next.config.js` | Redirects + `/*.md` rewrites |

If a file is named slightly differently, find the equivalent and use it. Do not duplicate helpers.

Stable `@id`s (must match `lib/brand.ts`):

- Hydrilla org: `https://hydrilla.ai/#organization`
- Website: `https://hydrilla.ai/#website`
- Hydrilla product: `https://hydrilla.ai/#software`
- Hawan: `https://hydrilla.ai/research#organization`
- BlueFox 1: `https://hydrilla.ai/bluefox3d#software`

---

## 2. Technical work (do first so new pages inherit it)

### 2.1 Metadata helper

Every public page uses `createPageMetadata()`. Fix bugs:

- `/about` currently reuses the homepage **title, description, and canonical** (`https://hydrilla.ai`). About must have its own `absoluteTitle` or unique title, unique description, and canonical `https://hydrilla.ai/about`.
- Homepage and sitelink-style pages use `absoluteTitle` so Google does not see “Hydrilla \| Hydrilla”.
- Root title template: `%s | Hydrilla`.
- Public pages: `index,follow`. Stubs / private: `noindex,nofollow`.
- HTML pages that have a markdown twin set `alternates.types["text/markdown"]` to the `.md` URL. Skip on noindex pages.
- Features **meta description must not mention rigging.** Current live meta does. Replace with the copy in §4.

### 2.2 JSON-LD

Emit from `JsonLd.tsx`. Homepage `@graph` today is only Organization + WebSite + WebPage. Expand it.

**Homepage `@graph` must include:**

1. `Organization` Hydrilla — name `Hydrilla`, alternateName `["Hydrilla AI", "Hydrilla.ai"]`, url, logo, email `founders@hydrilla.ai`, description = brand sentence, `sameAs` (X, LinkedIn, Reddit, Instagram — keep existing URLs), `parentOrganization` → Hawan `@id`, `makesOffer` / `hasOfferCatalog` optional. Founders as `Person` if you already have them.
2. `ResearchOrganization` Hawan Research Labs — `@id` research#organization, name, url `https://hydrilla.ai/research`, description from §4 Research lede.
3. `SoftwareApplication` Hydrilla — `@id` `#software`, applicationCategory `DesignApplication`, offers free tier, description = brand sentence, `softwareHelp` docs URL when docs exist.
4. `SoftwareApplication` BlueFox 1 — `@id` bluefox3d#software, name `BlueFox 1`, alternateName `["BlueFox 3D", "BlueFox"]`, `provider` Hawan, `isRelatedTo` / offered through Hydrilla, description from §4 BlueFox lede.
5. `WebSite` + `WebPage` as now.

**Per-page extra types:**

| Page | Extra JSON-LD |
| --- | --- |
| `/about` | `AboutPage` |
| `/research` | `ResearchOrganization` (full) + `WebPage` + `BreadcrumbList` |
| `/bluefox3d` | `SoftwareApplication` BlueFox 1 + `WebPage` + `BreadcrumbList` |
| `/pricing` | `Offer` for Free / Creator / Studio (prices already on page: $0 / $9 / $25 monthly) |
| `/faq` | `FAQPage` with **all** Q&A from `lib/faq.ts` (must match visible SSR text) |
| `/docs` | `TechArticle` only once docs have real body; otherwise noindex and no schema |
| `/team` | `Person` for each listed person (name, jobTitle, url, `sameAs` LinkedIn if present) |
| Blog + compare | `Article` with datePublished, dateModified, publisher Hydrilla, mainEntityOfPage |
| Most marketing | `WebPage` + `BreadcrumbList` |

Use-case pages already emit SoftwareApplication + Offer `$0`. Keep that, but make the SoftwareApplication `@id` point at `https://hydrilla.ai/#software` so you do not mint five duplicate product entities.

### 2.3 robots.txt (`app/robots.ts`)

Keep existing `User-agent: *` Allow `/` and the current Disallow list. Add:

```
Disallow: /viewer/
Disallow: /earlyaccess/
Disallow: /md/
Disallow: /brand

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Applebot
Allow: /
```

Each named bot must still inherit the same Disallow prefixes as `*` (repeat Disallows per group, or structure so they apply). **Do not** block Claude-SearchBot, Claude-User, OAI-SearchBot, or PerplexityBot.

Keep:
```
Sitemap: https://hydrilla.ai/sitemap.xml
Host: https://hydrilla.ai
```

Confirm Cloudflare / Vercel bot fight is **not** blocking those user-agents on marketing routes.

### 2.4 sitemap.xml (`app/sitemap.ts`)

Build from `PUBLIC_ROUTES` + every article under `content/blog/` and `content/compare/`.

**Include only URLs that are 200 with real copy and `index,follow`.**

Priorities:

- Home `1.0`
- `/pricing`, `/features`, `/bluefox3d` `0.9`
- `/docs`, `/faq`, `/blog`, `/compare`, `/research`, `/about` `0.8`
- Use-case hub `0.8`, verticals `0.7`
- `/contact`, `/team`, `/api` (only if not a stub) `0.6–0.8`
- Legal `0.3` yearly

**Remove from sitemap until they have real copy:** `/docs` if still coming soon, `/api` if still coming soon, `/careers` if still one line, `/3d-ai`, `/case-study`, `/roadmap`.

**Add when shipped:** `/about`, `/research`, `/bluefox3d`, `/blog`, each post, `/compare`, each compare article, `/security` when written.

**Never in sitemap:** noindex routes, `/brand`, `.md` mirrors (HTML is canonical).

Use real `lastmod` from file mtime or frontmatter, not one identical timestamp for every URL.

`sitemap.xml` must return **200** `application/xml` for all user-agents (some fetchers currently 500).

### 2.5 Redirects (`next.config.js`)

Permanent 301:

| From | To |
| --- | --- |
| `/3d-ai` | `/bluefox3d` |
| `/science-technology` | `/bluefox3d` |
| `/case-study` | `/usecase` |
| `/roadmap` | `/about` |
| `/hawan` | `/research` |
| `/bluefox` | `/bluefox3d` |
| `/bluefox-3d` | `/bluefox3d` |
| `/models` | `/bluefox3d` |

Keep `/generate` → `/workspace` as a **302** (product path, not marketing).

Optional aliases (301) if easy: `/privacy` → `/privacy-policy`, `/terms` → `/terms-and-conditions`.

After 301, old URLs must **not** remain in the sitemap.

### 2.6 Markdown mirrors + llms.txt

- Public URL: `https://hydrilla.ai/index.md`, `/about.md`, `/research.md`, `/bluefox3d.md`, `/docs.md`, `/faq.md`, `/features.md`, `/pricing.md`, and `/*.md` for each blog/compare article.
- Next rewrite: `/*.md` → `/md/...`
- `/md/` disallowed in robots.
- Source: `lib/markdown-pages.ts` for static pages; `content/blog` and `content/compare` for articles.
- Markdown bodies = same facts as HTML, no chrome.
- Ship `public/llms.txt` and `public/llms-full.txt` using the copy in §5. They must 200 as `text/plain`.

### 2.7 Nav + footer (`lib/nav.ts`)

**Navbar** (keep short): Solutions, Features, Pricing, FAQ, Contact. Add **BlueFox 3D** as a sitelink-quality item if there is room (Features or a Models item pointing at `/bluefox3d`). Do not add Blog to the top nav yet.

**Footer — fix bugs:**

| Label | Must go to |
| --- | --- |
| How It Works | `/features` (or homepage section that actually exists). Today `/#howitworks` is a dead hash. |
| About | `/about` (today it points at `/team`) |
| Documentation | `/docs` |
| API | `/api` |
| Pricing | `/pricing` |
| FAQ | `/faq` |
| Contact | `/contact` |
| Careers | `/careers` |
| Game / Film / Architecture / AR-VR | existing usecase URLs |
| Product Visualization | `/usecase/productdesign` (**add**; it is live but missing from footer) |
| Research | `/research` |
| BlueFox 3D | `/bluefox3d` |
| Team | `/team` |

Sitelink-style labels must be unique: Pricing, BlueFox 3D, Features, Docs, Use cases, API, About, Contact.

Primary marketing CTA may keep linking to `/generate` for humans. Crawlers already cannot follow it (disallowed). That is fine. Do not make `/generate` the only place the product is explained.

---

## 3. Page status after this PR

| URL | Action |
| --- | --- |
| `/` | Expand copy + JSON-LD. Keep H1 punchy. |
| `/about` | Replace “Content coming soon”. Own title + canonical. Index. Sitemap. |
| `/research` | **Create.** Lab entity + model card. |
| `/bluefox3d` | **Create.** Model entity. |
| `/features` | Keep 6 cards. Add H1. Fix meta (no rigging). Add short FAQ. |
| `/pricing` | Keep plans. Add on-page FAQ. Offer JSON-LD. |
| `/faq` | SSR **all** answers. FAQPage schema. Extra Qs below. |
| `/docs` | Either a real getting-started **or** `noindex` + drop from sitemap. Prefer a real page using §4.7. |
| `/api` | Same: real “partner / Studio API” page **or** noindex. Fix email to `.ai`. |
| `/usecase` + 5 verticals | Keep. Add one concrete example each. Deduplicate schema `@id`. |
| `/team` | Keep names. Add one factual line + LinkedIn if you have URLs. Person JSON-LD. Do not invent bios. Do not add people who are not already on the page. |
| `/careers` | One paragraph + how to apply, **or** noindex + drop from sitemap. |
| `/contact` | Keep. |
| `/enterprise` | Optional this PR. If skipped, do not 404 from nav (there is no nav link today). Pricing already has an enterprise blurb. |
| `/security` | **Create** a short trust page (accounts/Clerk, assets, exports, review path) so “security review” is not a dead claim. |
| `/changelog` | Skip this PR unless a dated log already exists. |
| `/blog` + 8 posts | Create cluster. |
| `/compare` + 4 posts | Create cluster. |
| `/llms.txt`, `/llms-full.txt` | Create. |
| `/3d-ai`, `/science-technology`, `/roadmap`, `/case-study` | 301 as in §2.5. Delete stub pages. |
| Legal | Keep. Indexed, low priority. |

---

## 4. Copy to ship (use this text; light edits for voice/components OK)

### 4.1 Homepage `/`

**Title (absolute):** `Hydrilla | Production-Ready 3D Assets, Generated Fast`  
**Meta:** the brand sentence.

**H1:** keep `Build 3D Better` if design requires it, or `Production-ready 3D from text or image`.

**Above the fold (required paragraph, SSR):**

Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products. Generate from a text prompt or a reference image, preview in the browser, and export GLB, FBX, OBJ, or USDZ into Unity, Unreal, Blender, and other pipelines.

**Entity block (3 short lines, link the names):**

- **Hydrilla** is the product: studio, workspaces, credits, preview, and export.
- **BlueFox 3D** is the model family. **BlueFox 1** is the model that runs generation today. → `/bluefox3d`
- **Hawan Research Labs** builds BlueFox. → `/research`

**How it works (give this section `id="howitworks"` so the old hash can 301/redirect, or just fix the footer):**

1. Describe the asset or drop a reference image.
2. BlueFox 1 generates a segmented mesh with PBR maps (base color, metalness, roughness, normals).
3. Preview in the browser. Inspect materials and parts before you download.
4. Export GLB, FBX, OBJ, or USDZ and drop into your engine or DCC.

**Who it is for:** 3D artists, technical artists, indie teams, and studios filling props, environments, visualization, and concept meshes.

**Honest limit (one sentence):** Hydrilla is for production-ready generated assets you can refine. It is not CAD, not print-ready engineering, and not a finished hero with no artist pass.

**CTAs:** Start for free → product. Book a demo → `/contact` or Cal.com.

Do not leave the homepage at a slogan plus a mission line.

### 4.2 About `/about`

**Title:** `About Hydrilla, Hawan Research Labs, and BlueFox | Hydrilla`  
**Meta:** `Hydrilla is the product. Hawan Research Labs is the lab. BlueFox 3D is the model family. Built for creators and studios who need production-ready 3D, fast.`  
**Canonical:** `https://hydrilla.ai/about`

**H1:** About Hydrilla

**Body:**

Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products.

Hydrilla is the product: a studio for text-to-3D and image-to-3D, in-browser preview, team workspaces, and exports into real pipelines. It is built for 3D artists, technical artists, and the teams who work with them.

Hawan Research Labs is the research lab that builds the models behind Hydrilla. The first public model family is BlueFox 3D. The model you run in Hydrilla today is BlueFox 1.

BlueFox 1 turns a prompt or a reference image into a segmented mesh with PBR materials, then Hydrilla lets you preview and export GLB, FBX, OBJ, and USDZ for Unity, Unreal, Blender, and other tools.

We do not treat generated meshes as a replacement for art direction. Hydrilla is how you get to a clean, editable base faster, then finish the work in your own pipeline.

[Meet the team](/team) · [Research](/research) · [BlueFox 3D](/bluefox3d) · [Contact](/contact)

### 4.3 Research `/research`

**Title:** `Hawan Research Labs | BlueFox 3D research`  
**Meta:** `Hawan Research Labs builds generative 3D models. BlueFox 1 is the first public model, shipped in Hydrilla as BlueFox 3D.`

**H1:** Hawan Research Labs

**Lede:**

Hawan Research Labs is the research lab that builds the generative 3D models behind Hydrilla. Our first public model family is BlueFox 3D. The current model is BlueFox 1.

**What we work on:** generative 3D from text and images, production-oriented meshes, PBR materials, and exports that land in game, film, architecture, and XR pipelines.

**BlueFox 1 model card**

| | |
| --- | --- |
| Model | BlueFox 1 |
| Family | BlueFox 3D |
| Product | Hydrilla |
| Inputs | Text prompt, reference image |
| Outputs | Segmented mesh, PBR maps (base color, metalness, roughness, normals) |
| Exports (via Hydrilla) | GLB, FBX, OBJ, USDZ |
| Intended use | Props, environments, visualization, concept-to-production assets |
| Not intended | CAD, manufacturing drawings, print-ready engineering, finished film/game heroes with no artist pass |

BlueFox 1 is available to creators and studios through [Hydrilla](/). Read the product model page at [BlueFox 3D](/bluefox3d).

### 4.4 BlueFox 3D `/bluefox3d`

**Title:** `BlueFox 3D | BlueFox 1 generative 3D model`  
**Meta:** `BlueFox 3D is Hawan Research Labs’ generative 3D model family. BlueFox 1 turns text or images into segmented meshes with PBR, exported from Hydrilla.`

**H1:** BlueFox 3D

**Body:**

BlueFox 3D is the generative 3D model family built by Hawan Research Labs. BlueFox 1 is the current model. It runs inside Hydrilla, the product used by creators, studios, and teams.

BlueFox 1 generates production-oriented meshes from a text prompt or a reference image. Meshes arrive segmented into logical parts, with PBR maps (base color, metalness, roughness, normals) you can preview in Hydrilla and export as GLB, FBX, OBJ, or USDZ.

Use it for game props and environments, film and animation concept assets, architectural visualization, XR objects, and product viz. Then refine in Unity, Unreal, Blender, Maya, or your DCC.

BlueFox 1 is not a CAD system and not a replacement for a hero-asset artist. It is the fast path to a clean, editable 3D base.

Hydrilla is how you run BlueFox 1: workspaces, credits, preview, team delivery, and export. [Start on Hydrilla](/) · [Hawan Research Labs](/research) · [Features](/features)

### 4.5 Features `/features`

**Title:** `Features | Hydrilla`  
**Meta:** `Text-to-3D and image-to-3D, segmented meshes, PBR materials, in-browser preview, and GLB, FBX, OBJ, and USDZ exports for Unity, Unreal, and Blender.`  
**Add an H1:** `From first prompt to production.`

Keep the six existing cards (text/image, segmentation, PBR, exports, preview, workspaces). Do not add a rigging card.

Add a short FAQ (also reuse on `/faq` where overlapping):

- **What formats does Hydrilla export?** GLB, FBX, OBJ, and USDZ (GLB on Free; all formats on Creator and Studio).
- **Which engines and tools?** Unity, Unreal, Blender, and other DCCs that ingest those formats. Film vertical also names Maya, Cinema 4D, and Houdini as import targets, not plugins we ship.
- **Text or image?** Both.

### 4.6 FAQ `/faq` (SSR every answer)

**Title:** `FAQ | Hydrilla`  
Keep the existing meta if accurate.

Put **all** answers in `lib/faq.ts` and render them in the HTML. No accordion-only-in-JS.

**Q&A (final copy):**

**Who is Hydrilla designed for?**  
Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products.

**How fast is generation?**  
Hydrilla can generate structured 3D assets in minutes, so teams spend less time on early modeling and concept asset production. Final hero quality still needs an artist pass.

**Is there a free plan available?**  
Yes. The Free plan is $0/month with 200 credits and GLB export, so you can generate a limited number of models before upgrading.

**Can I change or cancel my plan anytime?**  
Yes. Plans can be upgraded, downgraded, or cancelled at any time from account settings.

**Is Hydrilla difficult to learn?**  
No. If you already work in Unity, Unreal, or Blender, you generate, preview, and export into the same formats you already import.

**What inputs does Hydrilla support?**  
Text prompts and reference images.

**What is BlueFox 3D?**  
BlueFox 3D is the model family built by Hawan Research Labs. BlueFox 1 is the current model that runs generation inside Hydrilla.

**What is Hawan Research Labs?**  
Hawan Research Labs is the research lab that builds BlueFox. Hydrilla is the product you use to run it.

**Can Hydrilla integrate with my pipeline?**  
Yes. Export GLB, FBX, OBJ, and USDZ. Studio plans include API access for production workflows. See [/api](/api) and [/docs](/docs).

**Do I own what I generate?**  
Yes. Hydrilla’s terms grant personal and commercial use of generated content. Read the Terms for the full license.

Emit `FAQPage` JSON-LD with these exact questions and answers.

### 4.7 Docs `/docs` (minimum viable, so it can be indexed)

**Title:** `Docs | Get started with Hydrilla`  
**H1:** Get started

1. Create an account and open a workspace.  
2. Start a generation with a text prompt or a reference image (BlueFox 1).  
3. Wait for the mesh. Inspect parts, PBR, and silhouette in the browser preview.  
4. Export GLB (Free) or GLB/FBX/OBJ/USDZ (Creator/Studio).  
5. Import into Unity, Unreal, Blender, or your DCC.

Link Features, Pricing, API, FAQ. If you cannot ship this much, `noindex` the current “Coming Soon” page and drop it from the sitemap.

### 4.8 API `/api`

Replace “Coming soon” **or** noindex it. Preferred short page:

**H1:** Hydrilla API  
Studio plans include REST API access (10,000 calls/month on Studio). Programmatic generation for pipelines. Partner and volume access via [Contact](/contact). Email `founders@hydrilla.ai`.

Do not claim a public OpenAPI if it does not exist. If there is no callable public API yet, say “API access is available on Studio and by partner arrangement” and keep a waitlist/contact CTA. That is still better than “Coming soon” in the sitemap.

### 4.9 Security `/security`

**Title:** `Security | Hydrilla`  
Short page: accounts via Clerk; generated assets and exports are private on Creator/Studio as stated on Pricing; contact for enterprise security review. No invented certifications (SOC2 etc.) unless you already have them.

### 4.10 Careers `/careers`

If no open roles: “We hire people who care about generative 3D and production pipelines. Write to founders@hydrilla.ai with a short note and work.” That is enough to index **or** noindex. Do not leave “Interested in joining…?” as the only sentence in the sitemap.

### 4.11 Team `/team`

Keep the eight people already listed. Do not invent bios. Optional one-liners only if they are true (e.g. “Co-Founder”, already there). Add `Person` JSON-LD. Footer About must stop pointing here.

### 4.12 Use cases

Keep all five. On each vertical, add **one concrete example** so they do not read as clones, e.g.:

- Game: background props and environment fill for Unreal/Unity, not hero characters with no cleanup.
- Film: concept meshes and set dressing before DCC hero work.
- Architecture: furniture and interior fill for viz, not BIM.
- AR/VR: lighter GLB/USDZ objects for spatial layouts.
- Product: SKU-style product meshes for viewers and campaigns.

Keep existing capability blocks.

### 4.13 Pricing

Keep Free $0 / Creator $9 / Studio $25 and the compare table. Add the free/cancel/formats FAQ from §4.6. Offer JSON-LD. Enterprise stays a contact block pointing at `/contact` (and `/security` once live).

---

## 5. `llms.txt` and `llms-full.txt`

### `public/llms.txt`

```txt
# Hydrilla

> Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products.

Hydrilla is the product. Hawan Research Labs is the research lab. BlueFox 3D is the model family. BlueFox 1 is the current model.

## Product
- [Hydrilla](https://hydrilla.ai/): https://hydrilla.ai/index.md
- [Features](https://hydrilla.ai/features.md)
- [BlueFox 3D / BlueFox 1](https://hydrilla.ai/bluefox3d.md)
- [Pricing](https://hydrilla.ai/pricing.md)
- [Docs](https://hydrilla.ai/docs.md)
- [FAQ](https://hydrilla.ai/faq.md)
- [API](https://hydrilla.ai/api.md)

## Company
- [About](https://hydrilla.ai/about.md)
- [Hawan Research Labs](https://hydrilla.ai/research.md)
- [Team](https://hydrilla.ai/team.md)
- [Contact](https://hydrilla.ai/contact.md)
- [Security](https://hydrilla.ai/security.md)

## Learn
- [Blog](https://hydrilla.ai/blog)
- [Compare](https://hydrilla.ai/compare)

## Optional
- [Changelog](https://hydrilla.ai/changelog) (if it exists)
- Legal: Privacy, Terms, Cookies (HTML)

Full quote sheet: https://hydrilla.ai/llms-full.txt
```

Only link `.md` files that you actually generate. If docs/api are noindex stubs, omit them from this file.

### `public/llms-full.txt`

Include: brand sentence; the three entities and URLs; BlueFox 1 inputs/outputs/exports/limits from the Research model card; four-step loop; plan prices and credits from live Pricing (Free 200 / Creator 1,000 / Studio 4,000; $0 / $9 / $25; formats and seats as on the page); public URL list; contact `founders@hydrilla.ai`; `sameAs` socials. Do not list `/brand`, app routes, Water, or Rigging.

---

## 6. Blog cluster (8 posts, not 40)

Create `content/blog/` (or the repo’s existing content dir) and `/blog` index grouped **BlueFox / Pipeline / Plans**.

Each post: unique title, first paragraph is the answer, H2s as questions, internal links to the same cluster first, then product pages, `Article` JSON-LD, `datePublished`, related-links (“Continue”), `.md` twin.

Do not write fake case studies or fake benchmarks.

### 6.1 `how-bluefox-works` — cluster BlueFox

**Title:** How BlueFox works in Hydrilla  
**H1:** How does BlueFox 1 generate 3D?  
**Answer-first:** BlueFox 1, built by Hawan Research Labs and run in Hydrilla, turns a text prompt or reference image into a segmented mesh with PBR maps you can preview and export.  
Cover: Hydrilla vs BlueFox vs Hawan; inputs; segmentation; PBR; limits (not CAD, not finished hero). Link `/bluefox3d`, `/research`.

### 6.2 `text-to-3d` — BlueFox

**Title:** Text to 3D with Hydrilla  
**H1:** How do I generate 3D from text?  
Prompt → BlueFox 1 → preview → export. Prompting tips that are honest (be specific about object, style, scale). Link Features + BlueFox.

### 6.3 `image-to-3d` — BlueFox

**Title:** Image to 3D with Hydrilla  
**H1:** How do I generate 3D from an image?  
Reference image as input. What a good reference looks like. Same export path.

### 6.4 `export-formats` — Pipeline

**Title:** Hydrilla export formats: GLB, FBX, OBJ, USDZ  
**H1:** Which 3D formats does Hydrilla export?  
Table: format → typical use (GLB/web/AR, FBX/DCC/engines, OBJ/universal, USDZ/Apple AR). Free vs paid formats. Link Pricing.

### 6.5 `hydrilla-for-unity` — Pipeline

**Title:** Hydrilla for Unity  
**H1:** How do I use Hydrilla assets in Unity?  
Export FBX or GLB, import, materials. Not a Unity plugin unless you actually ship one (today you do not on the public site). Do not claim a plugin.

### 6.6 `hydrilla-for-unreal`

Same pattern for Unreal (FBX). No invented plugin.

### 6.7 `hydrilla-for-blender`

Same for Blender (GLB/FBX/OBJ). No invented add-on. LinkedIn currently calls Hydrilla a Blender/Maya plugin; **the site must not repeat that claim** unless the plugin is a real shipped product.

### 6.8 `hydrilla-pricing-explained` — Plans

**Title:** Hydrilla pricing explained  
Prose version of Free / Creator / Studio: credits, formats, seats, API, when to upgrade. Link `/pricing`. No discounts that are not on the page (yearly −20% may be mentioned if the toggle is live).

Blog index `/blog`: group the three clusters. No other posts in this PR.

---

## 7. Compare cluster (4 pages)

Create `/compare` hub + articles. Honest. Do not defame. Where you lack a measured benchmark, compare **workflow facts** (formats, PBR, segmentation, studio/workspaces, who the product is for).

### 7.1 `best-ai-3d-generators`

Category roundup. Name the category: AI 3D generators for production assets. List Hydrilla (BlueFox 1) next to Meshy, Luma, Tripo as alternatives people already search. Criteria: text/image input, export formats, production vs research preview, team workflow. State Hydrilla’s intended user (creators/studios, production-ready meshes, not CAD).

### 7.2 `hydrilla-vs-meshy`

Table: inputs, exports, PBR/segmentation, who it’s for. Hydrilla = BlueFox 1 via Hydrilla studio. Do not claim “better quality” without evidence. Do claim the three-entity story and production exports.

### 7.3 `hydrilla-vs-luma`

Luma is often video/NeRF/splats in public perception; Hydrilla is mesh + PBR + DCC/engine export. Be precise, not snarky.

### 7.4 `hydrilla-vs-tripo`

Same honest table pattern.

Hub `/compare` lists the four with one-line summaries. Related links point inside this cluster. `Article` JSON-LD on each.

---

## 8. Implementation order (single PR is fine if sequential)

1. `lib/brand.ts` lock + JSON-LD `@id`s + metadata helper fixes (About canonical).
2. robots.txt named crawlers + extra Disallows.
3. Redirects. Delete stub pages that 301 away.
4. Nav/footer link bugs.
5. Ship `/about`, `/research`, `/bluefox3d` with copy above.
6. Expand homepage; `id="howitworks"` or footer fix.
7. SSR FAQ + FAQPage + extra questions.
8. Features H1 + meta (no rigging) + pricing Offer schema.
9. Docs/API: real minimum copy or noindex + sitemap drop.
10. `/security` short page.
11. Sitemap rebuild (include new entities; exclude stubs; include `/about`).
12. Markdown mirrors + `llms.txt` + `llms-full.txt`.
13. Blog 8 + compare 4 + indexes.
14. Use-case concrete examples + schema `@id` fix.
15. Team Person JSON-LD.
16. QA against §9.

---

## 9. Acceptance checks (Cursor: actually hit production-preview or `next start`)

Must all pass:

- [ ] `GET /about` has unique title, meta, canonical `https://hydrilla.ai/about`, and more than “coming soon”
- [ ] `GET /research` 200, says Hawan Research Labs + BlueFox 1 model card
- [ ] `GET /bluefox3d` 200, says BlueFox 3D / BlueFox 1 / Hawan / Hydrilla
- [ ] `GET /3d-ai`, `/science-technology`, `/roadmap`, `/case-study` are **301** (not 200 stubs)
- [ ] `GET /llms.txt` and `/llms-full.txt` 200 text/plain
- [ ] `GET /index.md`, `/about.md`, `/research.md`, `/bluefox3d.md`, `/faq.md` 200
- [ ] `GET /robots.txt` names GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended
- [ ] `GET /sitemap.xml` 200 for a normal UA **and** a bot-like UA; lists `/about`, `/research`, `/bluefox3d`; does **not** list `/3d-ai` or coming-soon stubs
- [ ] Homepage HTML (view-source, no JS) contains the brand sentence, “BlueFox”, and “Hawan Research Labs”
- [ ] FAQ view-source contains **all** answers, not just Q1
- [ ] FAQ JSON-LD `FAQPage` present
- [ ] Homepage JSON-LD includes ResearchOrganization + both SoftwareApplications
- [ ] Footer About → `/about`; How It Works is not a dead hash; Product Visualization is linked
- [ ] No page meta mentions rigging
- [ ] No `founders@hydrilla.co` on the site
- [ ] `/docs` and `/api` are either real copy or `noindex` and absent from sitemap
- [ ] Blog index + 8 posts 200; compare index + 4 posts 200
- [ ] Features and Pricing have a visible H1
- [ ] Cloudflare/Vercel does not 403 Claude-User / GPTBot on these URLs (spot-check headers if you can)

---

## 10. Out of scope for this PR

- G2, Capterra, Product Hunt, Wikipedia, Wikidata (do later; need human accounts)
- Google Search Console / Bing / Brave webmaster signup (human)
- Changing LinkedIn company copy (human: stop saying Meshy/Rodin/plugin unless true)
- Shipping Water, Rigging, Hunyuan as marketing pages
- A 40-post blog, glossary farm, or `/how-it-works` as a fourth empty URL
- Inventing SOC2, plugin listings, or quality scores

---

## 11. Voice

Plain, specific, production-oriented. Creators and artists, not “synergy.” Repeat the brand sentence; do not paraphrase it into a new slogan on every page. Prefer “production-ready 3D assets” over “AI magic.” Prefer “BlueFox 1 generates” over “our proprietary stack.”
