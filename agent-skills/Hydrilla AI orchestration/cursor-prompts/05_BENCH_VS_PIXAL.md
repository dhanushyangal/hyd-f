# Cursor prompt — Bench vs raw Pixal3D

## Task

Extend `packages/bench` (or Lab `cloud-experiment`) to compare:

| Column | Source |
|--------|--------|
| Reference | input image / render |
| Raw Pixal | engine-only export |
| Harness Cloud | full t2i→i2_3d→gates→score |

## Artifacts

- Comparison sheets + optional turntable videos  
- GateReport + ScoreReport + latency/credits JSON  
- Pass = harness beats raw on geo integrity + look-good vs reference per `docs/QUALITY_VS_PIXAL.md`

Raw Pixal is baseline — never Create default.
