# Grok bot brief — 3D harness and skill swarm

> **Superseded on naming and sequencing.** The Grok orchestration pack
> (`agent-skills/Hydrilla AI orchestration/`) is now the source of truth for skill
> IDs, and [`CREATE_ORCHESTRATION_PLAN.md`](./CREATE_ORCHESTRATION_PLAN.md) is the
> build order. Keep this file for **strategy** (what to build, what to refuse, why
> Godot stays out); use canon IDs from
> `agent-skills/Hydrilla AI orchestration/docs/SKILL_ID_CANON.md` in code.
>
> | This brief | Canon ID |
> |---|---|
> | `router` | `cloud-route-estimate` / `water-route-estimate` |
> | `image-intake` | `cloud-preprocess-ref` |
> | `mesh-critic`, `post-mesh` | `cloud-mesh-post` (+ `cloud-bake`) |
> | `export-qa`, `competitor-eval` | `cloud-evaluate` + bench |
> | `factory-critic`, `visual-critic` | **Water factory mode only** — barred from the default GLB path |

Give this file to a Grok bot that will design or implement Hydrilla’s quality harness and skills.

**Read first (do not reinvent):**

- [`ENGINES.md`](./ENGINES.md) — Cloud vs Water, artifact boundary, current skills map
- [`WATER_ORCHESTRATION.md`](./WATER_ORCHESTRATION.md) — planner → generate → gate → evaluate
- [`WATER_FULL_GUIDE.md`](./WATER_FULL_GUIDE.md) — factory contract, passes, budgets
- [`GENERATION_FLOWS.md`](./GENERATION_FLOWS.md) — Trellis / BlueFox GPU path
- `lib/waterSkills.ts` + `lib/engines.ts` + `lib/models.ts`

This brief is strategy and constraints. Runtime generate still uses **backend prompt packs**, not markdown under `skills/water/`.

---

## 1. Product fact (do not collapse)

Hydrilla has **two engines**. Mixing them into one “3D skill” is how quality dies.

| | **Hydrilla cloud (BlueFox 1)** | **Water** |
|---|---|---|
| Catalog id | `trilles` (UI: BlueFox 1) | BYOK `provider:nativeId` |
| Compute | GPU — FLUX (optional) → Trellis | User’s LLM key |
| Output | `result_kind=glb` | `result_kind=three_factory` |
| Viewer | `ThreeViewer` + `/api/3d/glb/:jobId` | `WaterViewer` + `public/water-sandbox.html` |
| Job ids | GPU / backend ids | `wt_*` (legacy `cs_*`) |
| What skills can change | **Intake + post-mesh + critic** — not the weights | **Prompt packs + gates + critics** — this is the moat |

```text
Cloud:  engine=trilles   result_kind=glb            result_glb_url=…
Water:  engine=water     result_kind=three_factory  factory_code=…
```

Never send Water jobs to the GLB proxy or GPU poller. Never send Cloud jobs to `WaterViewer`.

---

## 2. What “beat competitors” means

| Competitor | What they are | How Hydrilla beats them |
|---|---|---|
| **Microsoft TRELLIS / our BlueFox 1 raw** | Structured-latent image→3D. Strong silhouette, weak production mesh. | Not a better Trellis prompt. **Image intake + post-mesh** (remesh, UVs, PBR, part split, floater kill). |
| **Meshy / Tripo / Rodin** | Same class as BlueFox, plus remesh + UV + texture polish. | They win on **file quality**. Match that post pipeline. |
| **Luma** | Capture / video / splats in public perception. | Do not compete on NeRF. Compete on **a GLB that opens in Blender/Unity**. |
| **img2threejs / Claude artifacts / Water clones** | One-shot `createModel()`. | Multi-pass + generator≠evaluator + **visual critic + export QA**. Water already has the first half. |
| **Godot-from-LLM demos** | Scene graphs, not hero meshes. | Ignore for model quality. Optional later: Godot **import preset**, not a generator. |

