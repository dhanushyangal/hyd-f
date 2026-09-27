# Researchy orchestration notes

**Generated:** 2026-09-13  
**For:** Ben / Hydrilla Create harness  
**Scope:** vercel-labs/skills license+purpose; Firstmate vs eve for long GPU Create jobs.

---

## 1) vercel-labs/skills

| | |
|--|--|
| **URL** | https://github.com/vercel-labs/skills (skills.sh homepage) |
| **Purpose** | Open **CLI for the agent-skills ecosystem** (`npx skills add|use|list|find|update|init|remove`). Installs/discovers `SKILL.md` packs into many coding agents (Claude Code, Cursor, Codex, **Eve → `agent/skills/`**, Pi, etc.). Not a 3D runtime, not a GPU job runner, not Hydrilla Create itself. |
| **License** | **MIT** confirmed — SPDX + root LICENSE © 2026 Vercel, Inc. (fetched 2026-09-13) |
| **Hydrilla adaptation** | **SAFE** to use CLI / mirror packaging patterns with attribution. Use to install/publish Hydrilla Create skills into eve's `agent/skills/`. Do **not** confuse with product compute: skills are instruction packs; GPU work stays in workers. Telemetry optional (`DISABLE_TELEMETRY` / `DO_NOT_TRACK`). Individual third-party skill repos keep **their own** licenses (check each steal). |

---

## 2) Firstmate vs eve — long GPU Create jobs

### Firstmate (one paragraph)
Firstmate ([kunchenguid/firstmate](https://github.com/kunchenguid/firstmate)) is a **local coding-agent crew orchestrator**: one “first mate” spawns parallel coding agents in visible terminal backends (tmux default; Herdr/cmux experimental), isolates git worktrees, supervises to PRs/reports, and keeps session state on disk so the control plane can restart. Herdr can keep terminals alive across disconnects, but Firstmate is **not** a durable application workflow engine or GPU job scheduler — long GPU Create (Pixal generate, remesh, bake) would still need external workers/queues; Firstmate only babysits interactive agent CLIs in panes. Fit: internal harness engineering / multi-agent coding, **not** the Create product Run API path.

### eve (one paragraph)
eve ([eve.dev execution model](https://eve.dev/docs/concepts/execution-model-and-durability), fetched 2026-09-13) is a **filesystem-first durable agent runtime**: sessions survive process restarts/redeploys; each turn is a durable workflow (Workflow SDK / Vercel Workflow) with step checkpoints; interrupted steps re-run, completed steps replay recorded results; turns can **park** with zero compute while waiting (approvals, OAuth, or external job completion). For Hydrilla Create, eve owns the agent loop (`skills` route/judge, `tools` as worker RPCs, `channels` Run API); **long GPU jobs should be submitted to Cloud/Water workers and awaited via park/resume or polling tools**, not held inside a live LLM turn or a coding-agent pane. Fits the locked Create stack (eve + AI SDK, no Gateway, durable checkpoints) far better than Firstmate for production Create.

### Recommendation
- **Create product path:** eve (durable session + worker RPCs).  
- **Internal multi-coding-agent work:** Firstmate optional.  
- **GPU:** never “run on Firstmate/Herdr pane”; always Hydrilla workers; eve parks until done.

---

## Sources
- https://github.com/vercel-labs/skills + raw LICENSE (2026-09-13)
- https://eve.dev/docs/concepts/execution-model-and-durability (2026-09-13)
- https://github.com/kunchenguid/firstmate + herdr.dev (2026-09-13)

*Not legal advice.*
