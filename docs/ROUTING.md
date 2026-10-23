# Kept, moved, and the words

This is the live copy. A path in **Kept** still opens the same address. A path in **Moved** no longer has its own page. The words under each kept path are the words on that page now: the browser title, the heading, and the line under the heading.

Browser titles use the template `… | Hydrilla` unless the row says the title is absolute.

---

## Moved

These addresses do not render a page. The browser is sent to the kept path.

| Old address | Sent to | Status | Name on the page it lands on |
| --- | --- | --- | --- |
| `/generate` | `/workspace` | 302 | Workspace |
| `/generate/` | `/workspace` | 302 | Workspace |
| `/3d-ai` | `/bluefox3d` | 301 | BlueFox 3D |
| `/3d-ai/` | `/bluefox3d` | 301 | BlueFox 3D |
| `/science-technology` | `/bluefox3d` | 301 | BlueFox 3D |
| `/science-technology/` | `/bluefox3d` | 301 | BlueFox 3D |
| `/bluefox` | `/bluefox3d` | 301 | BlueFox 3D |
| `/bluefox/` | `/bluefox3d` | 301 | BlueFox 3D |
| `/bluefox-3d` | `/bluefox3d` | 301 | BlueFox 3D |
| `/bluefox-3d/` | `/bluefox3d` | 301 | BlueFox 3D |
| `/models` | `/bluefox3d` | 301 | BlueFox 3D |
| `/models/` | `/bluefox3d` | 301 | BlueFox 3D |
| `/roadmap` | `/about` | 301 | About Hydrilla |
| `/roadmap/` | `/about` | 301 | About Hydrilla |
| `/case-study` | `/usecase` | 301 | Use cases built for production |
| `/case-study/` | `/usecase` | 301 | Use cases built for production |
| `/hawan` | `/research` | 301 | Research |
| `/hawan/` | `/research` | 301 | Research |
| `/privacy` | `/privacy-policy` | 301 | Privacy Policy |
| `/privacy/` | `/privacy-policy` | 301 | Privacy Policy |
| `/terms` | `/terms-and-conditions` | 301 | Terms of Service |
| `/terms/` | `/terms-and-conditions` | 301 | Terms of Service |
| `/blog?category=<name>` | `/blog/category/<name>` | 301 | Blog |
| `/blog?page=<n>` | `/blog/page/<n>` | 301 | Blog |
| `/app` | `/app/studio` | redirect inside the page | Studio |

`/md/...` is not a public page. `https://hydrilla.ai/about.md` stays in the address bar and is rewritten to the markdown handler. The public words are the `.md` address, not `/md/about`.

---

## Kept, with the heading changed

The address did not move. The heading on the page did.

| Path | Heading before | Heading now |
| --- | --- | --- |
| `/research` | Hawan Research Labs | Research |
| `/docs` | Get started | Get started with Hydrilla |
| `/api` | Hydrilla API | Hydrilla REST API |
| `/integrations` | Your tools, Hydrilla inside | Integrations |
| `/faq` | Pricing, exports, BlueFox, pipelines | Frequently asked questions |
| `/compare` | Hydrilla vs other 3D generators | Compare |
| `/contact` | Contact | Contact Us |
| `/careers` | Careers | Careers at Hydrilla |
| `/enterprise` | Enterprise | Hydrilla for Enterprise |
| `/security` | Security | How Hydrilla protects your studio assets |

These kept the same heading: `/`, `/features`, `/bluefox3d`, `/pricing`, `/usecase` and the five use-case paths, `/changelog`, `/blog` and each post, `/about`, `/team`, `/brand`, `/privacy-policy`, `/terms-and-conditions`, `/cookie-policy`, `/library`.

`/team` also kept the old page layout. It was not moved onto the Research or article layout.

---

## Nav words

Primary nav, left to right. The first column is the word in the bar. The second is where that word goes. The rest are the words inside the menu.

**Product** → `/features`

