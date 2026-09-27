# Create orchestration — adopting the Grok pack in this repo

**Pack under review:** `agent-skills/Hydrilla AI orchestration/` (Grok bot, 2026-09-13)
**This repo:** Next.js frontend + `backend/hydrilla_backend` (Express) — Cloud (`/api/3d/*`) and Water (`/api/water/*`)
**Purpose:** what the pack gets right, where it collides with shipped code, what is missing, and the ordered plan to improve **both** engines.

Related: [`ENGINES.md`](./ENGINES.md) · [`WATER_ORCHESTRATION.md`](./WATER_ORCHESTRATION.md) · [`WATER_FULL_GUIDE.md`](./WATER_FULL_GUIDE.md) · [`GENERATION_FLOWS.md`](./GENERATION_FLOWS.md) · [`GROK-3D-HARNESS-BRIEF.md`](./GROK-3D-HARNESS-BRIEF.md)

---

> **Status, Sep 2026.** Phases 0–5 are built and tested (452 assertions, `npm run verify:all`)
> except `mesh.bake`. The mesh worker turned out not to need a separate service — see §9a for
> what runs today, §9c for the one migration to apply, and §9d for known limitations.
> Nothing is wired into a user-facing route yet, by design.

## 1. TL;DR

| | Verdict |
|---|---|
| **Pack's core thesis** | **Adopt.** brain ≠ hands ≠ session, generator ≠ evaluator, engine-scoped skill trees, deterministic geo gates before any VLM, evidence-before-promote. All correct and all better specified than what we have. |
| **Biggest real finding** | **Cloud has no quality layer at all.** `backend/.../routes/threeD.ts` (3064 lines) contains zero matches for `manifold`, `remesh`, `mesh.post`, `gate`, `evidence`, `render_views`, `turntable`, `comparison_sheet`. It submits to the GPU and returns a GLB. Every competitive loss vs Meshy/Tripo lives here. |
| **Water status** | Already has planner → passes → generator ≠ evaluator → deterministic gates → fallback. It is **ahead** of the pack's Water spec on discipline, and **incompatible** with it on identity (factory vs mesh). |
| **Blocking conflict** | The pack redefines Water as **BYOK mesh providers** (Meshy/Tripo/fal) and demotes our shipped Three.js factory to `OPTIONAL_water-threejs-preview`, "off hot path". That deletes a live product surface. Needs your decision — see §4. |
| **Cannot run prompts 01–06 as written** | They target an **eve** agent runtime and `/workspace/hydrilla-harness/` packages/docs. Neither exists here. The pack's own `contracts/*.md` are stubs pointing at absent files. |
| **Plan shape** | Treat pack SKILL.md as **specification**, implement as **backend pipeline stages + prompt packs + a worker service**. Cloud quality first (biggest delta), Water hardening second. |

---

## 2. What the pack actually contains

| Group | Files | Value |
|---|---|---|
| Decisions | `ORCHESTRATOR_DECISION.md`, `ANTHROPIC_HARNESS_MAP.md`, `SYSTEM_INTEGRATION.md` | **High.** eve over Firstmate, brain/hands/session mapping, planner→generator→evaluator per engine. |
| Skill packs | `skills/cloud/*` (11), `skills/water/*` (11 + 1 optional), `skills/shared/*` (2 protocols) | **High as spec.** Bodies are thin-by-design; `references/` under Cloud carry the real numbers. |
| Quality | `IMG2THREEJS_DELTA.md`, `QUALITY_VS_PIXAL.md` | **Highest value in the pack.** Concrete thresholds + 7 must-fold rules. This is the moat. |
| Discipline | `KILL_LIST.md`, `KEEP_FROM_PRIOR.md`, `SKILL_ID_CANON.md` | **High.** Prevents scope creep; canon IDs settle naming. |
| Contracts | `contracts/JOB_CARD.md`, `EVIDENCE_MANIFEST.md`, `TOOL_SURFACE.md` | **Stubs only** — 3 lines each, pointing at `/workspace/hydrilla-harness/docs/`. Must be authored here. |
| Cursor prompts | `cursor-prompts/00`–`06` | **Not executable here.** Assume eve + harness monorepo. Reusable as intent, not as instructions. |
| Agent layout | `agents/EVE_AGENT_LAYOUT.md` | Useful shape; **uses retired skill IDs** (see §6). |

Cloud skills ship `references/` (quality-bar, img2threejs-must-fold, hard-surface-geo, remesh, car-identity-features, prop-score-rubric…). **Water skills ship none.** The Water side of the pack is noticeably thinner than the Cloud side.

---

## 3. Side-by-side: pack vs this repo

### 3.1 Cloud

