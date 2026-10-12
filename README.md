# Hydrilla Frontend

Next.js app for [hydrilla.ai](https://hydrilla.ai) — marketing site, studio, workspaces, and claim flows.

Lives at `hydrilla/frontend` in the monorepo (sibling of `backend/` and `admin/`).

## Engines

| Doc | Covers |
|-----|--------|
| [`docs/ENGINES.md`](./docs/ENGINES.md) | Cloud vs Water, skills map, models, prefs |
| [`docs/WATER_ORCHESTRATION.md`](./docs/WATER_ORCHESTRATION.md) | Water pipeline, tiers, harness |
| [`docs/GENERATION_FLOWS.md`](./docs/GENERATION_FLOWS.md) | Cloud GPU / credits / polling |
| [`skills/water/SKILL.md`](./skills/water/SKILL.md) | Agent docs only (not runtime) |
| [`../backend/WATER_DEPLOY.md`](../backend/WATER_DEPLOY.md) | SQL + env for Water BYOK |

## Overview

- **Auth:** Clerk
- **Studio:** `/app/studio` — create / open workspaces
- **Workspace:** `/workspace` and `/workspace/:id` — Cloud (GPU → GLB) and Water (BYOK → Three.js)
- **Help:** Support & Feedback via `useSupport()` (navbar / sidebar / workspace top bar — no global floating button)
- **Credits claim:** `/claim/[token]` — public claim links from admin grants
- **Billing:** Dodo via backend `/api/payments/*`
- **GEO markdown:** `/:page.md` rewritten to `/md/...` (see `lib/markdown-pages.ts`, `public/llms.txt`)

## Tech stack

Next.js (App Router) · TypeScript · React · Tailwind · Clerk · Three.js · PostHog · Vercel

## Getting started

```bash
cd hydrilla/frontend
npm install
# Create .env.local with the vars below (no committed .env.example yet)
npm run dev                  # http://localhost:3000
```

Required env (typical):

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=https://api.hydrilla.co
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Backend (local):

```bash
cd ../backend
npm install
npm run dev   # Express on :4000
```

## Key routes

| Path | Role |
|------|------|
| `/` | Marketing landing |
| `/app/studio` | Workspace picker |
| `/app/settings` | BYOK keys + Water defaults |
| `/workspace`, `/workspace/:id` | Generation UI |
| `/claim/[token]` | Claim admin-granted credits |
| `/viewer` | Standalone GLB viewer |
| `/sign-in`, `/sign-up` | Clerk |
| `/:slug.md` | Markdown twin for crawlers / LLMs |

Protected by middleware / proxy: `/app`, `/workspace`, `/generate`, `/generations`, `/library`, `/checkout`, `/rigging`.

## Key libs

| Path | Role |
|------|------|
| `lib/api.ts` | Backend HTTP client (jobs, support, claims, …) |
| `lib/markdown-pages.ts` | Public `.md` page bodies |
| `context/SupportContext.tsx` | Support modal provider |
| `lib/pricing.ts` | Plan / credit display helpers |
| `lib/clerkConfig.ts` | Clerk JS version + preconnect |

## Status updates

Client **HTTP polling** (not WebSocket): Cloud ~3s, Water ~2s, library ~5s while active.

## Deployment

Deploy this folder as its own Vercel project. Set `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_API_URL`, and Clerk keys.

## License

Private — Hydrilla Platform
