---
name: cloud-refine-loop
description: >-
  Use on Cloud when score rejects with retryable defects. Enforces max iterations
  and forbids VLM from overriding HARD fails. Not a generate skill itself.
metadata:
  version: "0.3.1"
  author: hydrilla
  engine: cloud
  token_class: router
compatibility: JobCard correctionCount; Cloud agent only.
---

# cloud-refine-loop

## Caps (unchanged)

- ≤3 refine attempts per pass  
- ≤6 total corrections (`max_iter` 6)  
- Stop: success / repeated defect / plateau Δ&lt;0.02 (`min_delta`) / ceiling / budget  

## Stage-aware stop rules (Gwen must-fold)

1. **Never** schedule `cloud-evaluate` VLM or `cloud-bake` until `cloud-mesh-post` HARD is green on the new `runId`.  
2. Geo HARD fail → fix geo (remesh / regenerate) or **reject** — VLM never overrides.  
3. Objectness probe / microscope paths from evaluate may request targeted refine — **not** a pass grant.  
4. Profiles only raise retry floors; cannot soften QUALITY_BAR defaults mid-loop.  
5. Fidelity-adapter hints require provenance on JobCard; never treat adapter score as ship.  
6. Re-enter `cloud-t2i` / `cloud-run-pixal` / `cloud-mesh-post` / `cloud-evaluate` as ScoreReport directs — **Cloud only**; never switch to Water.  
7. Bump `runId` when generate/bake changes invalidate EvidenceManifest.  

## Rules

- Not a generate skill — coordinates only.  
- No factory theater.  

## References

- [img2threejs-must-fold.md](./references/img2threejs-must-fold.md)