| Stage | Pack canon skill | In this repo today | Gap |
|---|---|---|---|
| Compile prompt | `cloud-compile-prompt` | none — raw user prompt to FLUX | **Missing.** No geo_brief/tex_brief, no class declaration, no refuse. |
| Route / estimate | `cloud-route-estimate` | none — UI picks model, credits fixed | **Missing.** No `needs_t2i`, no profile, no confidence ≥0.82. |
| Text→image | `cloud-t2i` | `POST /api/3d/text-to-image` (FLUX, 2 credits) | **Exists, ungoverned.** No single-subject/gray-studio discipline. |
| Preprocess ref | `cloud-preprocess-ref` | `upload-image` + `ensurePublicImageUrlFor3d` | **Missing.** No rembg/BiRefNet, no admission (fg 5–97%, short side ≥64px, blob ≥60%). |
| Generate | `cloud-run-pixal` | `POST /api/3d/generate` → Trellis GPU (10 credits) | **Exists.** This is the one stage we have. |
| Mesh post | `cloud-mesh-post` | **nothing** | **Missing — highest impact.** No manifold/self-intersect/bounds/+Y-grounded/tri-budget, no remesh. |
| Bake | `cloud-bake` | **nothing** | **Missing.** We market PBR + FBX/USDZ; there is no bake worker. |
| Evaluate | `cloud-evaluate` | **nothing** | **Missing.** No comparison sheet, no Tier1, no identity features, no VLM discipline. |
| Refine | `cloud-refine-loop` | **nothing** | Missing (needs evaluate first). |
| Job DAG | `cloud-run-job` | job rows + polling in `threeD.ts` | **Partial.** Status polling exists; no JobCard stages/checkpoint/resume. |
| Lab | `cloud-experiment` | **nothing** | Defer. |

**Cloud verdict:** we have stages 3 and 5 of an 11-stage pipeline. The pack's Cloud pack is close to a drop-in specification for what to build.

### 3.2 Water

| Concern | Pack spec | This repo today | Verdict |
|---|---|---|---|
| Identity | BYOK **mesh** via Meshy/Tripo/fal/Rodin | BYOK **LLM → Three.js factory** (`result_kind=three_factory`) | **Direct conflict.** See §4.1. |
| Generate | `water-generate-3d` (submit/poll adapter) | `runStudioPipeline` — 8 locked passes | Ours is a different thing, and more built. |
| Planner | `water-compile-prompt` | `harness/planner.ts` → SculptSpec + qualityContract | **We are ahead.** |
| Gates | `water-mesh-post` (geo) | `intakeGate`, `validateSculptSpec`, `validateFactoryCode` | **We are ahead** for code; **zero** mesh-geometry gates on the exported GLB. |
| Evaluator | `water-evaluate`, ≠ generator | `harness/evaluator.ts`, code gate + skeptic LLM, skipped on Fast | **We are ahead**, and already matches the pack's law. |
| Refine cap | ≤3/pass, ≤6 total | max 1 refine per pass | Ours is stricter. Fine. |
| Budgets | not specified | provider-aware soft budgets + `partial: true` | **We are ahead.** |
| Bake | `water-bake`, own it | none | Missing. |
| Evidence | EvidenceManifest before promote | none | Missing (both engines). |
| Preview | `OPTIONAL_water-threejs-preview` | `WaterViewer` + `water-sandbox.html` + 6 export formats | **Shipped.** Pack calls it optional/legacy. |
| Characters | HARD-REFUSE v1 | `character` skill **live** in UI | **Conflict.** See §4.2. |
| Animation | killed as default | `animation` skill **partial** in UI | Aligned enough — keep partial, do not grow. |

**Water verdict:** the pack's *discipline* is already largely implemented; the pack's *product definition* is not ours.

---

## 4. Decisions — RESOLVED

All four are locked in [`DECISIONS_LOCKED.md`](./DECISIONS_LOCKED.md). Summary:

| # | Decision |
|---|---|
| D1 | **Water keeps the Three.js factory as a first-class mode** (`water-threejs`). `water-mesh` (BYOK adapters) is deferred to Phase 7. Mode is chosen inside Water — not an engine switch. |
| D2 | **Characters:** refused on Cloud v1; `character` stays live on Water as stylized-only. |
| D3 | **Pixal3D = BlueFox = Trellis = `trilles`** — one backbone, no second host. `cloud-run-pixal` keeps its canon ID and wraps the existing submit/poll. |
| D4 | **Backend stages now, eve optional later.** Same stage names + frozen 12 tool IDs, so an eve wrapper needs no rework. |

The analysis that led to each is kept below for context.

### 4.1 What is Water?

| Option | Meaning | Cost |
|---|---|---|
| **A. Water stays factory; add mesh as second mode** *(recommended)* | Keep `three_factory` as `water-threejs` mode. Add `water-mesh` mode later behind BYOK adapters. Engine still immutable; **mode** chosen inside Water. | Two Water modes to gate and evaluate. Rejects the pack's "factory is legacy". |
| **B. Follow pack literally** | Water becomes BYOK mesh; factory demoted to optional preview. | Deletes/deprecates a shipped surface: `WaterViewer`, 6 export formats, token metering, Edit lineage, `sql/005_water_llm_tokens.sql`, Settings BYOK UX. |
| **C. Rename** | Factory becomes its own engine name; "Water" reserved for BYOK mesh. | Docs/UI/DB churn across `engines.ts`, `models.ts`, job rows, marketing. |

**Chosen: A.** The factory path is live, differentiated (nobody ships editable `createModel()` with GLB/OBJ/STL export), and already has the harness discipline the pack demands. Adopt the pack's *contracts* for it, not its *deletion*.

### 4.2 Characters

Pack: HARD-REFUSE in v1 (both engines). Repo: `character` is `status: "live"` in `lib/waterSkills.ts` and has a runtime pack.

