# Cursor prompt — Setup eve Create Water agent

## Task

Scaffold **eve-create-water** agent separate from Cloud:

1. Instructions: engine=water immutable; BYOK generate; own bake; HARD-REFUSE characters; no Pixal.
2. Skills from `skills/water/*/SKILL.md` only — **do not copy** cloud-t2i / cloud-run-pixal bodies.
3. Same Run API tool IDs; adapters behind `job.submit` are Water.
4. Optional `water-threejs-preview` — **do not add** unless product explicitly needs it; never onto Cloud agent.
5. Park/resume same JobCard pattern.

## Acceptance

- No Cloud Pixal skill prompts loaded.
- Refine loop cannot escape to BlueFox.
- Meshy never owns bake.
