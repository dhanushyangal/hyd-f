# Hydrilla engines

Two engines. Same workspace. Different compute.

| | **Hydrilla cloud** | **Water** |
|---|---|---|
| Models | Trilles (credits); Hunyuan reserved | BYOK LLMs → procedural Three.js |
| Input | Image (or text→image→3D) | Text; image optional reference |
| Cost | Plan credits | 0 Hydrilla credits (user’s API key) |
| Output | GLB mesh | `createModel()` + client export: **GLB, GLTF, OBJ, STL, PNG, TypeScript (.ts)** |
| APIs | `/api/3d/*` + GPU (`api.hydrilla.co`) | `/api/water/*` (+ legacy `/api/code-sculpt/*`) |
| Job ids | GPU / backend ids | `wt_*` (legacy `cs_*`) |
| Viewer | `ThreeViewer` + `/api/3d/glb/:jobId` | `WaterViewer` + `public/water-sandbox.html` |

Naming: cloud = Trilles / Hydrilla cloud. BYOK = **Water** (not “Aggregator”, not “Code Sculpt” in UI).

**Auth:** Clerk JWT only. Any signed-in user can use both engines (cloud still needs credits; Water needs a valid BYOK key).

**Product surface:** `/workspace` (and `/workspace/:id`). Studio (`/app/studio`) creates/opens workspaces.

---

## Routing (how the UI chooses)

```text
Engine picker selectedModel
  → provider === "hydrilla"  → Cloud  → /api/3d/*
  → otherwise                → Water  → /api/water/*
```

Frontend: `lib/engines.ts`, `lib/models.ts`, `app/workspace/page.tsx`.  
Backend mirrors: `backend/hydrilla_backend/src/lib/engines.ts`.

---

## Water Skills — where they live and what is used

Skills are **prompt packs in the backend**. There are no skill chips in the UI: the Create orchestrator picks the pack from the prompt. Skills shape the planner / generator / evaluator prompts. The markdown under `skills/water/` is for coding agents and is **not** loaded at generate time.

### Packs

| `skillId` | Chosen when the prompt mentions | What it does |
|-----------|---------------------------------|--------------|
| `game` | game-ready, collider, Unity, Unreal, LOD | Named parts, colliders, LOD hooks |
| `animation` | rig, socket, joint, rest pose | Pivots + sockets, static pose |
| `character` | human, character, creature, face… | Anatomy, proportions, stylized likeness |
| `object-studio` | anything else (default) | Hard-surface / prop reconstruction |

First match wins. Tier defaults to what the prompt implies, else `standard`.

### Where each piece lives

| Layer | Path | Role |
|-------|------|------|
| **Pack binding** | `backend/.../src/lib/water/orchestrator/packs.ts` | Prompt → pack + quality profile |
| **Runtime prompt packs** | `backend/.../src/lib/water/skills/index.ts` | Planner/generator/evaluator extras per pack |
| **BE registry (source of truth)** | `backend/.../src/lib/waterSkills.ts` | Skill ids, tiers, pass order |
| **FE mirror** | `lib/waterSkills.ts` | Tier / pass lists + labels for the progress rail only |
| **Harness** | `backend/.../src/lib/water/harness/*` | planner → passes (generate → run → evaluate → refine) → visual pass |
| **API** | `POST /api/water/generate` | Body: `prompt`, `modelId`, optional `qualityTier`, `imageUrl` |
| **Agent docs only** | `skills/water/SKILL.md` | For coding agents — **not loaded at generate time** |

```text
Workspace UI (prompt + engine + quality)
  → submitWater()  (lib/api.ts)
    → POST /api/water/generate
      → planWaterCreate: compile → route → pack + tier
      → waitUntil → runStudioPipeline (AI SDK generateText per step)
      → DONE + factory_code
        → WaterViewer / water-sandbox.html
           export GLB | GLTF | OBJ | STL | PNG | .ts
Follow-ups → POST /api/water/chat → director (AI SDK ToolLoopAgent): scene edit or rebuild
```

### Quality tiers (what unlocks)

| Tier | Passes unlocked | Typical cost |
|------|-----------------|--------------|
| **Fast** | blockout | ~2 LLM calls · ~1 min |
| **Standard** | → material (4 passes) | ~6 LLM calls · ~2–4 min |
| **Studio** | all 8: blockout → structural → form → material → surface → lighting → interaction → optimization | ~12 LLM calls · up to ~12 min |

Every run is capped at 760 s so it finishes inside the 800 s Vercel function limit. Budgets and runtime limits: [`WATER_ORCHESTRATION.md`](./WATER_ORCHESTRATION.md).

---

## Water model architecture

### Connectors (live lists)

Water models are not a static catalog. Each vendor is a connector (`backend/.../src/providers/`).  
`GET /api/user/models` lists language models for every provider the user can call.

