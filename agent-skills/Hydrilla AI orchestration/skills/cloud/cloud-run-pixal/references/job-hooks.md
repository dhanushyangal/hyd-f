# run-3d-job — job card hooks (Track 2 stubs OK)

Steve lock: **`run.checkpoint`** replaces `run.next` + `run.mark` ([`docs/TOOL_SURFACE.md`](../../../../../docs/TOOL_SURFACE.md)).

## `run.checkpoint`

```ts
{ jobId, step, status: "succeeded"|"failed"|"skipped",
  evidenceUris?, skipReason?, runId? }
→ { card, next }
```

- Silent skip forbidden — `status:"skipped"` requires `skipReason`
- Crash resume = read job card from last checkpoint, not chat memory
- Job card: [`docs/JOB_CARD.md`](../../../../../docs/JOB_CARD.md)
Evidence manifest: [`docs/EVIDENCE_MANIFEST.md`](../../../../../docs/EVIDENCE_MANIFEST.md)

Schema fill lands with Steve/Ben — this file stays a stub until then.
