# Gwen NEW must-fold 1–7 (IMG2THREEJS_DELTA) — encode in Cloud gates

**Source:** `Hydrilla AI orchestration/docs/IMG2THREEJS_DELTA.md`  
**Numbers:** unchanged from QUALITY_BAR (IoU HARD 0.85, scale≤0.08, aspect≤0.05, continue≥0.70, fidelity≥0.85, criteria≥0.80, spread≤0.20, max_iter 6, min_delta 0.02, route≥0.82).

| # | Rule | Owner |
|---|------|-------|
| 1 | Declare asset class — never infer from filename/keyword heuristics | compile / route |
| 2 | Class profiles **only raise** floors, never lower | mesh-post + evaluate |
| 3 | Stage-aware: no evaluate/bake/VLM before mesh-post HARD; no bake gates on draft | mesh-post + evaluate + refine |
| 4 | Default evidence = generic prop; Car/identity packs opt-in when class=vehicle | evaluate |
| 5 | Workers/CLI for mechanical gates; skills route/judge only | all |
| 6 | Fidelity adapters need provenance; never grant ship pass | preprocess + evaluate |
| 7 | Gen-vs-photo: objectness → probe + microscope; not more global IoU. RECON_OBJ_MIN≈0.48 rescues IoU-only → probe (never past geo HARD) | evaluate |

No factory theater / ObjectSculptSpec / character plugins.
