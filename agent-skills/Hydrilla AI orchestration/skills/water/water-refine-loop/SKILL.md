---
name: water-refine-loop
description: >-
  Water refine controller: max iters, plateau stop, VLM never overrides HARD
  fail. Must not escape to Cloud mid-job.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: water
  token_class: router
compatibility: JobCard correction caps; Water agent only.
---

# water-refine-loop

Caps: ≤3/pass, ≤6 total, Δ<0.02 plateau. Re-enter Water generate/post/score only. **No** “try BlueFox instead” — that would be an engine switch (killed).
