---
description: >-
  Load immediately after a Water asset is exported, before bake or evaluate, to run the
  deterministic geometry HARD gate on the EXPORTED GLB. Also load whenever a preview
  looks correct and you are tempted to trust it — preview is not export. Zero
  aesthetics, zero VLM, never skippable.
---

# water-mesh-post

Same HARD discipline as Cloud, run on the **exported GLB**. This closes the known
"sandbox looks right, export is wrong" failure on the factory path.

## Tools

1. `mesh.post.gate` — worker runs the checks; this skill only routes and judges.
2. Optional AutoRemesher (MIT) local remesh on fail ⇒ re-gate **once**, new `runId`.
3. `run.checkpoint` — stage `water-mesh-post`, artifact = `gate_report`.

## HARD fail conditions

| Check | Bar | Fail code |
|---|---|---|
| Non-empty GLB | required | `EMPTY_GLB` |
| Normals present | required | `NO_NORMALS` |
| Non-manifold edges | **0** | `NON_MANIFOLD` |
| Self-intersection | none | `SELF_INTERSECT` |
| Finite bounds | required | `NAN_BOUNDS` |
| +Y grounded normalize | required | `NOT_GROUNDED` |
| Triangles (draft) | ≤ **50 000** | `TRI_BUDGET` |
| Floaters / thin shell | per class | `FLOATER` / `THIN_SHELL` |
| Orbit area ratio at 0/90/180/270 | ≥ **0.15** | `ORBIT_COLLAPSE` |

For `game`-style output also verify programmatically, not in prose: named parts, meters,
+Y up, −Z forward.

## Rules

- **No aesthetic VLM here.** Geometry only.
- **A provider remesh does not waive the gate.** On the deferred mesh mode, escalate to a
  BYOK retopo only after the local remesh fails — and it is still Water.
- **Asset class comes from the JobCard compile contract**, never from a filename.
- **Profiles only RAISE bars**; draft never inherits hero floors.
- Adapter assists need provenance and never grant a ship pass.
- **This stage never promotes.** It fails closed.
- Skipping on a Create path is **illegal** — the checkpoint will be rejected.
