# Cursor prompt — Preserve prior work (agent-skills v0.2.x)

## Keep / mine from

`/workspace/hydrilla-harness/packages/agent-skills/skills/`:

| Prior skill | Preserve into |
|-------------|---------------|
| compile-3d-prompt | cloud-compile-prompt + water-compile-prompt (split engine language) |
| route-and-estimate | cloud-route-estimate + water-route-estimate |
| preprocess-ref | cloud- + water- preprocess |
| run-3d-job | Split: cloud-t2i + cloud-run-pixal + cloud-run-job; water-generate-3d + water-run-job |
| mesh-post-gate | cloud-mesh-post + water-mesh-post (keep geometric refs) |
| game-ready-bake | cloud-bake + water-bake (keep bake-pipeline refs) |
| score-turntable | cloud-evaluate + water-evaluate (keep comparison/evidence refs) |
| run-experiment | cloud-experiment (Lab) |

Also keep: harness-core references, schemas, `docs/*` contracts, adapters, job-runner, prompt-compiler, img2threejs-extract gates, skills-sh-extract patterns.

## Do not preserve as Create defaults

- Engine-switch wording / `engines: [bluefox, water]` single skill  
- Three.js factory as Cloud generate  
- AI Gateway examples from eve scaffold  
- Firstmate Create runners  
- Character/anim packs  
- Artificial “must stay ≤8” if a split skill earns quality (`cloud-t2i` vs `cloud-run-pixal` does)

## Method

Reference paths; copy individual reference markdown only when Cursor self-containment needs it. Do not duplicate entire trees into this orch pack.
