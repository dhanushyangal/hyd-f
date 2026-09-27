# `agent/` — eve orchestration for Hydrilla Create

> **Status: PARKED.** Nothing in the product calls these agents. Water generation and
> follow-up edits run in the backend on the Vercel AI SDK (`generateText` for the harness,
> `ToolLoopAgent` for the director) — see [`docs/WATER_ORCHESTRATION.md`](../docs/WATER_ORCHESTRATION.md).
> eve is kept compiling (`npm run typecheck`, `eve info`) so it can come back. The likely
> first use is the follow-up director, once it needs durable multi-turn sessions. Why
> it's parked, and when to revisit, is in the comments in `agents/create-water/agent/agent.ts`
> and in the backend's `orchestrator/routeCreate.ts`. Also note `job_submit` returns 501 by design.

Two [eve](https://vercel.com/eve) agents, one per engine. eve is Vercel's agent
framework: instructions and skills are Markdown, tools are TypeScript, and durability
comes from Vercel Workflows.

An eve app has exactly **one root agent**, assembled from the files under its `agent/`
directory. Two agents therefore means an `agents/` workspace, with each agent's own files
at `agents/<name>/agent/` — the shape `eve init --agents create-cloud,create-water`
produces and the one `eve info` calls `Layout: nested`.

This package is the **brain**. It plans stages, reads gate reports, and decides
promote / reject / refine. It contains **no geometry, no scoring, no provider calls**.
Every capability is a thin typed HTTP RPC to the Hydrilla backend, which is the hands.

---

## Why two agents

`agent-skills/Hydrilla AI orchestration/agents/EVE_AGENT_LAYOUT.md` and the kill list
both require engine-scoped skill trees: **Cloud must not be able to discover Water
skills, and vice versa.** eve scans `agent/skills/` of the agent it is running, so the
airtight way to enforce that is two agents. `create-cloud` has no Water skill on disk to
load; `create-water` has no Cloud skill on disk to load. Engine cross-contamination is
structurally impossible rather than merely discouraged.

The cost is duplication: the same twelve tool files exist under both agents, because a
tool is discovered from the agent's own `tools/` directory. What is *not* duplicated is
`shared/`, imported through the package subpath `#shared/*` — `runApi.ts`, the single
network client, and `compiledPrompt.ts`, the schema the backend validates. One backend
contract gets one schema; two copies would be two chances to drift.

## Layout

```
agent/                             # eve workspace root
  README.md
  package.json                     # imports #shared/* · dev:cloud / dev:water / typecheck
  tsconfig.json                    # includes agents/** and shared/**
  .env.example
  shared/
    runApi.ts                      # the ONLY network egress in this package
    compiledPrompt.ts              # CompiledPrompt schema, shared by both engines
  agents/
    create-cloud/agent/
      agent.ts                     # direct-provider model — see the AI Gateway section
      instructions.md              # engine=cloud lock, pipeline, refusals, floors
      channels/eve.ts              # inbound auth: vercelOidc + localDev
      skills/                      # 11 canon cloud skills
      tools/                       # 12 frozen tools
    create-water/agent/
      agent.ts
      instructions.md              # engine=water lock, waterMode, refusals, floors
      channels/eve.ts
      skills/                      # 11 canon water skills
      tools/                       # 12 frozen tools
```

## Running

```bash
cd agent
npm install
npm run info:cloud   # eve info --agent create-cloud — compile status, skill/tool counts
npm run dev:cloud    # eve dev --agent create-cloud
npm run dev:water    # eve dev --agent create-water
npm run typecheck    # tsc
```

Set `ANTHROPIC_API_KEY`, `HYDRILLA_RUN_API`, and `HYDRILLA_RUN_API_TOKEN` first — see
`.env.example`.

**Verified against `eve@0.54.3`:** `npm install` and `npm run typecheck` both pass, and
`eve info` reports `Compile ready`, `0 errors, 0 warnings`, **11 skills** and **22 tools**
(our 12 plus 10 framework tools) for each agent. `defineAgent` from `eve` and `defineTool`
from `eve/tools` are the real signatures. Note that `eve`'s published `.d.ts` re-exports
`defineAgent` under the name `n` in one barrel file; the runtime export is `defineAgent`,
which is what typechecks and what these files import.

What has **not** been exercised: an actual model turn. That needs a reachable
`HYDRILLA_RUN_API` and a live key, so end-to-end behaviour is still unproven.

---

## AI Gateway — how the ban is satisfied

The Hydrilla kill list (`agent-skills/Hydrilla AI orchestration/docs/KILL_LIST.md`) bans
AI Gateway outright — *"Direct provider keys / Water BYOK only"* — and
`cursor-prompts/01_SETUP_EVE_CREATE_CLOUD.md` repeats *"Direct provider keys — no AI
Gateway"*. `docs/CREATE_ORCHESTRATION_PLAN.md` §7 lists AI Gateway under "Kill".

This looked like an unavoidable conflict, because eve's documented default is a gateway
model id. It is not one: **eve's `model` also accepts a provider-authored AI SDK
`LanguageModel`, which calls the provider directly and never touches the gateway.** Both
agents use that form:

```ts
import { anthropic } from "@ai-sdk/anthropic";
export default defineAgent({ model: anthropic("claude-opus-4-8") });
```

So the ban is satisfied literally, not by argument. Two traps to avoid:

- A bare id string (`"anthropic/claude-opus-4.8"`) routes through the gateway. Direct
  provider ids use hyphens; gateway ids use a dot. `verify-agent-surface.ts` fails the
  build if either `agent.ts` reverts to the string form.
- `eve set --model <id>` and the dev-TUI `/model <id>` both **rewrite `agent.ts` to a
  gateway id**. Don't use them here. `eve link` also pulls gateway credentials.

Generation is a separate question, and the answer is that it never happens here:

1. **The agent is the brain only.** It never performs generation, not even as a fallback.
2. **All customer LLM and BYOK calls stay in the Hydrilla backend.** Water generation runs
   at `/api/water/generate` with the customer's own key, held server-side; Cloud runs
   against Hydrilla's GPU path. Tools are reached at
   `POST {HYDRILLA_RUN_API}/api/create/tools/<toolId>`.
3. **Tools are HTTP RPCs, never provider calls.** No file under any `tools/` imports a
   provider SDK; the only egress in the package is `shared/runApi.ts`, one host and one
   bearer token. Both properties are asserted by `verify-agent-surface.ts`.
4. **A customer key never enters this process** — never read, forwarded, or logged.

`ANTHROPIC_API_KEY` here is Hydrilla's own orchestration cost, and the tokens it sees are
prompts, gate reports, and job metadata. Both `agent.ts` files carry this reasoning as a
comment so the next person to change `model:` reads it first.

**Also note `docs/DECISIONS_LOCKED.md` D4:** the shipped orchestrator today is
*backend stages, eve optional later*. This package is that optional wrapper. It reuses
the same stage names and the same frozen tool surface, so it needs no backend rework —
but the backend, not this directory, is the current source of truth for Create.

---

## Tool filename → canonical dotted id

eve derives a tool's name from its filename, and dots are awkward in filenames. Each
file uses underscores and carries the canonical dotted id in both its `description` and
an exported `TOOL_ID` constant, which is validated at module load by
`assertToolId()` from `shared/runApi.ts`.

| File (in both agents' `tools/`) | Canonical id | Role |
|---|---|---|
| `prompt_compile.ts` | `prompt.compile` | brain |
| `run_estimate.ts` | `run.estimate` | brain |
| `run_route.ts` | `run.route` | brain |
| `image_rembg.ts` | `image.rembg` | hands |
| `job_submit.ts` | `job.submit` | hands |
| `job_await.ts` | `job.await` | hands |
| `mesh_post_gate.ts` | `mesh.post.gate` | hands |
| `mesh_bake.ts` | `mesh.bake` | hands |
| `asset_render_views.ts` | `asset.render_views` | hands |
| `asset_score.ts` | `asset.score` | evaluator — the only promote path |
| `run_checkpoint.ts` | `run.checkpoint` | session — the only writer of stage truth |
| `experiment_fanout.ts` | `experiment.fanout` | lab — deferred, flag-gated |

Twelve ids, frozen. There is no thirteenth: `assertToolId` throws on anything else, and
new capability folds in behind an existing id as a backend worker (t2i behind
`job.submit`, remesh behind `mesh.post.gate`, sheet composition behind `asset.score`).
This mirrors `backend/hydrilla_backend/src/lib/create/toolSurface.ts`, and
`verify-agent-surface.ts` fails if the two lists diverge.

### Engine scoping inside the duplicated tools

The two copies are not identical:

- Every Cloud tool posts `engine: "cloud"`; every Water tool posts `engine: "water"`.
  The engine is an **echo**, never a choice — no tool can switch it.
- `job_submit` / `job_await` enumerate only their own engine's stages and adapters.
  Cloud offers `flux-t2i` and `pixal3d`; Water offers `water-t2i`, `meshy`, `tripo`,
  `fal`, `rodin`.
- `run_checkpoint` enumerates only its own engine's stage ids.
- `experiment_fanout` pins `engineScope` to its own engine and says so in the
  description, so a Lab fanout cannot grow a cross-engine arm.
- Cloud tool descriptions never name a Water BYOK provider; Water tool descriptions never
  name Pixal3D or BlueFox.

## Canon skill ids

Eleven per engine, exactly as `agent-skills/Hydrilla AI orchestration/docs/SKILL_ID_CANON.md`
defines them.

| Cloud (`agents/create-cloud/agent/skills/`) | Water (`agents/create-water/agent/skills/`) |
|---|---|
| `cloud-compile-prompt` | `water-compile-prompt` |
| `cloud-route-estimate` | `water-route-estimate` |
| `cloud-t2i` | `water-t2i` |
| `cloud-preprocess-ref` | `water-preprocess-ref` |
| `cloud-run-pixal` | `water-generate-3d` |
| `cloud-mesh-post` | `water-mesh-post` |
| `cloud-bake` | `water-bake` |
| `cloud-evaluate` | `water-evaluate` |
| `cloud-refine-loop` | `water-refine-loop` |
| `cloud-run-job` | `water-run-job` |
| `cloud-experiment` | `water-experiment` |

**Retired aliases — never reintroduce:** `cloud-i2-3d`, `cloud-mesh-post-gate`,
`cloud-game-ready-bake`, `cloud-score-compare`, `cloud-run-experiment`,
`water-mesh-post-gate`, `water-game-ready-bake`, `water-score-compare`.

Each `skills/<id>.md` is an eve skill: YAML frontmatter with a `description` written for
auto-invocation (when eve should load it), then a tight body carrying the rules. Bodies
are prompts, not documentation — they point at the pack `SKILL.md` and its `references/`
for depth instead of copying reference tables.

## How this maps to the pack and the repo

| Source | Role here |
|---|---|
| `agent-skills/Hydrilla AI orchestration/skills/{cloud,water}/*/SKILL.md` | Specification for each `skills/<id>.md` body |
| `agent-skills/.../agents/EVE_AGENT_LAYOUT.md` | Two-agent split, park-on-`job.await` hooks |
| `agent-skills/.../docs/SKILL_ID_CANON.md` | The 22 skill filenames |
| `agent-skills/.../docs/KILL_LIST.md` | Refusals, engine lock, the AI Gateway tension above |
| `docs/contracts/TOOL_SURFACE.md` | The 12 tool files and their roles |
| `docs/contracts/JOB_CARD.md` | `run_checkpoint` schema, stage order, refine caps, resume |
| `docs/contracts/EVIDENCE_MANIFEST.md` | `asset_score` / `asset_render_views` schemas, promote gate |
| `docs/DECISIONS_LOCKED.md` | D1 Water threejs is first-class · D2 characters · D3 one Cloud backbone · D4 backend first |
| `backend/.../lib/create/quality/thresholds.ts` | Canonical numbers; the instructions restate them, never redefine them |

Numbers live in the backend module. If a floor ever changes, change it there and update
the two `instructions.md` tables — never fork a number into a skill body.

## Durability (park / resume)

eve runs on Vercel Workflows: steps are checkpointed, the session **parks** between
messages and resumes on delivery. That is exactly the JobCard requirement:

- Park during `job.await` and long bakes. No model turns while a GPU or provider runs.
- Resume reads the JobCard: first stage not `done`/`skipped`, run it. Never replay chat.
- `run.checkpoint` is idempotent per `(jobId, runId, stageId, attempt)` — the tool sends
  that tuple as an `idempotency-key` header so a durable retry cannot double-write stage
  truth.