- Generate: Text to 3D → `/docs#text-to-3d`. Image to 3D → `/docs#image-to-3d`. BlueFox 3D → `/bluefox3d`.
- Pipeline: Features → `/features`. Preview → `/docs#preview`. Exports → `/docs#export`.
- Build: API → `/api`. Integrations → `/integrations`. Rigging → `/rigging`.
- Scale: Enterprise → `/enterprise`. Security → `/security`.

**Solutions** → `/usecase`

- Industries: Game development → `/usecase/gamedev`. Film & animation → `/usecase/filmproduction`. Architecture → `/usecase/architecture`. AR / VR & XR → `/usecase/arvr`.
- Visualization: Product visualization → `/usecase/productdesign`. All solutions → `/usecase`.
- Teams: Studios → `/enterprise`. Enterprise → `/enterprise`. Startup → `/pricing`.

**Resources** → `/docs`

- Learn: Documentation → `/docs`. Integrations → `/integrations`. FAQ → `/faq`. Blog → `/blog`. Changelog → `/changelog`.
- Compare: Hydrilla vs Meshy → `/compare/hydrilla-vs-meshy`. Hydrilla vs Tripo → `/compare/hydrilla-vs-tripo`. Hydrilla vs Luma → `/compare/hydrilla-vs-luma`. Best AI 3D generators → `/compare/best-ai-3d-generators`.

**Company** → `/about`

- Hydrilla: About → `/about`. Team → `/team`. Careers → `/careers`. Contact → `/contact`.
- Lab: Research → `/research`. BlueFox 3D → `/bluefox3d`.
- Trust: Security → `/security`. Brand → `/brand`.

**Pricing** → `/pricing`

---

## Footer words

**Use Cases**

Game Development → `/usecase/gamedev`. Film & Animation → `/usecase/filmproduction`. Architecture & Interiors → `/usecase/architecture`. AR / VR & XR → `/usecase/arvr`. Product Visualization → `/usecase/productdesign`. All Use Cases → `/usecase`.

**Product**

BlueFox 3D → `/bluefox3d`. Text to 3D → `/docs#text-to-3d`. Image to 3D → `/docs#image-to-3d`. Auto-Rigging → `/rigging`. 3D Preview & Viewer → `/docs#preview`. Multi-format Exports → `/docs#export`. Features → `/features`. How It Works → `/features`. Pricing → `/pricing`. Changelog → `/changelog`.

**Compare**

Hydrilla vs Meshy → `/compare/hydrilla-vs-meshy`. Hydrilla vs Tripo → `/compare/hydrilla-vs-tripo`. Hydrilla vs Luma → `/compare/hydrilla-vs-luma`. Best AI 3D Generators → `/compare/best-ai-3d-generators`. All Comparisons → `/compare`.

**Resources**

Documentation → `/docs`. REST API → `/api`. Integrations → `/integrations`. 3D Asset Library → `/library`. Blog → `/blog`. FAQ → `/faq`.

**Company**

Contact Us → `/contact`. About → `/about`. Research → `/research`. Team → `/team`. Careers → `/careers`, with the badge “We are hiring!”. Enterprise → `/enterprise`. Security → `/security`. Brand → `/brand`.

**Integrations**

Blender Add-on → `/integrations/blender`. Unity Engine → `/integrations/unity`. Unreal Engine → `/integrations/unreal`. Godot 4 → `/integrations/godot`. MCP Server → `/integrations/mcp`. Studio Bridge → `/integrations/connect`.

**Legal**

Privacy Policy → `/privacy-policy`. Terms of Service → `/terms-and-conditions`. Cookie Policy → `/cookie-policy`. Security & Trust → `/security`.

**Get in touch** is the heading above `founders@hydrilla.ai`. It is not a page.

---

## Home — kept `/`

Browser title, absolute: `Hydrilla | Production-Ready 3D Assets, Generated Fast`

Description: `Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products.`

---

## Product pages that were kept

### Features — `/features`

