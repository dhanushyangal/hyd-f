---
name: water
description: Hydrilla Water Studio — BYOK multi-pass procedural Three.js with selectable skills (Object, Character, Animation, Game) and quality tiers (Fast / Standard / Studio).
---

# Water — Hydrilla skill

Build a **code-only**, gated, animation-ready procedural Three.js model from text (image optional), using the **Water Studio** harness:

`planner → locked passes → generator → evaluator` (Anthropic-style separation).

| Doc | Use |
|-----|------|
| [`docs/ENGINES.md`](../../docs/ENGINES.md) | Cloud vs Water, models, prefs, skills, tokens |
| [`docs/WATER_ORCHESTRATION.md`](../../docs/WATER_ORCHESTRATION.md) | Pipeline, passes, harness |

## When it runs

User picks a **Water** LLM model + **Skill** + **Quality** tier, then Generate.

| Skill | Status |
|-------|--------|
| Object Studio | live — hard-surface / props |
| Character | live — anatomy-aware |
| Animation Ready | partial — sockets + idle tick |
| Game Ready | partial — colliders / LOD hooks |
| Environment / World | stub (Soon) |

| Tier | Passes |
|------|--------|
| Fast | blockout |
| Standard | → material |
| Studio | full 8: blockout → structural → form → material → surface → lighting → interaction → optimization |

## Harness (do not collapse to one-shot)

1. **Planner** — SculptSpec + qualityContract + detailInventory  
2. **Generator** — current pass only; evolve previous factory  
3. **Evaluator** — deterministic code gate, then skeptic LLM (skipped on Fast)  
4. Max **one refine** per pass; soft time budget → partial DONE  

Runtime prompts live in `backend/.../lib/water/skills/` — **not** this markdown file.

## Contract (must hold)

- `import * as THREE from 'three'`
- `export function createModel(): THREE.Group`
- `root.userData.sculptRuntime` + `root.userData.tick`
- No fetch / eval / loaders / dynamic import  

Preview: `public/water-sandbox.html`.

## Agent notes

When editing Water, preserve pass order and generator≠evaluator split. Prefer extending skill packs over stuffing everything into one system prompt.
