# Water — Hydrilla skill

Build a **code-only**, gated, animation-ready procedural Three.js model from a text description (an image is an optional extra reference).

Product / API / BYOK docs: [`docs/ENGINES.md`](../../docs/ENGINES.md).

Workflow adapted from [img2threejs](https://github.com/img2threejs/img2threejs): reconstruction-by-code, deterministic gates, model tokens spent only on judgement.

## When it runs

The user selects a **bring-your-own model** (OpenRouter Free / Claude / GPT / Gemini) in the workspace **Engine** picker and clicks **Generate with Water**. Hydrilla cloud (Trilles mesh / credits) is untouched.

## Pipeline

```
intake gate → assessment + spec → spec gate → blockout codegen → code gate → (one refine) → done
```

| Stage | Who does it | What it produces |
|---|---|---|
| `intake` | code | Prompt suitability — blocks empty/no-subject requests before spending a token |
| `assessment` + `spec` | model | `SculptSpec` JSON: components, parents, materials, sockets, scale |
| spec gate | code | Depth check (simple ≥ 3, moderate ≥ 6, complex ≥ 10 components), parent + material integrity |
| `blockout` | model | TypeScript `createModel(): THREE.Group` built from the spec |
| code gate | code | Contract, banned APIs, brace balance, ≥ 60% planned-component coverage |
| refine | model | One corrective pass with the exact violations, best attempt wins |

Cost: 2 model calls on the happy path; up to 4 when the spec and code gates each request one repair.

## Gates

- **Intake** — a describable subject, ≤ 2000 chars
- **Spec depth** — no single-blob spec for a compound object
- **Code contract** — `import * as THREE from 'three'`, one `export function createModel(): THREE.Group`, `THREE.Group` root
- **Sandbox safety** — no `fetch`, `XMLHttpRequest`, `eval`, `new Function`, dynamic `import`, `require`, or asset loaders
- **Coverage** — the blockout must actually build the planned parts
- **Runtime** — `root.userData.sculptRuntime` (nodes, sockets) and `root.userData.tick(dt, elapsed)`

Preview runs in a **browser** iframe (`public/water-sandbox.html`, `sandbox="allow-scripts"`). This is not a Vercel Sandbox product.

## Later passes

`blockout → structural → form → material → surface → lighting → interaction → optimization`

v1 ships **blockout**. Each later pass reuses the same orchestrator: unlock only after the previous pass clears its gate.