Eyebrow: Product

Heading: From first prompt to production.

Line: Text-to-3D and image-to-3D with BlueFox, segmented meshes, PBR maps, Studio editing, API access, and exports for Unity, Unreal, and Blender.

Browser title: `Features | Hydrilla`

Description: Text-to-3D and image-to-3D, segmented meshes, PBR materials, in-browser preview, and GLB, FBX, OBJ, and USDZ exports for Unity, Unreal, and Blender.

On-page questions: “What formats does Hydrilla export?” “Which engines and tools?” “What inputs does Hydrilla support?”

Continue links: BlueFox 3D, Docs, Use cases.

### BlueFox 3D — `/bluefox3d`

Kicker: Model

Heading: BlueFox 3D

Line: BlueFox 3D is the generative 3D model family built by Hawan Research Labs. BlueFox 1 is the current model. It runs inside Hydrilla, the product used by creators, studios, and teams.

Browser title, absolute: `BlueFox 3D | BlueFox 1 generative 3D model`

Section heading: Why segmented geometry + PBR

Button: Start on Hydrilla → `/app/studio`

Cards: Hawan Research Labs → `/research`. Compare AI 3D Generators → `/compare`.

### Pricing — `/pricing`

Heading: Pricing

Line: Monthly credits for 3D generation. Save 40% when you generate in a daily selected hour.

Browser title: `Pricing: Free, Starter, Pro, and Hourly Plans | Hydrilla`

Description: Hydrilla pricing: Free $0, Starter $5, Pro $12, Hourly $3, Hourly Pro $8. Includes a 14-day free trial, monthly model generations, and full plugin suite.

Toggle words: Monthly. Hourly. “40% off on Hourly”.

Table caption: Default quality. Text is 45 credits per model. An uploaded image is 30.

### Documentation — `/docs`

Kicker: Documentation

Heading: Get started with Hydrilla

Line: From first prompt to a production export in Unity, Unreal, or Blender.

Date line: Aug 19, 2026 | Hydrilla Team

Browser title, absolute: `Docs | Get started with Hydrilla`

Description: Get started with Hydrilla: create a workspace, generate with BlueFox 1 from text or image, preview, and export GLB, FBX, OBJ, or USDZ.

On this page: Getting started. Text to 3D. Image to 3D. Preview. Export formats. Workspaces and credits. API.

Section headings, in order: Getting started. Text to 3D. Image to 3D. Preview. Export formats. Workspaces and credits. API.

Button: Open Studio → `/app/studio`

Cards: Hydrilla REST API → `/api`. DCC & Engine Integrations → `/integrations`.

### REST API — `/api`

Kicker: Developers

Heading: Hydrilla REST API

Line: Programmatic BlueFox 1 generation for studio asset pipelines, engines, and internal tools.

Browser title: `Hydrilla API | Hydrilla`

Description: Pro plans include REST API access for programmatic generation. Partner and volume access via contact. Email founders@hydrilla.ai.

Section headings: What you can integrate. Access & authentication.

Button: Get API Key → `/app/api-keys`

Cards: Documentation → `/docs`. DCC & Engine Integrations → `/integrations`.

### Integrations — `/integrations`

Heading: Integrations

Line: Native Blender add-on, game-engine plugins, a local Bridge for Studio-to-DCC send, plus MCP and REST for custom pipelines.

Browser title: `Integrations — Blender, Unity, Unreal, MCP | Hydrilla`

Cards on the page, title then line:

- Blender — Generate text/image to 3D and import GLB in Blender.
- Unity — Import game-ready GLB into the Unity Editor.
- Unreal Engine — Import Hydrilla meshes into Unreal Editor.
- Godot — Bring Hydrilla GLB into Godot 4 projects.
- MCP Server — Let AI agents generate 3D through Hydrilla over MCP.
- REST API — Build custom pipelines with the Hydrilla API.

Later headings: How the local Bridge works. Frequently asked questions.

