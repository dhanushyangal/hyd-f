"""Hydrilla Maya plugin — built-in Bridge toggle, Clerk sign-in, or API key.

Install:
  1. Place this folder on MAYA_SCRIPT_PATH
  2. import hydrilla_maya; hydrilla_maya.show()
  3. Bridge ON → Sign in → Sync
"""

from __future__ import annotations

import os
import sys
import tempfile
import traceback
import webbrowser

try:
    import maya.cmds as cmds
except ImportError:
    cmds = None

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)
_SHARED = os.path.abspath(os.path.join(_HERE, "..", "shared"))
if os.path.isdir(_SHARED) and _SHARED not in sys.path:
    sys.path.insert(0, _SHARED)

from hydrilla_api import HydrillaApiError, HydrillaClient, make_client  # noqa: E402
from hydrilla_bridge_client import BridgeClient, BridgeError  # noqa: E402
import bridge_server  # noqa: E402

WINDOW = "HydrillaMayaWindow"
DEFAULT_API = "https://api.hydrilla.ai"
DEFAULT_BRIDGE = "http://127.0.0.1:7345"
DEFAULT_SITE = "https://hydrilla.ai"


def _ensure_bridge() -> bool:
    if bridge_server.is_running():
        return True
    result = bridge_server.start_bridge(port=7345)
    if not result.get("ok"):
        _status(str(result.get("error") or "Bridge failed to start"))
        return False
    _status("Bridge ON")
    return True


def bridge_on(*_args) -> None:
    if _ensure_bridge():
        _status("Bridge ON · 127.0.0.1:7345")


def bridge_off(*_args) -> None:
    bridge_server.stop_bridge()
    _status("Bridge OFF")


def _option(key: str, default: str = "") -> str:
    if cmds is None:
        return default
    if not cmds.optionVar(exists=key):
        return default
    return str(cmds.optionVar(q=key) or default)


def _set_option(key: str, value: str) -> None:
    if cmds is None:
        return
    cmds.optionVar(sv=(key, value))


def _status(message: str) -> None:
    if cmds is None:
        print(message)
        return
    if cmds.text("hydrillaStatus", exists=True):
        cmds.text("hydrillaStatus", edit=True, label=message)
    print(f"[Hydrilla] {message}")


def _account(message: str) -> None:
    if cmds is None:
        return
    if cmds.text("hydrillaAccount", exists=True):
        cmds.text("hydrillaAccount", edit=True, label=message)


def _download_glb(client: HydrillaClient, mesh_url: str, stem: str) -> str:
    safe = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in stem)[:48] or "hydrilla"
    dest = os.path.join(tempfile.gettempdir(), f"hydrilla-{safe}.glb")
    return client.download_file(mesh_url, dest)


def _try_import_glb(path: str) -> None:
    if cmds is None:
        raise RuntimeError("Maya cmds unavailable")
    try:
        cmds.file(
            path,
            i=True,
            type="GLTF",
            ignoreVersion=True,
            mergeNamespacesOnClash=False,
            options="v=0;",
            preserveReferences=True,
        )
        _status(f"Imported {path}")
        return
    except Exception:
        pass
    cmds.confirmDialog(
        title="Hydrilla",
        message=f"GLB saved to:\n{path}\n\nImport with your glTF plugin if needed.",
        button=["OK"],
    )
    _status(f"Downloaded {path}")


def _client_from_ui() -> HydrillaClient:
    api_key = cmds.textField("hydrillaApiKey", query=True, text=True).strip()
    api_base = cmds.textField("hydrillaApiBase", query=True, text=True).strip() or DEFAULT_API
    bridge_url = cmds.textField("hydrillaBridgeUrl", query=True, text=True).strip() or DEFAULT_BRIDGE
    _set_option("hydrillaApiKey", api_key)
    _set_option("hydrillaApiBase", api_base)

    clerk_token = None
    try:
        session = BridgeClient(bridge_url).get_auth()
        if session.get("signed_in") and session.get("token"):
            clerk_token = session.get("token")
            _account(session.get("email") or "Signed in with Hydrilla")
    except Exception:
        clerk_token = None

    if clerk_token:
        return make_client(clerk_token=clerk_token, base_url=api_base)
    if api_key:
        _account("Using API key")
        return make_client(api_key=api_key, base_url=api_base)
    raise HydrillaApiError("Sign in with Hydrilla (Sync), or paste an API key")