BlueFox marketing already claims segmented parts + PBR + GLB/FBX/OBJ/USDZ. If the file still looks like raw Trellis (floaters, baked mush, no UVs), skills will not save it.

**Never score both engines with one rubric.** Neural mesh ≠ procedural CSG.

---

## 3. What you do NOT build

Drop these. They dilute quality work.

| Do not add | Why |
|---|---|
| **Godot as a generation engine** | Game engine, not a mesh model. Writing `.tscn` / GDScript is a different product. Three.js sandbox already exists. |
| **Environment + World skills** | Stubs only. They make Object / Character / Game worse before those are excellent. |
| **Hunyuan skills** | Catalog is `comingSoon`. No runtime to improve. |
| **One mega “3D skill”** | Extend packs. Do not stuff one system prompt. |
| **Remotion / video / canvas 3D skills** | Those make videos, not shippable assets. |
| **Unity / Unreal / Blender as engines** | Handoff targets, not generators. |
| **More LLM providers** | Quality is gates + critics + post-mesh, not “add Gemini.” |
| **Animation idle `tick`** | Preview is **static**. Anim stays sockets + rest pose until export is real. |
| **Playwright-first visual loop** | Add **after** deterministic geometry gates, not instead of them. |
| **Markdown under `skills/water/` as runtime** | Docs only. Runtime is `backend/.../water/skills/index.ts`. |
| **Same eval rubric for Trellis vs Water** | Wrong winner every time. |
| **Water for photoreal organics** | Water cannot beat BlueFox on a photo of a dog. |
| **BlueFox for editable CAD assemblies** | BlueFox cannot beat Water on named bolts and Boolean-clean hard-surface. |

---

## 4. Godot — exact rule

**Do not add Godot as an engine.**

| Ask | Answer |
|---|---|
| “Generate a Godot game / `.tscn`” | **No.** That forks Water into a second factory contract. |
| “Use Godot as the renderer instead of Three.js” | **No.** Use `WaterViewer` + `water-sandbox.html`. |
| “Export a GLB Godot can import” | **Yes, later.** One export-preset: +Y up, meters, named nodes, no root scale hacks. Same family as Unity / Unreal / Blender. |

Ship **Unity / Unreal / Blender / Godot import presets** as one `dcc-handoff` skill **after** `game` + `export-qa` are real. Not a fourth generator.

---

## 5. Architecture the bot must implement

Two harnesses. One router.

```text
User brief
    → ROUTER (engine + skill + tier)
         ├─ Cloud / BlueFox
         │     → IMAGE INTAKE
         │     → Trellis / BlueFox 1
         │     → MESH CRITIC
         │     → POST-MESH
         │     → EXPORT QA
         │
         └─ Water
               → PLANNER (SculptSpec + qualityContract)
               → for each unlocked pass:
                     generate → CODE GATE → FACTORY CRITIC → optional 1× refine
               → (Studio only) VLM SCREENSHOT critic
               → EXPORT QA (GLB from factory)
               → if empty: fallbackFactory
```

### Water harness rules (already shipped — do not collapse)

Canonical orchestrator: `backend/.../lib/water/harness/run.ts`

1. Planner writes spec. Generator writes **current pass only**.
2. Generator and evaluator are **different** model calls.
3. Deterministic code gate always (banned APIs, `createModel` contract, coverage).
4. Evaluator LLM skipped on **Fast**.
5. Max **one refine** per pass.
6. Soft budget → `partial: true`, keep best code.
7. Factory is **static** (no time-based animation, no `userData.tick`).

Factory contract:

```ts
import * as THREE from 'three'
export function createModel(): THREE.Group
// root.userData.sculptRuntime
// no fetch / eval / loaders / dynamic import
```

### Quality tiers (do not change the unlock table)

| Tier | Passes | Evaluator LLM |
|---|---|---|
| Fast | `blockout` | no |
| Standard | → `material` (4 passes) | yes |
| Studio | all 8 through `optimization` | yes + visual critic (new) |

