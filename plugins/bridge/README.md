# Hydrilla Bridge

Local daemon that lets Studio send meshes into DCC apps with one click.

```bash
python3 hydrilla_bridge.py
# http://127.0.0.1:7345
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness + connected clients |
| POST | `/register` | `{ "app": "blender" }` |
| POST | `/import` | `{ "mesh_url", "name?", "target?", "job_id?" }` |
| GET | `/pending?app=blender` | Queue for a DCC |
| POST | `/ack` | `{ "id" }` after successful import |

CORS is open for localhost Studio pages.