Buttons: Sign in for plugins → `/integrations/connect`. Create API key → `/app/api-keys`.

### Changelog — `/changelog`

Heading: Changelog

Line: Notes from the Hydrilla team on what shipped across BlueFox 1, Studio, DCC integrations, and the REST API.

Browser title, absolute: `Hydrilla Changelog — Product Updates`

Description: What shipped in Hydrilla and BlueFox 1: generation, exports, studio, and API.

Cards:

- BlueFox 1 in the studio → `/bluefox3d`. Aug 19, 2026 | Hydrilla Team.
- Blender, Unity, Unreal & Godot Bridge → `/integrations`. Aug 24, 2026 | Hydrilla Team.
- Studio REST API → `/api`. Aug 19, 2026 | Hydrilla Team.
- Docs, FAQ, and pipeline notes → `/docs`. Aug 19, 2026 | Hydrilla Team.

### Enterprise — `/enterprise`

Kicker: Studios

Heading: Hydrilla for Enterprise

Line: BlueFox 1 at studio volume: seats, API concurrency, and files that land in Unreal, Unity, or a DCC stack you already run.

Browser title, absolute: `Hydrilla Enterprise — Studio Pipelines, Seats, and API`

Description: Volume generation, team seats, and BlueFox 1 API access for studios. Custom plans and pipeline support.

Section headings: What studios ask for. How this differs from Pro. How to start.

Button: Book a demo → `https://cal.com/hydrilla`

Cards: Security & Trust → `/security`. Hydrilla REST API → `/api`.

### Security — `/security`

Kicker: Trust

Heading: How Hydrilla protects your studio assets

Line: The keys to your account, how generated meshes stay scoped to your workspace, and how files enter your pipeline.

Date line: Oct 1, 2026 | Hydrilla Team

Browser title: `Security | Hydrilla`

Description: How Hydrilla handles accounts, generated assets, and exports. Trust details for studios evaluating BlueFox 1 in a production pipeline.

Section headings: Accounts & session isolation. Generated assets & storage. Exports & vendor reviews.

Button: Contact Security → `mailto:founders@hydrilla.ai`

Cards: Enterprise → `/enterprise`. Privacy Policy → `/privacy-policy`.

### Auto-Rigging — `/rigging`

Browser title: `Rigging | Hydrilla`

Signed in. Not a public marketing heading. Footer word is Auto-Rigging. Nav word is Rigging.

---

## Solutions — kept

### All Use Cases — `/usecase`

Eyebrow: Solutions

Heading: Use cases built for production

Line: Game, film, architecture, XR, and product teams. Same BlueFox 1 workflow, industry-ready exports.

Browser title: `AI 3D Use Cases for Games, Film, Architecture & XR | Hydrilla`

Description: See how Hydrilla and BlueFox generate production-ready 3D for game development, film and animation, architecture, AR/VR, and product visualization.

List words on the hub:

- Game Development — Characters, props, and environments for real-time engines.
- Film & Animation — Concept and production assets for cinematic pipelines.
- Architecture & Interiors — Furniture and interior elements for visualization.
- AR / VR & XR — Lightweight assets for immersive experiences.
- Product Visualization — Product models for marketing and digital commerce.

### Game Development — `/usecase/gamedev`

Switcher word: Game development

Heading: Ship game-ready assets faster

Line: Characters, props, and environments with clean geometry for Unreal, Unity, and other real-time pipelines.

Browser title: `AI 3D Assets for Game Development | Hydrilla`

Description: Generate game-ready characters, props, and environments with clean geometry for Unreal Engine, Unity, and real-time pipelines.

Section: Built for real-time production

Feature words: Engine-ready models. Consistent iteration. Scalable asset libraries. Standard exports.

### Film & Animation — `/usecase/filmproduction`

Switcher word: Film & animation

Heading: Production assets for film pipelines

Line: Characters, props, and environments for animation and VFX—from early concept to DCC-ready exports.

