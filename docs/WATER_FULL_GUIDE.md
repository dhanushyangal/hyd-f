# Water Studio — Full Guide

Complete reference for **Hydrilla Water**: what it is, where skills live, how Skill + Quality change LLM prompts, prompt structure, every pipeline stage, and how many provider API requests a single 3D generation sends.

Related shorter docs:

- [`WATER_ORCHESTRATION.md`](./WATER_ORCHESTRATION.md) — orchestration checklist
- [`ENGINES.md`](./ENGINES.md) — Cloud vs Water overview
- [`../skills/water/SKILL.md`](../skills/water/SKILL.md) — agent-facing skill summary

---

## Table of contents

1. [What Water is (and is not)](#1-what-water-is-and-is-not)
2. [Mental model](#2-mental-model)
3. [File map — where everything lives](#3-file-map--where-everything-lives)
4. [User-facing flow (workspace UI)](#4-user-facing-flow-workspace-ui)
5. [API and job lifecycle](#5-api-and-job-lifecycle)
6. [Skills — catalog, status, runtime packs](#6-skills--catalog-status-runtime-packs)
7. [Quality tiers — passes and budgets](#7-quality-tiers--passes-and-budgets)
8. [How Skill changes the LLM prompt](#8-how-skill-changes-the-llm-prompt)
9. [How Quality changes the LLM prompt](#9-how-quality-changes-the-llm-prompt)
10. [Prompt structure (every call type)](#10-prompt-structure-every-call-type)
11. [Full pipeline process (stage by stage)](#11-full-pipeline-process-stage-by-stage)
12. [API request counts (one generation)](#12-api-request-counts-one-generation)
13. [Worked examples](#13-worked-examples)
14. [Factory code contract](#14-factory-code-contract)
15. [Preview, tokens, and Edit mode](#15-preview-tokens-and-edit-mode)
16. [Providers and tokens](#16-providers-and-tokens)
17. [Failure modes and fallbacks](#17-failure-modes-and-fallbacks)
18. [What does not call the LLM](#18-what-does-not-call-the-llm)
19. [Glossary](#19-glossary)

---

## 1. What Water is (and is not)

### Water **is**

- A **bring-your-own-key (BYOK)** engine.
- A multi-pass **LLM harness** that outputs a **TypeScript Three.js factory**:
  - `import * as THREE from 'three'`
  - `export function createModel(): THREE.Group`
- Previewed by **running that code** in a browser sandbox (`WaterViewer` / `public/water-sandbox.html`).
- Optionally exportable later as GLB / GLTF / OBJ / STL / PNG / `.ts` source from the viewer.
- Charged at **`credits_used: 0`** on Hydrilla — the user’s API key pays the LLM provider.

### Water **is not**

- Trellis / Hydrilla Cloud GPU mesh generation.
- A one-shot “ask LLM for a GLB URL” call.
- Image Edit / Combine (those stay on the image path and are disabled when a code/Water model is selected).
- Runtime loaded from the markdown files under `frontend/skills/water/*.md` (those are docs for humans/agents only).

---

## 2. Mental model

```text
Skill     = which domain instructions & evaluator checklist to staple onto prompts
Quality   = how many build passes run + how strict planning is + whether evaluator LLM runs
Model     = which LLM provider + model id (user’s API key)
Prompt    = the user’s brief (text, optional image)
Harness   = planner → [generate → gate → evaluate → optional refine] × N passes → DONE
Result    = TypeScript factory code stored on job; preview = execute createModel()
```

Canonical orchestrator:

`backend/src/lib/water/harness/run.ts` → `runStudioPipeline(...)`

---

## 3. File map — where everything lives

### Product / UI

| Path | Role |
|------|------|
| `frontend/lib/waterSkills.ts` | Skill list, tiers, pass unlock table, progress labels |
| `frontend/lib/api.ts` | `submitWater`, `fetchWaterJob`, `fetchWaterUsage`, … |
| `frontend/app/workspace/page.tsx` | Engine bar, generate, Edit model, tokens strip, polling |
| `frontend/components/WaterViewer.tsx` | Runs factory in iframe sandbox, exports |

### Agent / human skill docs (NOT runtime)

| Path | Role |
|------|------|
| `frontend/skills/water/SKILL.md` | Overview for agents |
| `frontend/skills/water/object-studio.md` | Object notes |
| `frontend/skills/water/character.md` | Character notes |
| `frontend/skills/water/animation.md` | Animation notes |
| `frontend/skills/water/game.md` | Game notes |

### Runtime (actually used at generate time)

| Path | Role |
|------|------|
| `backend/src/routes/codeSculpt.ts` | `POST /api/water/generate`, `GET /api/water/jobs/:id`, `GET /api/water/usage`, thumbnails |
| `backend/src/lib/water/harness/run.ts` | Orchestrator + time budgets |
| `backend/src/lib/water/harness/planner.ts` | Spec JSON planner + optional repair |
| `backend/src/lib/water/harness/generator.ts` | Pass-scoped `createModel()` codegen |
| `backend/src/lib/water/harness/evaluator.ts` | Deterministic gate + skeptic LLM |
| `backend/src/lib/water/harness/fallbackFactory.ts` | Last-resort valid factory |
| `backend/src/lib/water/harness/types.ts` | Harness types |
| `backend/src/lib/water/skills/index.ts` | **Runtime skill prompt packs** |
| `backend/src/lib/waterSkills.ts` | Backend parse/defaults for skill + tier |
| `backend/src/lib/codeSculptPipeline.ts` | Shared gates (`intakeGate`, `validateSculptSpec`, `validateFactoryCode`, …) |
| `backend/src/lib/llmProviders.ts` | `callLLM` across Anthropic / OpenAI / Gemini / OpenRouter / Cursor |

### Preview asset

| Path | Role |
|------|------|
| `frontend/public/water-sandbox.html` | Iframe host for running factory code |

---

## 4. User-facing flow (workspace UI)

```text
1. User selects a Water / BYOK code model (not Hydrilla Cloud mesh).
2. User picks Skill chips (Object / Character / Anim / Game …).
3. User picks Quality (Fast / Standard / Studio).
4. User enters prompt (optional reference image).
5. Generate → frontend calls submitWater / runWater.
6. Job id `wt_…` appears in library; center shows progress (sculpt_pass labels).
7. On DONE + factoryCode → centerView.type = "code" → WaterViewer renders.
8. Tokens strip (when available) + link to Usage → Water tokens table.
9. "Edit model" opens refine panel → new child job with parentJobId.
```

Progress copy comes from `WATER_PASS_LABELS` in `frontend/lib/waterSkills.ts`  
(e.g. `blockout` → “Building the blockout…”).

### Edit mode (brief)

- Opened from bottom-center **Edit model** when viewing a Water result.
- User types a follow-up refine prompt (or drops another Water job from the library).
- Calls the **same** `POST /api/water/generate` with `parentJobId` + new prompt.
- Creates a **new** `wt_` job (lineage), not an in-place mesh edit / gizmo.

---

## 5. API and job lifecycle

### Generate

`POST /api/water/generate` (auth required)

Typical body:

| Field | Meaning | Default |
|-------|---------|---------|
| `modelId` | BYOK model slug | required |
| `prompt` | User brief | required (intake) |
| `imageUrl` | Optional vision reference | `null` |
| `workspaceId` | Workspace | optional |
| `parentJobId` | Refine lineage | optional |
| `skillId` | Skill pack | `object-studio` |
| `qualityTier` | Pass unlock | `standard` |

Server:

1. Auth + sync user  
2. `intakeGate` (prompt/image rules)  
3. Resolve provider from `modelId`; require configured API key  
4. Create job `wt_…` with `credits_used: 0`, engine Water, status `RUN`  
5. Return job id immediately  
6. Background: `runStudioPipeline(...)` via `waitUntil` on Vercel / local `void`  

### Poll

`GET /api/water/jobs/:id` → status, `factoryCode`, `sculptPass`, token fields, errors, etc.

### Usage

`GET /api/water/usage?limit=100` → Water jobs with token columns for the usage page table.

### Persist on success

Updates include:

- `factory_code`
- `sculpt_pass` / final pass
- `sculpt_spec` JSON (spec, gates, reviews, skill, tier, tokenPasses, …)
- `llm_input_tokens` / `llm_output_tokens` / `llm_total_tokens` (nullable when provider reports none)
- `status: DONE` (or `FAIL`)

Legacy mount: `/api/code-sculpt/*` aliases the same router.

---

## 6. Skills — catalog, status, runtime packs

### UI catalog (`frontend/lib/waterSkills.ts`)

| `skillId` | Label | Status | Selectable? |
|-----------|--------|--------|-------------|
| `object-studio` | Object Studio | **live** | yes |
| `character` | Character | **live** | yes |
| `animation` | Animation Ready | **partial** | yes |
| `game` | Game Ready | **partial** | yes |
| `environment` | Environment | **stub** | no (Soon) |
| `world` | Procedural World | **stub** | no (Soon) |

`isWaterSkillSelectable` = `live || partial`.

### Runtime pack shape (`backend/.../water/skills/index.ts`)

Each skill is a `SkillPromptPack`:

```ts
{
  id: WaterSkillId;
  plannerSystemExtra: string;   // domain rules for planning JSON
  passExtras: Partial<Record<BuildPassId, string>>;  // per-pass generator tips
  evaluatorCriteria: string[];  // skeptic checklist
  strictSpecExtra: string;      // extra planner strictness text + gate hints
}
```

### What each skill steers

#### Object Studio (`object-studio`) — live

- Hard-surface / prop / product (not full scenes).
- Topology hints: panels, tubes, fasteners, etc.
- Demands decomposition into real parented parts.
- Materials with purposeful PBR contrast.
- Evaluator cares about silhouette, named hierarchy coverage, sculptRuntime + tick.

#### Character (`character`) — live

- Stylized character/creature (not photoreal likeness cloning).
- Head-unit proportions, face groups, limb pivots.
- Separate materials for skin vs cloth/armor.
- Evaluator wants readable silhouette, pivots, face groups, sockets.

#### Animation Ready (`animation`) — partial

- Spec must list animation sockets.
- Interaction pass requires visible idle `tick` + documented sockets.
- No full Auto-skin / Mixamo pipeline in v1 — hierarchy + idle.

#### Game Ready (`game`) — partial

- Collider hints, named parts, optional LOD groups on `sculptRuntime`.
- Grounded origin, gameplay-readable materials.
- Mesh exporters are client-side; codegen only prepares hooks.

#### Environment / World — stub

- Prompt packs exist for future unlock; UI disabled.

**Important:** Changing a skill only changes **injected prompt text and criteria**. It does not swap to a different binary engine.

---

## 7. Quality tiers — passes and budgets

### Pass unlock table

Build pass order (locked):

1. `blockout`  
2. `structural`  
3. `form`  
4. `material`  
5. `surface`  
6. `lighting`  
7. `interaction`  
8. `optimization`

| Tier | Unlocked passes | UI hint (approx) |
|------|-----------------|------------------|
| **Fast** | blockout | ~2 LLM calls · ~1 min |
| **Standard** | → material (4 passes) | ~6 LLM calls · ~2–4 min |
| **Studio** | all 8 | ~12 LLM calls · ~4–8 min |

### Soft wall-clock budgets (`run.ts`)

| Provider family | Fast | Standard | Studio |
|-----------------|------|----------|--------|
| Native (Anthropic / OpenAI / Gemini / OpenRouter) | ~90s | ~200s | ~240s |
| **Cursor** Cloud Agents | ~240s | ~600s | ~900s |

If budget is nearly exhausted mid-loop, harness sets `partial: true` and returns the **best factory so far**.

### Quality side-effects (beyond pass count)

| Behavior | Fast | Standard | Studio |
|----------|------|----------|--------|
| Planner text includes | `Quality tier: fast` | `standard` | `studio` |
| Default `qualityContract.fidelityBar` | `blockout` | `production` | `hero` |
| Strict `detailInventory` depth | Lenient (base validate) | Enforced | Enforced |
| Evaluator **LLM** | Skipped | Runs | Runs (may skip late to save tokens) |
| Max refine per pass | 1 | 1 | 1 |

---

## 8. How Skill changes the LLM prompt

Skill does **not** replace the user’s sentence. It **appends / embeds** pack text:

| Call | Where skill text lands |
|------|-------------------------|
| Planner **system** | `BASE_PLANNER_SYSTEM` + `"Skill focus:\n"` + `plannerSystemExtra` |
| Planner **user** | `Skill: {id}` + `plannerSystemExtra` + `strictSpecExtra` |
| Generator **system** | `BASE_CODE_SYSTEM` + `passExtras[currentPass]` |
| Generator **user** | Same pass tip again after `PASS_FOCUS[pass]` |
| Evaluator **user** | `Skill: {id}` + numbered `evaluatorCriteria` |

Example difference for the same user prompt `"a robot lamp"`:

- Object Studio planner → hard-surface parts, fasteners, hardware layout.
- Character planner → would still try to force character anatomy (bad match — pick Object for props).
- Animation interaction pass → mandatory idle motion + sockets.

---

## 9. How Quality changes the LLM prompt

| Mechanism | Effect |
|-----------|--------|
| Pass unlock | More generator/eval stages → more prompts over time |
| Explicit string in planner user | `Quality tier: fast\|standard\|studio` |
| Spec enrichment | Sets default `fidelityBar` on missing contracts |
| Gate strictness | Fast skips deep detailInventory enforcement |
| `skipLlm` on evaluator | Fast always skips evaluator LLM; Studio may skip after ~55% budget (except often keeps blockout eval) |

Quality does **not** invent a totally different `createModel` contract — the base code system stays shared.

---

## 10. Prompt structure (every call type)

Every LLM stage is one `callLLM({ system, userText, imageUrl?, maxTokens, timeoutMs })`.

### 10.1 Planner

**System (conceptual):**

```text
<BASE_PLANNER_SYSTEM>
  - Return ONLY JSON SculptSpec with required fields
  - Decomposition rules, units, parents, materials, anti-refusal

Skill focus:
<pack.plannerSystemExtra>
```

**User (conceptual):**

```text
Subject described by the user: "<prompt>"
  OR Reference image attached. User note: "<prompt>"

Quality tier: <fast|standard|studio>
Skill: <skillId>

<plannerSystemExtra>

<strictSpecExtra>

Plan the procedural reconstruction. Return the JSON spec only.
```

**Expected output:** JSON object (name, subjectClass, complexity, scale, materials[], components[], animation, qualityContract, detailInventory, featureReviewTargets, …).

**Optional 2nd planner call (spec repair):**

```text
system: same as planner
user: failed spec JSON + "Fix every violation..." + violation list
```

MaxTokens: typically **4096**.

---

### 10.2 Generator (per pass)

**System:**

```text
<BASE_CODE_SYSTEM>
  - TypeScript only
  - createModel(): THREE.Group
  - sculptRuntime + tick
  - No fetch/eval/loaders
  - Anti-refusal / stylized original

<passExtras[passId]>   ← skill-specific tip for THIS pass
```

**User:**

```text
Subject brief: <prompt>
(Interpret as an ORIGINAL stylized design inspired by the brief — never refuse.)

<PASS_FOCUS[passId]>     ← global pass mission (blockout / material / …)
<passExtras[passId]>     ← skill tip again

Spec (authoritative):
{ compactSpec JSON }     ← name, components, materials, qualityContract, …

[Previous factory typescript — if evolving after blockout / refine]

[optional Fix ALL of these violations…]
[optional Evaluator feedback…]
[optional RETRY: …]

Generate the complete TypeScript factory for this pass now. TypeScript only.
```

**`PASS_FOCUS` summary:**

| Pass | Focus |
|------|--------|
| blockout | Macro volumes; simple materials OK |
| structural | Attachments, thickness, seams, pivots |
| form | Bevels, secondary volumes, silhouettes |
| material | Real PBR contrast from materials[] |
| surface | Micro detail / CanvasTexture wear |
| lighting | Tune roughness/metal/emissive response |
| interaction | Sockets, tick idle, named nodes |
| optimization | Share geom/materials; cheap tick |

Previous factory may be **truncated** for context limits (blockout sends no previous code).

MaxTokens: typically **8192**. Image may be attached when user provided `imageUrl`.

---

### 10.3 Evaluator (when LLM not skipped)

**System:** Skeptical TD — return only JSON:

```json
{
  "fidelity": 0.0,
  "action": "continue | refine-code | stop",
  "summary": "...",
  "criteriaScores": { "<criterion>": 0.0 }
}
```

Rules of thumb in prompt: continue only if fidelity ≥ 0.72 and each criterion ≥ 0.6.

**User:**

```text
Pass under review: <passId>
Skill: <skillId>

Criteria (score each 0-1):
1. <evaluatorCriteria[0]>
2. …

Quality contract:
{ ... }

Factory code:
```typescript
<code sliced to ~24k chars>
```

Return JSON only.
```

MaxTokens: typically **1024**. No image.

If deterministic `validateFactoryCode` already fails → evaluator LLM is usually **not needed**; harness schedules refine from gate violations.

If `skipLlm: true` → local gate only; synthetic `continue` review.

---

## 11. Full pipeline process (stage by stage)

```text
intakeGate (local)
  → note: assessment / planner
  → runPlanner  → 1 (+ optional repair) LLM call(s)
  → note: spec
  → for passId in passesForTier(qualityTier):
        if budget low → break (partial)
        note: passId
        generatePass            → 1 LLM
        [optional empty/refusal regenerate] → +1 LLM
        note: evaluate
        evaluatePass            → 0–1 LLM (+ always local gate)
        if action == refine-code:
            generatePass again  → +1 LLM
            evaluate again      → 0–1 LLM
        keep best factoryCode
  → if still empty: buildMinimalFactory (local)
  → note: done | partial
  → persist job DONE
```

### Stage details

#### Intake (local)

- Rejects empty / useless briefs via `intakeGate`.
- No tokens.

#### Planner

- Builds **RichSculptSpec**.
- Skill + tier embedded in prompts.
- Validates with `validateSculptSpec` / `strictQualityGate`.
- On failure: one repair LLM call, else **fallbackSpec**.

#### Generate loop

- Evolves code across passes (except first blockout).
- Rejects banned APIs and contract breaks via `validateFactoryCode`.
- Max **one refine** per pass.
- Soft time budget → partial success with best code.

#### Fallback factory (local)

- If all LLM code unusable → `buildMinimalFactory` so the job can still DONE with a valid (simple) model and `partial` / fallback note.

---

## 12. API request counts (one generation)

Count = number of `callLLM` invocations during `runStudioPipeline` for that job.

> Cursor Cloud Agent steps also create/poll agents and may fetch `/usage`, but Hydrilla still treats each stage as **one logical LLM call**.

### Happy path (no repair, no refine, no empty retries)

| Tier | Planner | Generators | Evaluator LLMs | **Total** |
|------|---------|------------|----------------|-----------|
| Fast | 1 | 1 | 0 | **2** |
| Standard | 1 | 4 | 4 | **9** |
| Studio | 1 | 8 | ≤8* | **~9–17** |

\*Studio may skip evaluator LLM after ~55% of wall budget (still runs local gate).

### Per-pass worst case (additive)

For one pass under stress:

```text
1 generate
+ 1 empty/refusal retry
+ 1 evaluator LLM
+ 1 refine generate
+ 1 post-refine eval (Standard; Studio often skipLlm on re-eval)
≈ up to 4–5 calls for that pass
```

Planner may add **+1** repair call.

### Realistic ranges

| Tier | Clean | Busy / refine-heavy |
|------|-------|---------------------|
| Fast | **2** | **3–5** |
| Standard | **~9** | **~12–20** |
| Studio | **~13–17** | **~20–35+** (or fewer if budget cuts early → partial) |

UI hints (`~2 / ~6 / ~12`) are mid-range marketing estimates, not hard caps.

### Things that add calls

- Spec validation failure → planner repair  
- Model refusal / empty code → regenerate  
- Evaluator `refine-code` → extra generate (+ maybe eval)  
- First generate exception → one anti-refusal retry  

### Things that reduce calls

- Fast tier (`skipLlm` on eval)  
- Studio late-budget eval skip  
- Early budget exit (fewer remaining passes)  
- Skip eval LLM when code already fails local gate (refine driven by violations)

---

## 13. Worked examples

### Example A — Fast + Object Studio

User: `"chrome desk lamp"`, skill=`object-studio`, tier=`fast`

| # | Call | Prompt flavor |
|---|------|----------------|
| 1 | Planner | Object domain + `Quality tier: fast` → shallow fidelityBar |
| 2 | Gen `blockout` | Macro volumes tip from Object pack |

No evaluator LLM. → **2 calls**. Preview shows blockout-quality prop.

### Example B — Standard + Character (happy path)

User: `"stylized fox adventurer"`, skill=`character`, tier=`standard`

| # | Call |
|---|------|
| 1 | Planner (character anatomy rules) |
| 2–3 | Gen + Eval `blockout` |
| 4–5 | Gen + Eval `structural` |
| 6–7 | Gen + Eval `form` |
| 8–9 | Gen + Eval `material` |

→ **9 calls**. Factory should have limb hierarchy + face groups + skin/cloth materials.

### Example C — Studio + Game (clean, evals all run)

| Calls | Rough total |
|-------|-------------|
| 1 planner + 8 generate + 8 evaluate | **17** |

If later evals are skipped by budget logic, total shrinks toward ~10–14 while still producing further passes’ generator improvements.

### Example D — Edit / refine

Same as a **new generation**: another full (or tier-scoped) pipeline with a new prompt and `parentJobId` set. Token usage is per child job.

---

## 14. Factory code contract

Must hold for preview and gates:

```ts
import * as THREE from "three";

export function createModel(): THREE.Group {
  const root = new THREE.Group();
  // named meshes / groups matching spec hierarchy
  root.userData.sculptRuntime = {
    nodes: { /* ... */ },
    sockets: { /* ... */ },
    colliders?: { /* game skill */ },
    lodGroups?: { /* game skill */ },
  };
  root.userData.tick = (dt: number, elapsed: number) => {
    // subtle idle
  };
  return root;
}
```

**Banned:** `fetch`, `eval`, `new Function`, dynamic `import`, `require`, TextureLoader / GLTFLoader / etc.

**Allowed:** primitives, MeshStandard/Physical materials, self-built CanvasTexture / DataTexture.

Model should rest on **y = 0**, centered X/Z, approx height from spec.

---

## 15. Preview, tokens, and Edit mode

### Preview

1. Job `DONE` with `factory_code`.  
2. Frontend sets `centerView = { type: "code", factoryCode, jobId }`.  
3. `WaterViewer` loads sandbox, injects/runs `createModel()`, orbits camera.  
4. Optional thumbnail upload via `POST /api/water/jobs/:id/thumbnail`.

### Tokens

- Accumulated across planner/generate/eval via provider usage fields.  
- Stored on job columns + nested in `sculpt_spec.tokenUsage` / `tokenPasses`.  
- Canvas strip + `/app/usage#water-tokens` table.  
- Missing provider metering → `null` / UI “—” (not fake zeroes when properly persisted).  
- Cursor: after agent run, Hydrilla may fetch `GET /v1/agents/{id}/usage`.

### Edit mode UX

- **Edit model** — large control, bottom-center of canvas.  
- Panel: target job, refine textarea, **Exit** + **Refine**.  
- **Exit edit** also on panel chrome.  
- Drag Water library cards (`application/job-id`) onto canvas/panel to retarget.

---

## 16. Providers and tokens

Supported Water providers (via `callLLM`):

| Provider | Usage parsing (when present) |
|----------|-------------------------------|
| Anthropic | `input_tokens` / `output_tokens` |
| OpenAI / OpenRouter | `prompt_tokens` / `completion_tokens` (+ native fields when present) |
| Gemini | `usageMetadata.promptTokenCount` / `candidatesTokenCount` |
| Cursor | Agent `/usage` endpoint after FINISHED |

Hydrilla platform credits stay **0** for Water.

---

## 17. Failure modes and fallbacks

| Failure | Behavior |
|---------|----------|
| Intake fail | HTTP 400, no job |
| Missing / invalid API key | HTTP 400 |
| Planner JSON missing | fallbackSpec |
| Spec fails validation | one repair; else fallbackSpec |
| Generate throws | retry once (if no prior code); else keep prior / break |
| Empty / refusal text | dedicated regenerate with RETRY hint |
| Still empty after blockout | `buildMinimalFactory` → DONE partial |
| Time budget hit | stop remaining passes → DONE partial |
| Evaluator LLM down | continue if local gate ok |
| Job exception | status FAIL + error message |

---

## 18. What does not call the LLM

- Intake / sculpture-spec / factory **code gates** (deterministic)  
- Fallback factory template  
- Polling APIs / listing usage (reads DB)  
- WaterViewer run / orbit / export mesh from scene  
- Thumbnail screenshot upload  

---

## 19. Glossary

| Term | Meaning |
|------|---------|
| **BYOK** | Bring your own API key |
| **Skill** | Domain prompt pack id |
| **Quality / tier** | Fast / Standard / Studio → pass unlock |
| **Pass** | One locked build stage (blockout … optimization) |
| **SculptSpec** | Planner JSON plan of parts/materials |
| **Factory** | TypeScript module exporting `createModel` |
| **sculptRuntime** | `userData` hook bag (nodes, sockets, …) |
| **Harness** | Planner + generate/eval loop |
| **Partial** | Finished early or used fallback; still may be DONE |
| **Refine (harness)** | One extra generate inside a pass |
| **Edit / refine (UI)** | New Water job with parent lineage |
| **callLLM** | Single provider completion/agent stage |

---

## Quick reference card

```text
Skills live in UI:     frontend/lib/waterSkills.ts
Skill docs (agents):   frontend/skills/water/*.md
Skill prompts (LLM):   backend/src/lib/water/skills/index.ts
Orchestrator:          backend/src/lib/water/harness/run.ts
HTTP:                  POST /api/water/generate

Happy-path LLM calls:
  Fast     ≈ 2
  Standard ≈ 9
  Studio   ≈ 13–17 (evals optional later)

Prompt always = system (base + skill) + user (brief + tier/pass + JSON/code)
```

---

*Last aligned with the Water Studio harness (`runStudioPipeline`) and skill packs in `backend/src/lib/water/skills/index.ts`. If code drifts, prefer the source over this document.*
