# Quality vs raw Pixal3D — bench & comparison requirements

**Goal:** Hydrilla Cloud (BlueFox = Pixal3D + harness) must **beat raw Pixal3D** and **look good vs reference** in benches and comparison videos.

Raw Pixal3D = engine / compare path only (see `DECISIONS_LOCKED.md`). Harness adds: BiRefNet admission, compile discipline, mesh-post HARD gates, own bake, evidence, skeptical score, refine caps.

## Definition of “beat raw Pixal”

On the same input fingerprint (prompt/ref/seed policy as bench allows):

| Dimension | Pass condition |
|-----------|----------------|
| Geo integrity | Harness HARD-pass rate ≥ raw; self-intersection / non-manifold escapes → fail harness run (raw may “ship” broken mesh — we must not) |
| Reference look | Comparison sheet + turntable: fidelity / critical features meet quality bar (see below) more often than raw-only export |
| Production handoff | Blender-openable GLB; game_ready maps when profiled; Unity/Unreal smoke — raw Pixal preview is not enough |
| Cost/latency honesty | Estimate gate; no silent double-generate; evidence freshness |

## Quality bar (fold)

Canonical numbers: `/workspace/hydrilla-harness/docs/QUALITY_BAR_IMG2THREEJS.md`

Must ship score path:

1. mesh-post HARD pass  
2. Tier1 (IoU≥0.85, scale≤0.08, aspect≤0.05) with objectness rescue before blind IoU reject on photo-vs-gen  
3. Exactly **one** comparison sheet per `runId`  
4. aiVisionScore ≥0.70 continue; fidelity ≥0.85 quality-complete  
5. Critical features ≤5 each ≥0.80; important avg ≥0.65  
6. VLM never on hard fail; criteria≥0.80; spread≤0.20  
7. Stop: success / repeated defect / plateau <0.02 / ceiling 6 / budget  

## Bench requirements

| Artifact | Requirement |
|----------|-------------|
| Side-by-side stills | Reference | raw Pixal GLB views | harness GLB views |
| Comparison sheet | One sheet per harness run; raw may use parallel sheet labeled `raw_pixal` |
| Turntable video (optional bench) | Same camera path; label engine+runId in filename |
| Metrics JSON | GateReport + ScoreReport + credits/latency |
| Promote | Only harness runs with EvidenceManifest promoteEligible |

Lab: `cloud-experiment` fanout may include raw Pixal adapter as **baseline column**, never as Create default override.

## Cloud language

- Generate = **mesh/GLB from Pixal** after t2i→i2_3d  
- Three.js = turntable/viewer **evidence** only  
- No “BlueFox default override” of user Water pick (Water jobs out of scope here)

## Skeptical evaluator

`cloud-evaluate` must prefer fail when evidence thin. Looking “prettier” than raw without HARD geo + sheet = **not** a win.