Browser title: `AI 3D Assets for Film & Animation | Hydrilla`

Description: Create characters, props, and environments for animation and VFX. Export to Maya, Blender, Cinema 4D, and Houdini-ready formats.

Section: Built for cinematic workflows

Feature words: High-detail generation. Faster concept exploration. DCC-ready exports. Art-directed control.

### Architecture & Interiors — `/usecase/architecture`

Switcher word: Architecture

Heading: Visualization assets without the modeling wait

Line: Furniture, interiors, and architectural components for presentations and design reviews.

Browser title: `AI 3D Assets for Architecture & Interiors | Hydrilla`

Description: Generate furniture, interiors, and architectural elements for visualization, client presentations, and design reviews.

Section: Built for design visualization

Feature words: Interiors & furnishings. Rapid design iteration. Client-ready visuals. Standard 3D exports.

### AR / VR & XR — `/usecase/arvr`

Switcher word: AR / VR

Heading: Assets for immersive experiences

Line: Lightweight, spatially coherent 3D for VR, AR, and spatial apps—from prototype to production.

Browser title: `AI 3D Assets for AR, VR & XR | Hydrilla`

Description: Create lightweight, spatially coherent 3D assets for VR, AR, and spatial applications. Export formats ready for immersive pipelines.

Section: Built for spatial pipelines

Feature words: Real-time friendly models. Rapid spatial prototyping. Platform exports. Consistent scale.

### Product Visualization — `/usecase/productdesign`

Switcher word: Product design

Heading: Product visuals from concept to commerce

Line: Marketing-ready 3D for packaging, campaigns, and digital storefronts.

Browser title: `AI 3D Assets for Product Visualization | Hydrilla`

Description: Turn product concepts into polished 3D for marketing, e-commerce, and digital storefronts. Export standard formats for your stack.

Section: Built for product teams

Feature words: Clean product models. Concept to presentation. Commerce-ready exports. Rapid variants.

---

## Compare — kept

### Compare — `/compare`

Heading: Compare

Line: Side-by-side notes from the Hydrilla team on BlueFox 1 versus Meshy, Tripo, and Luma for production 3D pipelines.

Browser title, absolute: `Hydrilla vs Meshy, Luma, Tripo — AI 3D Comparisons`

Description: Side-by-side notes on Hydrilla and BlueFox 1 versus Meshy, Luma, and Tripo for production 3D generation.

Article cards use the article title and description below. Extra cards: BlueFox 3D. Documentation. Heading above those two: Continue exploring.

### Hydrilla vs Meshy — `/compare/hydrilla-vs-meshy`

Kicker: Compare

Heading: How does Hydrilla compare to Meshy?

Line: Hydrilla runs BlueFox 1 in a studio with segmented meshes, PBR, and GLB, FBX, OBJ, and USDZ export. Meshy is a widely used AI 3D generator. Compare workflow facts, not slogans.

Browser title, absolute: `Hydrilla vs Meshy`

Date line: Aug 19, 2026 | Hydrilla Team

In-page heading: Side by side

### Hydrilla vs Tripo — `/compare/hydrilla-vs-tripo`

Heading: How does Hydrilla compare to Tripo?

Line: Hydrilla and Tripo both turn text or images into 3D. Hydrilla is BlueFox 1 inside a studio with GLB, FBX, OBJ, and USDZ export. Compare tables, then bake off in your scene.

Browser title, absolute: `Hydrilla vs Tripo`

### Hydrilla vs Luma — `/compare/hydrilla-vs-luma`

Heading: How does Hydrilla compare to Luma?

Line: Luma is often associated with video, NeRF, and Gaussian splats. Hydrilla is mesh plus PBR plus DCC and engine export via BlueFox 1. Different jobs.

Browser title, absolute: `Hydrilla vs Luma`

In-page heading: How to decide

### Best AI 3D Generators — `/compare/best-ai-3d-generators`

Heading: What is the best AI 3D generator for production assets?

