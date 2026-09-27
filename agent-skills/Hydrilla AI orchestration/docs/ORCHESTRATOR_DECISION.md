# Orchestrator decision — eve for Create (Firstmate out)

**Authors:** Steve (placement) · Ben (harness)  
**Date:** 2026-09-13  
**Status:** **LOCKED** — Create product runtime  
**Sources:** Researchy `RESEARCHY_ORCH_NOTES.md` · Anthropic managed-agents + harness-design · Firstmate README · `NEEDLE_AND_EVE_BRIEF.md`

---

## Verdict (one line each)

| Question | Lock |
|----------|------|
| Create orchestrator (Cloud + Water GPU DAG) | **eve** |
| Firstmate for Create runtime | **NO** |
| Firstmate for internal harness *coding* crews | Optional later — never mounts live Create |
| Engine Cloud↔Water | **UI/API immutable** — skills never switch |
| Skill count | **No hard 8-cap** — ship only **earned** skills (generator step or quality gate) |
| Cloud generate path | **text → image → image→3D (Pixal)** — not text→mesh shortcut |

Ben lean and Steve agree: eve wins. Firstmate is crew-chat / coding-distro UX — weak fit for long GPU JobCard DAGs.

---

## Why eve (Create runtime)

| Need | eve fit |
|------|---------|
| Long GPU jobs (t2i, Pixal i2_3d, remesh, bake) | Durable session; **park** on `job.await` / worker wait; **resume** from JobCard `next` — not chat replay |
| Skills as packs | `agent/skills/` on-demand; **separate roots** for Cloud vs Water |
| Tools as hands | `agent/tools/` = Run API / worker RPCs (`prompt.compile`, `job.submit`, `mesh.post.gate`, …) — not bash coding tools |
| Session truth | JobCard + EvidenceManifest = Anthropic **session**; promote needs `checkEvidence` |
| Stack locks | Direct provider keys / BYOK — **no AI Gateway**; Needle flag-only |
| Two engines | Two agent layouts (`create-cloud`, `create-water`) — shared contracts/workers, **not** shared skill markdown |

Prior: `/workspace/hydrilla-harness/docs/NEEDLE_AND_EVE_BRIEF.md`.

---

## Why Firstmate is wrong for Create

| Firstmate is good at | Why it fails Create |
|----------------------|---------------------|
| tmux / Herdr panes + coding crews | Create = **DAG of GPU workers**, not parallel git checkouts |
| Worktrees → PRs | Asset jobs need JobCard stage machine + EvidenceManifest, not PR reviews |
| Chat/session-backend reconcile | Crash recovery must read **JobCard total state**, not agent chat |
| Multi-agent coding distro | Mounting Create skills as “crew skills” invites engine-switch drift and no durable promote gate |

**Rule:** Never name Firstmate as Create orchestrator in skills, cursor prompts, or agent layouts. Refuse “Firstmate runs Create” — point here.

### Optional later (engineering only)

- Parallel PRs against harness packages (adapters, job-runner, bench)
- Coding agents that **implement** workers/skills — they do **not** run customer Create jobs
- Never load `skills/cloud/*` or `skills/water/*` as Firstmate live generate crews

---

## Laws this decision carries

1. **Engine immutable** — `run.route` / `*-route-estimate` echo user engine; adapter/profile **inside** engine only; never swap generate worker Cloud↔Water.  
2. **Separate skill trees** — `skills/cloud/*` ≠ `skills/water/*`; no shared Create prompt packs (shared = contracts + worker binaries only).  
3. **Cloud path** — `compile → route → [t2i] → preprocess → Pixal i2_3d → mesh-post → [bake] → score` (text→image→image→3D).  
4. **Earned skills only** — lift old ≤8 when a skill owns generate or a gate that beats raw Pixal/BYOK; delete unused.  
5. **Generator ≠ evaluator** — score/compare skills own promote; VLM never overrides HARD geo fail.  
6. **v1 props/hard-surface** — character/Thor = phase 2 refuse.

Details: [`ANTHROPIC_HARNESS_MAP.md`](./ANTHROPIC_HARNESS_MAP.md) · [`CLOUD_SKILL_PACK.md`](./CLOUD_SKILL_PACK.md) · [`WATER_SKILL_PACK.md`](./WATER_SKILL_PACK.md) · [`KILL_LIST.md`](./KILL_LIST.md).

---

## Naming

| ID | Role |
|----|------|
| `eve-create-cloud` | Cloud Pixal Create orchestrator |
| `eve-create-water` | Water BYOK / (legacy factory if kept) orchestrator |
| ~~`firstmate-create-*`~~ | **Forbidden** |

Layout: [`../agents/EVE_AGENT_LAYOUT.md`](../agents/EVE_AGENT_LAYOUT.md).

---

## Acceptance

- [x] eve = Create runtime  
- [x] Firstmate ≠ Create runtime  
- [x] Cloud text→image→i2_3d locked  
- [x] Separate Cloud / Water skill trees  
- [x] Engine immutable  
- [x] No 8-cap — earned only  

**One-liner:** Create runs on **eve** (durable JobCard + park/resume + engine-scoped skills); Firstmate stays optional coding crew — never the GPU orchestrator.