### Best-of-N

- Only on **`blockout`** and **`form`**.
- N = 2 or 3.
- Never on all 8 passes.
- Reuse Grok `best-of-n` / `check` for **harness development**, not for 8 parallel Studio jobs in production.

---

## 6. Skill swarm — cap at ~12

Three types only. Not a pile of markdown.

### Type A — Domain packs (runtime, Water)

Keep **3**. Do not add Env / World.

| `skillId` | Status | Must enforce |
|---|---|---|
| `object-studio` | live | Hard-surface: fillets, thickness, boolean cleanliness, named parts, PBR (albedo / metal / rough / normal). No “sphere + box sculpture.” |
| `character` | live | Hierarchy: pelvis → spine → head → limbs. Face groups. Skin vs cloth. Stylized, not photoreal. Do not pretend to beat Trellis on likeness. |
| `game` | make **live** | `userData` names, colliders, LOD hooks, origin at feet/ground, **meters**, **+Y up**, **−Z forward**. |
| `animation` | stay **partial** | Sockets + rest pose only. No idle tick. |

These stay as **backend prompt packs** (`backend/.../lib/water/skills/index.ts`), mirrored in `lib/waterSkills.ts`. Agent markdown under `skills/water/` is docs only.

### Type B — Critics (quality moat)

| Skill | Engine | What it scores |
|---|---|---|
| `image-intake` | Cloud | Single subject, clean bg, readable silhouette, no cropped handles/legs, consistent lighting. Reject or rewrite FLUX prompt **before** Trellis. |
| `mesh-critic` | Cloud | Floaters, non-manifold, inverted normals, scale, bbox, triangle budget, part count, texture seams. Fail = remesh or regenerate, not “looks ok.” |
| `factory-critic` | Water | Contract: `createModel()`, no fetch/eval/loaders, static, `sculptRuntime`, coverage vs spec. Skill-specific skeptic. |
| `visual-critic` | Water Studio only | Screenshots from 4 cameras (front / 3/4 / side / top). Silhouette, intersection, material break, empty volume. Skip on Fast. |
| `export-qa` | Both | GLB: scene graph names, meters, Y-up, no NaNs, textures &lt; 4K unless asked, passes glTF-Validator **and** Three.js load. FBX/USDZ if we claim them. |

Use **fail codes**, not vibes: `FLOATER`, `NON_MANIFOLD`, `SCALE`, `NO_UV`, `CONTRACT`, `BANNED_API`, `EMPTY_VOLUME`, `NAN`, `CROP`, `BAD_SILHOUETTE`.

### Type C — Post and judge

| Skill | When |
|---|---|
| `post-mesh` | After BlueFox: remesh / decimate, UV unwrap, texture reproject, part split, ground contact. **This is Meshy’s real advantage.** |
| `competitor-eval` | Bake-off only. Separate rubrics: mesh file vs factory. Never one score. |
| `router` | First call. Prompt → `trilles` vs `water` + `object-studio` / `character` / `game` + tier. |

Wrong engine = guaranteed loss.

---

## 7. Grok bot roles (the swarm that *builds* the harness)

These are **dev agents**, not user-facing generate chips.

| Bot | Job | Must not |
|---|---|---|
| **Harness architect** | Owns `run.ts` budgets, pass order, generator≠evaluator, artifact boundary | Write factories or Trellis prompts |
| **Router bot** | Classifies briefs; logs wrong-engine misses | Generate assets |
| **Object pack bot** | Edit **only** the object-studio pack + its evaluator checklist | Touch character / game packs |
| **Character pack bot** | Edit **only** the character pack + checklist | Touch other packs |
| **Game pack bot** | Edit **only** the game pack + checklist | Touch other packs |
| **Gate bot** | Deterministic checks only (AST, banned APIs, bbox, triangle count) | Call an LLM to “see if it looks good” |
| **Critic bot** | Rubrics + fail codes | Generate |
| **Export bot** | glTF-Validator + golden import tests | Redesign materials |
| **Eval bot** | Fixed prompt set vs Meshy / Tripo / raw Trellis / Water Fast | Ship new skills |