Line: AI 3D generators for production assets. Hydrilla (BlueFox 1) sits next to Meshy, Luma, and Tripo. Compare inputs, exports, and whether the file is a mesh you can ship.

Browser title, absolute: `Best AI 3D generators`

In-page headings: What criteria actually matter? How do the names compare at a glance? Where to read more

---

## Resources — kept

### FAQ — `/faq`

Kicker: Resources

Heading: Frequently asked questions

Line: Short answers for creators and studios evaluating Hydrilla: plans, formats, engines, and who builds the model.

Browser title: `FAQ | Hydrilla`

Description: Answers about Hydrilla — 3D generation, BlueFox, pricing, exports, studio workflows, and getting started for creators and teams.

Cards: Documentation → `/docs`. Compare AI 3D Generators → `/compare`.

### Blog — `/blog`

Heading: Blog

Line: Notes from the Hydrilla team on BlueFox 1, production exports, and 3D pipelines.

Browser title, absolute: `Hydrilla Blog — BlueFox, Pipelines, and 3D Generation`

Description: Guides on text-to-3D, image-to-3D, Unity, Unreal, Blender, and how BlueFox 1 produces production meshes.

Category words: All. BlueFox. Pipeline. Plans.

Posts, title then path:

- How BlueFox works in Hydrilla — `/blog/how-bluefox-works` — BlueFox
- Text to 3D in Hydrilla — `/blog/text-to-3d` — BlueFox
- Image to 3D in Hydrilla — `/blog/image-to-3d` — BlueFox
- Hydrilla export formats — `/blog/export-formats` — Pipeline
- Hydrilla for Unity — `/blog/hydrilla-for-unity` — Pipeline
- Hydrilla for Unreal — `/blog/hydrilla-for-unreal` — Pipeline
- Hydrilla for Blender — `/blog/hydrilla-for-blender` — Pipeline
- Hydrilla pricing explained — `/blog/hydrilla-pricing-explained` — Plans

Each post page uses that post’s headline as the H1 and the excerpt as the line under it. Kicker is the category and links to `/blog`. Button: Open Studio.

### 3D Asset Library — `/library`

Heading: 3D Asset Library

Line: Review, inspect, and download every reference image and 3D mesh generated with BlueFox 1.

Browser title: `Library | Hydrilla`

Signed in. Empty state heading: Your archive is empty. Signed-out heading: Sign in to view your library.

Section words when there are files: 3D Assets. Reference Images.

### Integration pages — kept paths

| Footer or card name | Path | Heading on the page | Line under the heading |
| --- | --- | --- | --- |
| Blender Add-on | `/integrations/blender` | Blender | Generate text/image to 3D and import GLB in Blender. |
| Unity Engine | `/integrations/unity` | Unity | Import game-ready GLB into the Unity Editor. |
| Unreal Engine | `/integrations/unreal` | Unreal Engine | Import Hydrilla meshes into Unreal Editor. |
| Godot 4 | `/integrations/godot` | Godot | Bring Hydrilla GLB into Godot 4 projects. |
| MCP Server | `/integrations/mcp` | MCP Server | Let AI agents generate 3D through Hydrilla over MCP. |
| REST API (connector) | `/integrations/api` | REST API | Build custom pipelines with the Hydrilla API. |

Browser title pattern: `<Name> integration | Hydrilla`. Blender’s title is `Blender integration | Hydrilla`.

Kicker on each: Integrations → `/integrations`. Date line: Available | Hydrilla Team.

Blender section words: Setup guide. Install from Disk. Open the sidebar. Open the Hydrilla tab. After install.

Other connectors use the heading Install.

### Studio Bridge — `/integrations/connect`

Browser title: `Connect DCC plugin | Hydrilla`

Kicker: Integrations

Heading: Sign in for Blender (or Unity, Unreal, Godot, Maya, 3ds Max, your plugin — the `app` query picks the word)

Line: Use your Hydrilla account. Leave this tab open while you generate so your session stays fresh in the local Bridge.

