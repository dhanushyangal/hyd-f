# Hydrilla engines

**Source of truth** for the two Studio engines: **Hydrilla cloud** and **Water**.

Related detail for the GPU mesh path (credits, FLUX, Trilles polling): [`GENERATION_FLOWS.md`](./GENERATION_FLOWS.md).  
Water prompts / gates / Cursor agent flow: [`WATER_ORCHESTRATION.md`](./WATER_ORCHESTRATION.md).  
Agent skill for Water codegen conventions: [`skills/water/SKILL.md`](../skills/water/SKILL.md).

---

## 0. Naming (read this first)

| Name | Meaning |
|------|---------|
| **Hydrilla cloud** | Models **we** host (e.g. **Trilles**). Uses plan **credits**. Output: **GLB**. |
| **Water** | Bring-your-own-key (**BYOK**). Uses the user’s LLM key. Output: **Three.js TypeScript**. **0 credits**. |
| ~~Aggregator~~ | **Do not use.** Cloud engine is Hydrilla cloud / Trilles. |
| ~~Code Sculpt~~ | Old product name for Water. Still accepted on **read** (`code_sculpt`, `CodeSculpt`). |

**Preview “sandbox” ≠ Vercel Sandbox.**  
Water preview uses a **browser iframe** (`public/water-sandbox.html` + `sandbox="allow-scripts"`).  
**No Vercel Sandbox product** was created for this feature. Backend on Vercel is the normal serverless API (`maxDuration: 300` + `waitUntil` for Water generation).

---

## 1. Product comparison

| | **Hydrilla cloud** | **Water** |
|---|---|---|
| Who pays | Hydrilla credits | User’s LLM provider |
| Models in picker | Trilles, Hunyuan 3D (soon) | Claude / GPT / Gemini / OpenRouter / **Cursor** (incl. free OR) |
| Primary input | Image (or text→image then 3D) | Text (optional image = LLM reference only) |
| Output | GLB mesh | `createModel(): THREE.Group` factory |
| Credits | 2–12 depending on path | **0** |
| GPU / Trellis | Yes | **Never** |
| UI badge | **Cloud** | **Water** |
| Generate button | Generate / Generate 3D | **Generate with Water** |

---

## 2. How the UI picks an engine

Workspace **Engine** picker (`app/workspace/page.tsx`):

1. User selects a catalog model (`lib/models.ts`).
2. `providerForModelId(selectedModel)` → provider.
3. Branch:

```text
provider === "hydrilla"  →  Hydrilla cloud  (selectedIsCode = false)
any other provider       →  Water BYOK      (selectedIsCode = true)
```

Guards so Water never hits the GPU:

- Water forces **Text** input mode.
- Main button calls `runWater()` directly (not `start3DFromImage`).
- Image / 3D handlers re-check and bail if a code model is selected.
- GPU-offline errors clear when switching to Water.

Picker groups:

- `Hydrilla cloud · credits`
- `Water · Anthropic` / `OpenAI` / `Google` / `OpenRouter` / `Water · free keys`

---

## 3. API surface

### Water (BYOK)

| Action | Endpoint | Frontend helper |
|--------|----------|-----------------|
| Submit | `POST /api/water/generate` | `submitWater` |
| Poll | `GET /api/water/jobs/:jobId` | `fetchWaterJob` |
| Thumbnail | `POST /api/water/jobs/:jobId/thumbnail` | `saveWaterThumbnail` |
| Keys list | `GET /api/user/api-keys` | `fetchUserApiKeys` |
| Save key | `PUT /api/user/api-keys/:provider` | `saveUserApiKey` |
| Verify key | `POST /api/user/api-keys/:provider/verify` | `verifyUserApiKey` |

Legacy mount (same router): `/api/code-sculpt/*` — kept for old clients.  
Mounted on **local** `server.ts` and **Vercel** `api/index.ts` as both `/api/water` and `/api/code-sculpt`.

### Hydrilla cloud (Trilles)

Unchanged: `/api/3d/*` (`threeD.ts`) — text-to-image, edit, generate, status, queue.

Water jobs are **excluded** from GPU sync when `engine` is `water`/`code_sculpt`, or `generateType` is `Water`/`CodeSculpt`, or `result_kind` is `three_factory`.

---

## 4. How BYOK works (end to end)

```text
Settings
  └─ Save Anthropic / OpenAI / Gemini / OpenRouter key
       ├─ Format check (lookLikeKey)
       ├─ Encrypt AES-GCM → user_api_keys
       └─ Live probe → status valid | invalid
            (GET provider /models with the key)

Workspace Engine
  └─ Pick BYOK model → badge Water · 0 credits

Generate with Water
  └─ POST /api/water/generate
       ├─ Auth + approved access
       ├─ Intake gate (prompt rules)
       ├─ Resolve provider from modelId
       ├─ Reject if key missing / invalid
       ├─ Create jobs row (engine=water, credits_used=0, status=RUN)
       ├─ Return { jobId } immediately
       └─ Background: waitUntil (Vercel) / fire-and-forget (local)
            └─ LLM: assessment → spec → blockout → optional refine
                 └─ DONE + factory_code  |  FAIL + error_message

Frontend polls GET /api/water/jobs/:id (~2s, up to ~5 min UI cap)
  └─ DONE → WaterViewer → iframe /water-sandbox.html
       └─ Canvas snapshot → thumbnail (S3 preferred)
```

