# Water Studio — orchestration

Multi-pass BYOK pipeline (img2threejs spirit + Anthropic-style generator/evaluator split).  
Product overview + **skills map**: [`ENGINES.md`](./ENGINES.md).

---

## What runs at generate time

```text
intake
  → planner (SculptSpec + qualityContract)     ← skill prompt pack
  → for each unlocked pass:
        generate → deterministic code gate → evaluate → optional 1× refine
  → if still empty: deterministic fallback factory
  → DONE (partial: true if budget cut short)
```

Request: `POST /api/water/generate` with:

| Field | Source | Default |
|-------|--------|---------|
| `modelId` | Engine picker | prefs / catalog |
| `skillId` | Skill chips | `object-studio` |
| `qualityTier` | Fast / Standard / Studio | `standard` |
| `prompt` | Create bar | required |
| `imageUrl` | optional | — |

---

## Skills — availability and what is used

| `skillId` | UI | Runtime pack used | Status |
|-----------|----|-------------------|--------|
| `object-studio` | Object | `backend/.../water/skills` object pack | live |
| `character` | Character | character pack | live |
| `animation` | Anim | animation pack (sockets / tick) | partial |
| `game` | Game | game pack (colliders / LOD hooks) | partial |
| `environment` | Env | — | stub (UI Soon) |
| `world` | World | — | stub (UI Soon) |

**UI / validation registries**

- Frontend: `lib/waterSkills.ts`
- Backend: `src/lib/waterSkills.ts`

**Runtime prompts (actually injected into LLM calls)**

- `backend/hydrilla_backend/src/lib/water/skills/index.ts`

**Agent markdown (not runtime)**

- `skills/water/SKILL.md`, `character.md`, `animation.md`, `game.md`, `object-studio.md`

Selectable in UI = `status === "live" || "partial"`. Stubs render disabled.

---

## Quality tiers → passes

| Tier | Unlocked passes |
|------|-----------------|
| Fast | `blockout` |
| Standard | `blockout` → `structural` → `form` → `material` |
| Studio | all 8 through `optimization` |

### Soft budgets (provider-aware)

| Provider | Fast | Standard | Studio |
|----------|------|----------|--------|
| Native (Anthropic / OpenAI / …) | ~90s | ~200s | ~240s |
| **Cursor** Cloud Agents | ~240s | ~600s | ~900s |

Per-stage timeout: Cursor ~210s (agents often need 2–4 min); other providers ~60s.  
Hitting the budget returns the best code so far with `partial: true`.

---

## Harness files

| Path | Role |
|------|------|
| `src/lib/water/harness/run.ts` | Orchestrator + budgets |
| `src/lib/water/harness/planner.ts` | Spec JSON |
| `src/lib/water/harness/generator.ts` | Pass-scoped `createModel()` codegen |
| `src/lib/water/harness/evaluator.ts` | Code gate + skeptic LLM (skipped on Fast) |
| `src/lib/water/harness/fallbackFactory.ts` | Last-resort valid factory if LLM empty |
| `src/lib/water/skills/index.ts` | Per-skill prompt extras |
| `src/routes/codeSculpt.ts` | `/api/water/*` (+ legacy `/api/code-sculpt/*`) |
| `src/lib/llmProviders.ts` | Anthropic / OpenAI / Gemini / OpenRouter / Cursor |

Frontend mirror: `lib/waterSkills.ts`, `lib/api.ts` (`submitWater`), `components/WaterViewer.tsx`.

---

## Review loop (v1)

- Deterministic gates always (banned APIs, `createModel` contract, coverage).
- Separate evaluator LLM (not the generator) — skipped on Fast.
- Max one refine per pass.
- No Playwright / VLM screenshot loop yet.

---

## Client downloads

`WaterViewer` (top-right) + `public/water-sandbox.html`:

| Format | Notes |
|--------|--------|
| **GLB** | Binary glTF (warm-cached) |
| **GLTF** | JSON, embedded buffers/images |
| **OBJ** / **STL** | Mesh interchange / print |
| **PNG** | Viewport snapshot |
| **TypeScript (.ts)** | Raw factory source |

---

## Roadmap (honest)

| Theme | Today |
|-------|--------|
| Object quality | Studio + Object skill |
| Character | Character skill (live) |
| Environment / World | Stub |
| Game pipeline | Partial hooks; **mesh exporters live** |
| Animation | Partial sockets / tick |
| AI Studio UI | `/workspace` |
