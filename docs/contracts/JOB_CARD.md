# JobCard — session contract

Authored here (the Grok pack's `contracts/JOB_CARD.md` is a stub). Types:
`backend/hydrilla_backend/src/lib/create/contracts.ts` · Table: `sql/010_create_job_cards.sql`.

**Law:** the JobCard is **total state**. Crash recovery reads the card. Chat history is
never job truth.

---

## Shape

```text
JobCard
  jobId          # existing jobs.id  (GPU id, or wt_* for Water)
  runId          # minted per generate attempt; re-minted on remesh / bake / refine
  engine         # "cloud" | "water"        — immutable for the life of the job
  waterMode      # "threejs" | "mesh"       — Water only; not an engine switch
  profile        # "draft" | "balanced" | "quality" | "game_ready"
  assetClass     # "prop" | "vehicle" | "prop-hero"
  stages[]       # ordered; every stage present from creation
  next           # id of the next stage to run, or null when terminal
  refine         # { perStage: Record<stage, n>, total: n }
  outcome        # "pending" | "promoted" | "rejected" | "partial" | "failed"
```

`engine` is written once from the UI pick and never updated. Any code path that would
change it is a bug.

## Stage record

```text
JobCardStage
  id           # canon skill id, e.g. "cloud-mesh-post"
  status       # "pending" | "running" | "done" | "skipped" | "failed"
  skipReason   # required when status = "skipped"
  failCodes[]  # required when status = "failed"
  artifacts[]  # URIs produced by this stage
  startedAt / endedAt
  attempt      # 1-based; increments on refine re-entry
```

A stage may only move `pending → running → (done | skipped | failed)`. Re-entry from
`cloud-refine-loop` resets it to `running` with `attempt + 1`.

## Stage order

### Cloud

```text
cloud-compile-prompt
  → cloud-route-estimate
  → [cloud-t2i]              # when needs_t2i
  → cloud-preprocess-ref
  → cloud-run-pixal          # ONLY generate
  → cloud-mesh-post          # HARD gate — never skippable
  → [cloud-bake]             # profile = game_ready, or NO_UV
  → cloud-evaluate           # ≠ generator; owns promote
  → [cloud-refine-loop]
```

### Water (`water-threejs`)

```text
water-compile-prompt
  → water-route-estimate
  → water-generate-3d        # runStudioPipeline: planner → locked passes
  → water-mesh-post          # HARD gate on the EXPORTED GLB
  → water-evaluate
  → [water-refine-loop]
```

**Not skippable on either engine:** `*-mesh-post`, `*-evaluate`. Marking them
`skipped` is illegal and must throw.

## Refine caps

| Cap | Value |
|---|---|
| Per stage | **≤ 3** |
| Total per job | **≤ 6** |

Counters live on the card, not in memory. Stop conditions: success · repeated defect ·
plateau (`Δ < 0.02`) · ceiling reached · budget exhausted.

## `run.checkpoint`

The only writer of stage truth. Every call is idempotent for a given
`(jobId, runId, stageId, attempt)`.

```text
run.checkpoint({ jobId, runId, stageId, status, skipReason?, failCodes?, artifacts?, next })
```

Rules:

1. `skipped` without `skipReason` → reject.
2. `failed` without at least one fail code → reject.
3. Advancing past `*-mesh-post` while it is not `done` → reject (stage-aware gating).
4. `next` must name a stage that exists on the card.

## Resume

```text
load JobCard → find first stage not in (done | skipped) → run it
```

Never replay chat. Never re-run a `done` stage. A resumed job keeps its `runId` unless
the resumed stage mints a new one (remesh / bake / refine).

## `runId` minting

New `runId` on: initial generate, remesh inside `mesh-post`, bake, and each refine
iteration. Evidence is scoped to a `runId` — see
[`EVIDENCE_MANIFEST.md`](./EVIDENCE_MANIFEST.md). A stale `runId` cannot promote.

## Relationship to existing `jobs`

The card **augments** `jobs`; it does not replace it.

| Concern | Owner |
|---|---|
| user-facing status (`WAIT` / `RUN` / `DONE`), credits, result URLs, lineage | `jobs` |
| stage machine, gate reports, fail codes, refine counters, `next` | `job_cards` + `job_card_stages` |

The artifact boundary from [`../ENGINES.md`](../ENGINES.md) is unchanged:

```text
Cloud:  engine=trilles   result_kind=glb            result_glb_url=…
Water:  engine=water     result_kind=three_factory  factory_code=…
```
