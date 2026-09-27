---
name: cloud-route-estimate
description: >-
  Use after Cloud compile to estimate credits and pick profile/adapter inside
  Cloud only. Sets needs_t2i for the locked text→image → image→3D pipeline.
  Never routes to Water or switches engines.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: cloud
  token_class: router
compatibility: run.estimate, run.route; eve Create Cloud agent only.
---

# cloud-route-estimate

## When to use

Immediately after `cloud-compile-prompt` succeeds.

## Tool sequence

1. `run.estimate` — hard gate; `ok:false` → stop  
2. `run.route` with `engine: "bluefox"` — **echo only**; confidence ≥0.82 fail-closed  
3. `run.checkpoint` — mark `estimate` / `route`

## Rules

- Adapter/profile selection **inside Cloud** (Pixal/BlueFox path) only.  
- Default Cloud pipeline expects `needs_t2i=true` when input is text-only; image inputs may set `needs_t2i=false` with skipReason later.  
- Never emit Water adapter IDs.  
- Never “fallback to Meshy” from this skill.

## Unwanted

Engine switch, AI Gateway, BlueFox override of a Water session (this skill must not run on Water agents).

## Engine lock

Operate **inside Cloud only**. Never emit or switch to Water. Default BlueFox adapter only when engine field unset (API/tests).

## Prior pack references (v0.2.3)

- [class-poly-budgets.md](./references/class-poly-budgets.md)
- [routing.md](./references/routing.md)
- [paid-call-discipline.md](./references/paid-call-discipline.md)
