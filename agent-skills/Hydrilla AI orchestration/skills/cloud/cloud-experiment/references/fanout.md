> Skill `run-experiment` may call only `experiment.fanout` + `run.checkpoint`.

# run-experiment — fanout

Ben lock: **one** batch `run.route` for the candidate set (shared compile), then per-adapter submit. Default concurrency **3**.

```ts
// After shared prompt.compile + single run.route(candidates) + run.estimate(total)
experiment.fanout({
  compiled_prompt_ref: string
  estimate_id: string
  route_plan_id: string  // from the single batch run.route
  adapters: { adapter_id: string; engine: "bluefox" | "water" }[]
  concurrency: number  // default 3; do not raise without user
})
```

- Pre-drop adapters with `license_tags` / region blocks; record `drop_reason`.
- Each child job: `job.submit` → `job.await` → export GLB → post-gate → score (profile promote floors).
- Rank by ScoreReport; promote single winner only if ≥ profile floor and mesh-post HARD pass.
- Resume: fanout is durable; completed children not re-run.

## Retopo A/B (folds here — no new skill)

Compare remesh/retopo providers under the same compiled intent + mesh-post bar:

- Candidates may include: AutoRemesher (local), Tripo Smart Mesh, PolyGen, Meshy remesh (BYOK).
- Same fanout concurrency default **3**; same promote floors; never promote hard-mesh fail.
- Motion/animation providers are **out of scope** — do not add anim skills or anim legs to fanout.
