---
name: cloud-evaluate
description: >-
  Skeptical evaluator for Cloud GLBs: turntable stills, exactly one comparison
  sheet vs reference, heuristics then optional VLM. Owns promote/reject.
  Never rescues HARD geo fails. Not generate.
metadata:
  version: "0.3.1"
  author: hydrilla
  engine: cloud
  token_class: judge
compatibility: asset.render_views, asset.score; EvidenceManifest; Cloud agent only.
---

# cloud-evaluate

## When to use

**Only after** `cloud-mesh-post` HARD pass (+ `cloud-bake` if game_ready). Generator ≠ evaluator — never `job.submit`.

## Tool sequence

1. Confirm mesh-post HARD on JobCard — else refuse aesthetics
2. `asset.render_views` — 0/90/180/270 (evidence capture only)
3. `asset.score` — Tier1 + **one** comparison sheet + optional VLM; evidence check
4. `run.checkpoint` — mark `score`

Workers package sheet / Tier1 / admission; skill judges only.

## Skeptical criteria (numbers unchanged)

1. No score if mesh-post HARD failed  
2. EvidenceManifest coverage + freshness for `runId` before promote  
3. Tier1 IoU/scale/aspect with **objectness rescue** before blind IoU reject  
4. Exactly one comparison sheet per `runId`  
5. Continue ≥0.70; quality-complete fidelity ≥0.85  
6. Critical features ≤5 each ≥0.80; important avg ≥0.65  
7. VLM: multi-sample near threshold; criteria≥0.80; spread≤0.20; **never on HARD fail**  
8. Prefer reject when evidence thin  

## Gwen must-fold (IMG2THREEJS_DELTA)

See [img2threejs-must-fold.md](./references/img2threejs-must-fold.md).

1. Class from contract — never keyword/filename inference for specialty floors.  
2. **Profiles only raise floors** — hero/vehicle may raise identity bars; never soften draft below QUALITY_BAR defaults.  
3. **Stage-aware:** illegal to VLM/promote before mesh-post HARD; illegal bake-channel QA on draft.  
4. Default evidence = generic prop; Car identity pack ([car-identity-features.md](./references/car-identity-features.md)) when `class=vehicle` only.  
5. Sheet/Tier1/correction decide = workers; thin skill text.  
6. Fidelity adapters (masks/depth) need **provenance**; adapter output ≠ ship grant.  
7. Gen-vs-photo: if IoU HARD but objectness ≥ **RECON_OBJ_MIN ≈0.48** → **probe** (not past geo HARD). Feature-scale uses **zoom/microscope patches**, not global IoU churn. Prefer multi-orbit self-consistency over single-view IoU vs t2i plate.

## Beat raw Pixal

Compare harness candidate to reference; promote only runs that clear gates + floors (`docs/QUALITY_VS_PIXAL.md`).

## Prior pack references

- [car-identity-features.md](./references/car-identity-features.md)
- [prop-score-rubric.md](./references/prop-score-rubric.md)
- [evidence-manifest.md](./references/evidence-manifest.md)
- [quality-bar.md](./references/quality-bar.md)
- [img2threejs-must-fold.md](./references/img2threejs-must-fold.md)
