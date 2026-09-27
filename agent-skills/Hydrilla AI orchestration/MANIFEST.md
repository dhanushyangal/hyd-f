# MANIFEST — Hydrilla AI orchestration pack

**Generated for:** Tharak (Ben executor)
**Pack date:** 2026-09-13 · **Reconciled against disk:** 2026-09-13
**Pack root (this repo):** `agent-skills/Hydrilla AI orchestration/`
**Adoption plan:** [`docs/CREATE_ORCHESTRATION_PLAN.md`](../../docs/CREATE_ORCHESTRATION_PLAN.md)

Canonical skill IDs: [`docs/SKILL_ID_CANON.md`](./docs/SKILL_ID_CANON.md) — this manifest matches it and the folders on disk.

## Skill ID counts

| Pack | SKILL.md count |
|------|----------------|
| Cloud | **11** |
| Water | **11** (+1 optional, doc-only) |
| Shared Create skills | **0** (protocol helpers only) |
| **Total Create skills** | **22** |

### Cloud IDs (canon)

- `cloud-compile-prompt`
- `cloud-route-estimate`
- `cloud-t2i`
- `cloud-preprocess-ref`
- `cloud-run-pixal`
- `cloud-mesh-post`
- `cloud-bake`
- `cloud-evaluate`
- `cloud-refine-loop`
- `cloud-run-job`
- `cloud-experiment` (Lab flag only)

### Water IDs (canon)

- `water-compile-prompt`
- `water-route-estimate`
- `water-t2i`
- `water-preprocess-ref`
- `water-generate-3d`
- `water-mesh-post`
- `water-bake`
- `water-evaluate`
- `water-refine-loop`
- `water-run-job`
- `water-experiment` (Lab flag only)

### Optional (documented, no SKILL.md)

- `water-threejs-preview` — `skills/water/OPTIONAL_water-threejs-preview.md`

> **Repo note:** in this repo the Three.js factory path is **shipped**, not legacy
> (`runStudioPipeline` → `result_kind=three_factory` → `WaterViewer`). See
> `docs/CREATE_ORCHESTRATION_PLAN.md` §4.1 before treating it as optional.

### Retired aliases — never use in new prompts

`cloud-i2-3d` → `cloud-run-pixal` · `cloud-mesh-post-gate` → `cloud-mesh-post` ·
`cloud-game-ready-bake` → `cloud-bake` · `cloud-score-compare` → `cloud-evaluate` ·
`cloud-run-experiment` → `cloud-experiment` · same pattern for `water-*-gate`,
`water-score-compare`, `water-game-ready-bake`.

## Every file in this pack

