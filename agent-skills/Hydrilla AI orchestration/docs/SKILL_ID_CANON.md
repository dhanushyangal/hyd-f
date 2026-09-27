# Canonical skill IDs (2026-09-13)

## Cloud (Create)
| ID | Role |
|----|------|
| cloud-compile-prompt | planner |
| cloud-route-estimate | estimate/profile inside Cloud |
| cloud-t2i | text→image |
| cloud-preprocess-ref | rembg/admission |
| cloud-run-pixal | image→3D Pixal |
| cloud-mesh-post | HARD geo + remesh |
| cloud-bake | own game_ready bake |
| cloud-evaluate | skeptical compare vs ref |
| cloud-refine-loop | ≤6 refine coordinator (earned) |
| cloud-run-job | JobCard DAG coordinator (earned) |
| cloud-experiment | Lab only |

## Water (Create)
| ID | Role |
|----|------|
| water-compile-prompt | planner |
| water-route-estimate | BYOK adapter inside Water |
| water-t2i | optional if adapter needs image |
| water-preprocess-ref | rembg/admission |
| water-generate-3d | Meshy/Tripo/fal/… |
| water-mesh-post | HARD geo |
| water-bake | own bake |
| water-evaluate | skeptical compare |
| water-refine-loop | ≤6 refine |
| water-run-job | JobCard DAG |
| water-experiment | Lab |
| water-threejs-preview | OPTIONAL legacy — never Cloud |

## Aliases retired (do not use in new prompts)
cloud-i2-3d → cloud-run-pixal; cloud-mesh-post-gate → cloud-mesh-post; cloud-game-ready-bake → cloud-bake; cloud-score-compare → cloud-evaluate; cloud-run-experiment → cloud-experiment; same pattern for water-*-gate / water-score-compare / water-game-ready-bake.