def sign_in(*_args) -> None:
    site = cmds.textField("hydrillaSiteUrl", query=True, text=True).strip() or DEFAULT_SITE
    if not _ensure_bridge():
        return
    webbrowser.open(f"{site.rstrip('/')}/integrations/connect?app=maya")
    _status("Browser opened — finish sign-in, then Sync")


def sync_account(*_args) -> None:
    if not _ensure_bridge():
        return
    bridge_url = cmds.textField("hydrillaBridgeUrl", query=True, text=True).strip() or DEFAULT_BRIDGE
    try:
        bridge = BridgeClient(bridge_url)
        bridge.register("maya")
        session = bridge.get_auth()
        if session.get("signed_in"):
            _account(session.get("email") or "Signed in")
            _status("Clerk session synced")
            return
        api_key = cmds.textField("hydrillaApiKey", query=True, text=True).strip()
        if api_key:
            _account("Using API key")
            _status("No Clerk session — using API key")
            return
        _account("Not signed in")
        _status("Not signed in — use Sign in, then Sync")
    except Exception as error:
        _status(str(error))


def sign_out(*_args) -> None:
    bridge_url = cmds.textField("hydrillaBridgeUrl", query=True, text=True).strip() or DEFAULT_BRIDGE
    try:
        BridgeClient(bridge_url).clear_auth()
    except Exception:
        pass
    _account("Not signed in")
    _status("Signed out")


def generate_text(*_args) -> None:
    prompt = cmds.textField("hydrillaPrompt", query=True, text=True).strip()
    if not prompt:
        _status("Enter a prompt")
        return
    try:
        client = _client_from_ui()
        _status("Submitting text-to-3d…")
        created = client.text_to_3d(prompt)
        task_id = created.get("id") or created.get("task_id")
        if not task_id:
            raise HydrillaApiError("No task id returned")

        def on_progress(task):
            _status(f"{task.get('status')} {task.get('progress')}%")

        task = client.wait_for_task(task_id, on_progress=on_progress)
        if str(task.get("status") or "").upper() != "SUCCEEDED":
            raise HydrillaApiError(task.get("error") or "Generation failed")
        mesh_url = (task.get("result") or {}).get("mesh_url")
        path = _download_glb(client, mesh_url, str(task_id))
        _try_import_glb(path)
    except Exception as error:
        traceback.print_exc()
        _status(str(error))


def generate_image(*_args) -> None:
    image_url = cmds.textField("hydrillaImageUrl", query=True, text=True).strip()
    if not image_url:
        _status("Enter an image URL")
        return
    try:
        client = _client_from_ui()
        _status("Submitting image-to-3d…")
        created = client.image_to_3d_url(image_url)
        task_id = created.get("id") or created.get("task_id")

        def on_progress(task):
            _status(f"{task.get('status')} {task.get('progress')}%")

        task = client.wait_for_task(task_id, on_progress=on_progress)
        if str(task.get("status") or "").upper() != "SUCCEEDED":
            raise HydrillaApiError(task.get("error") or "Generation failed")
        mesh_url = (task.get("result") or {}).get("mesh_url")
        path = _download_glb(client, mesh_url, str(task_id))
        _try_import_glb(path)
    except Exception as error:
        traceback.print_exc()
        _status(str(error))


