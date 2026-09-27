---
name: water-preprocess-ref
description: >-
  Use on Water when an image ref needs BiRefNet admission before BYOK
  image→3D. Skip with reason on text-only Water paths. Not Cloud t2i worker.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: water
  token_class: judge
compatibility: image.rembg; Water agent only.
---

# water-preprocess-ref

## When to use

Image present and adapter wants cleaned ref. Text-only → skipReason.

## Admission

Same floors as Cloud (fg 5–97%, etc.). Fail-closed before paid BYOK submit.
