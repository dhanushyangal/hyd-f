# Water & cloud orchestration

How Hydrilla builds 3D — prompts, gates, skills, and which docs matter.

---

## Most important docs (read these)

| Doc | Purpose |
|-----|---------|
| **[`docs/ENGINES.md`](./ENGINES.md)** | Product truth: Cloud vs Water, BYOK, APIs, job fields, verify checklist |
| **[`docs/WATER_ORCHESTRATION.md`](./WATER_ORCHESTRATION.md)** (this file) | Water pipeline prompts, gates, Cursor agent usage, skills |
| **[`docs/GENERATION_FLOWS.md`](./GENERATION_FLOWS.md)** | Deep Trilles / FLUX cloud credit path |
| **[`skills/water/SKILL.md`](../skills/water/SKILL.md)** | Agent skill: gates + codegen contract |
| **Backend [`WATER_DEPLOY.md`](../backend/hydrilla_backend/WATER_DEPLOY.md)** | Supabase SQL + Vercel env for Water/BYOK |

Cloud mesh orchestration lives in `threeD.ts` + GPU gateways (no LLM prompts).  
Water orchestration lives in `codeSculptPipeline.ts` + `llmProviders.ts`.

---

## Engines at a glance

| | Hydrilla cloud | Water |
|---|---|---|
| Models | Trilles (credits) | BYOK: Anthropic, OpenAI, Gemini, OpenRouter, **Cursor** |
| Orchestration | FLUX → Trellis GPU | LLM stages + deterministic gates |
| Output | GLB | Three.js `createModel()` (+ client export GLB/OBJ/…) |

---

## Water pipeline (orchestration)

```text
intake (code) → assessment/spec (LLM) → spec gate (code)
  → blockout (LLM) → code gate (code) → optional 1× refine (LLM) → DONE
```

Implemented in `backend/hydrilla_backend/src/lib/codeSculptPipeline.ts`.  
Skill summary: `skills/water/SKILL.md`.

### Stage prompts (canonical)

#### 1) Spec system prompt (`SPEC_SYSTEM`)

Role: technical director for procedural Three.js reconstruction.  
Output: **JSON only** (SculptSpec): name, subjectClass, complexity, materials, components (hierarchy), animation sockets.  
Rules: min components by complexity (3 / 6 / 10), valid parents & materials, metres, Y-up, on ground plane.

#### 2) Spec user prompt

Subject text (and optional image). Ask for the JSON spec only.  
On gate failure: one repair call listing exact violations; else fallback scaffold.

#### 3) Code system prompt (`CODE_SYSTEM`)

Role: senior Three.js engineer, **blockout** pass.  
Output: **TypeScript only** with:

- `import * as THREE from 'three'`
- `export function createModel(): THREE.Group`
- primitives + `MeshStandardMaterial` / `MeshPhysicalMaterial` (THREE. prefix)
- `root.userData.sculptRuntime` + `root.userData.tick`
- no fetch / eval / loaders / dynamic import

#### 4) Code user prompt

Subject + full JSON spec; on refine, append gate violations.

### Deterministic gates (no tokens)

| Gate | Blocks when |
|------|-------------|
| Intake | Empty / too short / no word / >2000 chars |
| Spec | Shallow component tree, bad parents/materials |
| Code | Missing contract, banned APIs, unbalanced braces, &lt;60% component coverage |

Blocking code failures after one refine → job `FAIL` / `water_failed`.

### Provider adapters (`llmProviders.ts`)

| Provider | How Water calls it |
|----------|-------------------|
| Anthropic | Messages API |
| OpenAI / OpenRouter | Chat completions |
| Gemini | generateContent |
| **Cursor** | Cloud Agents API: `POST /v1/agents` (no-repo), poll run until `FINISHED`, read `result`. Not chat-completions. Docs: [endpoints](https://cursor.com/docs/cloud-agent/api/endpoints), [TS SDK](https://cursor.com/docs/sdk/typescript) |

Cursor verify: `GET https://api.cursor.com/v1/me` with Bearer key.  
Cursor is slower per stage (agent run); expect longer Water jobs.

---

## Cloud (Trilles) orchestration

No LLM prompts in-app. Flow:

1. Optional FLUX text/edit/combine → image (credits)  
2. `POST /api/3d/generate` → Trellis image-to-3D (credits)  
3. Poll / job sync → GLB  

Details: [`GENERATION_FLOWS.md`](./GENERATION_FLOWS.md).

---

## Skills

| Skill | Role |
|-------|------|
| `skills/water/SKILL.md` | Water codegen conventions & gates for agents working on Hydrilla |

There is no separate “cloud skill”; cloud is gateway + credits.

---

## Engine picker UX

- **Hydrilla cloud** group always first.  
- Water provider groups with a **valid/unlocked** API key sort **above** locked groups.  
- Inside a group, unlocked models sort above locked (lock icon = need key or coming soon).

---

## SQL / deploy notes for Cursor

1. Base migration: `sql/add_user_api_keys_and_code_sculpt.sql`  
2. Cursor provider: `sql/add_cursor_provider.sql` (adds `cursor` to `user_api_keys.provider` check)  
3. Env: `USER_API_KEYS_ENCRYPTION_SECRET` (unchanged)  
4. Settings → paste Cursor key from [cursor.com/dashboard/api](https://cursor.com/dashboard/api) (`crsr_…`)
