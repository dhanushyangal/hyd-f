# mesh-post-gate — remesh backends

**Not a separate skill.** Poly-budget remesh stays inside `mesh-post-gate` / `mesh.post.gate` optional remesh pass.

## Default / preferred: AutoRemesher (MIT)

- Repo: https://github.com/huxingyi/autoremesher
- License: **MIT** — safe for product worker
- Role: **default** remesh backend when topo/poly fail geometric gates
- Early remesh targets: **~10–30k** tris (before game_ready LOD bake budgets)
- Invoke via worker CLI (job-runner); skill only decides *when* to remesh, not GPU loops

## GeometryPack (GPL) — inspiration / sidecar only

Researchy lock: GeometryPack is **GPL**. Use only as:

- design inspiration for topology goals, or
- optional **sidecar** experiment (isolated process / non-distributed) when a user explicitly opts in

**Do not** wire GeometryPack as default remesh in `mesh-post-gate` or ship it in the BlueFox hot path. Default remains AutoRemesher MIT.

## Sequence

1. `mesh.post.gate` fails poly/topo (or draft ≫ 50k / non-manifold after gen)
2. One **AutoRemesher** pass toward **10–30k** (profile may tighten)
3. `mesh.post.gate` again
4. Still fail → escalate (Water BYOK remesh) or reject — do not infinite remesh; do not fall back to GeometryPack by default

## Non-goals

- Do **not** invent a `poly-budget-remesh` skill
- Do **not** use Meshy remesh as default (escalate-only)
- Do **not** make GeometryPack (GPL) the product default remesher
- Bake LOD (hero 8–12k / mid / distant) remains `game-ready-bake`, not this step
