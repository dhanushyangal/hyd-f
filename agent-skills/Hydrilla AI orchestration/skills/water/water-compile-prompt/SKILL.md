---
name: water-compile-prompt
description: >-
  Use when a Water (BYOK) Create job needs a CompiledPrompt / provider brief from
  text and/or refs. Props/hard-surface only. Do not copy Cloud Pixal t2i→i2_3d
  prompt templates. Not for characters or Cloud generate.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: water
  token_class: router
compatibility: prompt.compile; eve Create Water agent only.
---

# water-compile-prompt

## When to use

First step on every **Water** create path.

## Rules

- Create v1 props/hard-surface Car-class; **HARD-REFUSE characters**.  
- Provider-aware brief: separate geo vs texture intent when Meshy-like refine applies.  
- `result_kind=glb` default.  
- **Do not** embed Cloud locked pipeline language (mandatory Pixal t2i→i2_3d). Water adapters may accept text→3D or image→3D per route.  
- Engine never chosen here — session `engine=water`.

## Tool sequence

`prompt.compile` → `run.checkpoint` (compile)

## References

Mine structure from harness `compile-3d-prompt` but strip BlueFox/Pixal-only injects; keep prop rubrics.
