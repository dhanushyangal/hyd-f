"""Embeddable Hydrilla Bridge HTTP server (start/stop from a DCC plugin)."""

from __future__ import annotations

import base64
import json
import os
import tempfile
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, urlparse

DEFAULT_PORT = 7345
MAX_QUEUE = 50
MAX_UPLOAD_BYTES = 80 * 1024 * 1024

_lock = threading.Lock()
_queue: List[Dict[str, Any]] = []
_clients: Dict[str, Dict[str, Any]] = {}
_auth: Dict[str, Any] = {}
_UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "hydrilla-bridge")
os.makedirs(_UPLOAD_DIR, exist_ok=True)

_runtime_lock = threading.Lock()
_server: Optional[ThreadingHTTPServer] = None
_thread: Optional[threading.Thread] = None
_running = False
_port = DEFAULT_PORT


def _auth_public() -> Dict[str, Any]:
    if not _auth.get("token"):
        return {"signed_in": False}
    return {
        "signed_in": True,
        "email": _auth.get("email"),
        "user_id": _auth.get("user_id"),
        "updated_at": _auth.get("updated_at"),
        "expires_at": _auth.get("expires_at"),
    }


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: Dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    handler.end_headers()
    if status != 204:
        handler.wfile.write(body)


def _read_json(handler: BaseHTTPRequestHandler) -> Dict[str, Any]:
    length = int(handler.headers.get("Content-Length") or "0")
    if length <= 0:
        return {}
    raw = handler.rfile.read(length)
    data = json.loads(raw.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("JSON body must be an object")
    return data


class BridgeHandler(BaseHTTPRequestHandler):
    server_version = "HydrillaBridge/1.1"

    def log_message(self, format: str, *args: Any) -> None:
        return

    def do_OPTIONS(self) -> None:
        _json_response(self, 204, {})

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            with _lock:
                payload = {
                    "ok": True,
                    "service": "hydrilla-bridge",
                    "embedded": True,
                    "pending": len(_queue),
                    "clients": list(_clients.values()),
                    "auth": _auth_public(),
                }
            _json_response(self, 200, payload)
            return

        if parsed.path == "/auth/session":
            with _lock:
                if not _auth.get("token"):
                    _json_response(self, 404, {"error": "not_signed_in", "signed_in": False})
                    return
                payload = {
                    "signed_in": True,
                    "token": _auth.get("token"),
                    "email": _auth.get("email"),
                    "user_id": _auth.get("user_id"),
                    "expires_at": _auth.get("expires_at"),
                    "updated_at": _auth.get("updated_at"),
                }
            _json_response(self, 200, payload)
            return

        if parsed.path == "/pending":
            query = parse_qs(parsed.query)
            app = (query.get("app") or [None])[0]
            with _lock:
                items = [
                    item
                    for item in _queue
                    if not app
                    or item.get("target") in {None, "any", app}
                ]
            _json_response(self, 200, {"items": items})
            return

        _json_response(self, 404, {"error": "not_found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            payload = _read_json(self)
        except Exception as error:
            _json_response(self, 400, {"error": str(error)})
            return

        if parsed.path == "/register":
            app = str(payload.get("app") or "").strip().lower()
            if not app:
                _json_response(self, 400, {"error": "app is required"})
                return
            record = {
                "app": app,
                "name": str(payload.get("name") or app),
                "seen_at": time.time(),
            }
            with _lock:
                _clients[app] = record
            _json_response(self, 200, {"ok": True, "client": record})
            return

        if parsed.path == "/auth":
            token = str(payload.get("token") or "").strip()
            if not token:
                _json_response(self, 400, {"error": "token is required"})
                return
            with _lock:
                _auth.clear()
                _auth.update(
                    {
                        "token": token,
                        "email": payload.get("email"),
                        "user_id": payload.get("user_id"),
                        "expires_at": payload.get("expires_at"),
                        "updated_at": time.time(),
                    }
                )
                public = _auth_public()
            _json_response(self, 200, {"ok": True, "auth": public})
            return

        if parsed.path == "/auth/logout":
            with _lock:
                _auth.clear()
            _json_response(self, 200, {"ok": True, "signed_in": False})
            return

        if parsed.path in {"/import", "/import-file"}:
            mesh_url = str(payload.get("mesh_url") or "").strip()
            file_b64 = payload.get("file_base64")
            name = str(payload.get("name") or "hydrilla-model")
            file_path = None
            if file_b64:
                try:
                    raw = base64.b64decode(str(file_b64), validate=False)
                except Exception:
                    _json_response(self, 400, {"error": "invalid file_base64"})
                    return
                if len(raw) > MAX_UPLOAD_BYTES:
                    _json_response(self, 413, {"error": "file too large"})
                    return
                safe = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in name)[:48] or "hydrilla"
                file_path = os.path.join(_UPLOAD_DIR, f"{safe}-{uuid.uuid4().hex[:8]}.glb")
                with open(file_path, "wb") as handle:
                    handle.write(raw)
            if not mesh_url and not file_path:
                _json_response(self, 400, {"error": "mesh_url or file_base64 is required"})
                return
            item = {
                "id": str(uuid.uuid4()),
                "mesh_url": mesh_url or None,
                "file_path": file_path,
                "name": name,
                "target": str(payload.get("target") or "any").strip().lower(),
                "job_id": payload.get("job_id"),
                "created_at": time.time(),
            }
            with _lock:
                _queue.append(item)
                while len(_queue) > MAX_QUEUE:
                    _queue.pop(0)
            _json_response(self, 200, {"ok": True, "item": item})
            return

        if parsed.path == "/ack":
            item_id = str(payload.get("id") or "").strip()
            if not item_id:
                _json_response(self, 400, {"error": "id is required"})
                return
            removed = None
            with _lock:
                for index, item in enumerate(_queue):
                    if item.get("id") == item_id:
                        removed = _queue.pop(index)
                        break
            if removed is None:
                _json_response(self, 404, {"error": "item_not_found"})
                return
            _json_response(self, 200, {"ok": True, "item": removed})
            return

        _json_response(self, 404, {"error": "not_found"})


def is_running() -> bool:
    with _runtime_lock:
        return _running


def current_port() -> int:
    with _runtime_lock:
        return _port


def start_bridge(host: str = "127.0.0.1", port: int = DEFAULT_PORT) -> Dict[str, Any]:
    """Start the embedded Bridge. Returns status dict. Idempotent if already running."""
    global _server, _thread, _running, _port

    with _runtime_lock:
        if _running and _server is not None:
            return {"ok": True, "already": True, "port": _port, "url": f"http://{host}:{_port}"}

        try:
            server = ThreadingHTTPServer((host, port), BridgeHandler)
        except OSError as error:
            return {"ok": False, "error": f"Port {port} unavailable: {error}"}

        _server = server
        _port = port
        _running = True

        def _serve() -> None:
            try:
                server.serve_forever(poll_interval=0.5)
            finally:
                with _runtime_lock:
                    global _running
                    _running = False

        thread = threading.Thread(target=_serve, name="HydrillaBridge", daemon=True)
        _thread = thread
        thread.start()
        return {"ok": True, "already": False, "port": port, "url": f"http://{host}:{port}"}


def stop_bridge() -> Dict[str, Any]:
    """Stop the embedded Bridge if running."""
    global _server, _thread, _running

    with _runtime_lock:
        server = _server
        thread = _thread
        _server = None
        _thread = None
        _running = False

    if server is None:
        return {"ok": True, "already": True}

    try:
        server.shutdown()
    except Exception:
        pass
    try:
        server.server_close()
    except Exception:
        pass
    if thread is not None and thread.is_alive():
        thread.join(timeout=2.0)
    return {"ok": True, "already": False}
