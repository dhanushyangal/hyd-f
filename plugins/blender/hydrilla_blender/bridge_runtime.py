"""Embedded Hydrilla Bridge — Meshy-style Start/Stop + modal import queue."""

from __future__ import annotations

import base64
import json
import os
import socketserver
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler
from queue import Empty, Queue
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

import bpy
from bpy.props import BoolProperty
from bpy.types import Operator, PropertyGroup

BRIDGE_PORT = 7345
MAX_UPLOAD_BYTES = 80 * 1024 * 1024

_server_stop = False
_server_thread: Optional[threading.Thread] = None
_import_queue: "Queue[Dict[str, Any]]" = Queue()
_auth: Dict[str, Any] = {}
_auth_lock = threading.Lock()
_pending: list = []
_pending_lock = threading.Lock()


def _auth_public() -> Dict[str, Any]:
    if not _auth.get("token"):
        return {"signed_in": False}
    return {
        "signed_in": True,
        "email": _auth.get("email"),
        "user_id": _auth.get("user_id"),
        "updated_at": _auth.get("updated_at"),
    }


def get_auth_session() -> Dict[str, Any]:
    with _auth_lock:
        if not _auth.get("token"):
            return {"signed_in": False}
        return {
            "signed_in": True,
            "token": _auth.get("token"),
            "email": _auth.get("email"),
            "user_id": _auth.get("user_id"),
            "expires_at": _auth.get("expires_at"),
            "updated_at": _auth.get("updated_at"),
        }


def clear_auth() -> None:
    with _auth_lock:
        _auth.clear()


def pop_pending(app: Optional[str] = None) -> list:
    with _pending_lock:
        if not app:
            items = list(_pending)
            return items
        return [
            item
            for item in _pending
            if item.get("target") in {None, "any", app}
        ]


def ack_pending(item_id: str) -> bool:
    with _pending_lock:
        for index, item in enumerate(_pending):
            if item.get("id") == item_id:
                _pending.pop(index)
                return True
    return False


class HydrillaBridgeProps(PropertyGroup):
    bridge_running: BoolProperty(name="Bridge Running", default=False)


