---
description: >-
  Load ONLY in a Lab-flagged session when explicitly asked to compare pipeline variants,
  prompt variants, or harness-vs-raw-engine output on Cloud. Never load on a normal
  customer Create job — this is not the default path and it spends real credits per arm.
---

# cloud-experiment

**Lab only.** Deferred to Phase 7; gated behind `HYDRILLA_LAB_ENABLED`. If the session is
not Lab-flagged, refuse and run the normal pipeline instead.

## Tools

1. `prompt.compile` — **one shared compile** across all arms, so arms differ only by the
   variable under test.
2. `experiment.fanout` — concurrency **3**, Cloud arms only, `engineScope: "cloud"`.
3. Per-arm EvidenceManifest + comparison artifacts.

## Rules

- Cloud-scoped. No Water arms — a Water comparison belongs to the Water Lab agent.
- Raw engine output is a **baseline column**, never a Create default and never an
  override of the harness result.
- Dual metrics are mandatory: geometry integrity **and** reference look, reported
  separately. Never average a HARD geometry fail away into a blended score.
- Every arm still passes `cloud-mesh-post` before it is scored.
- Fixed prompt set per bench run, so results are reproducible.

Depth: `agent-skills/Hydrilla AI orchestration/skills/cloud/cloud-experiment/`
(`fanout.md`, `paid-sample-discipline.md`).
