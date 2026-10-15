# Hydrilla DCC integrations

Source for Blender, Maya, 3ds Max, Unity, Unreal, Godot plugins, and MCP server.

The Bridge runs **inside** each plugin (Bridge ON / OFF). There is no separate Bridge download.

## Pack downloads

```bash
./pack.sh
# writes plugin zips to ../public/plugins/
```

## Clerk sign-in

1. Install a plugin and turn **Bridge ON**.
2. Click **Sign in** → finish login at `/integrations/connect`.
3. Click **Sync**.
4. Generate uses Studio routes (`/api/3d/*`). API keys still work as a fallback.

Studio **Send to DCC** needs Bridge ON in the plugin.

## API contract

- `Authorization: Bearer …` (Clerk session or `hyd_live_` key)
- `POST /v1/3d/text-to-3d` or `/api/3d/…` for Clerk
- Poll until success, then import GLB