### Key verification (is the key “real”?)

Not a local guess. After save (and on **Verify**):

| Provider | Live probe |
|----------|------------|
| Anthropic | `GET /v1/models` + `x-api-key` |
| OpenAI | `GET /v1/models` + Bearer |
| OpenRouter | `GET /v1/models` + Bearer |
| Gemini | `GET …/models?key=` |

HTTP OK → **valid**. Else → **invalid** + short `lastError`. Key never returned to the browser (only `last4`, status).

Frontend allows generate if `configured && status !== "invalid"`.  
Backend also rejects `api_key_required` / `api_key_invalid` on submit.

### Env

| Variable | Purpose |
|----------|---------|
| `USER_API_KEYS_ENCRYPTION_SECRET` | Encrypt user keys (≥16 chars, stable) |
| `AWS_*` + S3 bucket | Durable Water thumbnails (recommended in prod) |
| Clerk + Supabase | Auth + jobs / keys (existing) |

---

## 5. Persisted job fields

| Column | Cloud | Water |
|--------|-------|-------|
| `engine` | `trilles` | `water` (read also `code_sculpt`) |
| `generate_type` | ImageTo3D / … | `Water` (read also `CodeSculpt`) |
| `result_kind` | `glb` | `three_factory` |
| `result_glb_url` | set | null |
| `factory_code` | null | TypeScript source |
| `llm_model` / `llm_provider` | null | BYOK model |
| `credits_used` | > 0 | `0` |
| `sculpt_pass` | n/a | assessment → … → blockout |
| `preview_image_url` | mesh / source | client capture |

SQL: `backend/hydrilla_backend/sql/add_user_api_keys_and_code_sculpt.sql` (additive).

---

## 6. Water pipeline & intentional error stops

```text
intake → assessment/spec → spec gate → blockout → code gate → (one refine) → DONE|FAIL
```

### Before tokens / before job

| Stop | Why |
|------|-----|
| No workspace / not signed in | Product rules |
| Wrong model / hydrilla provider | Water is BYOK-only |
| Key missing / invalid | Don’t call provider |
| Intake: empty / too short / no word / >2000 chars | Don’t spend tokens |
| Job insert fails | Migration missing |

### During generation (job → FAIL)

| Stop | Why |
|------|-----|
| Provider 401/403 | Key rejected mid-run |
| Provider 429 | Rate limit (esp. OpenRouter free) |
| Blocking code-gate after 1 refine | Missing `createModel`, forbidden APIs, too short |
| `empty_factory` | Returned code &lt; ~200 chars |
| Generic `water_failed` | Other pipeline/LLM errors |

### Soft (does not hard-fail)

| Behavior | Why |
|----------|-----|
| Spec fails → 1 repair → fallback scaffold | Keep builds moving |
| Non-blocking code issues after refine | Still return best attempt |

### Preview / infra (not app-thrown)

| Symptom | Meaning |
|---------|---------|
| **Upstream idle timeout exceeded** | Host/proxy (e.g. Vercel) killed a quiet long request — **not** an app error string |
| UI “Water timed out…” | Client poll ~5 min; job may still finish in DB |
| Vercel `maxDuration: 300` | Background work capped at 5 minutes |

Code gates ban: `fetch`, `XMLHttpRequest`, `eval`, `new Function`, dynamic `import`, asset loaders, `require`.

---

## 7. Files that matter

### Frontend (keep)

| File | Role |
|------|------|
| `lib/engines.ts` | Names + detectors |
| `lib/models.ts` | Catalog |
| `lib/api.ts` | Water + key clients |
| `components/WaterViewer.tsx` | Iframe host |
| `public/water-sandbox.html` | Browser preview sandbox |
| `app/workspace/page.tsx` | Engine picker + `runWater` |
| `app/app/settings/page.tsx` | BYOK keys |
| `app/app/assets/page.tsx` | Mesh vs Water library |

### Backend (keep)

| File | Role |
|------|------|
| `src/lib/engines.ts` | Engine constants |
| `src/lib/llmProviders.ts` | Catalog, `callLLM`, `verifyProviderKey` |
| `src/lib/codeSculptPipeline.ts` | Water pipeline (legacy filename) |
| `src/lib/userApiKeysCrypto.ts` | AES-GCM |
| `src/repository/userApiKeys.ts` | Key CRUD |
| `src/routes/user.ts` | `/api/user/*` |
| `src/routes/codeSculpt.ts` | Water router (`waterRouter` alias) |
| `src/server.ts` + `api/index.ts` | Mounts |
| SQL migration above | Schema |

### Removed (do not bring back)

- `components/CodeSculptViewer.tsx`
- `public/code-sculpt-sandbox.html`
- `skills/code-sculpt/` → use `skills/water/`

Internal filenames `codeSculpt*.ts` remain for history; they implement **Water**.

---

## 8. Quick verify

1. Settings → save a key → status **Valid**.  
2. Engine → Claude / free model → badge **Water**, cost **0 credits**.  
3. Generate → job `engine=water`, `credits_used=0`, no GPU sync.  
4. Preview in WaterViewer; library thumbnail appears.  
5. **Download** → GLB (primary), GLTF, OBJ, STL, PNG, or TypeScript (from live preview).  
6. Switch to **Trilles** → badge **Cloud**, credits path unchanged.
