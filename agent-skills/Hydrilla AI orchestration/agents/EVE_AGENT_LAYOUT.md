# eve agent layout — Create Cloud vs Create Water

**Orchestrator:** eve (see `docs/ORCHESTRATOR_DECISION.md`).  
**Not Firstmate.**

> **Repo status:** there is no eve runtime in this repo (Next.js frontend + Express
> backend). Stage names and tool IDs below are still authoritative — they are
> implemented as backend pipeline stages first, so an eve wrapper later needs no
> rework. See [`docs/CREATE_ORCHESTRATION_PLAN.md`](../../../docs/CREATE_ORCHESTRATION_PLAN.md) §4.4 and §8.

## Recommendation

Ship **two agents** (or one binary with engine-gated skill roots). Prefer separate agents so skill discovery cannot cross-load Pixal and BYOK prompts.

| Agent ID | Engine | Skill root |
|----------|--------|------------|
| `eve-create-cloud` | `bluefox` | `skills/cloud/**` |
| `eve-create-water` | `water` | `skills/water/**` |

Shared protocol markdown may be linked from `instructions.md` but **not** registered as Create skills.

## defineAgent sketch (Cloud)

```ts
// illustrative — align to eve filesystem layout (agent/)
export const createCloudAgent = {
  id: "eve-create-cloud",
  instructions: [
    "Engine=bluefox immutable. Pipeline: text→image → image→3D → mesh-post → optional bake → score.",
    "Deliverable result_kind=glb mesh/GLB. Three.js = turntable/viewer evidence only.",
    "HARD-REFUSE characters. No engine switch. No AI Gateway. No Firstmate.",
    "Brain=eve; hands=workers; session=JobCard+EvidenceManifest.",
    "Generator ≠ evaluator: cloud-evaluate owns promote.",
  ],
  skills: [
    "cloud-run-job",
    "cloud-compile-prompt",
    "cloud-route-estimate",
    "cloud-t2i",
    "cloud-preprocess-ref",
    "cloud-run-pixal",
    "cloud-mesh-post",
    "cloud-bake",
    "cloud-evaluate",
    "cloud-refine-loop",
    // Lab only:
    // "cloud-experiment",
  ],
  tools: [
    // thin RPC → Hydrilla Run API (TOOL_SURFACE.md)
    "prompt.compile",
    "run.estimate",
    "run.route",
    "image.rembg",
    "job.submit",
    "job.await",
    "mesh.post.gate",
    "mesh.bake",
    "asset.render_views",
    "asset.score",
    "run.checkpoint",
    // Lab: "experiment.fanout",
  ],
};
```

## defineAgent sketch (Water)

```ts
export const createWaterAgent = {
  id: "eve-create-water",
  instructions: [
    "Engine=water immutable. BYOK adapters only for generate.",
    "Do not load cloud-t2i/cloud-run-pixal. result_kind=glb.",
    "Own bake; Meshy never owns bake. HARD-REFUSE characters.",
    "water-evaluate is evaluator; no Cloud escape hatch in refine.",
  ],
  skills: [
    "water-run-job",
    "water-compile-prompt",
    "water-route-estimate",
    "water-t2i",
    "water-preprocess-ref",
    "water-generate-3d",
    "water-mesh-post",
    "water-bake",
    "water-evaluate",
    "water-refine-loop",
    // Lab only:
    // "water-experiment",
    // optional later: water-threejs-preview — NEVER on Cloud agent
  ],
  tools: [ /* same Run API IDs; adapters differ behind job.submit */ ],
};
```

## Filesystem (eve)

```
agent/
  instructions.md          # art bible + kill list + engine lock
  agent.ts                 # model/compaction; NO AI Gateway
  skills/                  # symlink or copy from orch pack engine root
  tools/                   # typed worker RPCs
  connections/             # MCP/OpenAPI to Pixal OR Water BYOK (per agent)
  subagents/               # optional remesh/bake QA specialists
  evals/                   # gate regression
sessions/                  # durable JobCard-backed sessions
```

## Hooks — park during GPU

| Event | Hook behavior |
|-------|----------------|
| `job.submit` accepted | Persist JobCard; optionally park eve session |
| `job.await` waiting | Park; webhook/resume on terminal status |
| bake long-running | Same park pattern |
| resume | Load JobCard `next`; do not replay chat as state |
| score complete | Write EvidenceManifest; promote/reject/refine |

Implementation details live in harness `packages/job-runner` — agent only calls tools.

## Cursor self-containment

Symlink `agent/skills` → this pack’s `skills/cloud` or `skills/water`. Prefer reference notes to `/workspace/hydrilla-harness/docs/*` over copying trees.
