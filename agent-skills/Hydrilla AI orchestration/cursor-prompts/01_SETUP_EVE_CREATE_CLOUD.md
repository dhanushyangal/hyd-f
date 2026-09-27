# Cursor prompt — Setup eve Create Cloud agent

Paste after `00_MASTER_ORCHESTRATION.md`.

## Task

Scaffold **eve-create-cloud** agent:

1. `agent/instructions.md` — engine=bluefox lock; t2i→i2_3d pipeline; kill list; props-only; glb deliverable; Three.js evidence-only.
2. Register skills from `Hydrilla AI orchestration/skills/cloud/*/SKILL.md` (include Lab `cloud-experiment` only behind Lab flag).
3. Tools = thin wrappers over Hydrilla Run API IDs in `/workspace/hydrilla-harness/docs/TOOL_SURFACE.md`.
4. Sessions durable via JobCard; hooks park on `job.await` / bake.
5. Connections to BlueFox/Pixal only — no Water BYOK connectors on this agent.
6. Direct provider keys — **no AI Gateway**.

## Acceptance

- Agent cannot discover Water skills.
- `cloud-run-pixal` is the only generate path.
- `cloud-evaluate` is the only promote path.
- Firstmate not referenced as runner.
