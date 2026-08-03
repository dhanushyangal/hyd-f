---
name: water
description: Hydrilla Water engine — BYOK procedural Three.js (Claude, OpenAI, Gemini, OpenRouter, Cursor). Use when editing Water generation, gates, sandbox, or model picker.
---

# Water — Hydrilla skill

Build a **code-only**, gated, animation-ready procedural Three.js model from a text description (image optional).

| Doc | Use |
|-----|-----|
| [`docs/ENGINES.md`](../../docs/ENGINES.md) | Cloud vs Water, model catalog, prefs, Cursor live sync |
| [`docs/WATER_ORCHESTRATION.md`](../../docs/WATER_ORCHESTRATION.md) | Pipeline prompts & gates |

Adapted from [img2threejs](https://github.com/img2threejs/img2threejs): reconstruction-by-code, deterministic gates.

## When it runs

User picks a **Water** model in the Engine picker (unlocked BYOK key) and clicks Generate.

| Provider | Models |
|----------|--------|
| Anthropic | Claude Sonnet / Opus (catalog) |
| OpenAI | GPT-4.1 / Mini (catalog) |
| Gemini | 2.5 Flash / Pro (catalog) |
| OpenRouter | Free (live) + paid (catalog) |
| Cursor | Auto + live Cloud Agents `/v1/models` |

Hydrilla cloud (Trilles / credits) is untouched.

## Pipeline

```
intake → assessment+spec → spec gate → blockout → code gate → (one refine) → done
```

| Stage | Who | Output |
|-------|-----|--------|
| intake | code | Suitability before tokens |
| assessment + spec | LLM | SculptSpec JSON |
| spec gate | code | Depth / parent / material integrity |
| blockout | LLM | `createModel(): THREE.Group` |
| code gate | code | Contract, banned APIs, coverage ≥ 60% |
| refine | LLM | One corrective pass |

Happy path: **2** LLM calls; up to **4** with repairs.

## Gates (must hold)

- Intake — describable subject, ≤ 2000 chars  
- Spec depth — simple ≥ 3 / moderate ≥ 6 / complex ≥ 10 components  
- Code contract — `import * as THREE from 'three'`, one `export function createModel(): THREE.Group`  
- Sandbox — no `fetch`, `eval`, `new Function`, dynamic `import`, `require`, asset loaders  
- Runtime — `root.userData.sculptRuntime` + `root.userData.tick(dt, elapsed)`  

Preview: browser iframe `public/water-sandbox.html` (`sandbox="allow-scripts"`).

## Model ids (do not invent Cursor ids)

- Static: catalog ids as listed in `lib/models.ts` / backend `llmProviders.ts`  
- OpenRouter Free: live slug ids  
- Cursor: `cursor-auto` (omit `model`) or `cursor/<nativeId>` from that key’s `/v1/models` only  
- Persist: `user_model_prefs.default_code_model` (Settings + workspace picker)

## Later passes (future)

`blockout → structural → form → material → surface → lighting → interaction → optimization`  
v1 ships **blockout** only.
