# Hydrilla Frontend

Next.js app for the Hydrilla 3D platform — **Hydrilla cloud** (GPU → GLB, credits) and **Water** (BYOK LLM → procedural Three.js).

## Engines (read these first)

| Doc | What it covers |
|-----|----------------|
| [`docs/ENGINES.md`](./docs/ENGINES.md) | Cloud vs Water, **skills map** (where / what), models, prefs |
| [`docs/WATER_ORCHESTRATION.md`](./docs/WATER_ORCHESTRATION.md) | Pipeline, tiers, harness files, downloads |
| [`docs/GENERATION_FLOWS.md`](./docs/GENERATION_FLOWS.md) | Cloud GPU / credits / polling |
| [`skills/water/SKILL.md`](./skills/water/SKILL.md) | Agent docs only (not runtime) |
| Backend [`WATER_DEPLOY.md`](./backend/hydrilla_backend/WATER_DEPLOY.md) | SQL + Vercel env for BYOK |

## Overview

- **Auth:** Clerk only (invite / AccessGate removed)
- **Main UI:** `/workspace` (and `/workspace/:id`) — Engine picker, library rail, canvas
- **Studio:** `/app/studio` — create / open workspaces
- **Cloud:** text→image → image→3D (credits) → `ThreeViewer`
- **Water:** BYOK keys in Settings → generate → `WaterViewer` sandbox
- **Billing:** credits via backend `/api/payments/*` (Dodo subscriptions)

## Tech stack

- Next.js (App Router) · TypeScript · React · Tailwind · Clerk · Three.js · Framer Motion · PostHog · Vercel

App lives at the **repo root** (not a nested `frontend/` folder). Nested backend clone: `backend/hydrilla_backend/`.

## Getting started

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=https://api.hydrilla.co
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Optional: `NEXT_PUBLIC_CLERK_JS_VERSION` — see `lib/clerkConfig.ts`.

```bash
npm run dev   # http://localhost:3000
```

## Product flow

```text
Sign in (Clerk)
  → /app/studio (pick or create workspace)
  → /workspace/:id
       Engine = Cloud (Trilles)  → /api/3d/*   → GLB
       Engine = Water (BYOK)     → /api/water/* → factory code
  → poll status → canvas + left library
```

Credits (cloud):

| Op | Low | High |
|----|-----|------|
| Text → image (OpenAI / Gemini) | 2 | 5 |
| Edit image (OpenAI / Gemini) | 3 | 6 |
| Image → 3D (GPU VM) | 10 | 10 |

Workspace text→mesh = 2 + 10 = **12** (Low) or 5 + 10 = **15** (High). Pick the image model, quality and
aspect from the composer's settings menu. Edit needs an OpenAI or Gemini key on the backend.

## Key routes

| Path | Role |
|------|------|
| `/` | Marketing landing |
| `/app/studio` | Workspace picker |
| `/app/settings` | BYOK keys + Water defaults |
| `/workspace`, `/workspace/:id` | Generation UI |
| `/generate` | Redirect → `/workspace` |
| `/generations` | Workspace gallery (GLB-oriented) |
| `/library` | Global history (GLB-oriented) |
| `/viewer` | Standalone GLB viewer |
| `/sign-in`, `/sign-up` | Clerk |

Protected by `middleware.ts`: `/app`, `/workspace`, `/generate`, `/generations`, `/library`, `/checkout`, `/rigging`.

## Key libs

| Path | Role |
|------|------|
| `lib/api.ts` | Backend / GPU HTTP client |
| `lib/apiHealth.ts` | Feature health: image providers (OpenAI / Gemini) + GPU VM |
| `lib/imageOptions.ts` | Image model / quality / aspect options + credit table |
| `lib/engines.ts` / `lib/models.ts` | Engine constants + model catalog |
| `lib/clerkConfig.ts` | Pinned Clerk JS version + preconnect |

## Status updates

Not WebSocket / Supabase Realtime. Client **HTTP polling**:

- Cloud 3D status ~3s
- Water job ~2s
- Workspace library refresh ~5s while active

## Backend

Local clone: `backend/hydrilla_backend` → `https://github.com/dhanushyangal/hydrilla_backend`.

```bash
cd backend/hydrilla_backend
npm install
npm run dev   # Express on :4000 + background cloud job sync
```

Vercel entry: `api/index.ts` (no background sync; Water uses `waitUntil` up to 300s).

## Deployment (frontend)

Vercel env: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_API_URL`, Clerk keys. Deploy from repo root.

## License

Private — Hydrilla Platform