Meta line: Local Bridge | 127.0.0.1:7345

Button when signed out: Sign in with Hydrilla

This page is not indexed.

---

## Company — kept

### About — `/about`

Kicker: Company

Heading: About Hydrilla

Line: Hydrilla is the product. Hawan Research Labs is the lab. BlueFox 3D is the model family.

Browser title, absolute: `About Hydrilla, Hawan Research Labs, and BlueFox`

Description: Hydrilla is the product. Hawan Research Labs is the lab. BlueFox 3D is the model family. Built for creators and studios who need production-ready 3D, fast.

Section headings: Lab, model, and studio. Keep reading.

Button: Meet the team → `/team`

Cards: Hawan Research Labs → `/research`. BlueFox 3D → `/bluefox3d`.

### Research — `/research`

Heading: Research

Line: Notes from Hawan Research Labs and the Hydrilla team on building generative 3D that understands structure, exports cleanly into your engine, and keeps your studio assets private.

Browser title, absolute: `Hawan Research Labs | BlueFox 3D research`

Description: Hawan Research Labs builds generative 3D models. BlueFox 1 is the first public model, shipped in Hydrilla as BlueFox 3D.

Cards, title then where they go:

- How your Hydrilla workspace protects your assets → `/security`. Oct 1, 2026 | Hydrilla Team.
- How BlueFox 1 synthesizes segmented 3D in real pipelines → `/blog/how-bluefox-works`. Aug 19, 2026 | Hawan Research Labs.
- BlueFox 3D: The model family behind Hydrilla → `/bluefox3d`. Aug 19, 2026 | Hawan Research Labs.
- Production 3D benchmarks: Hydrilla vs Meshy, Tripo, and Luma → `/compare`. Aug 19, 2026 | Hydrilla Team.

Section headings under the grid: Hawan Research Labs. BlueFox 1 model card.

### Team — `/team`

Eyebrow: Company

Heading: Team

Line: The people at Hydrilla and Hawan Research Labs building BlueFox 1.

Browser title: `Team | Hydrilla`

Description: Meet the Hydrilla team at Hawan Research Labs — the people building BlueFox and production 3D tools for creators and studios.

Continue words: About. Careers. Research.

This page was not moved onto the article layout.

### Careers — `/careers`

Kicker: Company

Heading: Careers at Hydrilla

Line: Join Hydrilla and Hawan Research Labs. The work is meshes, exports, and a studio product teams can trust.

Date line: We are hiring | Hydrilla & Hawan Research Labs

Browser title, absolute: `Careers at Hydrilla — Engineering, Research, GTM`

Description: Join Hydrilla and Hawan Research Labs. Help build BlueFox and production 3D tools for games, film, architecture, and immersive media. Email founders@hydrilla.ai to apply.

Section headings: Who we hire. How to apply.

Role words: Engineering. 3D & Research. Go to Market.

Button: Apply via founders@hydrilla.ai

Cards: About Hydrilla → `/about`. Hawan Research Labs → `/research`.

### Contact Us — `/contact`

Kicker: Company

Heading: Contact Us

Line: Questions about Hydrilla, a studio pipeline, or a live demo. Send a note or book a time with the founders.

Date line: Direct response | founders@hydrilla.ai

Browser title, absolute: `Contact Hydrilla — Demos, Studios, and Support`

Description: Get in touch with Hydrilla. Book a demo, reach the founders, or send a message about studio and enterprise 3D production.

Form words: Full Name. Work Email. Company / Studio. Studio size. Primary Use Case. Message. Button: Send Message.

Use case options: Game Development. Film / Animation. Architecture / Interiors. AR / VR / XR. Product Visualization. Other.

Cards: Book a meeting. Direct email.

Related cards: Enterprise → `/enterprise`. Documentation → `/docs`.

### Brand — `/brand`

Heading: Press kit

Line: Official marks, canonical naming, boilerplate, and reference links for Hawan Research Labs, Hydrilla, and BlueFox 1.

