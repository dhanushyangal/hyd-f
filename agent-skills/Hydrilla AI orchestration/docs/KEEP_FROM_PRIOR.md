# KEEP from prior solid work

Preserve these locks when folding img2threejs discipline into Cloud GLB. Do not reopen without an explicit product override.

## Engine immutability
- User Cloud vs Water pick is **immutable** for the job.
- `run.route` **echoes** engine only — never switches Cloud↔Water; adapter/profile changes stay **inside** the chosen engine.

## Exactly 12 Run API tool IDs
Locked surface (`TOOL_SURFACE.md`):  
`prompt.compile`, `run.estimate`, `run.route`, `image.rembg`, `job.submit`, `job.await`, `mesh.post.gate`, `mesh.bake`, `asset.render_views`, `asset.score`, `run.checkpoint`, `experiment.fanout`.  
No 13th ID (sheet stays inside `asset.score`; t2i/remesh/preview are workers). Skill discipline: prefer fold; lift the artificial 8-cap only when a skill earns a generate step or fail-closed gate (e.g. `cloud-t2i` vs `cloud-run-pixal`). Do not invent provider/class chips.

## JobCard
- Total-state resume via stages + `run.checkpoint` (mark + next + skipReason).
- Crash recovery reads the card — does not replay chat.
- Correction counters: ≤3 refine/pass, ≤6 total on the card.

## EvidenceManifest
- Promote illegal without fresh, complete manifest for the same `runId`.
- `checkEvidence` → `promoteEligible` before VLM / promote.
- Required captures: GLB, gate_report, turntable 0/90/180/270, exactly one comparison_sheet (+ bake/admission when applicable).

## Car-class deepen (v1)
- Scope: **Car + hard-surface props** only (CREATE_V1_SCOPE / CREATE_GAPS_GWEN).
- Score ≤5 identity features: body, wheels, cabin, glass, grille.
- Compile hard-surface pack + symmetry/hard-edge mesh-post + multiview when available.
- Characters / Thor / face / hair / anim deferred.

## Kill list (do not reintroduce)
- Character / hero / creature Create path as v1 must
- Factory `createModel` / ObjectSculptSpec / pass theater as Create default
- `factory-critic` / `visual-critic` on default GLB path
- Always-on remesh/bake/BYOK without fail code
- Meshy/Tripo/Needle as bake owner; AI Gateway; AGPL vendor embed
- World / Kenney / multi-asset one-mesh scenes; photo-IoU-only promote
- Per-provider skill chips / unbounded Create skills that do not own generate or a gate
- Comfy runtime as product skill prose; cloudai threejs-animation as Create

## Stack locks still in force
- Create default `result_kind=glb`; Pixal3D BlueFox backbone; own bake worker; BiRefNet admission; heuristics before VLM; eve skills route/judge + tools as worker RPCs.
