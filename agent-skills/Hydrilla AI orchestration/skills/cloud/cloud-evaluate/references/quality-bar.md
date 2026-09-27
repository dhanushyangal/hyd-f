# score-turntable — quality bar

Source: [docs/QUALITY_BAR_IMG2THREEJS.md](../../../../docs/QUALITY_BAR_IMG2THREEJS.md) (Gwen). Scripts: `make_comparison_sheet`, `correction_loop`, `vlm_gate`, `feature_acceptance_policy`, Tier1 / objectness.

## All required to ship

1. **mesh-post HARD pass** first (VLM **never** overrides hard fail).
2. **Exactly one** comparison sheet per judge pass.
3. **Tier1:** IoU **≥ 0.85**, scale **≤ 0.08**, aspect **≤ 0.05** (objectness rescue before blind IoU reject on photo-vs-gen).
4. **Feature policy:** critical features **≤ 5** each **≥ 0.80**; important avg **≥ 0.65**.
5. **VLM:** criteria **≥ 0.80**; spread **≤ 0.20**; multi-sample; only after heuristics / near threshold.
6. **correction_loop stop:** success | repeated defect | plateau **< 0.02** | ceiling **6** | budget. Cap **3 refine/pass**.

## Promote floors (Ben lock 2026-09-05)

| Profile | Promote floor |
|---------|---------------|
| `draft` | **continue ≥ 0.70** |
| `balanced` | **complete ≥ 0.80** |
| `quality` / `game_ready` | **complete ≥ 0.85** **+** feature policy |

Hard-mesh fail → reject (never promote).