class HydrillaHTTPServer(socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


class HydrillaBridgeHandler(BaseHTTPRequestHandler):
    server_version = "HydrillaBridge/1.2"

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _cors(self) -> None:
        origin = self.headers.get("Origin", "") or "*"
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Max-Age", "86400")

    def _json(self, status: int, payload: Dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if status != 204:
            self.wfile.write(body)

    def _read_json(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0:
            return {}
        chunks = []
        remaining = length
        while remaining > 0:
            chunk = self.rfile.read(min(remaining, 65536))
            if not chunk:
                break
            chunks.append(chunk)
            remaining -= len(chunk)
        raw = b"".join(chunks).decode("utf-8")
        data = json.loads(raw) if raw else {}
        if not isinstance(data, dict):
            raise ValueError("JSON body must be an object")
        return data

    def do_OPTIONS(self) -> None:
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in {"/health", "/status", "/ping"}:
            with _pending_lock:
                pending = len(_pending)
            with _auth_lock:
                auth = _auth_public()
            self._json(
                200,
                {
                    "ok": True,
                    "status": "ok",
                    "service": "hydrilla-bridge",
                    "embedded": True,
                    "dcc": "blender",
                    "pending": pending,
                    "auth": auth,
                },
            )
            return

        if parsed.path == "/auth/session":
            # Always 200 so clients do not treat "not signed in" as Bridge failure
            self._json(200, get_auth_session())
            return

        if parsed.path == "/pending":
            query = parse_qs(parsed.query)
            app = (query.get("app") or [None])[0]
            self._json(200, {"items": pop_pending(app)})
            return

        self._json(404, {"error": "not_found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            payload = self._read_json()
        except Exception as error:
            self._json(400, {"error": str(error)})
            return

        if parsed.path == "/register":
            self._json(200, {"ok": True, "client": {"app": payload.get("app") or "blender"}})
            return

        if parsed.path == "/auth":
            token = str(payload.get("token") or "").strip()
            if not token:
                self._json(400, {"error": "token is required"})
                return
            expires_at = payload.get("expires_at")
            try:
                expires_val = float(expires_at) if expires_at is not None else None
            except Exception:
                expires_val = None
            with _auth_lock:
                _auth.clear()
                _auth.update(
                    {
                        "token": token,
                        "email": payload.get("email"),
                        "user_id": payload.get("user_id"),
                        "updated_at": time.time(),
                        "expires_at": expires_val,
                    }
                )
                public = _auth_public()
            self._json(200, {"ok": True, "auth": public})
            return

        if parsed.path == "/auth/logout":
            clear_auth()
            self._json(200, {"ok": True, "signed_in": False})
            return

        if parsed.path == "/ack":
            item_id = str(payload.get("id") or "").strip()
            ok = ack_pending(item_id) if item_id else False
            self._json(200 if ok else 404, {"ok": ok})
            return

        # Meshy-style /import { url } and Hydrilla /import-file { file_base64, mesh_url }
        if parsed.path in {"/import", "/import-file"}:
            try:
                item = self._enqueue_import(payload)
                self._json(200, {"ok": True, "status": "ok", "item": item})
            except Exception as error:
                self._json(400, {"error": str(error), "status": "error"})
            return

        self._json(404, {"error": "not_found"})

    def _enqueue_import(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        name = str(payload.get("name") or payload.get("job_id") or "hydrilla-model")
        target = str(payload.get("target") or "any").strip().lower()
        job_id = payload.get("job_id")
        item_id = str(uuid.uuid4())
        dest = os.path.join(bpy.app.tempdir, f"hydrilla-bridge-{item_id}.glb")

        file_b64 = payload.get("file_base64")
        mesh_url = str(
            payload.get("mesh_url")
            or payload.get("url")
            or ""
        ).strip()

        if file_b64:
            raw = base64.b64decode(str(file_b64), validate=False)
            if len(raw) > MAX_UPLOAD_BYTES:
                raise ValueError("file too large")
            with open(dest, "wb") as handle:
                handle.write(raw)
        elif mesh_url:
            request = Request(mesh_url, headers={"User-Agent": "Hydrilla-Blender-Bridge/1.2"})
            with urlopen(request, timeout=120) as response:
                data = response.read()
            with open(dest, "wb") as handle:
                handle.write(data)
        else:
            raise ValueError("mesh_url/url or file_base64 is required")

        item = {
            "id": item_id,
            "file_path": dest,
            "path": dest,
            "file_format": "glb",
            "name": name,
            "target": target,
            "job_id": job_id,
            "mesh_url": mesh_url or None,
            "created_at": time.time(),
        }
        with _pending_lock:
            _pending.append(item)
            while len(_pending) > 50:
                _pending.pop(0)
        _import_queue.put(item, block=False)
        return item


def _guard_job(server: HydrillaHTTPServer) -> None:
    global _server_stop
    while not _server_stop:
        time.sleep(0.2)
    try:
        server.shutdown()
    except Exception:
        pass


def _run_server() -> None:
    global _server_stop
    try:
        with HydrillaHTTPServer(("127.0.0.1", BRIDGE_PORT), HydrillaBridgeHandler) as server:
            guard = threading.Thread(target=_guard_job, args=(server,), daemon=True)
            guard.start()
            print(f"[Hydrilla Bridge] listening on http://127.0.0.1:{BRIDGE_PORT}")
            server.serve_forever()
            server.server_close()
    except OSError as error:
        print(f"[Hydrilla Bridge] failed to bind :{BRIDGE_PORT}: {error}")
    print("[Hydrilla Bridge] stopped")


class HYDRILLA_OT_bridge_start(Operator):
    bl_idname = "hydrilla.bridge_start"
    bl_label = "Run Bridge"
    bl_description = "Start the built-in Hydrilla Bridge (sign-in + Studio send)"
    bl_options = {"REGISTER"}

    _timer = None
    props = None
    thread = None

    def _import_glb(self, path: str, name: str) -> None:
        bpy.ops.import_scene.gltf(filepath=path)
        active = bpy.context.view_layer.objects.active
        if active is not None:
            active.name = f"Hydrilla_{name}"[:60]

    def _process(self, item: Dict[str, Any]) -> None:
        path = item.get("file_path") or item.get("path")
        name = str(item.get("name") or "model")
        if not path or not os.path.exists(path):
            return
        try:
            self._import_glb(path, name)
            ack_pending(str(item.get("id") or ""))
        finally:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass

    def modal(self, context, event):
        props = getattr(context.window_manager, "hydrilla_bridge_props", None)
        if event.type == "ESC":
            self.cancel(context)
            return {"CANCELLED"}

        if event.type == "TIMER":
            if props is None or not props.bridge_running:
                self.cancel(context)
                return {"CANCELLED"}
            try:
                while True:
                    item = _import_queue.get(block=False)
                    self._process(item)
                    _import_queue.task_done()
            except Empty:
                pass

        return {"PASS_THROUGH"}

    def execute(self, context):
        global _server_stop, _server_thread

        props = context.window_manager.hydrilla_bridge_props
        if props.bridge_running:
            self.report({"INFO"}, "Bridge already running")
            return {"CANCELLED"}

        _server_stop = False
        props.bridge_running = True
        self.props = props

        self.thread = threading.Thread(target=_run_server, daemon=True)
        _server_thread = self.thread
        self.thread.start()

        # Give the socket a moment; report bind failure via health check next frame
        wm = context.window_manager
        self._timer = wm.event_timer_add(0.1, window=context.window)
        wm.modal_handler_add(self)

        context.scene.hydrilla_status = f"Bridge ON · 127.0.0.1:{BRIDGE_PORT}"
        self.report({"INFO"}, f"Hydrilla Bridge started on port {BRIDGE_PORT}")
        return {"RUNNING_MODAL"}

    def cancel(self, context):
        global _server_stop, _server_thread
        _server_stop = True
        props = getattr(context.window_manager, "hydrilla_bridge_props", None)
        if props is not None:
            props.bridge_running = False

        if self.thread is not None:
            self.thread.join(timeout=2.0)
        _server_thread = None

        wm = context.window_manager
        if self._timer is not None:
            wm.event_timer_remove(self._timer)
            self._timer = None

        if context and context.scene:
            context.scene.hydrilla_status = "Bridge OFF"


class HYDRILLA_OT_bridge_stop(Operator):
    bl_idname = "hydrilla.bridge_stop"
    bl_label = "Stop Bridge"
    bl_description = "Stop the built-in Hydrilla Bridge"
    bl_options = {"REGISTER"}

    def execute(self, context):
        global _server_stop
        props = context.window_manager.hydrilla_bridge_props
        props.bridge_running = False
        _server_stop = True
        context.scene.hydrilla_status = "Bridge OFF"
        self.report({"INFO"}, "Hydrilla Bridge stopped")
        return {"FINISHED"}


RUNTIME_CLASSES = (
    HydrillaBridgeProps,
    HYDRILLA_OT_bridge_start,
    HYDRILLA_OT_bridge_stop,
)


def register_runtime():
    for cls in RUNTIME_CLASSES:
        bpy.utils.register_class(cls)
    bpy.types.WindowManager.hydrilla_bridge_props = bpy.props.PointerProperty(
        type=HydrillaBridgeProps
    )


def unregister_runtime():
    global _server_stop
    _server_stop = True
    if hasattr(bpy.types.WindowManager, "hydrilla_bridge_props"):
        del bpy.types.WindowManager.hydrilla_bridge_props
    for cls in reversed(RUNTIME_CLASSES):
        bpy.utils.unregister_class(cls)