Browser title: `Press kit | Hydrilla`

Description: Hydrilla names, logo, and boilerplate for press. Not linked from the public site.

Button: Download Brand Mark

Section headings: Brand marks. Canonical naming & boilerplate. Founders. Canonical directory & sitelinks.

Sitelink words: Pricing. BlueFox 3D. Features. Docs. Use cases. API. About. Contact.

Not indexed. Not in the primary nav. Footer still says Brand.

---

## Legal — kept

### Privacy Policy — `/privacy-policy`

Kicker: Legal

Heading: Privacy Policy

Line: How Hydrilla AI collects, uses, and protects your account and service information.

Date line: Jul 14, 2026 | Hydrilla Legal

Browser title: `Privacy Policy | Hydrilla`

Description: Hydrilla AI privacy policy — how we collect, use, and protect your data.

Summary heading: Summary at a glance

Section headings: 1. Introduction. 2. Information We Collect. 3. How We Use Information. 4. How We Share Information. 5. Data Security. 6. Your Rights and Choices. 7. Cookies. 8. Children's Privacy. 9. International Transfers. 10. Retention. 11. Changes. 12. Contact Us.

Button: Contact Privacy

Cards: Terms of Service → `/terms-and-conditions`. Security & Trust → `/security`.

### Terms of Service — `/terms-and-conditions`

Heading: Terms of Service

Line: Agreement governing your access to Hydrilla AI, BlueFox 1 generation, and ownership of generated 3D assets.

Date line: Jul 14, 2026 | Hydrilla Legal

Browser title: `Terms of Service | Hydrilla`

Description: Hydrilla AI terms and conditions for using our 3D generation platform and services.

Summary heading: Key terms at a glance

Section headings run 1. Agreement to Terms through 13. Contact.

Button: Contact Legal

Cards: Privacy Policy. Cookie Policy.

### Cookie Policy — `/cookie-policy`

Heading: Cookie Policy

Line: How Hydrilla AI uses essential session cookies, preferences, and analytics.

Date line: Jul 14, 2026 | Hydrilla Legal

Browser title: `Cookie Policy | Hydrilla`

Description: Hydrilla AI cookie policy — how we use cookies and similar technologies on hydrilla.ai.

Section headings: 1. Introduction. 2. What Are Cookies? 3. Types of Cookies We Use. 4. Managing Cookies. 5. Changes & Contact.

Button: Contact Privacy

Cards: Privacy Policy. Terms of Service.

---

## Signed-in pages that were kept

These paths did not move. They are not marketing pages.

| Name | Path | Browser title |
| --- | --- | --- |
| Studio | `/app/studio` | Studio \| Hydrilla |
| Assets | `/app/assets` | Studio \| Hydrilla |
| Image | `/app/image` | Studio \| Hydrilla |
| Usage | `/app/usage` | Studio \| Hydrilla |
| Settings | `/app/settings` | Studio \| Hydrilla |
| API keys | `/app/api-keys` | Studio \| Hydrilla |
| In-app pricing | `/app/pricing` | Studio \| Hydrilla |
| Demo meeting | `/app/demo-meeting` | Studio \| Hydrilla |
| Workspace | `/workspace` | Workspace \| Hydrilla |
| One workspace | `/workspace/<id>` | Workspace \| Hydrilla |
| Generations | `/generations` | Generations \| Hydrilla |
| Viewer | `/viewer` | Viewer \| Hydrilla |
| Checkout | `/checkout` | Checkout \| Hydrilla |
| Checkout success | `/checkout/success` | Checkout \| Hydrilla |
| Claim | `/claim/<token>` | the claim page |
| Early access | `/earlyaccess` | Early access \| Hydrilla |
| Sign in | `/sign-in` | Sign in \| Hydrilla |
| Sign up | `/sign-up` | Sign up \| Hydrilla |

`/app` is not kept as a screen. It moves to `/app/studio`.
