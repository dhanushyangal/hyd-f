# Paid-call discipline (Hydrilla)

**License:** inspired by openmontage paid-call pattern (AGPL — rewrite only). Numbers are placeholders; confirm live provider pages before quoting.

## Before first paid provider call

1. Name provider + **pinned** `model_version` (no silent `latest` on batches).
2. Name operation (text_to_3d / image_to_3d / remesh escalate).
3. State estimated unit cost + number of outputs.
4. Gate on `run.estimate` ok.

## Batch rule

Generate **one sample** and score/gate it before fanout (`run-experiment`). Cap concurrency (default 3).

## Pin versions

Water adapters: pin Meshy `meshy-5`/`meshy-6`, Tripo exact `model_version` string, fal endpoint id. Re-check changelog when costs drift.