- `MANIFEST.md`
- `MANIFEST_FILES.txt`
- `agents/EVE_AGENT_LAYOUT.md`
- `contracts/EVIDENCE_MANIFEST.md` *(stub → author locally, see plan §5)*
- `contracts/JOB_CARD.md` *(stub)*
- `contracts/README.md`
- `contracts/TOOL_SURFACE.md` *(stub)*
- `cursor-prompts/00_MASTER_ORCHESTRATION.md`
- `cursor-prompts/01_SETUP_EVE_CREATE_CLOUD.md`
- `cursor-prompts/02_SETUP_EVE_CREATE_WATER.md`
- `cursor-prompts/03_IMPLEMENT_CLOUD_PIPELINE.md`
- `cursor-prompts/04_IMPLEMENT_QUALITY_GATES.md`
- `cursor-prompts/05_BENCH_VS_PIXAL.md`
- `cursor-prompts/06_PRESERVE_PRIOR_WORK.md`
- `docs/ANTHROPIC_HARNESS_MAP.md`
- `docs/CLOUD_SKILL_PACK.md`
- `docs/IMG2THREEJS_DELTA.md`
- `docs/KEEP_FROM_PRIOR.md`
- `docs/KILL_LIST.md`
- `docs/ORCHESTRATOR_DECISION.md`
- `docs/QUALITY_VS_PIXAL.md`
- `docs/README.md`
- `docs/RESEARCHY_ORCH_NOTES.md`
- `docs/SHARED_LAYER.md`
- `docs/SHARED_SKILLS.md`
- `docs/SKILL_ID_CANON.md`
- `docs/SYSTEM_INTEGRATION.md`
- `docs/VERCEL_LABS_SKILLS.md`
- `docs/WATER_SKILL_PACK.md`
- `skills/README.md`
- `skills/cloud/cloud-bake/SKILL.md`
- `skills/cloud/cloud-bake/references/glb-compress-notes.md`
- `skills/cloud/cloud-bake/references/material-slot-qa.md`
- `skills/cloud/cloud-bake/references/pbr-map-expectations.md`
- `skills/cloud/cloud-compile-prompt/SKILL.md`
- `skills/cloud/cloud-compile-prompt/references/hard-surface-compile.md`
- `skills/cloud/cloud-compile-prompt/references/hydrilla-prop-compile.md`
- `skills/cloud/cloud-compile-prompt/references/prompt-contract.md`
- `skills/cloud/cloud-compile-prompt/references/quality-bar.md`
- `skills/cloud/cloud-evaluate/SKILL.md`
- `skills/cloud/cloud-evaluate/references/car-identity-features.md`
- `skills/cloud/cloud-evaluate/references/evidence-manifest.md`
- `skills/cloud/cloud-evaluate/references/img2threejs-must-fold.md`
- `skills/cloud/cloud-evaluate/references/prop-score-rubric.md`
- `skills/cloud/cloud-evaluate/references/quality-bar.md`
- `skills/cloud/cloud-experiment/SKILL.md`
- `skills/cloud/cloud-experiment/references/fanout.md`
- `skills/cloud/cloud-experiment/references/paid-sample-discipline.md`
- `skills/cloud/cloud-mesh-post/SKILL.md`
- `skills/cloud/cloud-mesh-post/references/hard-surface-geo.md`
- `skills/cloud/cloud-mesh-post/references/img2threejs-must-fold.md`
- `skills/cloud/cloud-mesh-post/references/prop-geo-rules.md`
- `skills/cloud/cloud-mesh-post/references/quality-bar.md`
- `skills/cloud/cloud-mesh-post/references/remesh.md`
- `skills/cloud/cloud-preprocess-ref/SKILL.md`
- `skills/cloud/cloud-preprocess-ref/references/i2-3d-intake.md`
- `skills/cloud/cloud-preprocess-ref/references/vehicle-preprocess.md`
- `skills/cloud/cloud-refine-loop/SKILL.md`
- `skills/cloud/cloud-refine-loop/references/img2threejs-must-fold.md`
- `skills/cloud/cloud-route-estimate/SKILL.md`
- `skills/cloud/cloud-route-estimate/references/class-poly-budgets.md`
- `skills/cloud/cloud-route-estimate/references/paid-call-discipline.md`
- `skills/cloud/cloud-route-estimate/references/quality-bar.md`
- `skills/cloud/cloud-route-estimate/references/routing.md`
- `skills/cloud/cloud-run-job/SKILL.md`
- `skills/cloud/cloud-run-pixal/SKILL.md`
- `skills/cloud/cloud-run-pixal/references/job-contract.md`
- `skills/cloud/cloud-run-pixal/references/job-hooks.md`
- `skills/cloud/cloud-run-pixal/references/resume.md`
- `skills/cloud/cloud-t2i/SKILL.md`
- `skills/shared/README.md`
- `skills/shared/evidence-manifest-protocol.md`
- `skills/shared/job-card-protocol.md`
- `skills/water/OPTIONAL_water-threejs-preview.md`
- `skills/water/water-bake/SKILL.md`
- `skills/water/water-compile-prompt/SKILL.md`
- `skills/water/water-evaluate/SKILL.md`
- `skills/water/water-experiment/SKILL.md`
- `skills/water/water-generate-3d/SKILL.md`
- `skills/water/water-mesh-post/SKILL.md`
- `skills/water/water-preprocess-ref/SKILL.md`
- `skills/water/water-refine-loop/SKILL.md`
- `skills/water/water-route-estimate/SKILL.md`
- `skills/water/water-run-job/SKILL.md`
- `skills/water/water-t2i/SKILL.md`

## Known gaps

| Gap | Impact |
|-----|--------|
| `contracts/*.md` are 3-line stubs pointing at `/workspace/hydrilla-harness/docs/` | JobCard / EvidenceManifest / tool surface must be authored in this repo — plan Phase 0 |
| Water skills have **no** `references/` | Cloud ships 20+ reference files; Water carries none |
| `cloud-t2i`, `cloud-run-job` have no `references/` | Thin by design; confirm before deepening |
| Referenced `packages/*` and `data/*` trees absent from this repo | Prompts `03`–`06` cannot run literally — plan §5 |

## Prior hydrilla-harness files referenced (not present in this repo)

| Referenced path | Used by |
|-----------------|---------|
| `docs/DECISIONS_LOCKED.md` | locks / kill list |
| `docs/CREATE_V1_SCOPE.md` | props-only refuse |
| `docs/JOB_CARD.md` | session / run-job / contracts stub |
| `docs/EVIDENCE_MANIFEST.md` | evaluator / shared protocol / contracts stub |
| `docs/TOOL_SURFACE.md` | tool IDs / contracts stub |
| `docs/QUALITY_BAR_IMG2THREEJS.md` | IMG2THREEJS_DELTA / quality vs Pixal |
| `docs/NEEDLE_AND_EVE_BRIEF.md` | eve orch decision |
| `docs/SKILLS_SH_VERIFY.md` (+ scrape/license) | VERCEL_LABS_SKILLS keepers |
| `docs/HARNESS_CONTRACTS_PKG.md` | contracts README |
| `docs/PRODUCT_HARNESS.md` | dual-engine context |
| `packages/harness-contracts/` | `@hydrilla/harness-contracts` |
| `packages/agent-skills/skills/*` (v0.2.x) | mine into engine-scoped skills |
| `packages/adapters-bluefox/` | Cloud i2_3d hands |
| `packages/adapters-fal/`, `adapter-core/` | Water BYOK hands |
| `packages/job-runner/` | durable submit/await/checkpoint |
| `packages/prompt-compiler/` | compile tool |
| `packages/bench/` | bench vs Pixal |
| `data/img2threejs-extract/` | gates + comparison sheet |
| `data/skills-sh-extract/` | Meshy/fal/tripo patterns |

## Not included

- No `.tar.gz` (Ben packs later)
- No wholesale copy of `packages/agent-skills` or img2threejs trees
