# Paid-sample discipline (Experiment Lab)

**Inspiration only** (openmontage AGPL patterns rewritten). MIT adapter cost tables OK.

## Rules

1. State estimated **$ / credits** before first paid fanout call.
2. **One sample** succeeds mesh-post + score floor before batch N>1.
3. Concurrency default **3**; do not raise without user.
4. Engine immutable — fanout varies adapters **inside** user engine, never Cloud↔Water swap.
5. Drop license-blocked adapters with reason; keep in report.
6. Fire async jobs then await; one child failure does not cancel siblings (fal-regenerate fold).