Canonical picker id: `provider:nativeId` (example `anthropic:claude-sonnet-5`, `openrouter:google/gemma-4-31b-it:free`, `cursor:auto`).

| Provider | How models appear | Generate |
|----------|-------------------|----------|
| Anthropic | Live `GET /v1/models` | AI SDK `generateText` |
| OpenAI | Live `GET /v1/models` (language only) | AI SDK `generateText` |
| Google | Live Gemini model list | AI SDK `generateText` |
| OpenRouter | Live OpenRouter list (free vs paid grouped) | AI SDK OpenAI-compatible |
| Cursor | Live Cloud Agents `GET /v1/models` | Cloud Agents adapter |

Key resolve: **user key if usable, else platform key**. Invalid keys never generate.

### Preference (`defaultCodeModel`)

One field: `user_model_prefs.default_code_model`.

1. **Settings → Default Water model** — save prefs.
2. **Workspace Engine picker** — selecting a Water model also saves prefs.
3. On workspace load, prefs restore the last Water model when its key is still valid.

Mesh default remains `default_mesh_model` (usually `trilles`).

### Generate path

```text
selectedModel + prompt (+ qualityTier)
  → POST /api/water/generate
  → pack chosen server-side → runStudioPipeline
  → DONE + factory_code + llm_*_tokens
  → WaterViewer (never /api/3d/glb for wt_* jobs)
```

### Client downloads (Water)

Top-right of the Water preview: **GLB** + **Formats** (GLTF, OBJ, STL, PNG, TypeScript `.ts`).  
Implemented in `components/WaterViewer.tsx` + `public/water-sandbox.html`.

### Token usage

On DONE: `jobs.llm_*_tokens` + nested `sculpt_spec.tokenUsage`.  
`GET /api/water/jobs/:jobId`, `GET /api/water/usage`.  
Migration: `backend/hydrilla_backend/sql/005_water_llm_tokens.sql`.

### Key verification

`listModels` succeeding marks the key valid (Cursor also probes `GET /v1/me`). Keys never returned to the browser (only `last4`, status).

Admin **Platform keys** (`/api/admin/api-keys`) are used only when the member has no usable key for that provider.

### Env / SQL

| Item | Purpose |
|------|---------|
| `USER_API_KEYS_ENCRYPTION_SECRET` | Encrypt BYOK keys |
| `sql/add_user_api_keys_and_code_sculpt.sql` | Base Water + keys tables |
| `sql/add_cursor_provider.sql` | Allow `provider = 'cursor'` |
| `sql/007_provider_google.sql` | Rename `gemini` → `google` |
| `sql/008_enabled_code_models.sql` | Persist Settings model toggles |
| `sql/011_water_engine.sql` | Water projects / scenes / runs / scene ops |
| `sql/012_water_scene_material_op.sql` | Allow `material` scene ops (part color / roughness / metalness) |

---

## Hydrilla cloud (brief)

Text or edit → OpenAI / Gemini image (optional) → GPU VM (BlueFox3D) → GLB. Credits.
GPU host: `https://api.hydrilla.co` (overridable). Image quality Low / High picks the model and resolution.
Details: [`GENERATION_FLOWS.md`](./GENERATION_FLOWS.md).

---

## Artifact boundary (must hold)

```text
Cloud:  engine=trilles   result_kind=glb            result_glb_url=…
Water:  engine=water     result_kind=three_factory  factory_code=…
```

Never send Water jobs to the GLB proxy or GPU status poller.

---

## Doc map

| Path | Role |
|------|------|
| **`docs/ENGINES.md`** (this file) | Cloud vs Water, **skills map**, models, prefs |
| **`docs/WATER_PROVIDERS.md`** | Connectors, keys, Settings toggles, Engine picker |
| **`docs/WATER_ORCHESTRATION.md`** | Pipeline, packs, budgets, Vercel limits, AI SDK, harness files |
| **`docs/WATER_FULL_GUIDE.md`** | Full Water pipeline reference |
| **`docs/CREATE_ORCHESTRATION_PLAN.md`** | **Adoption plan** — Grok orchestration pack vs this repo, phased build order |
| **`docs/DECISIONS_LOCKED.md`** | Locked Create decisions (Water modes, characters, Pixal=BlueFox, orchestrator) |
| **`docs/contracts/*.md`** | JobCard, EvidenceManifest, 12-ID tool surface |
| **`agent/README.md`** | The two eve agents (Cloud + Water) — **parked**, not on the generate path |
| **`docs/GROK-3D-HARNESS-BRIEF.md`** | Earlier strategy brief — superseded on naming by the plan above |
| **`skills/water/SKILL.md`** | Agent skill (docs only) |
| **Backend `WATER_DEPLOY.md`** | SQL + Vercel env for BYOK |
