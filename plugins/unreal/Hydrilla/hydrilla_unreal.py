"""Hydrilla helpers for Unreal Editor Python.

Enable Edit → Plugins → Python Editor Script Plugin, then:
  import hydrilla_unreal
  hydrilla_unreal.set_api_key("hyd_live_…")
  hydrilla_unreal.generate_text("a sci-fi crate")
  hydrilla_unreal.poll_bridge()
"""

from __future__ import annotations

import os
import sys
import tempfile

_HERE = os.path.dirname(os.path.abspath(__file__))
_SHARED = os.path.abspath(os.path.join(_HERE, "..", "..", "shared"))
if _SHARED not in sys.path and os.path.isdir(_SHARED):
    sys.path.insert(0, _SHARED)
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

# When packaged as a zip, shared modules are copied next to this file.
_LOCAL_SHARED = os.path.join(_HERE, "shared")
if os.path.isdir(_LOCAL_SHARED) and _LOCAL_SHARED not in sys.path:
    sys.path.insert(0, _LOCAL_SHARED)

from hydrilla_api import HydrillaApiError, HydrillaClient
from hydrilla_bridge_client import BridgeClient

try:
    import unreal
except ImportError:
    unreal = None

_STATE = {
    "api_key": "",
    "api_base": "https://hydrilla-backend.vercel.app",
    "bridge_url": "http://127.0.0.1:7345",
}


def set_api_key(key: str) -> None:
    _STATE["api_key"] = key


def _content_dir() -> str:
    if unreal is not None:
        return unreal.Paths.project_content_dir()
    return tempfile.gettempdir()


def _download(client: HydrillaClient, mesh_url: str, stem: str) -> str:
    folder = os.path.join(_content_dir(), "Hydrilla")
    os.makedirs(folder, exist_ok=True)
    safe = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in stem)[:48] or "hydrilla"
    dest = os.path.join(folder, f"{safe}.glb")
    return client.download_file(mesh_url, dest)


def generate_text(prompt: str) -> str:
    client = HydrillaClient(_STATE["api_key"], _STATE["api_base"])
    created = client.text_to_3d(prompt)
    task_id = created.get("id")
    task = client.wait_for_task(task_id)
    if str(task.get("status") or "").upper() != "SUCCEEDED":
        raise HydrillaApiError(task.get("error") or "failed")
    path = _download(client, (task.get("result") or {})["mesh_url"], str(task_id))
    if unreal is not None:
        unreal.log(f"Hydrilla saved GLB to {path}. Import with your glTF importer.")
    return path


def generate_image(image_url: str) -> str:
    client = HydrillaClient(_STATE["api_key"], _STATE["api_base"])
    created = client.image_to_3d_url(image_url)
    task_id = created.get("id")
    task = client.wait_for_task(task_id)
    if str(task.get("status") or "").upper() != "SUCCEEDED":
        raise HydrillaApiError(task.get("error") or "failed")
    return _download(client, (task.get("result") or {})["mesh_url"], str(task_id))


def poll_bridge() -> str | None:
    bridge = BridgeClient(_STATE["bridge_url"])
    bridge.register("unreal")
    items = bridge.pending("unreal") or bridge.pending()
    if not items:
        if unreal is not None:
            unreal.log("Hydrilla Bridge idle")
        return None
    item = items[0]
    file_path = item.get("file_path")
    if file_path and os.path.exists(str(file_path)):
        path = str(file_path)
    else:
        client = HydrillaClient(_STATE["api_key"] or "bridge", _STATE["api_base"])
        path = _download(client, item["mesh_url"], str(item.get("name") or item["id"]))
    bridge.ack(str(item["id"]))
    return path
