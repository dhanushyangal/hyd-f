# score-turntable — evidence manifest

**Authoritative schema:** [`docs/EVIDENCE_MANIFEST.md`](../../../../../docs/EVIDENCE_MANIFEST.md) (Steve rev3).
**Job card:** [`docs/JOB_CARD.md`](../../../../../docs/JOB_CARD.md) · tools: [`docs/TOOL_SURFACE.md`](../../../../../docs/TOOL_SURFACE.md).

## Promote hard gate

`asset.score` must:

1. Load/create `EvidenceManifest` for `card.runId`
2. `checkEvidence(manifest)` (not a 13th tool — inside score)
3. If `!promoteEligible` → reject, **no VLM**
4. Else heuristics → optional VLM → profile floors
5. Promote only if `promoteEligible && floorsPass`
6. `run.checkpoint({ step:"score", ... })`

Upstream game format notes: [evidence-manifest-upstream.md](./evidence-manifest-upstream.md) (MIT © Majid Manzarpour 2026).
