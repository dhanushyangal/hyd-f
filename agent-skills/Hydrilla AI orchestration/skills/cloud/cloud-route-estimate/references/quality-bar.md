# route-and-estimate — quality bar

Source: [docs/QUALITY_BAR_IMG2THREEJS.md](../../../../docs/QUALITY_BAR_IMG2THREEJS.md) (Gwen). From `pipeline_routing.py`: **confidence ≥ 0.82**.

## Hard gates (encode)

| Gate | Threshold / rule |
|------|------------------|
| route confidence | **≥ 0.82** else `request-input`; **no job** |
| **estimate before submit** | `run.estimate` must succeed and be accepted **before** any `job.submit` |
| missing CompiledPrompt | stop |
| estimate over budget / credits fail | stop; show estimate |
| license-blocked adapter | drop with reason; fallback or refuse |

Never call `job.submit` from this skill. Default engine **BlueFox only when unset** (API/tests) — never override UI/API pick.
