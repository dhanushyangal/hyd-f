# img2threejs UPDATE delta — Cloud (`cloud-mesh-post` / `cloud-evaluate`)

**Date:** 2026-09-13 (refreshed)  
**Src freshness:** `/workspace/hydrilla-harness/data/img2threejs-src` @ `6e60b5e` — `git fetch` clean (behind **0**).  
**Baseline:** `/workspace/hydrilla-harness/docs/QUALITY_BAR_IMG2THREEJS.md`  
**Extract SoT:** `/workspace/hydrilla-harness/data/img2threejs-extract/` (no full-tree dup in orch pack)  
**Skill IDs:** `cloud-mesh-post`, `cloud-evaluate` (+ `cloud-refine-loop` for ≤6). **Not** `*-gate` / `score-compare` / `score-turntable`.  
**Out of scope:** Three.js factory, ObjectSculptSpec, character/CS2 plugins, Stage R, GLB→code prompts.

---

## Freshness result

| Area | Changed since QUALITY_BAR (2026-09-05 extract)? |
|------|--------------------------------------------------|
| IoU / sheet / `correction_loop` / `vlm_gate` **numbers** | **No** — still IoU HARD 0.85, scale≤0.08, aspect≤0.05, continue≥0.70, fidelity≥0.85, criteria≥0.80, spread≤0.20, max_iter 6, min_delta 0.02, route≥0.82 |
| v2.0 domain/plugin registry + SKILL harness docs | **Yes** — routing honesty; fold below |

No new IoU math to chase. Fold **routing / floors / timing**; keep QUALITY_BAR numeric defaults.

---

## NEW must-fold vs QUALITY_BAR (encode into Max Cloud)

These are **not** already stated as defaults in QUALITY_BAR — Max should add them to `cloud-mesh-post` / `cloud-evaluate` (+ compile/route as noted):

1. **Declare asset class — never infer from name**  
   img2 removed keyword domain detection (name tokens silently applied specialty floors).  
   → `cloud-compile-prompt` / route: class from intent + contract, not filename/prompt keyword heuristics.

2. **Class profiles only raise floors, never lower**  
   Domain merge clamps: augmentation may raise fidelity / detail floors; cannot soften them.  
   → `cloud-mesh-post` + `cloud-evaluate`: `vehicle`/`prop-hero` may raise HARD + identity bars above draft; draft cannot inherit hero floors without an explicit profile.

3. **Stage-aware gate participation**  
   Late gates must not fire before their track exists (img2: rig gates before rig track).  
   → Do not run bake-channel QA or `cloud-evaluate` VLM before `cloud-mesh-post` HARD pass; do not run `cloud-bake` gates on draft path.

4. **Default evidence = generic prop; specialty packs opt-in**  
   Local-spec-search defaults to `core_3d`, not a specialty corpus.  
   → Car/identity packs are compile refs when class=`vehicle`, not always-on.

5. **Workers/CLI for mechanical gates; skills only route/judge**  
   Latest SKILL: harness = Node CLI install/diagnose/resolve; forge scripts enforce.  
   → Sheet packaging, Tier1, correction decide, admission = workers; eve skill text stays thin (token discipline).

6. **Optional fidelity adapters need provenance; never grant pass**  
   Documented: SAM2-class masks, relative depth — every adapter emits provenance.  
   → Keep BiRefNet in `cloud-preprocess-ref`; MoGe/FOV assist on Pixal only with provenance; adapter output ≠ ship grant.

7. **Gen-vs-photo: objectness → probe + microscope; not more global IoU**  
   QUALITY_BAR already says objectness rescue before blind IoU reject. **New detail to encode:**  
   - `RECON_OBJ_MIN` ≈0.48 rescues IoU-only HARD → **probe** (never past geo HARD).  
   - Feature-scale needs **zoom/microscope patches**, not threshold churn (grids starve small features).  
   → `cloud-evaluate`: multi-orbit self-consistency + objectness preferred over single-view IoU vs t2i plate; identity ≤5 critical.

---

## Unchanged — keep QUALITY_BAR defaults

Map old names → canonical IDs:

### `cloud-mesh-post` (was “mesh-post”)
- Non-empty GLB + normals; 0 non-manifold; watertight per profile  
- Self-intersection = HARD fail  
- Finite bounds; +Y grounded normalize  
- Tri: draft ≤50k; game_ready Needle tiers via `cloud-bake`  
- Turntable 0/90/180/270; orbit area ratio ≥0.15  

### `cloud-evaluate` (was “score-turntable”)
1. `cloud-mesh-post` HARD pass first  
2. Tier1 numbers (+ objectness rescue / microscope per NEW #7)  
3. Exactly **one** comparison sheet per `runId`  
4. aiVisionScore ≥0.70 continue; fidelity ≥0.85 quality-complete  
5. Critical ≤5 each ≥0.80; important avg ≥0.65  
6. VLM never on HARD fail; multi-sample; criteria≥0.80; spread≤0.20  
7. Stop: success / repeated defect / plateau &lt;0.02 / ceiling 6 / budget → `cloud-refine-loop`

### Shared knobs
Admission fg 5–97%, short side ≥64px, largest blob ≥60% (`cloud-preprocess-ref`); route confidence ≥0.82 (`cloud-route-estimate`).

Extract paths unchanged under `data/img2threejs-extract/` — see QUALITY_BAR must-steal list.

---

## Do-not-encode

Three.js factory, ObjectSculptSpec-as-Cloud, `plugin-character` / Stage R / mesh_parity, `plugin-cs2`, hair/chirality, GLB-to-code prompts, Comfy knobs as skill prose, always-on grimoire dumps, retired IDs (`cloud-mesh-post-gate`, `cloud-score-compare`).

---

## Pixal Cloud fold path

```
cloud-t2i → cloud-preprocess-ref → cloud-run-pixal
  → cloud-mesh-post (HARD; class may RAISE only)
  → optional cloud-bake
  → cloud-evaluate (1 sheet + objectness/microscope + VLM last)
  → cloud-refine-loop (≤6)
```
