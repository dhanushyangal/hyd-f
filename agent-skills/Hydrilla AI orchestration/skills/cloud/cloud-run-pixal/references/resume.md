# run-3d-job — resume

1. `run.checkpoint` returns `{ card, next }` — sole checklist authority.
2. Resume from last succeeded stage; never invent progress from chat.
3. Correction caps (score path): ≤3 refine/pass, ≤6 total — enforced with gate scripts + checkpoint history.
4. Skip only via `status:"skipped"` + `skipReason`.
