# Hydrilla engines

Two engines. Same workspace. Different compute.

| | **Hydrilla cloud** | **Water** |
|---|---|---|
| Models | Trilles (credits) | BYOK LLMs → procedural Three.js |
| Input | Image (or text→image→3D) | Text; image optional reference |
| Cost | Plan credits | 0 Hydrilla credits (user’s API key) |
| Output | GLB mesh | `createModel(): THREE.Group` (+ client export) |
| APIs | `/api/3d/*` + GPU | `/api/water/*` + provider APIs |

Naming: cloud = Trilles / Hydrilla cloud. BYOK = **Water** (not “Aggregator”, not “Code Sculpt” in UI).

---

## Water model architecture

### Catalog vs live sync

| Provider | How models appear | Picker id | API call |
|----------|-------------------|-----------|----------|
| Anthropic | Static catalog | `claude-sonnet-4-5`, `claude-opus-4-5` | Messages API |
| OpenAI | Static catalog | `gpt-4.1`, `gpt-4.1-mini` | Chat completions |
| Gemini | Static catalog | `gemini-2.5-flash`, `gemini-2.5-pro` | generateContent |
| OpenRouter Free | Seed + **live** `GET openrouter.ai/api/v1/models` (free filter) | OR slug / `openrouter/free` | Chat completions |
| OpenRouter Paid | Static catalog | `openrouter/<slug>` | Chat completions (strip prefix) |
| Cursor | **Auto** + **live** `GET api.cursor.com/v1/models` | `cursor-auto` or `cursor/<nativeId>` | Cloud Agents `POST /v1/agents` |

Cursor docs: [Cloud Agents endpoints](https://cursor.com/docs/cloud-agent/api/endpoints) — only ids from `/v1/models` for that key may be passed as `model.id`. Omit `model` for account Auto.

### Preference (`defaultCodeModel`)

One field: `user_model_prefs.default_code_model`.

1. **Settings → Default Water model** — single grid of unlocked providers; Save writes prefs.  
2. **Workspace Engine picker** — selecting a Water model also saves the same prefs.  
3. On workspace load, prefs restore the last Water model when its key is still valid.

Mesh default remains `default_mesh_model` (usually `trilles`).

### Generate path

```text
Engine picker selectedModel
  → submitWater({ modelId })
  → POST /api/water/generate
  → providerForModel(modelId) + decrypted BYOK key
  → jobs.llm_model = modelId, engine = water
  → codeSculptPipeline → callLLM(provider, modelId)
       Anthropic / OpenAI / Gemini / OpenRouter → chat APIs
       Cursor → resolveCursorAgentModel(/v1/models) → POST /v1/agents → poll result
  → DONE + factory_code  |  FAIL
  → WaterViewer (never /api/3d/glb for wt_* jobs)
```

### Key verification

| Provider | Probe |
|----------|--------|
| Anthropic | `GET /v1/models` + `x-api-key` |
| OpenAI | `GET /v1/models` + Bearer |
| OpenRouter | `GET /v1/models` + Bearer |
| Gemini | `GET …/models?key=` |
| Cursor | `GET api.cursor.com/v1/me` |

HTTP OK → **valid**. Keys never returned to the browser (only `last4`, status).

Generate allowed when `configured && status !== "invalid"`.

### Env / SQL

| Item | Purpose |
|------|---------|
| `USER_API_KEYS_ENCRYPTION_SECRET` | Encrypt BYOK keys |
| `sql/add_user_api_keys_and_code_sculpt.sql` | Base Water + keys tables |
| `sql/add_cursor_provider.sql` | Allow `provider = 'cursor'` |

---

## Hydrilla cloud (brief)

Image → FLUX (optional) → Trellis → GLB. Credits. Details: [`GENERATION_FLOWS.md`](./GENERATION_FLOWS.md).

Water jobs use ids `wt_*` and must open in WaterViewer — never the GLB proxy.

---

## Important docs & skill

| Path | Role |
|------|------|
| **`docs/ENGINES.md`** (this file) | Cloud vs Water, model architecture, prefs |
| **`docs/WATER_ORCHESTRATION.md`** | Pipeline prompts, gates, provider adapters |
| **`docs/GENERATION_FLOWS.md`** | Deep cloud GPU / credits path |
| **`skills/water/SKILL.md`** | Agent skill for Water codegen |
| **Backend `WATER_DEPLOY.md`** | SQL + Vercel env for BYOK |
