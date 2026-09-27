# System integration — orch ↔ existing harness

**Do not duplicate** trees already under `/workspace/hydrilla-harness/`. This pack is the orchestration SoT + Cursor prompts; prior engineering stays canonical where linked.

| Concern | Canonical location | This pack |
|---------|-------------------|-----------|
| Prior Max 8 skill bodies v0.2.3 | `hydrilla-harness/packages/agent-skills/skills/*` | Split/rename into `skills/cloud/*` + `skills/water/*` drafts |
| Tool surface (12 IDs) | `docs/TOOL_SURFACE.md` | Reference; extend worker notes for explicit `cloud-t2i` |
| JobCard / Evidence | `docs/JOB_CARD.md`, `EVIDENCE_MANIFEST.md` | contracts/ pointers |
| Product laws | `PRODUCT_ENG_PLAN_NEW_CREATE.md`, `CREATE_V1_SCOPE.md` | **Override:** ≤8 cap lifted; Cloud≠Water skill packs |
| Quality bar | `QUALITY_BAR_IMG2THREEJS.md` | `IMG2THREEJS_DELTA.md` |
| Placement map | `SKILL_PLACEMENT_MAP.md` | Update via Cursor prompt 06 |
| Orchestrator | eve (locked) | `ORCHESTRATOR_DECISION.md` |
| Firstmate | coding crew only | Not Create runtime |

## eve layout

```text
agent/
  skills/cloud/*     # Create Cloud agent only
  skills/water/*     # Create Water agent only
  tools/             # 12 Run API tool bindings
  hooks/             # park on job.await; wake on webhook
```

Two `defineAgent` entries (or one agent with hard engine gate that loads only one skill root). Prefer **two agents** so skill discovery cannot cross-contaminate.

## Migration from shared-8

1. Keep v0.2.3 bodies as source.
2. Fork into Cloud-prefixed and Water-prefixed SKILL.md with engine-specific generate sections only.
3. Promote t2i from “worker note” to `cloud-t2i` skill (earned).
4. Rename score-turntable → `*-evaluate` (generator≠evaluator naming).
5. Do not delete old folders until Cursor migrates symlinks — preserve prior work.
