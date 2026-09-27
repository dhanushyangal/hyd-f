# Hydrilla Water

Hydrilla Cloud is a GPU mesh product. Water is the BYOK agent engine that turns a brief into a controllable Three.js asset and scene. This glossary is for Water.

## Language

**Water Job**:
A `jobs` row with `engine = water` and id `wt_*`. The library listing. Cloud jobs are not Water Jobs.
_Avoid_: CodeSculpt job, GPU job

**Quality Tier**:
The user’s Fast, Standard, or Studio lock on how many Asset passes run.
_Avoid_: profile (that is the Create profile mapped from the tier), skill chip

**Asset Factory**:
The `createModel()` TypeScript module that builds one object. Stored on `water_assets` (cached on `jobs.factory_code`).
_Avoid_: the project, Scene IR, the chat transcript

**Scene IR**:
Authoritative layout: camera, lights, instances, transforms. Stored on `water_scenes` / `water_scene_nodes`.
_Avoid_: factory source, chat history

**JobCard**:
Total generate-run state (stages, outcome, evidence). Chat is never JobCard.
_Avoid_: conversation, session log

**Director**:
Hidden Water coordinator that classifies follow-ups (new asset vs refine vs scene edit vs QA). Not shown in the UI.
_Avoid_: eve agent, Cloud orchestrator

**Cloud**:
Hydrilla GPU generate (`/api/3d/*`, credits, Trellis GLB). Not an agent product.
_Avoid_: Water, Create Cloud eve