---

## 8. Quality targets

### BlueFox vs Trellis-vanilla / Meshy

- Image intake reject rate **> 0** (bad refs never hit GPU).
- Mesh critic fail codes on every Cloud job.
- Post-mesh: manifold, UVs, grounded, named parts.
- File opens in Blender + Unity without rescale.
- Do **not** try to beat Meshy on photoreal organics until post-mesh exists.

### Water vs Three.js one-shots

- Studio 8-pass stays; Fast stays cheap.
- Object Studio must look like a **product**, not glued primitives.
- Game skill: named parts + colliders + 1 m scale.
- Visual critic on Studio only.
- Exported GLB matches the sandbox (the usual Water fail).

### Router rules

- Photo / organic / likeness / “make this image 3D” → **Cloud**.
- Hard-surface / named parts / editable assembly / “procedural / Three.js / code” → **Water**.
- Characters: Cloud for likeness, Water for stylized / game-ready hierarchy. Do not cross them silently.

---

## 9. Build order (do not skip ahead)

1. **Router + `image-intake` + `mesh-critic`** — BlueFox quality jumps without new models.
2. **Harden Object Studio + `factory-critic` + `export-qa`** — Water quality jumps.
3. **`post-mesh`** — this is how we beat Meshy-class files.
4. **Make `game` live** — named parts, scale, colliders.
5. **`visual-critic` on Studio**.
6. **`dcc-handoff`** (Unity / Unreal / Blender / Godot presets).
7. Env / World / Hunyuan / Godot engine — **not until 1–6 are boring**.

---

## 10. File map (where to change things)

| Layer | Path | Role |
|---|---|---|
| FE skill chips | `lib/waterSkills.ts` | Labels, status, tier unlock, progress |
| BE skill ids | `backend/.../src/lib/waterSkills.ts` | Same ids / tiers |
| Runtime packs | `backend/.../src/lib/water/skills/index.ts` | Planner / generator / evaluator extras |
| Harness | `backend/.../src/lib/water/harness/*` | `run`, planner, generator, evaluator, fallback |
| Water API | `POST /api/water/generate` | `modelId`, `skillId`, `qualityTier`, `prompt` |
| Cloud API | `POST /api/3d/generate` | Image → Trellis GLB |
| Agent docs only | `skills/water/*.md` | **Not loaded at generate time** |
| Grok project skills (if added) | `.grok/skills/<name>/SKILL.md` | Dev-bot instructions for this repo |

If you add Grok skills, put them in **`.grok/skills/`** (project scope), one skill per Type B/C name above. Keep `SKILL.md` bodies short and actionable. Do not copy this whole brief into every skill — **link here**.

---

## 11. Acceptance checks for the bot

Before claiming the harness is done, all of these must be true:

- [ ] Cloud and Water artifacts still cannot be mixed.
- [ ] No Godot / Env / World / Hunyuan generation path was added.
- [ ] Water still uses planner → locked passes → generator ≠ evaluator.
- [ ] Fast still skips evaluator LLM and visual critic.
- [ ] New critics emit fail codes, not free-text “looks good.”
- [ ] `game` skill writes named parts + colliders + meter scale when selected.
- [ ] Export QA runs on a real GLB (Cloud URL or Water sandbox export), not on a screenshot only.
- [ ] Router has a logged reason for engine + skill choice.
- [ ] Competitor-eval uses two rubrics (mesh vs factory).

---

## 12. One-line brief

You do not need Godot, Env/World, Hunyuan skills, or a 40-skill pile. You need a **router**, **three domain packs**, **five critics/gates**, and **post-mesh**. BlueFox wins on **files**. Water wins on **editable hard-surface**. Godot is an import target, not a model.
