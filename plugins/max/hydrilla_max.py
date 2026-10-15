"""Hydrilla for 3ds Max (Python).

Run from Max Python listener after placing this file + shared hydrilla_*.py on sys.path:
  import hydrilla_max; hydrilla_max.show()
"""

from __future__ import annotations

import os
import sys
import tempfile
import traceback

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)
_SHARED = os.path.abspath(os.path.join(_HERE, "..", "shared"))
if os.path.isdir(_SHARED) and _SHARED not in sys.path:
    sys.path.insert(0, _SHARED)

from hydrilla_api import HydrillaApiError, HydrillaClient
from hydrilla_bridge_client import BridgeClient

try:
    from pymxs import runtime as rt
except ImportError:
    rt = None

DEFAULT_API = "https://hydrilla-backend.vercel.app"
DEFAULT_BRIDGE = "http://127.0.0.1:7345"
_STATE = {
    "api_key": "",
    "api_base": DEFAULT_API,
    "bridge_url": DEFAULT_BRIDGE,
    "prompt": "",
    "image_url": "",
}


def _download(client: HydrillaClient, mesh_url: str, stem: str) -> str:
    safe = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in stem)[:48] or "hydrilla"
    dest = os.path.join(tempfile.gettempdir(), f"hydrilla-{safe}.glb")
    return client.download_file(mesh_url, dest)


def _import_glb(path: str) -> None:
    if rt is None:
        print(f"[Hydrilla] Saved GLB to {path}")
        return
    try:
        rt.importFile(path, rt.Name("noPrompt"))
        print(f"[Hydrilla] Imported {path}")
    except Exception:
        print(f"[Hydrilla] Could not auto-import. File saved at: {path}")


def generate_text(prompt: str | None = None) -> None:
    prompt = (prompt or _STATE["prompt"]).strip()
    api_key = _STATE["api_key"].strip()
    if not prompt or not api_key:
        raise HydrillaApiError("prompt and api_key required")
    client = HydrillaClient(api_key, _STATE["api_base"])
    created = client.text_to_3d(prompt)
    task_id = created.get("id")
    task = client.wait_for_task(task_id, on_progress=lambda t: print(t.get("status"), t.get("progress")))
    if str(task.get("status") or "").upper() != "SUCCEEDED":
        raise HydrillaApiError(task.get("error") or "failed")
    path = _download(client, (task.get("result") or {})["mesh_url"], str(task_id))
    _import_glb(path)


def generate_image(image_url: str | None = None) -> None:
    image_url = (image_url or _STATE["image_url"]).strip()
    api_key = _STATE["api_key"].strip()
    if not image_url or not api_key:
        raise HydrillaApiError("image_url and api_key required")
    client = HydrillaClient(api_key, _STATE["api_base"])
    created = client.image_to_3d_url(image_url)
    task_id = created.get("id")
    task = client.wait_for_task(task_id)
    if str(task.get("status") or "").upper() != "SUCCEEDED":
        raise HydrillaApiError(task.get("error") or "failed")
    path = _download(client, (task.get("result") or {})["mesh_url"], str(task_id))
    _import_glb(path)


def poll_bridge() -> None:
    bridge = BridgeClient(_STATE["bridge_url"])
    bridge.register("3dsmax")
    items = bridge.pending("3dsmax") or bridge.pending()
    if not items:
        print("[Hydrilla] Bridge idle")
        return
    item = items[0]
    file_path = item.get("file_path")
    if file_path and os.path.exists(str(file_path)):
        path = str(file_path)
    else:
        client = HydrillaClient(_STATE["api_key"] or "bridge", _STATE["api_base"])
        path = _download(client, item["mesh_url"], str(item.get("name") or item["id"]))
    _import_glb(path)
    bridge.ack(str(item["id"]))


def show() -> None:
    """Simple Max dialog using pymxs if available; otherwise print usage."""
    if rt is None:
        print("Set hydrilla_max._STATE['api_key'] then call generate_text('a red chair')")
        return
    try:
        rollout = rt.NewRollout("hydrillaRollout", "Hydrilla", 0, 0, 360, 220)
        # Prefer scripted usage when UI macros differ across Max versions.
        print("[Hydrilla] Use hydrilla_max._STATE and generate_text() / poll_bridge()")
        print("[Hydrilla] Example: hydrilla_max._STATE['api_key']='hyd_live_…'; hydrilla_max.generate_text('robot')")
    except Exception:
        traceback.print_exc()
        print("[Hydrilla] UI unavailable — use generate_text() / poll_bridge() from listener")


if __name__ == "__main__":
    show()
