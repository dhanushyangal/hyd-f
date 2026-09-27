# Water Studio — orchestration

Multi-pass BYOK pipeline (img2threejs spirit + Anthropic-style generator/evaluator split).  
Product overview: [`ENGINES.md`](./ENGINES.md).  
Keys, connectors, Settings toggles: [`WATER_PROVIDERS.md`](./WATER_PROVIDERS.md).

Everything below runs in the **backend** (`backend/hydrilla_backend`). The frontend only submits the prompt, polls the job, and renders the factory.

---

## What runs at generate time

```text
POST /api/water/generate
  → intake gate + image admission (optional reference image)
  → planWaterCreate: compile prompt → route → bind skill pack + quality tier
  → insert job card, respond with jobId
  → waitUntil(generateWaterAsset)                    ← keeps running after the response
       → runStudioPipeline
            planner (SculptSpec + qualityContract)   ← skill prompt pack
            for each unlocked pass:
                generate → run factory → code gate → evaluate → optional refine
            if still empty: deterministic fallback factory
            visual pass: run factory → GLB → mesh gate → turntable renders
                         → structure + interior checks → score
       → DONE (partial: true if the time budget cut it short)
```

Request fields:

| Field | Source | Default |
|-------|--------|---------|
| `prompt` | Create bar | required (unless image) |
| `modelId` | Engine picker (`provider:nativeId`) | prefs / catalog |
| `qualityTier` | Fast / Standard / Studio | inferred from the prompt, else `standard` |
| `imageUrl` | optional reference | — |
| `workspaceId`, `parentJobId`, `factoryCode` | workspace / edit flow | — |

There is **no `skillId` field** any more. The pack is chosen by the server from the prompt.

### Follow-up edits (director)

`POST /api/water/chat` runs the **director** (`agents/director.ts`), a `ToolLoopAgent`. It decides between:

- a **scene edit** (move / rotate / scale / material / duplicate / delete). These are saved in `water_scene_ops`, with no regeneration.
- a **rebuild**, which starts a new child job through the same pipeline with `parentJobId`.

The viewer also saves direct edits via `PATCH /api/water/jobs/:jobId/scene`.

---

## Skill packs — how one is chosen

A skill pack is extra prompt text for the planner, generator and evaluator. It is added to the base prompts so the model knows how to build that kind of thing.

| Pack | Chosen when the prompt mentions | Notes |
|------|---------------------------------|-------|
| `game` | game-ready, collider, Unity, Unreal, LOD, meters | named parts, collider / LOD hooks |
| `animation` | rig, socket, Mixamo, joint, rest pose, animation-ready | pivots and sockets, **static** pose |
| `character` | human, person, character, creature, face, anime… | anatomy, proportions |
| `object-studio` | anything else (default) | hard-surface props and products |

**First match wins**, in the order above. Rules: `orchestrator/packs.ts`. Prompt text: `skills/index.ts`.

**Why the backend owns skills:**

- The backend is the only place prompts are built.
- It holds the user's BYOK key (ADR 0001: keys never reach the browser).
- A single copy can't drift out of sync.

The frontend `lib/waterSkills.ts` only mirrors the tier and pass lists for the progress rail.

---

## Quality tiers → passes

| Tier | Unlocked passes |
|------|-----------------|
| Fast | `blockout` |
| Standard | `blockout` → `structural` → `form` → `material` |
| Studio | all 8: … → `surface` → `lighting` → `interaction` → `optimization` |

On Fast, the evaluator skips its LLM call if the deterministic code gate passes.

### Time budgets

| Provider | Fast | Standard | Studio |
|----------|------|----------|--------|
| Native (Anthropic / OpenAI / Google / OpenRouter) | 120 s | 420 s | 720 s |
| **Cursor** Cloud Agents | 240 s | 600 s | 760 s (900 s, capped) |

Every budget is capped at **760 s**: the 800 s Vercel function limit minus 40 s to save the result (`runtimeLimits.ts`).  
Per-stage timeouts: Cursor ~210 s (agents often need 2–4 min), other providers ~50 s.  
Hitting the budget returns the best code so far with `partial: true`.

---

## Vercel runtime limits

| Setting | Where | Value |
|---------|-------|-------|
| Function max duration | `api/index.ts` → `export const config` | `800` (Pro GA max) |
| Fluid compute | `vercel.json` → `"fluid": true` | on |
| Harness wall budget | `src/lib/water/runtimeLimits.ts` | 760 s |
| Stale-run cutoff | `runtimeLimits.ts` → `STALE_RUN_MS` | 8 min |

With Fluid compute, time spent **waiting on the LLM is not billed as CPU**. That is why a long `waitUntil` run is cheap.

