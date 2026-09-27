# Class face_limit / tris defaults (Create v1)

Inside immutable user engine. Used by route-and-estimate inject and Tripo/Meshy face_limit when BYOK.

| Class / role | Draft tris (post-remesh) | Balanced | Quality / pre-bake | game_ready after bake |
|--------------|--------------------------|----------|--------------------|------------------------|
| Prop mid / scatter | ~8-12k | ~10-16k | ~16-25k | ~8-12k |
| Prop hero | ~12-18k | ~16-24k | ~24-40k | ~10-20k |
| Car mid | ~10-16k | ~14-22k | ~22-35k | ~10-18k |
| Car hero | ~16-24k | ~20-30k | ~30-50k then bake | ~12-20k |

Notes:
- Draft path stays local AutoRemesher toward ~10-30k early.
- BYOK face_limit (esp. Tripo P1) must not exceed quality column without estimate.
- Scatter never uses hero budgets.
