# Cursor prompt — Master orchestration (paste-ready)

You are implementing Hydrilla Create orchestration for Tharak.

> **Read before pasting:** [`docs/CREATE_ORCHESTRATION_PLAN.md`](../../../docs/CREATE_ORCHESTRATION_PLAN.md).
> In this repo there is no eve runtime and no `/workspace/hydrilla-harness/` tree, so
> prompts `01`–`06` cannot run literally. Stage names, canon skill IDs, laws, and
> quality numbers below still hold — they are implemented as backend pipeline stages.
> Skill IDs are canon per `docs/SKILL_ID_CANON.md`; retired aliases are forbidden.

## Non-negotiables

1. Orchestrator = **eve**. Firstmate is NOT Create runtime (optional later for repo coding-crew only).
2. Two engines: Cloud = GCP Pixal3D BlueFox; Water = BYOK. UI engine pick **immutable**. Skills never switch engines.
3. Cloud pipeline **EXACT**: text→image → image→3D → mesh-post/gates/optional bake → score.
4. Create v1: props/hard-surface Car-class only; **HARD-REFUSE characters**.
5. Default output `result_kind=glb` (mesh/GLB). Three.js only for turntable/viewer evidence — not Cloud generate.
6. Quality: beat raw Pixal3D; look good vs reference (comparison sheet + benches).
7. Anthropic shape: brain (eve) ≠ hands (workers) ≠ session (JobCard + EvidenceManifest). Generator ≠ evaluator.
8. No AI Gateway, no Comfy product runtime, no Meshy-as-default-bake, no BlueFox override of Water picks.
9. Lift artificial 8-skill cap only for skills that earn quality — use packs under `Hydrilla AI orchestration/skills/{cloud,water}/`.
10. Prefer referencing `/workspace/hydrilla-harness/` over duplicating trees.

## Read first

- `Hydrilla AI orchestration/docs/README.md`
- `ORCHESTRATOR_DECISION.md`, `ANTHROPIC_HARNESS_MAP.md`, `SYSTEM_INTEGRATION.md`
- `CLOUD_SKILL_PACK.md` or `WATER_SKILL_PACK.md`
- `KILL_LIST.md`
- Harness: `docs/DECISIONS_LOCKED.md`, `JOB_CARD.md`, `EVIDENCE_MANIFEST.md`, `TOOL_SURFACE.md`, `QUALITY_BAR_IMG2THREEJS.md`

## Deliver

Wire eve Create Cloud and Create Water agents per `agents/EVE_AGENT_LAYOUT.md`. Implement using subsequent prompts `01`–`06`. Do not create `.tar.gz`.