`maxDuration` must be a literal in `api/index.ts`, so keep it in sync with `FUNCTION_MAX_DURATION_S` by hand.

If runs ever need to go past 800 s or survive crashes, move to Vercel Workflow (durable steps). The comment in `runtimeLimits.ts` explains when.

---

## AI SDK — what we use and why

Backend: `ai@7` with `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/openai-compatible` (OpenRouter).

| Use | API | Why |
|-----|-----|-----|
| Planner, generator, evaluator | `generateText` + `Output.object` (`providers/llm.ts`) | typed JSON back, same code for every provider |
| Director (follow-ups) | `ToolLoopAgent` (`agents/director.ts`) | the model picks a tool (edit vs rebuild) |
| Cursor | Cloud Agents adapter (`providers/`) | not an AI SDK provider |

Why the AI SDK and not eve:

- **One API for all BYOK providers.**
- **The customer key stays in the backend.**
- **No gateway markup**, and nothing extra to deploy.

eve (`agent/`) is **parked**. The reasons and the conditions for revisiting are in the comments in `orchestrator/routeCreate.ts` and `agents/director.ts`.

---

## Harness files

All paths are under `backend/hydrilla_backend/src/`.

| Path | Role |
|------|------|
| `routes/codeSculpt.ts` | `/api/water/*` (+ legacy `/api/code-sculpt/*`): generate, poll, cancel, chat, scene |
| `lib/water/orchestrator/routeCreate.ts` | `planWaterCreate`: compile → route → pack + tier |
| `lib/water/orchestrator/packs.ts` | Prompt → skill pack + quality profile |
| `lib/water/skills/index.ts` | Per-pack planner / generator / evaluator prompt extras |
| `lib/waterSkills.ts` | Skill ids, tiers, pass order (source of truth) |
| `lib/water/generateWaterAsset.ts` | Background job: runs the pipeline, saves the result |
| `lib/water/runtimeLimits.ts` | 800 s function / 760 s harness budget |
| `lib/water/harness/run.ts` | `runStudioPipeline`: passes, budgets, loop |
| `lib/water/harness/imageIntake.ts` | Reference-image admission |
| `lib/water/harness/planner.ts` | SculptSpec JSON |
| `lib/water/harness/generator.ts` | Pass-scoped `createModel()` codegen |
| `lib/water/harness/factoryExecute.ts` | Runs the factory in a VM sandbox → GLB |
| `lib/water/harness/evaluator.ts` | Code gate + skeptic LLM (a different call from the generator) |
| `lib/water/harness/fallbackFactory.ts` | Last-resort valid factory |
| `lib/water/harness/visualPass.ts` | GLB → mesh gate → turntables → score |
| `lib/water/harness/structure.ts`, `interior.ts` | Missing / floating parts, interior checks |
| `lib/water/harness/specToGlb.ts` | Spec → GLB when the factory can't execute |
| `lib/water/agents/director.ts` | Follow-up chat: scene edit vs rebuild |
| `lib/water/agents/scene.ts` | Scene compose / edit ops |
| `providers/` | Connector registry, `callLLM`, live `listModels` |

Frontend: `lib/api.ts` (`submitWater`), `lib/waterSkills.ts` (tier / pass labels), `components/WaterViewer.tsx`, `public/water-sandbox.html`.

---

## Review loop

- Deterministic gates always run (banned APIs, `createModel` contract, coverage).
- The evaluator is a separate LLM call from the generator; on Fast it is skipped when the code gate passes.
- One refine per pass at most.
- Visual pass after the passes: the factory is executed, rendered as turntables, then checked for structure and interior and scored.
- **Not yet:** the renders are not fed back to the generator. The next step is a pi-style tool loop (write → run → render → critique → fix).

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

Preview is **static**: factories must not animate; the sandbox never runs per-frame model animation.

---

## SQL

| Migration | Purpose |
|-----------|---------|
| `sql/011_water_engine.sql` | Water scene tables (`water_scene_ops`, …) |
| `sql/012_water_scene_material_op.sql` | Allow `material` scene ops (part color / roughness / metalness) |

Both are applied to `Hydrilla_database`.

---

## Roadmap (honest)

| Theme | Today |
|-------|--------|
| Object quality | Studio tier + object-studio pack + visual pass |
| Character | character pack (live) |
| Game pipeline | Partial hooks; **mesh exporters live** |
| Animation | Sockets + pivots; static pose (no idle tick) |
| Render feedback loop | Planned (pi-style tool loop) |
| Durability past 800 s | Planned (Vercel Workflow) |
| AI Studio UI | `/workspace` |