**Chosen: refuse on Cloud v1** (no identity-scoring corpus, no likeness rubric, guaranteed loss vs Trellis-class competitors), **keep on Water** as stylized-only with an explicit "not photoreal likeness" contract. Do not delete a live UI chip to satisfy a Cloud-scoped rule.

### 4.3 Pixal3D vs BlueFox/Trellis naming

**Resolved: they are the same engine.** Pixal3D is the pack's name for the backbone we already run. `Pixal3D` = `BlueFox 1` (UI label) = Trellis (GPU env) = `trilles` (persisted engine). `cloud-run-pixal` keeps its canon skill ID and wraps our existing submit/poll against `api.hydrilla.co` — no new adapter, no new env vars.

### 4.4 Where does the orchestrator live?

Pack assumes **eve** (`agent/skills`, `agent/tools`, durable sessions, park/resume). This repo has no eve.

**Chosen:** implement the pipeline as **backend stages first** (Express + job rows + JobCard table), keeping stage boundaries and tool IDs exactly as the pack names them. If eve is adopted later, it wraps the same tool surface with zero rework. Cloud quality is not blocked on an agent runtime.

---

## 5. What the pack assumes that does not exist here

Every one of these is referenced as canonical and is **absent**:

| Referenced | Needed for |
|---|---|
| `/workspace/hydrilla-harness/docs/JOB_CARD.md` | session/total-state, `run.checkpoint` |
| `.../EVIDENCE_MANIFEST.md` | promote gate, `checkEvidence.promoteEligible` |
| `.../TOOL_SURFACE.md` (12 IDs) | every skill's tool calls |
| `.../QUALITY_BAR_IMG2THREEJS.md` | the numeric floors (partly recoverable from `IMG2THREEJS_DELTA.md`) |
| `.../DECISIONS_LOCKED.md`, `CREATE_V1_SCOPE.md`, `CREATE_FEATURES_MUST.md` | locks, props-only scope, handoff definition |
| `packages/harness-contracts`, `job-runner`, `prompt-compiler`, `bench` | contracts, durable submit/await, compile, bench |
| `packages/adapters-bluefox`, `adapters-fal`, `adapter-core` | Cloud/Water hands |
| `data/img2threejs-extract/gates/`, `data/skills-sh-extract/` | gate thresholds, provider lifecycle patterns |
| AutoRemesher (MIT), BiRefNet/rembg, glTF-Validator | mesh-post, preprocess, export QA |

**Consequence:** Phase 0 is authoring the three contracts locally. Without JobCard + EvidenceManifest + tool surface, the pack's skills have nothing to call.

The 12 locked tool IDs (from `KEEP_FROM_PRIOR.md`) — treat as frozen, no 13th:

```
prompt.compile   run.estimate   run.route      image.rembg
job.submit       job.await      mesh.post.gate mesh.bake
asset.render_views  asset.score  run.checkpoint  experiment.fanout
```

---

## 6. Pack internal drift to fix

The pack contradicts itself. `SKILL_ID_CANON.md` + the on-disk folders are correct; two files are stale:

| File | Problem |
|---|---|
| `MANIFEST.md` | Lists **retired** IDs (`cloud-i2-3d`, `cloud-mesh-post-gate`, `cloud-game-ready-bake`, `cloud-score-compare`, `cloud-run-experiment`) and omits shipped folders (`cloud-run-pixal`, `cloud-mesh-post`, `cloud-bake`, `cloud-evaluate`, `cloud-experiment`, `water-t2i`, `water-experiment`). Water count says 9, disk has 11. |
| `agents/EVE_AGENT_LAYOUT.md` | `defineAgent` sketches register retired IDs (`cloud-i2-3d`, `cloud-mesh-post-gate`, `cloud-game-ready-bake`, `cloud-score-compare`, `water-mesh-post-gate`, `water-game-ready-bake`, `water-score-compare`). |
| `cursor-prompts/01`, `03`, `04`, `06` | Same retired IDs in acceptance criteria and DAGs. |
| `MANIFEST_FILES.txt` | Absolute `/workspace/...` paths; no `references/` files listed at all. |
| Water skills | No `references/` directory. Cloud has 20+ reference files; Water has zero. |

Fix these **before** handing the pack to any implementing agent, or it will scaffold retired names.

---

## 7. Keep / adapt / defer

### Keep verbatim
- brain ≠ hands ≠ session; generator ≠ evaluator; evaluator owns promote
- Engine immutable from UI pick; skills never switch engine
- Engine-scoped skill trees (`skills/cloud/*` ≠ `skills/water/*`); shared layer = contracts + workers only
- Deterministic geo HARD gates **before** any aesthetic/VLM scoring
- VLM never overrides a HARD geo fail
- Exactly **one** comparison sheet per `runId`
- 12 tool IDs, no 13th
- JobCard is total state; chat is never job state
- Numeric floors from `IMG2THREEJS_DELTA.md` (IoU 0.85, scale ≤0.08, aspect ≤0.05, continue ≥0.70, fidelity ≥0.85, criteria ≥0.80, spread ≤0.20, `RECON_OBJ_MIN` ≈0.48, admission fg 5–97% / ≥64px / blob ≥60%, route ≥0.82, tri draft ≤50k, orbit area ≥0.15, refine ≤3/pass ≤6 total, plateau <0.02)
- Class declared from contract, never inferred from filename/keywords; profiles **raise** floors only
- Stage-aware gating (no bake QA or VLM before mesh-post HARD pass)
- Raw engine output is a **baseline column**, never the Create default
- Kill list: no Godot/game engines as generators, no AI Gateway, no Comfy runtime, no Meshy-as-bake-owner, no Firstmate as Create orchestrator, no world/HUD/multiplayer skills

