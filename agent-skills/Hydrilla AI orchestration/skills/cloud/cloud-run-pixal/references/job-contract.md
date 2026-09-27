# run-3d-job — job contract

## submit payload (mesh.generate)

```ts
{
  kind: "mesh.generate"
  engine: "bluefox" | "water"
  adapter_id: string
  compiled_prompt_ref: string
  ref_image?: string
  profile: "draft" | "balanced" | "quality" | "game_ready"
  estimate_id: string   // must exist
}
```

## await

- Poll/wait via Run API / job runner only.
- **No** model calls to “check if done.”
- Terminal: `succeeded` | `failed` | `cancelled`.

## export

Primary artifact: **`.glb`**. Attach URI + bytes hash via `run.checkpoint` evidenceUris.
