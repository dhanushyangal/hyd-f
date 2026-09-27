# Shared layer — contracts/tools/evidence only

## Rule

**Skills are engine-scoped.** There are **no shared Create agent skills** that both Cloud and Water agents load as the same skill ID.

What *is* shared:

| Layer | Shared? | Notes |
|-------|---------|-------|
| JobCard schema / stages | YES | Same session machine; `engine` field discriminates |
| EvidenceManifest | YES | Same promote discipline |
| Tool surface IDs | YES | Same Run API; adapters behind `job.submit` differ |
| Geo HARD gate thresholds | YES (numbers) | Reports tagged by engine |
| Skill markdown / prompts | **NO** | Separate `skills/cloud/*` vs `skills/water/*` |
| Compile/route wording | **NO** | Cloud locks t2i→i2_3d; Water locks BYOK adapter pick |

## This pack’s `skills/shared/`

Contains **protocol helpers** (markdown), not eve Create skills:

- `job-card-protocol.md` — how skills call `run.checkpoint`
- `evidence-manifest-protocol.md` — capture/promote rules

Do not register these as `agent/skills/` entries unless an implementation explicitly needs a non-Create utility skill — default: **reference only**.

## Why not shared Create skills

Prior v0.2.x used `engines: [bluefox, water]` on one SKILL.md. That invited engine-switch language and mixed Pixal/BYOK prompts. New orch: **separate agents or engine-gated skill roots** (see `../agents/EVE_AGENT_LAYOUT.md`).