### Adapt
| Pack item | Adaptation here |
|---|---|
| eve agent + `agent/skills` | Backend pipeline stages; same stage names + tool IDs. eve optional later. |
| `contracts/*` stubs | Author real `docs/contracts/JOB_CARD.md`, `EVIDENCE_MANIFEST.md`, `TOOL_SURFACE.md` in this repo. |
| `water-generate-3d` as only Water generate | Becomes `water-mesh` **mode**; `water-threejs` mode = existing `runStudioPipeline`. |
| `OPTIONAL_water-threejs-preview` "legacy" | Promote to first-class Water mode (it is shipped and exports 6 formats). |
| `cloud-run-pixal` | Wraps our Trellis GPU submit/poll unless Pixal3D is genuinely a new host (§4.3). |
| Character HARD-REFUSE | Cloud v1 only; Water keeps stylized character. |
| `*-experiment` Lab | Defer to Phase 7. |

### Defer
`cloud-experiment` / `water-experiment`, `water-mesh` BYOK adapters, Needle, multiview, FBX/USDZ export, `dcc-handoff` presets, Env/World/Hunyuan.

### Kill (agree with pack)
Godot as generator, Firstmate as Create runtime, AI Gateway, Comfy as product runtime, Meshy as bake owner, engine-switch language in any skill, shared Cloud+Water prompt markdown, chat-as-job-state, raw-engine-as-default.

**Note on [`GROK-3D-HARNESS-BRIEF.md`](./GROK-3D-HARNESS-BRIEF.md):** the pack supersedes its naming. `mesh-critic` → `cloud-mesh-post`; `export-qa`/`competitor-eval` → `cloud-evaluate` + bench; `post-mesh` → `cloud-mesh-post` + `cloud-bake`; `image-intake` → `cloud-preprocess-ref`; `router` → `cloud-route-estimate`. The pack's kill list explicitly bars `factory-critic` / `visual-critic` **on the default GLB path** — they survive only inside the Water factory mode, which is where that brief put them anyway. Keep the brief as strategy; use canon IDs in code.

---

## 8. Target layout in this repo

```text
docs/
  contracts/JOB_CARD.md              # authored here (was a stub)
  contracts/EVIDENCE_MANIFEST.md
  contracts/TOOL_SURFACE.md          # the 12 IDs, frozen
  CREATE_ORCHESTRATION_PLAN.md       # this file

agent-skills/Hydrilla AI orchestration/
  skills/cloud/*                     # SPEC, canon IDs — keep as source of truth
  skills/water/*                     # + add references/ (currently empty)

backend/hydrilla_backend/src/
  lib/create/
    contracts.ts                     # JobCard + EvidenceManifest types + guards
    toolSurface.ts                   # 12 tool IDs, typed
    jobCard.ts                       # stages, checkpoint, next, resume
    evidence.ts                      # captures, freshness, promoteEligible
    quality/thresholds.ts            # every number from IMG2THREEJS_DELTA
  lib/cloud/
    compilePrompt.ts                 # cloud-compile-prompt
    routeEstimate.ts                 # cloud-route-estimate
    preprocessRef.ts                 # cloud-preprocess-ref (rembg/admission)
    meshPost.ts                      # cloud-mesh-post  ← highest impact
    bake.ts                          # cloud-bake
    evaluate.ts                      # cloud-evaluate (sheet, Tier1, VLM last)
    refineLoop.ts                    # cloud-refine-loop
  lib/water/                         # EXISTS — harness/, skills/
    harness/meshGate.ts              # NEW: geo gate on exported GLB
  routes/threeD.ts                   # wire Cloud stages
  routes/codeSculpt.ts               # /api/water/*

services/mesh-worker/                # NEW: Python/Node GPU-adjacent worker
                                     # mesh.post.gate, mesh.bake,
                                     # asset.render_views, asset.score
```

**Law:** skills/markdown describe; **backend code enforces**. Same rule already true for Water (`skills/water/*.md` are docs; `backend/.../water/skills/index.ts` is runtime). Do not regress into markdown-as-runtime.

---

## 9. Step-by-step plan

Ordered by quality-per-effort. Cloud first because it has nothing.

### Phase 0 — Contracts + canon hygiene — **DONE**
1. ✅ [`contracts/JOB_CARD.md`](./contracts/JOB_CARD.md), [`contracts/EVIDENCE_MANIFEST.md`](./contracts/EVIDENCE_MANIFEST.md), [`contracts/TOOL_SURFACE.md`](./contracts/TOOL_SURFACE.md) — real schemas replacing the pack's 3-line stubs.
2. ✅ `lib/create/quality/thresholds.ts` (every number, one module), `lib/create/toolSurface.ts` (12 IDs frozen, `assertToolId` throws on a 13th), `lib/create/contracts.ts` (JobCard + EvidenceManifest types and guards).
3. ✅ `sql/010_create_job_cards.sql` — `job_cards`, `job_card_stages`, `evidence_captures`; DB-level checks mirror the code guards (skip needs reason, fail needs code, one sheet per `runId`, engine immutability trigger).
4. ✅ Pack drift from §6 fixed: `MANIFEST.md` rewritten to canon, `EVE_AGENT_LAYOUT.md` + prompts `01`–`06` de-aliased.
5. ✅ [`DECISIONS_LOCKED.md`](./DECISIONS_LOCKED.md) authored with D1–D4.

