---
description: >-
  Load ONLY in a Lab-flagged session when explicitly asked to compare Water variants —
  prompt variants, harness settings, or BYOK adapters against each other. Never load on a
  normal customer Create job; every arm spends the customer's budget.
---

# water-experiment

**Lab only.** Deferred to Phase 7; gated behind `HYDRILLA_LAB_ENABLED`. If the session is
not Lab-flagged, refuse and run the normal pipeline instead.

## Tools

1. `prompt.compile` — **one shared compile** across all arms.
2. `experiment.fanout` — concurrency **3**, Water arms only, `engineScope: "water"`.
3. Per-arm EvidenceManifest, ranked by `water-evaluate` sheets.

## Rules

- Water-scoped. Arms may compare harness settings, or Meshy / Tripo / fal / Rodin against
  each other on the deferred mesh mode. **Never a Cloud or Pixal arm** — that would be an
  engine switch wearing a lab coat.
- Dual metrics are mandatory: geometry integrity **and** reference look, reported
  separately. Never average a HARD geometry fail away.
- Never merge Water and Cloud results into one score; the rubrics are separate.
- Every arm still passes `water-mesh-post` before it is scored.
- Respect the customer's BYOK budget — a fanout multiplies real cost.
