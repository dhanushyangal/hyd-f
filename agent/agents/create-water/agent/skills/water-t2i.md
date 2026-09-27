---
description: >-
  Load only on Water when a deferred mesh-mode adapter needs a reference image and the
  user supplied text alone. Skip it whenever the user gave an admitted image or the path
  accepts text directly. Not used at all on the shipped threejs mode.
---

# water-t2i

Optional, Water-owned, and inert on the shipped `threejs` mode — the factory path needs
no reference plate.

## When

`waterMode = mesh` (deferred) **and** the selected adapter requires an image **and** the
user gave text only. Otherwise skip with a `skipReason`.

## Tools

1. `job.submit` with `kind: "t2i"` — a Water-side worker behind the frozen surface.
2. `job.await` — park while it runs.
3. `run.checkpoint` — only if `water-t2i` exists as a stage on the card.

## Rules

- Prompt for a single object, clear silhouette, neutral studio lighting. No mesh or
  topology jargon in an image prompt.
- Output feeds `water-preprocess-ref`.
- This is **not** interchangeable with any Cloud t2i skill and must not be described as
  one.
- Fail closed: a worker error never becomes a silent jump to generate.
