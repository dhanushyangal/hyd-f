# Tool surface — 12 IDs, frozen

Authored here (the Grok pack's `contracts/TOOL_SURFACE.md` is a stub pointing at a
tree outside this repo). Code: `backend/hydrilla_backend/src/lib/create/toolSurface.ts`.

**Law:** exactly these twelve IDs. **No 13th.** New capability folds into an existing
ID as a worker behind it, or it does not ship.

| ID | Kind | Owns | Never |
|---|---|---|---|
| `prompt.compile` | brain | geo_brief + tex_brief, asset class, refuse decision, `needs_t2i` | Call the GPU |
| `run.estimate` | brain | credit / latency estimate before spend | Deduct credits |
| `run.route` | brain | profile + adapter **inside** the chosen engine; echoes engine | Switch Cloud ↔ Water |
| `image.rembg` | hands | background removal + admission checks | Judge aesthetics |
| `job.submit` | hands | submit to the engine adapter, return provider job id | Poll to completion |
| `job.await` | hands | poll / webhook until terminal; park-friendly | Re-submit on timeout |
| `mesh.post.gate` | hands | deterministic geometry HARD gate + optional remesh | Score look, call a VLM |
| `mesh.bake` | hands | UV unwrap, PBR channels, game_ready tiers | Be delegated to Meshy/Tripo/Needle |
| `asset.render_views` | hands | turntable renders at 0/90/180/270 | Compose the comparison sheet |
| `asset.score` | evaluator | comparison sheet (exactly one per `runId`), Tier1, identity, VLM last | Rescue a HARD geo fail |
| `run.checkpoint` | session | mark stage, set `next`, record `skipReason` / fail codes | Hold job truth in chat |
| `experiment.fanout` | lab | N-way fanout incl. raw-engine baseline column | Be a Create default |

## Folded, not new IDs

| Capability | Lives behind |
|---|---|
| text→image (`cloud-t2i`) | `job.submit` + `job.await` |
| remesh / AutoRemesher | `mesh.post.gate` |
| comparison sheet composition | `asset.score` |
| glTF validation / export QA | `mesh.post.gate` |
| Three.js factory preview render | `asset.render_views` |

## Ownership by role

Per [`../DECISIONS_LOCKED.md`](../DECISIONS_LOCKED.md) — brain ≠ hands ≠ session:

- **brain** (`prompt.compile`, `run.estimate`, `run.route`) decides; never touches GPU.
- **hands** (`image.rembg`, `job.submit`, `job.await`, `mesh.post.gate`, `mesh.bake`, `asset.render_views`) produce artifacts + fail codes; never decide engine or promote.
- **evaluator** (`asset.score`) owns promote / reject / refine; runs after geo HARD pass.
- **session** (`run.checkpoint`) is the only writer of stage truth.

## Stage → tool map

### Cloud

| Stage skill | Tools |
|---|---|
| `cloud-compile-prompt` | `prompt.compile` |
| `cloud-route-estimate` | `run.estimate`, `run.route` |
| `cloud-t2i` | `job.submit`, `job.await` |
| `cloud-preprocess-ref` | `image.rembg` |
| `cloud-run-pixal` | `job.submit`, `job.await` |
| `cloud-mesh-post` | `mesh.post.gate` |
| `cloud-bake` | `mesh.bake` |
| `cloud-evaluate` | `asset.render_views`, `asset.score` |
| `cloud-refine-loop` | `run.checkpoint` (+ re-entry) |
| `cloud-run-job` | `run.checkpoint` |
| `cloud-experiment` | `experiment.fanout` |

### Water (`water-threejs` mode — shipped)

| Stage | Tools |
|---|---|
| `water-compile-prompt` | `prompt.compile` |
| `water-route-estimate` | `run.estimate`, `run.route` |
| `water-generate-3d` | in-process harness passes (no GPU adapter) |
| `water-mesh-post` | `mesh.post.gate` on the **exported** GLB |
| `water-evaluate` | `asset.render_views`, `asset.score` |
| `water-run-job` | `run.checkpoint` |

`water-mesh` mode (deferred) adds `job.submit` / `job.await` behind BYOK adapters.
