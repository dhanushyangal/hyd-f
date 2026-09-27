# vercel-labs/skills — CLI only (find-skills)

## What it is

`vercel-labs/skills` is the **skills CLI** (`find-skills` / install UX) for discovering skills in the ecosystem. It is **not** a library of Hydrilla Create skills.

## What we already mined

Keepers and fold decisions live in the skills.sh ecosystem scrape already on disk:

| Path | Role |
|------|------|
| `/workspace/hydrilla-harness/docs/SKILLS_SH_SCRAPE.md` | Scrape log |
| `/workspace/hydrilla-harness/docs/SKILLS_SH_VERIFY.md` | Fold/skip verdicts |
| `/workspace/hydrilla-harness/docs/SKILLS_SH_LICENSE.md` | License notes |
| `/workspace/hydrilla-harness/data/skills-sh-extract/` | Extracted keepers (fal-3d, meshy, tripo, inspect-glb, …) |
| `/workspace/hydrilla-harness/data/skills-sh-src/` | Source mirrors |

## Rules for this orch pack

1. **Do not invent fake skills** from an empty or CLI-only vercel-labs/skills repo.  
2. **Do not** add Create skill IDs named after CLI commands (`find-skills`, etc.).  
3. Patterns (Meshy lifecycle, fal async adapter, inspect-glb checks) fold into **Water/Cloud workers + existing skill refs** per `SKILLS_SH_VERIFY.md`.  
4. New skill IDs in this pack must **earn quality** (own a generate step or fail-closed gate) — see Cloud/Water pack lists.

## Cursor note

If an agent proposes “install vercel-labs skills as Create pack,” redirect to harness verify docs and engine-scoped SKILL.md drafts here.
