# EvidenceManifest — promote contract

Authored here (the Grok pack's `contracts/EVIDENCE_MANIFEST.md` is a stub). Types:
`backend/hydrilla_backend/src/lib/create/contracts.ts` · Table: `sql/010_create_job_cards.sql`.

**Law:** promote is **illegal** without a fresh, complete manifest for the current
`runId`. A high score never substitutes for missing evidence.

---

## Shape

```text
EvidenceManifest
  jobId
  runId              # must equal the JobCard's current runId
  captures[]         # { kind, uri, runId, createdAt, meta? }
  promoteEligible    # derived, never stored as input
  missing[]          # capture kinds still required
  reasons[]          # why promote is blocked
```

## Capture kinds

| Kind | Required when | Notes |
|---|---|---|
| `glb` | always | The mesh being judged |
| `gate_report` | always | Output of `mesh.post.gate`, must be HARD pass |
| `turntable` | always | **Exactly 4** — 0°, 90°, 180°, 270° |
| `comparison_sheet` | always | **Exactly 1 per `runId`** — more than one is a hard error |
| `admission_report` | Cloud with a reference image | From `cloud-preprocess-ref` |
| `bake_report` | `profile = game_ready`, or bake ran | Channel QA |
| `score_report` | always | Output of `asset.score` |

## `checkEvidence`

```text
checkEvidence(manifest, jobCard) → { promoteEligible, missing[], reasons[] }
```

`promoteEligible` is true only when **all** hold:

1. Every required capture kind for the profile is present.
2. Every capture carries the JobCard's **current** `runId` — stale captures do not count.
3. Exactly one `comparison_sheet`.
4. Exactly four `turntable` captures, one per required angle.
5. `gate_report` shows a HARD **pass**.
6. `score_report` meets the profile floor (`thresholds.ts`).

Any failure → `promoteEligible: false` with a populated `reasons[]`.

## Freshness

A capture is stale the moment its `runId` differs from the card's current `runId`.
Remesh, bake, and each refine iteration mint a new `runId`, which invalidates prior
captures. This is deliberate: it prevents promoting a mesh on evidence rendered from
an earlier version of that mesh.

## Ordering (stage-aware)

```text
mesh.post.gate HARD pass
  → asset.render_views (4 turntable)
  → asset.score  (one sheet → Tier1 → identity → VLM last)
  → checkEvidence
  → promote | reject | refine
```

Illegal:

- Scoring before a HARD geo pass.
- Running bake-channel QA before `*-mesh-post` is `done`.
- A VLM score overriding `NON_MANIFOLD`, `SELF_INTERSECT`, or any HARD fail code.
- Two comparison sheets for one `runId`.
- Promoting from `cloud-run-pixal` or any generator stage — only `*-evaluate` promotes.

## Rubrics are per engine

The Cloud sheet-averaging rubric and the Water rubric are **separate**. Never score a
`three_factory` result and a Pixal/BlueFox GLB with one rubric — see
[`../CREATE_ORCHESTRATION_PLAN.md`](../CREATE_ORCHESTRATION_PLAN.md) §2.
