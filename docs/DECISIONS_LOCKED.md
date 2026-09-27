# Create — locked decisions

Authored in this repo (the Grok pack referenced a `DECISIONS_LOCKED.md` that lived
outside it). These are the resolved answers to
[`CREATE_ORCHESTRATION_PLAN.md`](./CREATE_ORCHESTRATION_PLAN.md) §4.

**Status:** LOCKED · **Date:** 2026-09-13
Do not reopen without an explicit product override recorded here.

---

## D1 — Water keeps the Three.js factory as a first-class mode

The Grok pack defined Water as BYOK **mesh** generation and demoted our shipped
Three.js factory to `OPTIONAL_water-threejs-preview` ("off hot path"). **Rejected.**

| Water mode | Status | Generate | `result_kind` |
|---|---|---|---|
| `water-threejs` | **shipped, first-class** | `runStudioPipeline` — planner → locked passes → generator ≠ evaluator | `three_factory` |
| `water-mesh` | **deferred** (plan Phase 7) | BYOK adapters (Meshy / Tripo / fal / Rodin) via `water-generate-3d` | `glb` |

Rationale: the factory path is live, differentiated, and already implements the
discipline the pack demands. Nothing that exists gets deleted to satisfy a spec.

**Rules**

- Engine stays immutable from the UI pick. **Mode** is chosen *inside* Water — that is not an engine switch.
- `water-mesh` must not be assumed by any skill, gate, or doc until it ships.
- The pack's `OPTIONAL_water-threejs-preview.md` is superseded by this decision.

## D2 — Characters: refused on Cloud v1, stylized-only on Water

| Engine | Character input | Behavior |
|---|---|---|
| **Cloud** | refuse | `cloud-compile-prompt` HARD-REFUSES character / humanoid / face / hair / creature. No identity rubric exists, so we would lose the comparison. |
| **Water** | allow, stylized only | `character` skill stays `status: "live"` with an explicit **not photoreal likeness** contract. |

Water's `animation` skill stays `partial`. No idle `tick`; factories remain static.

## D3 — "Pixal3D" is BlueFox — one Cloud backbone

Pixal3D in the pack is the **same engine** we already run. There is no second host.

| Name | Where it appears |
|---|---|
| **Pixal3D** | Grok pack prose, `cloud-run-pixal` skill ID |
| **BlueFox 1** | user-facing label (`lib/models.ts`, marketing) |
| **Trellis** | GPU gateway env (`TRELLIS_GATEWAY_URL`, `TRELLIS_API_URL`) |
| `trilles` | persisted `jobs.engine` / catalog id |

All four refer to one thing. `cloud-run-pixal` keeps its canon skill ID (renaming
would churn 20+ pack files) and wraps our existing submit/poll against
`api.hydrilla.co`. No new adapter, no new env vars.

## D4 — Orchestrator: backend stages now, eve optional later

No eve runtime exists here. The pipeline is implemented as **backend stages** in
`backend/hydrilla_backend/src/lib/create/` and `lib/cloud/`, using the pack's exact
stage names and the frozen 12 tool IDs. An eve wrapper later reuses the same tool
surface with no rework. Cloud quality is not blocked on an agent runtime.

Firstmate is never the Create runtime.

---

## Carried from the pack (unchanged)

- brain ≠ hands ≠ session; generator ≠ evaluator; evaluator owns promote
- Engine immutable end-to-end; no code path switches Cloud ↔ Water
- Engine-scoped skill trees; shared layer is contracts + workers only
- Deterministic geo HARD gate before any aesthetic/VLM scoring, both engines
- VLM never overrides a HARD geo fail
- Exactly one comparison sheet per `runId`
- JobCard is total state; chat is never job state
- Asset class from contract, never inferred from filename/keywords
- Class profiles **raise** floors only, never lower
- Exactly 12 tool IDs, no 13th
- Raw engine output is a bench baseline column, never the Create default
- Kill list holds: no Godot/game engines as generators, no AI Gateway, no Comfy
  product runtime, no Meshy-as-bake-owner, no world/HUD/multiplayer skills

## Contracts

| Contract | Path |
|---|---|
| Tool surface (12 IDs) | [`contracts/TOOL_SURFACE.md`](./contracts/TOOL_SURFACE.md) |
| JobCard | [`contracts/JOB_CARD.md`](./contracts/JOB_CARD.md) |
| EvidenceManifest | [`contracts/EVIDENCE_MANIFEST.md`](./contracts/EVIDENCE_MANIFEST.md) |
| Thresholds (code) | `backend/hydrilla_backend/src/lib/create/quality/thresholds.ts` |
