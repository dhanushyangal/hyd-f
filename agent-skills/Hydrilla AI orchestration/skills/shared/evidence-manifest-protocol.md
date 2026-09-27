# EvidenceManifest protocol helper

**Canonical:** `/workspace/hydrilla-harness/docs/EVIDENCE_MANIFEST.md`

## Promote rule

Promote is illegal without fresh, complete manifest for the same `runId`. Checker = coverage + freshness + non-stub bytes — not artistic vibes.

## Score skills

`cloud-evaluate` / `water-evaluate` must call `asset.score` which runs evidence check before VLM and before promote.

## Captures

turntable views, gate_report, exactly one comparison_sheet, glb, bake_maps/bake_qa when game_ready, admission when preprocess ran.
