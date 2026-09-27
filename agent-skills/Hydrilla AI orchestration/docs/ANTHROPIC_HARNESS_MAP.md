# Anthropic harness map → Hydrilla Create

**Authors:** Steve · Ben  
**Date:** 2026-09-13  
**Sources:** [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents) · [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) · [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) · Researchy orch notes · Hydrilla JobCard / Evidence / TOOL_SURFACE

Maps Anthropic managed-agents + harness-design onto Hydrilla Create (Cloud Pixal + Water BYOK). Orchestrator lock: [`ORCHESTRATOR_DECISION.md`](./ORCHESTRATOR_DECISION.md) → **eve**.

---

## 1. Brain ≠ hands ≠ session

Anthropic Managed Agents virtualize three interfaces so each can fail or scale independently. Hydrilla maps 1:1:

| Anthropic | Hydrilla Create | Owns | Must not |
|-----------|-----------------|------|----------|
| **Brain** (Claude + harness loop) | **eve** — `agent.ts`, `instructions.md`, engine-scoped skills, tool choice, refine policy | Plan next stage; refuse; call tools; never do GPU | Embed Comfy/Pixal graphs as prose; switch Cloud↔Water |
| **Hands** (sandbox / tools / execute) | **Workers** via Run API tools — t2i, Pixal i2_3d, Water BYOK generate, AutoRemesher, own bake, turntable render | GPU / mesh / IO; return URIs + metrics + fail codes | Decide engine; promote without evidence |
| **Session** (append-only event log) | **JobCard + EvidenceManifest** (+ eve durable session) | Total checklist, `next`, skip reasons, captures, freshness, `runId` | Chat transcript as job truth |

### Interface sketch (Anthropic → us)

| Anthropic-ish | Hydrilla |
|---------------|----------|
| `wake(sessionId)` | Resume eve session / Run API continue from JobCard |
| `emitEvent` / session log | Stage records + evidence captures |
| `getSession` | Load JobCard |
| `provision` / `execute(name, input)→string` | `job.submit` / worker RPCs; brain only gets structured results |

**Implications**

- Skills **orchestrate** tools; workers return artifacts.  
- Engine is a **session field** from UI pick — immutable for the job.  
- Promote illegal without EvidenceManifest for current `runId` (`checkEvidence.promoteEligible`), regardless of VLM score.

Canonical: `/workspace/hydrilla-harness/docs/JOB_CARD.md`, `EVIDENCE_MANIFEST.md`, `TOOL_SURFACE.md`.

---

## 2. Planner / generator / evaluator (harness-design)

Anthropic long-running app harness: **planner → generator → evaluator**, with contracts and a skeptical evaluator that does not share the generator’s build context.

| Role | Cloud skill tree | Water skill tree | Rule |
|------|------------------|------------------|------|
| **Planner / router** | `cloud-compile-prompt`, `cloud-route-estimate` | `water-compile-prompt`, `water-route-estimate` | Inside engine only; estimate before preprocess |
| **Generator (hands)** | `cloud-t2i`, `cloud-run-pixal` (Pixal), `cloud-bake` | `water-generate-3d`, `water-bake` | Produce next artifact |
| **Gate (deterministic)** | `cloud-preprocess-ref`, `cloud-mesh-post` | `water-preprocess-ref`, `water-mesh-post` (+ earned factory gates) | Fail-closed codes |
| **Evaluator (skeptical)** | `cloud-evaluate` | `water-evaluate` | **≠ generator**; one comparison sheet; fresh context preferred |
| **Refine controller** | `cloud-refine-loop` (earned) | `water-refine-loop` (earned) | Caps; **VLM never overrides HARD geo** |
| **Lab** | `cloud-experiment` | `water-experiment` | Same engine only |

**Do not** let generator skills self-score promote. Evaluator owns promote / reject / refine.

Skill count: **no hard 8-cap** — add only when earned (beats raw Pixal / BYOK quality or closes a real gate hole).

---

## 3. Cloud path (locked) — text → image → image→3D

```text
UI engine=Cloud (immutable)
  → cloud-compile-prompt          # brain
  → cloud-route-estimate          # brain — adapter/profile inside Cloud only
  → [cloud-t2i]                   # hands — text→image when needs_t2i / no admitted ref
  → cloud-preprocess-ref          # gate — rembg / gray studio (image→clean image)
  → cloud-run-pixal                   # hands — Pixal image→3D (structure→shape→texture = worker)
  → cloud-mesh-post          # gate — HARD + AutoRemesher on fail
  → [cloud-bake]       # hands — own bake if game_ready / NO_UV
  → cloud-evaluate           # evaluator — sheet + EvidenceManifest
  → [cloud-refine-loop]           # earned
  → promote | reject
```

**Not allowed on Cloud Create:** text→mesh shortcut that skips image stage when quality path needs t2i; Water adapters; factory `createModel` as Cloud default.

---

## 4. Water path (sibling tree — never share Cloud prompts)

```text
UI engine=Water (immutable)
  → water-compile-prompt
  → water-route-estimate          # Meshy/Tripo/fal/… inside Water only
  → [water-preprocess-ref]
  → water-generate-3d             # BYOK mesh (default) or legacy factory mode if product keeps it
  → water-mesh-post | earned factory gates
  → [water-bake]
  → water-evaluate           # mesh rubric ≠ Cloud sheet averaging
  → [water-refine-loop]
  → promote | reject
```

Separate markdown under `skills/water/*`. Shared layer = `@hydrilla/harness-contracts` + worker binaries only — see `SHARED_SKILLS.md` / `SHARED_LAYER.md`.

---

## 5. Skeptical QA (evaluator contract)

1. Mesh-post HARD pass before aesthetic scoring.  
2. Exactly **one** comparison sheet vs reference (img2threejs discipline).  
3. Heuristics / Tier1 before VLM.  
4. Multi-sample VLM near threshold; refuse incomplete/stale EvidenceManifest.  
5. Never rescue `NON_MANIFOLD` / self-intersect with a high VLM score.  
6. Floors: draft 0.70 / balanced 0.80 / quality+game_ready 0.85.

---

## 6. Session lifecycle (both engines)

```text
UI engine pick (immutable)
  → JobCard created (engine, profile, stages[])
  → eve brain loads engine-scoped skills only
  → hands workers produce URIs; JobCard checkpoint
  → EvidenceManifest accumulates (mint new runId on remesh/bake)
  → evaluator → promote | reject | refine (≤ caps)
  → done (outcome on JobCard)
```

**Park:** eve parks on `job.await` / long bake (zero burn).  
**Resume:** from JobCard `next` + evidence — not chat history.  
**Handoff:** production GLB = validator + Three load + Y-up/meters + `promoteEligible` (`CREATE_FEATURES_MUST.md`).

---

## 7. What we deliberately do *not* copy from Anthropic coding harnesses

| Coding-harness pattern | Create translation |
|------------------------|--------------------|
| git commit as progress | JobCard stage mark + checkpoint |
| `PROGRESS.md` / feature list | JobCard stages + EvidenceManifest required list |
| Playwright UI grader | Turntable + mesh HARD + comparison sheet (Three preview = evidence, not product generate) |
| Fresh coding sandbox per sprint | Fresh **worker** invocation; brain may compact but session state stays on JobCard |
| Firstmate / tmux crew | **Out** of Create runtime |

---

## 8. One-liner

**Brain = eve · hands = GPU/mesh workers · session = JobCard + Evidence — separate Cloud (text→image→Pixal i2_3d) and Water skill trees; engine immutable; evaluator ≠ generator; earn every skill past the old eight.**