**Verify:**

```bash
cd backend/hydrilla_backend && npm run verify:create
```

`scripts/verify-create-contracts.ts` — 39 guard assertions, no DB or network. Covers the
frozen tool surface, raise-only class floors, both stage machines, stage-aware gating,
refine caps, HARD fail-code classification, and every promote-blocking condition.

**Still open in Phase 0 scope:**

| Gap | Note |
|---|---|
| `sql/010_create_job_cards.sql` not applied | Written, unrun. Apply before Phase 1 persists anything. |
| No persistence layer | `lib/create/contracts.ts` is pure logic. `repository/jobCards.ts` (load / checkpoint / resume) and evidence capture writes do not exist yet — build alongside Phase 1. |
| Nothing calls any of it | No route touched, no user-visible change. Deliberate. |

### Phase 1 — `cloud-mesh-post` — **DONE (in-process, not a separate service)**

The worker-runtime question in the old §9b is **answered: neither Python nor headless GL.**
Every HARD check in the quality bar is CPU geometry maths over a parsed GLB, so it is
written in TypeScript with **zero new dependencies** and runs inside the Express process.
That removes the service, the Docker image, and the Python toolchain from the critical
path. A separate service is still possible later — the modules are pure functions over a
`Buffer` — but nothing is blocked on it now.

| Module | Role |
|---|---|
| `lib/create/mesh/glb.ts` | Hand-written GLB/glTF reader. Applies node transforms, so grounding and scale are measured in the space the engine will import. |
| `lib/create/mesh/geometry.ts` | Welded topology, non-manifold and boundary edges, connected components, signed volume, inverted normals, self-intersection via an AABB-binned uniform grid. |
| `lib/create/mesh/silhouette.ts` | Software orthographic rasteriser with a depth buffer. Orbit coverage, solidity, IoU, objectness. |
| `lib/create/mesh/png.ts` | PNG encode/decode on `node:zlib`. Turntables and the comparison sheet are real files. |
| `lib/create/mesh/gate.ts` | Turns measurements into fail codes. `EMPTY_GLB`, `NO_NORMALS`, `NON_MANIFOLD`, `SELF_INTERSECT`, `NAN_BOUNDS`, `NOT_GROUNDED`, `TRI_BUDGET`, `FLOATER`, `THIN_SHELL`, `ORBIT_COLLAPSE`, `SCALE`, `GLTF_INVALID`; `NO_UV` as a warning. |

Two corrections the tests forced, both worth recording:

- **Orbit collapse** is measured as each view's coverage relative to the *widest* view, not
  as silhouette solidity. Solidity does not fall when a slab turns edge-on — the projection
  becomes a line whose bounding box is also a line, so the ratio stays near 1. Coverage
  against the widest view catches it.
- **Self-intersection** binning by vertex cells missed two large faces crossing in a cell
  that owns neither's vertices. Triangles are now binned by every cell their AABB touches,
  with cell size derived from the mean triangle size.

Still open: **AutoRemesher is not wired.** The gate reports `remeshCandidate` when every
HARD finding is plausibly remeshable, and the refine controller routes to the mesh stage on
that signal, but no remesh actually runs. Until it does, a remeshable defect costs a
regeneration.

**Verify:** `npm run verify:mesh` — 77 assertions over generated GLB fixtures.

### Phase 2 — Cloud front half — **decision logic DONE, FLUX wiring NOT DONE**

| Module | State |
|---|---|
| `lib/create/compile.ts` | Refusal screen + `CompiledPrompt` contract validation. Done. |
| `lib/create/route.ts` | Profile, confidence floor, poly budgets, `needs_t2i`, credit estimate. Done. |
| `lib/create/admission.ts` | Admission floors + largest-blob analysis. Done. |

Three points worth knowing:

- `planRoute` takes `engine` as an **input and echoes it**. There is no branch that can
  return a different engine, which makes "engine is immutable" structural rather than a rule
  a model is asked to remember.
- The refusal screen is a **pre-screen, not a classifier.** It never sets `assetClass` —
  deriving class from prompt keywords is the exact mistake img2threejs removed, because a
  token like "hero" silently applied specialty floors. Class comes from the compile contract
  or defaults to `prop` with a warning.
- `scale_m` sanity is checked at **compile**, so a 40 m prop is rejected before any spend
  rather than at the gate after a GPU job.

Not done: the existing FLUX call in `threeD.ts` is not yet routed through `cloud-t2i`, and
`image.rembg` has no BiRefNet backend. Admission falls back to PNG alpha, then to a
border-colour estimate, and **refuses to admit** anything it cannot measure — a JPEG with no
adapter configured fails closed rather than being waved through.

**Verify:** `npm run verify:pipeline` (compile + route + admission sections).

