# DESIGN.md: Hydrilla Studio (inspired, not cloned)

## Source
- Hydrilla app: `/app/studio` on 20 Sep 2026
- Evidence: Firecrawl scrapes of Tripo, Meshy, Rodin, Cartwheel, World Labs Marble, Omma, AssetHub
- Screenshots / branding: `.firecrawl/assethub-screenshot.png`, `.firecrawl/assethub-branding.json`
- Capture date: 2026-09-20

## Reference Screenshot
![AssetHub marketing home — one image to editable 3D](./assethub-screenshot.png)

Use AssetHub for **pipeline simplicity** (Prepare → Generate → Assemble → Review) and Meshy/Omma for **one-box create**. Do not copy AssetHub’s four “Choose what to create” tiles, Chakra Petch, or dark Framer look. Hydrilla stays a light production desk.

## Design Summary
Hydrilla Studio is a workbench, not a dashboard and not a node graph. One field starts work. Recents are plates on the table. Engines, quality tiers, and library metadata stay off this page.

## Design Tokens

### Colors
| Role | Hex | Notes |
| --- | --- | --- |
| Paper | `#FAFAFA` | Existing app shell. Cool zinc, not cream. |
| Plate | `#FFFFFF` | Composer and cards. |
| Ink | `#171717` | Headings, Create. |
| Mute | `#737373` | Secondary copy. |
| Line | `#E5E5E5` | Hairline only. |
| Danger | `#DC2626` | Delete only. |

No accent color on Studio. The Create fill is ink. Water/Cloud colors do not appear here.

### Typography
- Display / body: existing `DM Sans` (`--font-dm-sans`). Do not add a second display face on Studio.
- Composer prompt: 16–17px, weight 400, tracking tight.
- Page title: 28–32px, weight 600, tracking -0.03em.
- Recents meta: 13px tabular.

### Spacing And Layout
- Page uses `.app-content-page` padding.
- Composer max-width 720px, left-aligned with recents (not a marketing-center hero).
- Card radius 20px (existing plates). Composer radius 18px.
- One primary action per view.

## Components
- **Workbench field:** white plate, 1px line, inner textarea, paperclip later, one ink pill **Create**.
- **Recent plate:** 4:3 thumbnail, name, item count. Overflow menu only on hover.
- **Quiet New:** text control next to Recents, not a competing hero CTA.

## Page Patterns
1. Greeting (one line)
2. Workbench (the only decision)
3. Recents (if any)
4. No empty-state card if the workbench is present
5. No templates, intent chips, engine badges, or “choose a workflow”

## Content Style
- Title: greeting, then “What should we make?”
- Placeholder: a concrete object, e.g. “A ceramic mug on a wooden table”
- Button: Create / Creating…
- Recents: Recent — never “N workspaces” as the hero metric
- Errors name the failure and the next action

## Agent Build Instructions
- Do not add Object / Scene / Cloud / Water on this page.
- Do not auto-create a Demo Workspace.
- Create names the workspace from the prompt and opens `/workspace/:id` with prefill.
- Assets (`/app/assets`) is the future library (AssetHub metadata), not a third create mode.
- Keep Hydrilla paper/DM Sans. Do not restyle the marketing site.

## Rerun Inputs
```
workflow: firecrawl-website-design-clone + firecrawl-demo-walkthrough
source_url: https://assethub.io/
related: https://app.assethub.io/ https://www.meshy.ai/ https://omma.build/
target_stack: Next.js App Router, Tailwind, existing Hydrilla app shell
output: DESIGN.md + /app/studio workbench
```
