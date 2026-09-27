# Kill list — unwanted prompt / skill elements

Refuse or strip these from skills, cursor prompts, agent instructions, and Lab copy.

| Element | Why killed |
|---------|------------|
| **Animation / rigging** as Create default | v1 = props GLB handoff, not anim |
| **Characters / humanoids / faces-as-core** | Create v1 HARD-REFUSE (`CREATE_V1_SCOPE.md`) |
| **Engine switch** Cloud↔Water inside skills | UI pick immutable |
| **Meshy-as-default-bake** | Own bake worker; Meshy may generate Water mesh only |
| **AI Gateway** | Direct provider keys / Water BYOK only |
| **Comfy runtime** as product Create path | Stage order inspiration only; workers are Hydrilla |
| **Firstmate as Create orch** | Coding-crew distro; eve owns Create GPU DAG |
| **Three.js factory as Cloud default** | Cloud generate = Pixal mesh/GLB; Three.js = evidence viewer/turntable only |
| **BlueFox default override** of user Water pick | Never |
| **Game UI / HUD / world / multiplayer** skills | Out of Create v1 |
| **Godot / game engines as generators** | Out of scope |
| **Invented vercel-labs Create skills** | CLI only; use skills.sh verify keepers |
| **Shared Cloud+Water skill prompts** | Engine-scoped packs only |
| **VLM override of HARD geo fail** | Evaluator must not rescue |
| **Needle as default bake** | Feature flag sidecar only |
| **Raw Pixal as Create default** | Compare/baseline only |
| **chat-as-job-state** | JobCard is total state |

When in doubt: if it is not **generate → gate → GLB ship** (plus evidence), kill it for v1.