### Phase 3 — `cloud-evaluate` + evidence — **DONE except the VLM adapter**

`lib/create/mesh/views.ts` (`asset.render_views`) and `lib/create/score.ts` (`asset.score`).
The ordering is enforced in code, not by prompt: a HARD gate fail returns before Tier1 runs
and before the VLM is even called, so `report.vlm.attempted` is `false` on a broken mesh.

Tier1 takes the **best IoU across the orbit** rather than a single view, because a generated
mesh legitimately differs in yaw from a reference plate and a fixed-view comparison produced
false rejects.

**`silhouette_readability` was rebuilt during testing.** It first measured min/max coverage
consistency around the orbit — which scored a correctly proportioned 4.4 m car at 0.68 and
failed it, because a car is long and narrow and *should* look very different front-on versus
side-on. It now measures worst-angle silhouette solidity, and coverage variance moved to a
non-critical `orbit_stability` axis. Outright collapse is already a HARD gate fail, so
nothing was lost.

**The VLM is optional for props and mandatory for vehicles.** Vehicle identity (cabin, glass,
grille) is VLM-measured and marked critical, so with no adapter configured a vehicle cannot
promote: `fidelity` stays `null` and `IDENTITY_FEATURE` fires. A prop, whose deterministic
axes cover the rubric, can promote without one. That matches the skill spec calling the VLM
optional while still refusing to treat unmeasured as passed.

**Verify:** `npm run verify:pipeline` (scoring sections, including a vehicle that cannot
promote without a VLM and one that can with it).

### Phase 4 — Water hardening — **shared machinery DONE, export NOT DONE**

Everything the gate and evaluator need is engine-agnostic: `runMeshPostGate` takes `engine`
as a parameter, the refine controller derives its stage ids from the card, and `planRoute`
handles `waterMode`. The verification suite covers a Water card refining onto Water stages.

The one blocker is **server-side GLB export from the Three.js factory**, without which
`water-mesh-post` has nothing to gate. Original Phase 4 notes follow.
1. `water-mesh-post`: run the **same** `mesh.post.gate` on the factory's exported GLB — closes the known "sandbox looks right, export is wrong" failure.
2. `water-evaluate`: extend `harness/evaluator.ts` with the mesh rubric (separate from the Cloud sheet-averaging rubric) + EvidenceManifest.
3. JobCard for `wt_*` jobs: pass stages become stages; keep `partial: true` semantics.
4. Make `game` skill live: named parts, colliders, LOD hooks, meters, +Y up, −Z forward — validated by the gate, not by prose.
5. `character` stays live with an explicit stylized-only contract (per §4.2).
6. Keep `animation` partial. No idle tick.

**Accept:** exported Water GLB passes the same HARD gate as Cloud; `game` output has named parts + 1 m scale verified programmatically; Fast tier still skips evaluator LLM.

### Phase 5 — refine loop **DONE**, bake **NOT DONE**

`lib/create/refine.ts` is a pure function of the JobCard plus the last two reports, which is
why it is testable without a GPU and cannot be talked out of a stop. It enforces: geometry
before aesthetics, remesh-before-regenerate, repeated-defect stop, ≤3 per stage and ≤6 total,
plateau at Δ<0.02, evidence gaps recaptured rather than regenerated, and objectness probes
treated as a request for a closer look rather than a pass grant. Re-entry stage ids are
derived from the card's engine, so a Water job cannot be handed a Cloud stage.

**`mesh.bake` is not built and `game_ready` cannot be served.** UV unwrapping is the one part
of this pipeline that genuinely needs a library (xatlas or Blender) rather than a few hundred
lines of maths. The tool surface returns **501 with an explanation** rather than a stub that
appears to succeed, and the gate reports `NO_UV` as a warning so the missing capability is
visible instead of silent.

### Phase 6 — Bench vs raw engine — **NOT STARTED**

Deliberately last. The bench needs real Trellis output to compare against, so it is the first
thing to do once the gate is wired into `/api/3d`, and it is what should decide whether the
gate is turned on for users. Original notes follow.
1. Three-column bench: reference | raw engine export | harness output.
2. Metrics JSON: GateReport + ScoreReport + credits + latency.
3. Pass = harness beats raw on geo integrity **and** reference look, per `QUALITY_VS_PIXAL.md`.
4. Fixed prompt set; car-class first. Two rubrics — mesh vs factory — never one score.

**Accept:** reproducible bench run; documented win/loss vs raw; raw is a baseline column and never the Create default.

### Phase 7 — Deferred
`cloud-experiment` / `water-experiment` (Lab flag), `water-mesh` BYOK adapters (if §4.1 goes toward two modes), eve wrapper over the tool surface, `dcc-handoff` export presets (Unity/Unreal/Blender/Godot **import**, not generation), FBX/USDZ, multiview, Needle.

---

## 9a. What is runnable today

Nothing here needs a GPU, a database, a network call, or a new npm package.

```bash
cd backend/hydrilla_backend
npm run verify:all
```

| Suite | Covers |
|---|---|
| `verify:create` | 39 — contracts, thresholds, stage machines, promote gate |
| `verify:mesh` | 77 — GLB parsing, geometry, silhouette raster, PNG codec, every gate fail code |
| `verify:pipeline` | 106 — refusal screen, routing, estimate, admission, Tier1, scoring, refine controller |
| `verify:agents` | 230 — eve tool ids match the frozen 12, skills match canon, no cross-engine leakage, no tool bypasses the Run API |