def poll_bridge(*_args) -> None:
    if not _ensure_bridge():
        return
    bridge_url = cmds.textField("hydrillaBridgeUrl", query=True, text=True).strip() or DEFAULT_BRIDGE
    bridge = BridgeClient(bridge_url)
    try:
        bridge.register("maya")
        items = bridge.pending("maya") or bridge.pending()
        if not items:
            _status("Bridge idle")
            return
        item = items[0]
        file_path = item.get("file_path")
        if file_path and os.path.exists(str(file_path)):
            path = str(file_path)
        else:
            client = _client_from_ui()
            path = _download_glb(
                client,
                item["mesh_url"],
                str(item.get("name") or item.get("id")),
            )
        _try_import_glb(path)
        bridge.ack(str(item["id"]))
        _status(f"Bridge imported {item.get('name')}")
    except BridgeError as error:
        _status(str(error))
    except Exception as error:
        traceback.print_exc()
        _status(str(error))


def check_bridge(*_args) -> None:
    bridge_url = cmds.textField("hydrillaBridgeUrl", query=True, text=True).strip() or DEFAULT_BRIDGE
    bridge = BridgeClient(bridge_url)
    try:
        health = bridge.health()
        bridge.register("maya")
        auth = health.get("auth") or {}
        if auth.get("signed_in"):
            _account(auth.get("email") or "Signed in")
        _status(f"Bridge ok · pending {health.get('pending', 0)}")
    except Exception as error:
        _status(str(error))


def show() -> None:
    if cmds is None:
        raise RuntimeError("Run inside Maya")
    if cmds.window(WINDOW, exists=True):
        cmds.deleteUI(WINDOW)
    cmds.window(WINDOW, title="Hydrilla", widthHeight=(440, 500))
    cmds.columnLayout(adjustableColumn=True, rowSpacing=6, columnAttach=("both", 12))
    cmds.text(label="Hydrilla", align="left", font="boldLabelFont", height=24)
    cmds.text(label="Bridge (built-in)", align="left")
    cmds.rowLayout(numberOfColumns=2, adjustableColumn=1, columnAttach=[(1, "both", 0), (2, "both", 4)])
    cmds.button(label="Bridge ON", command=bridge_on, backgroundColor=(0.15, 0.45, 0.25))
    cmds.button(label="Bridge OFF", command=bridge_off)
    cmds.setParent("..")
    cmds.text("hydrillaAccount", label="Not signed in", align="left")
    cmds.rowLayout(numberOfColumns=3, adjustableColumn=1, columnAttach=[(1, "both", 0), (2, "both", 2), (3, "both", 2)])
    cmds.button(label="Sign in", command=sign_in, backgroundColor=(0.12, 0.12, 0.12))
    cmds.button(label="Sync", command=sync_account)
    cmds.button(label="Sign out", command=sign_out)
    cmds.setParent("..")
    cmds.textField("hydrillaSiteUrl", text=_option("hydrillaSiteUrl", DEFAULT_SITE), placeholderText="Site URL")
    cmds.textField(
        "hydrillaApiKey",
        text=_option("hydrillaApiKey"),
        placeholderText="API key optional (hyd_live_…)",
    )
    cmds.textField("hydrillaApiBase", text=_option("hydrillaApiBase", DEFAULT_API))
    cmds.separator(height=10, style="in")
    cmds.textField("hydrillaPrompt", placeholderText="Text prompt")
    cmds.button(label="Generate from Text", command=generate_text, height=28)
    cmds.textField("hydrillaImageUrl", placeholderText="https://…/image.png")
    cmds.button(label="Generate from Image URL", command=generate_image)
    cmds.separator(height=10, style="in")
    cmds.textField("hydrillaBridgeUrl", text=DEFAULT_BRIDGE)
    cmds.button(label="Import from Studio", command=poll_bridge)
    cmds.text("hydrillaStatus", label="Ready — turn Bridge ON first", align="left")
    cmds.showWindow(WINDOW)


if __name__ == "__main__":
    show()
