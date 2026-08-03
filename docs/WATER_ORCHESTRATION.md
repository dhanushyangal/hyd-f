# Water orchestration

How Water builds procedural Three.js from a text prompt (BYOK).  
Product / model picker / prefs: [`ENGINES.md`](./ENGINES.md).

---

## Most important files

| Path | Role |
|------|------|
| [`docs/ENGINES.md`](./ENGINES.md) | Cloud vs Water, model catalog, prefs, APIs |
| [`docs/WATER_ORCHESTRATION.md`](./WATER_ORCHESTRATION.md) (this) | Pipeline, prompts, gates, providers |
| [`docs/GENERATION_FLOWS.md`](./GENERATION_FLOWS.md) | Hydrilla cloud (Trilles) only |
| [`skills/water/SKILL.md`](../skills/water/SKILL.md) | Agent skill — gates + codegen contract |
| `backend/.../codeSculptPipeline.ts` | Spec → code → gates |
| `backend/.../llmProviders.ts` | Claude / OpenAI / Gemini / OpenRouter / Cursor adapters |
| `backend/.../routes/codeSculpt.ts` | `/api/water/*` |
| `backend/.../WATER_DEPLOY.md` | SQL + env |

---

## Pipeline

```text
intake (code) → assessment/spec (LLM) → spec gate (code)
  → blockout (LLM) → code gate (code) → optional 1× refine (LLM) → DONE
```

Cost: **2** model calls on the happy path; up to **4** if both gates repair once.

### Stage prompts (canonical)

1. **Spec (`SPEC_SYSTEM`)** — JSON SculptSpec only: components, parents, materials, sockets, scale. Min depth by complexity (3 / 6 / 10).  
2. **Code (`CODE_SYSTEM`)** — TypeScript only: `import * as THREE`, `export function createModel(): THREE.Group`, `sculptRuntime` + `tick`, no fetch/eval/loaders.  
3. **Refine** — same code system + exact gate violations.

### Deterministic gates

| Gate | Blocks when |
|------|-------------|
| Intake | Empty / no subject / >2000 chars |
| Spec | Shallow tree, bad parents/materials |
| Code | Missing contract, banned APIs, brace imbalance, &lt;60% coverage |

---

## Provider adapters

| Provider | Selection | Runtime |
|----------|-----------|---------|
| Anthropic | Catalog id → Messages API | Pass-through known ids |
| OpenAI | Catalog id → chat completions | Pass-through known ids |
| Gemini | Catalog id → generateContent | Pass-through known ids |
| OpenRouter | Live free + catalog paid | Slug as API model |
| Cursor | Live `/v1/models` + Auto | Cloud Agents create/poll; omit `model` for Auto |

Cursor: [API endpoints](https://cursor.com/docs/cloud-agent/api/endpoints). Slower per stage (agent run).

---

## Frontend

- Preview: `WaterViewer` → `public/water-sandbox.html` (`sandbox="allow-scripts"`).  
- Job ids `wt_*` / `cs_*` → always Water path, never `/api/3d/glb/...`.  
- Engine picker: Hydrilla cloud first; unlocked Water groups next; selection persists `defaultCodeModel`.

---

## Skills

| Skill | Role |
|-------|------|
| `skills/water/SKILL.md` | Water codegen + gates for agents editing Hydrilla |

No separate cloud skill — cloud is gateway + credits ([`GENERATION_FLOWS.md`](./GENERATION_FLOWS.md)).
