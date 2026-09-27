---
name: water
description: Hydrilla Water Studio — BYOK multi-pass procedural Three.js. Packs (object / character / animation / game) are bound by the Create orchestrator, not by UI chips.
---

# Water — Hydrilla skill

Build a **code-only**, gated, procedural Three.js model from text (image optional), using the **Water Studio** harness:

`compile → route → bind pack → planner → locked passes → generator ≠ evaluator`

The workspace Create bar is **prompt + engine only**. Object / Character / Anim / Fast chips are retired. Pack and quality profile come from `backend/.../lib/water/orchestrator/packs.ts`.

Product generate: `POST /api/water/generate` (Clerk + BYOK).
eve brain: `agent/agents/create-water` (11 skills, 12 frozen tools). Do not add a 13th tool.

| Doc | Use |
|-----|------|
| [`docs/ENGINES.md`](../../docs/ENGINES.md) | Cloud vs Water |
| [`docs/WATER_ORCHESTRATION.md`](../../docs/WATER_ORCHESTRATION.md) | Pipeline, passes, harness |

## Adding a pack

1. Prompt pack in `backend/.../lib/water/skills/index.ts`
2. Binding in `orchestrator/packs.ts` (first match wins; default last)
3. Matching eve skill under `agent/agents/create-water/agent/skills/`

## Contract (must hold)

- `import * as THREE from 'three'`
- `export function createModel(): THREE.Group`
- `root.userData.sculptRuntime`
- Factory is **static** (no time-based animation; no `userData.tick`)
- No fetch / eval / loaders / dynamic import

Preview: `public/water-sandbox.html`.
