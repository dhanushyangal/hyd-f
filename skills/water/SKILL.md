---
name: water
description: Hydrilla Water Studio — BYOK multi-pass procedural Three.js, built in the backend with the Vercel AI SDK. Packs (object / character / animation / game) are bound by the Create orchestrator from the prompt, not by UI chips.
---

# Water — Hydrilla skill

Build a **code-only**, gated, procedural Three.js model from text (image optional), using the **Water Studio** harness in the backend:

`route (compile → pack) → planner → locked passes (generate → run → evaluate → refine) → visual pass → DONE`

The workspace Create bar is **prompt + engine + quality** only. Object / Character / Anim chips are retired: the pack is chosen from the prompt in `backend/.../lib/water/orchestrator/packs.ts`.

Product generate: `POST /api/water/generate` (Clerk + BYOK). Follow-up edits: `POST /api/water/chat` (director).
LLM calls: Vercel **AI SDK v7** (`generateText` + `Output.object`; `ToolLoopAgent` for the director).
eve (`agent/agents/create-water`) is **parked** — not on the generate path. See `agent/README.md`.

| Doc | Use |
|-----|------|
| [`docs/ENGINES.md`](../../docs/ENGINES.md) | Cloud vs Water |
| [`docs/WATER_ORCHESTRATION.md`](../../docs/WATER_ORCHESTRATION.md) | Pipeline, passes, budgets, harness files |

## Adding a pack

1. Prompt pack in `backend/.../lib/water/skills/index.ts`
2. Binding in `orchestrator/packs.ts` (first match wins; `object-studio` is last and matches everything)
3. Add the id to `WaterSkillId` in `backend/.../lib/waterSkills.ts`

## Contract (must hold)

- `import * as THREE from 'three'`
- `export function createModel(): THREE.Group`
- `root.userData.sculptRuntime`
- Factory is **static** (no time-based animation; no `userData.tick`)
- No fetch / eval / loaders / dynamic import

Preview: `public/water-sandbox.html`.