The mesh suite builds real binary GLBs in memory (`scripts/fixtures/glbFixtures.ts`) and pushes
them through the same parser production uses, so a passing assertion means the gate works on
bytes, not on a mock.

### The tool surface over HTTP

`POST /api/create/tools/:toolId` in `src/routes/createTools.ts`, mounted at `/api/create`.
Auth is the shared internal secret, not Clerk — the agents are infrastructure, not users.

Live: `prompt.compile`, `run.route`, `run.estimate`, `image.rembg`, `mesh.post.gate`,
`asset.render_views`, `asset.score`, `run.checkpoint`.
**501 with an explanation:** `job.submit`, `job.await` (owned by the existing routes),
`mesh.bake` (not built), `experiment.fanout` (not wired).
An id outside the 12 is a **400 listing the surface** — there is no dynamic registration.

Three guards live in the router rather than in a prompt, because a prompt can be argued with:

- `run.route` echoes the **card's** engine and rejects a request naming a different one (409).
- `asset.render_views` refuses to capture turntables before `*-mesh-post` is `done` (409).
- Any call asserting a `runId` that is not the card's current run is rejected (409).

---

## 9b. Remaining work — stage ledger

The engine of the harness is built and tested. What is left is almost entirely **wiring**:
connecting the existing generation routes to the gate, and supplying two ML backends.

### Cloud

| Stage | Logic | Wired into a live route |
|---|---|---|
| `cloud-compile-prompt` | done | no — nothing calls it from `/api/3d/generate` yet |
| `cloud-route-estimate` | done | no |
| `cloud-t2i` | n/a (governance only) | no — the FLUX call is still ungoverned |
| `cloud-preprocess-ref` | done | no, **and needs a BiRefNet backend** |
| `cloud-run-pixal` | already shipped | yes |
| `cloud-mesh-post` | **done** | no — must run after the Trellis export |
| `cloud-bake` | **not built** | returns 501; `game_ready` unavailable |
| `cloud-evaluate` | **done** | no, **and needs a VLM for vehicle identity** |
| `cloud-refine-loop` | **done** | no |

### Water

| Stage | Logic | Wired |
|---|---|---|
| `water-compile-prompt` | partial — `planner.ts` writes a SculptSpec with no declared class or profile | yes (own path) |
| `water-route-estimate` | done (shared with Cloud) | no — tier still comes from the UI |
| `water-generate-3d` | already shipped (`runStudioPipeline`) | yes |
| `water-mesh-post` | gate is engine-agnostic and ready | no — **needs server-side GLB export from the factory** |
| `water-evaluate` | done (shared) | no — existing skeptic LLM is separate |
| `water-refine-loop` | done (shared) | no — `run.ts` still does its own single refine |

The one Water-specific gap is real and worth naming: the factory produces Three.js code, and
the gate needs a GLB. Something has to execute `createModel()` and export a GLB server-side
before `water-mesh-post` can run. That is the last mile on closing the "looks right in the
sandbox, exports wrong" failure.

### The two external dependencies

Everything else is ours. These two are not, and both currently **fail closed**:

| Need | Interface | Behaviour with nothing configured |
|---|---|---|
| Background removal (BiRefNet) | `RembgAdapter` in `lib/create/admission.ts` | PNG alpha → border-colour estimate → refuse. A JPEG is not admitted. |
| Vision scoring | `VlmScorer` in `lib/create/score.ts` | Vehicle identity unmeasured ⇒ `fidelity: null` ⇒ cannot promote. Props still promote on deterministic axes. |

Both are function types, so neither module imports a provider and the evaluator cannot
accidentally depend on one being up.

---

## 9c. Database — what has to be stored

**One migration to apply, and it has not been run yet:**

```bash
psql "$DATABASE_URL" -f backend/hydrilla_backend/sql/010_create_job_cards.sql
```

It is additive — three new tables, no change to `public.jobs`, no destructive statements, and
every object uses `IF NOT EXISTS`. Existing jobs keep working; `loadJobCard` returns `null`
for a job with no card, which callers treat as "not a harness job".

| Table | Holds | Why it cannot live in `jobs` |
|---|---|---|
| `job_cards` | engine, waterMode, profile, assetClass, runId, next stage, outcome, refine total | `jobs` is user-facing status and credits. This is orchestration state with a different lifecycle. |
| `job_card_stages` | one row per stage: status, skipReason, failCodes, artifacts, attempt, timings | Resume reads this. Without it a crashed session has to replay chat, which the contract forbids. |
| `evidence_captures` | one row per artifact, scoped to `run_id` | Promote eligibility is *derived* from these rows. A stored `promoteEligible` boolean would be a lie waiting to happen. |

Three invariants are enforced by the schema itself, not only by application code, because
they are the ones that matter most if a future code path forgets them:

- `status = 'skipped'` requires a `skip_reason`; `status = 'failed'` requires at least one fail code.
- A partial unique index allows **exactly one `comparison_sheet` per `(job_id, run_id)`**.
- A `BEFORE UPDATE` trigger raises if `engine` changes. Engine immutability survives a bad UPDATE.

