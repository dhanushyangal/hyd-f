# Water providers, keys, and the Engine picker

How Hydrilla Water chooses an LLM, stores keys, and decides which models appear in Studio.

Related: [`ENGINES.md`](./ENGINES.md) (Cloud vs Water), [`WATER_ORCHESTRATION.md`](./WATER_ORCHESTRATION.md) (harness), [`WATER_FULL_GUIDE.md`](./WATER_FULL_GUIDE.md) (passes).

---

## Mental model

```text
Settings API keys     →  encrypted on Express (user_api_keys)
Admin Platform keys   →  encrypted on Express (platform_api_keys)
Settings model toggles → Engine dropdown (what you can pick)
Engine pick            → POST /api/water/generate (which LLM runs)
```

The Next.js app **never** sees raw provider secrets. It only sees `last4`, status, live model **names**, and your enabled ids.

---

## Connectors (one registry)

Vendors live only in `backend/hydrilla_backend/src/providers/`:

| id | UI name | Product | Chat path |
|----|---------|---------|-----------|
| `anthropic` | Anthropic | Claude API | AI SDK `generateText` |
| `openai` | OpenAI | API | AI SDK `generateText` |
| `google` | Google | Gemini API | AI SDK `generateText` |
| `openrouter` | OpenRouter | — | AI SDK OpenAI-compatible |
| `cursor` | Cursor | Cloud Agents API | create/poll/usage (not chat completions) |

Stored provider column is `google` (not `gemini`). The API still accepts `gemini` as an alias. Run `sql/007_provider_google.sql` once in Supabase so `CHECK` constraints allow `google`.

Adding a vendor later: one file in `providers/` + SQL `CHECK` + optional featured needles in `lib/waterModels.ts`.

---

## Key resolve order (generate + live list)

`resolveWaterApiKey(userId, provider)`:

1. Member key if configured and `status !== "invalid"`
2. Else platform key if configured and `status !== "invalid"`
3. Else none → generate 400

Invalid keys never generate. User key always beats platform.

Admin UI: **Platform keys** (`/api/admin/api-keys`, alias `/api/admin/water-keys`). Copy: used only when the member has not added their own key.

Settings: if you have no personal key but platform is set, the card says Hydrilla’s key is available.

---

## HTTP

| Method | Path | Who |
|--------|------|-----|
| GET | `/api/user/api-keys` | connectors (no secrets) + user keys + `sharedKeys` (platform, no last4) + prefs |
| PUT/DELETE/POST verify | `/api/user/api-keys/:provider` | member BYOK |
| GET | `/api/user/models` | live `listModels` per connector that has a resolved key (5 min cache) |
| PATCH | `/api/user/model-prefs` | `defaultCodeModel`, `enabledCodeModels` |
| GET/PUT/DELETE/verify | `/api/admin/api-keys` | platform table |

Canonical model id: `provider:nativeId` (example `anthropic:claude-sonnet-5`). Legacy prefs (`claude-sonnet-5`, `gemini-*`, `cursor-auto`) go through `migrateCodeModelId`.

---

## Settings toggles → Engine list

Cursor-style: search “Add or search model”, green switch per row, **saved immediately**.

- **On** → id is in the Engine picker  
- **Off** → gone from the picker  
- A few featured models start **on** when that provider has a usable key (user or platform)  
- You cannot turn off the **last** model for a provider (picker never empty)

Persistence:

1. Instant: `localStorage` key `hydrilla.water.enabledModels`
2. Account: `user_model_prefs.enabled_code_models` via PATCH (run `sql/008_enabled_code_models.sql`)

If 008 is not applied yet, toggles still work in this browser; PATCH ignores the missing column.

Studio listens for the same-tab event and other-tab `storage` so the Engine list updates after Settings.

Frontend helpers: `lib/waterModels.ts`. Fallback connector cards if the API omits `connectors`: `lib/connectors.ts`.

---

## Generate path

```text
Engine Water model
  → parseWaterModelId
  → resolveWaterApiKey
  → callLLM / callLLMObject (AI SDK, Cursor adapter)
  → planner → generate → validateFactoryCode → evaluator
  → fallback factory only if the LLM returns empty/refusal
```

Object Studio asks for a **few attached volumes** (no floating extra tubes). Last-resort fallback is a box with a handle welded to the side.

---

## SQL to run (once each)

| File | Why |
|------|-----|
| `sql/007_provider_google.sql` | `gemini` rows → `google`; CHECK ids |
| `sql/008_enabled_code_models.sql` | persist Engine pins across devices |

Env: `USER_API_KEYS_ENCRYPTION_SECRET` (AES-GCM for keys). AI SDK packages are **backend only** — not the Next app.