`refine_total` carries a `CHECK (<= 6)` and `attempt` a `CHECK (<= 4)`, so the refine ceiling
holds even if the controller is bypassed.

**Nothing else needs a schema change.** Artifacts (GLBs, turntable PNGs, comparison sheets)
go to S3 exactly as they do now; `evidence_captures.uri` points at them. No new columns on
`jobs`, `chats`, or `workspaces`.

One thing to decide before this runs in production: `evidence_captures` grows by roughly
eight rows per run and never prunes. A retention policy on rows whose `run_id` is no longer
current would keep it from growing without bound.

---

## 9d. Known issues and honest limitations

Ordered by how likely each is to bite.

1. **`game_ready` is not deliverable.** No bake means no UV unwrap and no PBR maps. The tool
   returns 501. Do not sell the profile yet.
2. **Vehicles cannot promote without a VLM.** This is correct fail-closed behaviour, but it
   means the vehicle path is blocked on wiring a vision model, not on more geometry work.
3. **JPEG references are not admitted** without a rembg adapter. If users upload photos, this
   is the first thing they will hit. The local fallback only reads 8-bit PNG.
4. **AutoRemesher is not wired.** `remeshCandidate` is computed and routed on, but no remesh
   runs, so a remeshable defect costs a full regeneration.
5. **Self-intersection can report inconclusive** on very dense meshes when the pair-test
   budget runs out. It fails closed, which is right, but a legitimate 50k-triangle asset could
   be rejected for a budget reason rather than a geometry reason. Watch for
   `"scan exceeded its work budget"` in gate details and raise `maxPairTests` if it appears.
6. **Flush contact is not self-intersection.** A crossing landing exactly on a triangle edge
   counts as touching, deliberately — parts resting on each other are legal. Perfectly
   axis-aligned interpenetration at identical coordinates is therefore missed. Real generator
   output is not aligned that way, but synthetic assets can be.
7. **Admission's border-colour fallback is crude.** It handles plain studio backgrounds, which
   is all the intake rule allows, and nothing else.
8. **The comparison sheet has no text labels.** Columns are identified by a coded marker bar
   and the ordering recorded in the score report, because adding a font was not worth a
   dependency.
9. **Nothing is wired into a user-facing route.** No behaviour has changed for any current
   user. That is deliberate — the gate should be turned on after a bench run, not before.
10. **eve is not installed.** The `agent/` directory is written to the framework's layout but
    `npm install` has not been run there, so it is unverified against the real runtime.

---

## 10. Naming map (pack ↔ this repo)

| Pack term | Here |
|---|---|
| Cloud / BlueFox / Pixal3D | `engine=trilles`, label `BlueFox 1`, GPU `api.hydrilla.co` *(pending §4.3)* |
| `cloud-run-pixal` | `POST /api/3d/generate` → Trellis submit/poll |
| `cloud-t2i` | `POST /api/3d/text-to-image` (FLUX) |
| Water BYOK generate (`water-generate-3d`) | **not shipped** — would be `water-mesh` mode |
| `water-threejs-preview` (pack: optional) | **shipped** `runStudioPipeline` → `three_factory` + `WaterViewer` |
| JobCard | to build — `job_cards` + `lib/create/jobCard.ts` |
| EvidenceManifest | to build — `evidence_captures` + `lib/create/evidence.ts` |
| `mesh.post.gate`, `mesh.bake`, `asset.render_views`, `asset.score` | to build — `services/mesh-worker` |
| `result_kind=glb` | already `ENGINE.hydrilla.resultKind` |
| eve | not present; backend stages instead |

Artifact boundary from [`ENGINES.md`](./ENGINES.md) still holds and is non-negotiable:

```text
Cloud:  engine=trilles   result_kind=glb            result_glb_url=…
Water:  engine=water     result_kind=three_factory  factory_code=…
```

---

## 11. Global acceptance gates

- [ ] One module owns every threshold; no number duplicated in prose.
- [ ] Deterministic geo gate runs before any aesthetic scoring, on **both** engines.
- [ ] VLM cannot override a HARD geo fail.
- [ ] Generator never self-promotes; evaluator owns promote/reject/refine.
- [ ] Exactly one comparison sheet per `runId`.
- [ ] Promote blocked without a fresh complete EvidenceManifest.
- [ ] Engine immutable end-to-end; no code path switches Cloud↔Water.
- [ ] Cloud and Water skill markdown never shared; shared layer is contracts + workers only.
- [ ] JobCard is total state; resume never replays chat.
- [ ] Exactly 12 tool IDs.
- [ ] Refine caps enforced on the JobCard (≤3/pass, ≤6 total).
- [ ] Asset class from contract, never from filename/keyword; profiles only raise floors.
- [ ] Water Fast tier still cheap (no evaluator LLM, no VLM).
- [ ] Exported GLB matches the previewed result on Water.
- [ ] No Godot/Firstmate/AI-Gateway/Comfy-runtime/Meshy-as-bake in any shipped path.

---

## 12. One-liner

The pack's laws are right and we adopt them; its Water product definition is not ours and we keep the factory as a first-class mode. **Cloud has no quality layer — build `cloud-mesh-post` first, then the front half, then `cloud-evaluate` with evidence, then reuse all of it to harden Water.**
