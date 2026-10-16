bl_info = {
    "name": "Hydrilla",
    "author": "Hydrilla",
    "version": (1, 3, 15),
    "blender": (3, 0, 0),
    "location": "View3D > Sidebar > Hydrilla",
    "description": "Built-in Bridge, Clerk sign-in, and AI 3D generate/import",
    "category": "Import-Export",
}

import base64
import importlib
import json
import os
import threading
import time
import webbrowser
from queue import Empty, Queue
from typing import Any, Optional
from urllib.parse import urlparse

import bpy
from bpy.props import (
    BoolProperty,
    CollectionProperty,
    EnumProperty,
    IntProperty,
    PointerProperty,
    StringProperty,
)
from bpy.types import AddonPreferences, Operator, Panel, PropertyGroup
from bpy_extras.io_utils import ImportHelper

from . import api_client
from . import bridge_client
from . import bridge_runtime

BRIDGE_URL = f"http://127.0.0.1:{bridge_runtime.BRIDGE_PORT}"
DEFAULT_SITE = "https://hydrilla.ai"
DEFAULT_API_BASE = "https://hydrilla-backend.vercel.app"
DEFAULT_LOCAL_SITE = "http://localhost:3000"
DEFAULT_LOCAL_API = "http://localhost:4000"
ADDON_ID = __name__

# Clerk JWTs last ~60s; Connect tab must stay open to refresh the Bridge session
SESSION_REAUTH = (
    "Session expired. Click Sign in, finish in the browser, "
    "KEEP the Connect tab open, then Sync and Generate again."
)
SESSION_KEEP_TAB = (
    "Keep the browser Connect tab open and visible — "
    "it refreshes your login every ~10s."
)
MIN_TOKEN_SECONDS = 5


def _prefs(context):
    return context.preferences.addons[ADDON_ID].preferences


def _bridge_running(context) -> bool:
    props = getattr(context.window_manager, "hydrilla_bridge_props", None)
    return bool(props and props.bridge_running)


def _is_http_url(value: str) -> bool:
    text = (value or "").strip().lower()
    if not (text.startswith("http://") or text.startswith("https://")):
        return False
    # Blender inserts bpy.ops… into focused text fields when clicking operators
    if "bpy." in text or "()" in text or " " in text.strip():
        return False
    return True


def _url_port(value: str) -> str:
    try:
        parsed = urlparse((value or "").strip())
        if parsed.port:
            return str(parsed.port)
        if parsed.scheme == "https":
            return "443"
        if parsed.scheme == "http":
            return "80"
    except Exception:
        pass
    return ""


def _is_local_host(value: str) -> bool:
    host = (urlparse((value or "").strip()).hostname or "").lower()
    return host in {"localhost", "127.0.0.1", "::1"}


def _looks_like_frontend_url(value: str) -> bool:
    """Site / Next.js URLs must never be used as API Base."""
    text = (value or "").strip().rstrip("/").lower()
    if not text:
        return False
    port = _url_port(text)
    if port in {"3000", "3001", "5173", "8080"}:
        return True
    # Production marketing site (not the Node API)
    host = (urlparse(text).hostname or "").lower()
    if host in {"hydrilla.ai", "www.hydrilla.ai"}:
        return True
    return False


def _looks_like_gpu_gateway_url(value: str) -> bool:
    """Old default pointed at the GPU host; DCC clients must use the Node backend."""
    host = (urlparse((value or "").strip()).hostname or "").lower()
    return host in {"api.hydrilla.ai", "api.hydrilla.co"}


def _default_api_for_site(site_url: str) -> str:
    # Only Local Site (:3000) implies Local API (:4000)
    if _is_local_host(site_url):
        return DEFAULT_LOCAL_API
    return DEFAULT_API_BASE


def _sanitize_http_url(raw: str, fallback: str) -> str:
    value = (raw or "").strip().rstrip("/")
    if _is_http_url(value):
        return value
    return (fallback or DEFAULT_API_BASE).rstrip("/")


def _normalize_api_base(raw: str, site_url: str = "") -> str:
    """
    Force a real API origin.
    Blender often pastes Site URL (:3000) or bpy.ops into the API field.
    Also remaps legacy GPU gateway hosts (api.hydrilla.ai) to the Node backend.
    """
    site = _sanitize_http_url(site_url, DEFAULT_SITE)
    fallback = _default_api_for_site(site)
    value = (raw or "").strip().rstrip("/")

    if not _is_http_url(value):
        return fallback
    if _looks_like_frontend_url(value):
        return fallback
    if _looks_like_gpu_gateway_url(value):
        return fallback
    if site and value.lower() == site.lower():
        return fallback
    return value


def _prefs_site_url(prefs) -> str:
    raw = getattr(prefs, "site_url", "") or ""
    fixed = _sanitize_http_url(raw, DEFAULT_SITE)
    if str(raw).strip().rstrip("/") != fixed:
        try:
            prefs.site_url = fixed
        except Exception:
            pass
    return fixed


def _prefs_api_base(prefs) -> str:
    """Read API base; never allow Site URL (:3000) or bpy.ops pollution."""
    site = getattr(prefs, "site_url", "") or ""
    # Newest prop first — older names may still hold a pasted :3000 Site URL
    raw = getattr(prefs, "api_server", None)
    if raw is None or str(raw).strip() == "":
        raw = getattr(prefs, "api_base_url", None)
    if raw is None or str(raw).strip() == "":
        raw = getattr(prefs, "api_base", "") or ""

    fixed = _normalize_api_base(str(raw), site)
    if str(raw).strip().rstrip("/") != fixed:
        try:
            prefs.api_server = fixed
        except Exception:
            pass
    return fixed


def _prefs_bridge_url(prefs) -> str:
    raw = getattr(prefs, "bridge_url", "") or ""
    fixed = _sanitize_http_url(raw, BRIDGE_URL)
    if str(raw).strip().rstrip("/") != fixed:
        try:
            prefs.bridge_url = fixed
        except Exception:
            pass
    return fixed


def _bridge_token_provider():
    """Pull a fresh Clerk JWT from the embedded Bridge (Connect tab refreshes it)."""

    def provider():
        try:
            session = bridge_runtime.get_auth_session()
            if session.get("signed_in") and session.get("token"):
                return session.get("token")
        except Exception:
            pass
        return None

    return provider


def _build_client(*, token: str, mode: str, base_url: str):
    """Build API client without relying on make_client (older installs may lack it)."""
    provider = _bridge_token_provider() if mode == "clerk" else None
    return api_client.HydrillaClient(
        token,
        base_url=base_url,
        mode=mode,
        token_provider=provider,
    )


# Background generate jobs — keep HTTP off Blender's main thread (no rainbow freeze)
_JOB: dict = {
    "busy": False,
    "cancel": False,
    "events": Queue(),
    "started_at": 0.0,
    "mode": "",
}

# Account job list (creator history from /api/3d/history)
_JOBS_UI: dict = {
    "fetching": False,
    "events": Queue(),
    "auto": False,
}

ACTIVE_JOB_STATUSES = {
    "WAIT",
    "RUN",
    "PENDING",
    "QUEUED",
    "IN_PROGRESS",
    "RUNNING",
    "PROCESSING",
}
DONE_JOB_STATUSES = {"DONE", "SUCCEEDED", "SUCCESS", "COMPLETED"}
FAILED_JOB_STATUSES = {"FAIL", "FAILED", "ERROR"}
CANCELLED_JOB_STATUSES = {"CANCELLED", "CANCELED"}


def _normalize_job_status(status: str, *, has_mesh: bool = False) -> str:
    """Canonical status. Mesh URL means Done even if the server still says RUN."""
    code = (status or "").strip().upper()
    if has_mesh and code in ACTIVE_JOB_STATUSES | {""}:
        return "DONE"
    if code in DONE_JOB_STATUSES:
        return "DONE"
    if code in FAILED_JOB_STATUSES:
        return "FAILED"
    if code in CANCELLED_JOB_STATUSES:
        return "CANCELLED"
    if code in {"WAIT", "PENDING", "QUEUED"}:
        return "PENDING"
    if code in {"RUN", "IN_PROGRESS", "RUNNING", "PROCESSING"}:
        return "RUNNING"
    return code or "UNKNOWN"


def _job_status_label(status: str, *, has_mesh: bool = False) -> str:
    code = _normalize_job_status(status, has_mesh=has_mesh)
    if code == "PENDING":
        return "Pending"
    if code == "RUNNING":
        return "Running"
    if code == "DONE":
        return "Done"
    if code == "FAILED":
        return "Failed"
    if code == "CANCELLED":
        return "Cancelled"
    return code.title() if code else "Unknown"


def _job_status_icon(status: str, *, has_mesh: bool = False) -> str:
    label = _job_status_label(status, has_mesh=has_mesh)
    if label == "Pending":
        return "TIME"
    if label == "Running":
        return "SORTTIME"
    if label == "Done":
        return "CHECKMARK"
    if label == "Failed":
        return "ERROR"
    return "INFO"


def _job_sort_key(item: dict) -> tuple:
    code = _normalize_job_status(
        str(item.get("status") or ""),
        has_mesh=bool(item.get("mesh_url")),
    )
    order = {"RUNNING": 0, "PENDING": 1, "DONE": 2, "FAILED": 3, "CANCELLED": 4}
    return (order.get(code, 9), str(item.get("created_at") or ""), str(item.get("id") or ""))


def _truncate(text: str, width: int = 28) -> str:
    value = (text or "").replace("\n", " ").strip()
    if len(value) <= width:
        return value or "(no prompt)"
    return value[: width - 1] + "…"



def _tag_hydrilla_redraw() -> None:
    window_manager = bpy.context.window_manager
    if not window_manager:
        return
    for window in window_manager.windows:
        screen = window.screen
        if not screen:
            continue
        for area in screen.areas:
            if area.type in {"VIEW_3D", "PROPERTIES"}:
                area.tag_redraw()


def _wrap_status_lines(text: str, width: int = 34) -> list:
    raw = (text or "Ready").replace("\n", " ").strip() or "Ready"
    words = raw.split()
    lines: list = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip() if current else word
        if len(candidate) > width and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines or ["Ready"]


def _set_scene_status(
    scene,
    text: str,
    *,
    kind: str = "INFO",
    phase: str = "",
    progress: int = -1,
    busy: Optional[bool] = None,
    task_id: Optional[str] = None,
) -> None:
    """Write durable status onto the scene so reconnect / Sync still shows it."""
    scene.hydrilla_status = text
    scene.hydrilla_status_kind = kind
    if phase:
        scene.hydrilla_job_phase = phase
    if progress >= 0:
        scene.hydrilla_job_progress = max(0, min(100, int(progress)))
    if busy is not None:
        scene.hydrilla_busy = bool(busy)
    if task_id is not None:
        scene.hydrilla_job_task_id = task_id


def _local_job_busy(scene=None) -> bool:
    """True only while THIS Blender session is actively generating/importing."""
    if _JOB["busy"]:
        return True
    if scene is not None and bool(getattr(scene, "hydrilla_busy", False)):
        return True
    return False


def _status_icon(kind: str, busy: bool) -> str:
    if busy:
        return "SORTTIME"
    if kind == "ERROR" or kind == "SESSION":
        return "ERROR"
    if kind == "DONE":
        return "CHECKMARK"
    return "INFO"


def _status_headline(scene) -> str:
    busy = _local_job_busy(scene)
    kind = scene.hydrilla_status_kind or "INFO"
    phase = (scene.hydrilla_job_phase or "").strip()
    progress = int(getattr(scene, "hydrilla_job_progress", 0) or 0)
    if busy:
        if phase and progress > 0:
            return f"Generating · {phase} · {progress}%"
        if phase:
            return f"Generating · {phase}"
        return "Generating…"
    if kind == "SESSION":
        return "Session issue"
    if kind == "ERROR":
        return "Failed"
    if kind == "DONE":
        return "Done"
    pending = int(getattr(scene, "hydrilla_jobs_pending", 0) or 0)
    running = int(getattr(scene, "hydrilla_jobs_running", 0) or 0)
    if pending or running:
        return f"Account · {running} running · {pending} pending"
    return "Ready"


def _draw_status_block(layout, scene) -> None:
    """Always-visible status: local generate vs account job summary."""
    busy = _local_job_busy(scene)
    kind = scene.hydrilla_status_kind or "INFO"
    box = layout.box()
    header = box.row()
    header.label(text=_status_headline(scene), icon=_status_icon(kind, busy))
    if busy and _JOB.get("started_at"):
        elapsed = max(0, int(time.time() - float(_JOB["started_at"])))
        header.label(text=f"{elapsed}s")

    for line in _wrap_status_lines(scene.hydrilla_status or "Ready"):
        box.label(text=line)

    if kind == "SESSION":
        box.label(text="Fix: Sign in → keep Connect tab open → Sync", icon="URL")
        row = box.row(align=True)
        row.operator("hydrilla.sign_in", text="Sign in", icon="URL")
        row.operator("hydrilla.sync_account", text="Sync", icon="FILE_REFRESH")
    elif busy:
        box.operator("hydrilla.cancel_generate", text="Cancel", icon="X")
    elif (scene.hydrilla_job_task_id or "").strip() and kind == "ERROR":
        box.operator("hydrilla.resume_job", text="Retry poll task", icon="FILE_REFRESH")


def _show_hydrilla_popup(message: str, *, title: str = "Hydrilla", icon: str = "INFO") -> None:
    """Blender popup after background generate finishes (reports from timers are easy to miss)."""
    lines = _wrap_status_lines(message, width=48)

    def draw_popup(menu, _context):
        col = menu.layout.column(align=True)
        for line in lines:
            col.label(text=line)

    window_manager = bpy.context.window_manager
    if window_manager:
        window_manager.popup_menu(draw_popup, title=title, icon=icon)


def _job_emit(kind: str, **payload) -> None:
    _JOB["events"].put({"kind": kind, **payload})


def _human_task_status(status: str, progress: Any) -> tuple:
    """Return (phase, progress_int, status_line)."""
    code = (status or "").upper()
    try:
        pct = int(progress) if progress is not None else 0
    except Exception:
        pct = 0
    if code in {"PENDING", "QUEUED", "WAIT"}:
        return "Queued", pct, f"Queued on server… {pct}%" if pct else "Queued on server…"
    if code in {"IN_PROGRESS", "RUNNING", "PROCESSING", "RUN"}:
        return "Generating", pct, f"Generating mesh… {pct}%" if pct else "Generating mesh…"
    if code == "SUCCEEDED":
        return "Done", 100, "Generation succeeded"
    if code in {"FAILED", "ERROR"}:
        return "Failed", pct, "Generation failed"
    if code in {"CANCELLED", "CANCELED"}:
        return "Cancelled", pct, "Generation cancelled"
    return code or "Working", pct, f"{code or 'Working'}… {pct}%" if pct else (code or "Working…")


def _job_timer() -> Optional[float]:
    """Main-thread timer: apply status to the Hydrilla panel and import when done."""
    scene = getattr(bpy.context, "scene", None)
    if scene is None:
        return 0.25 if _JOB["busy"] else None

    try:
        while True:
            event = _JOB["events"].get_nowait()
            kind = event.get("kind")
            if kind == "status":
                text = str(event.get("text") or "")
                phase = str(event.get("phase") or scene.hydrilla_job_phase or "Working")
                progress = event.get("progress")
                progress_i = int(progress) if progress is not None else -1
                status_kind = "SESSION" if _is_session_error(text) else "RUNNING"
                _set_scene_status(
                    scene,
                    text,
                    kind=status_kind,
                    phase=phase,
                    progress=progress_i,
                    busy=True,
                    task_id=event.get("task_id"),
                )
            elif kind == "error":
                message = str(event.get("text") or "Failed")
                status_kind = "SESSION" if _is_session_error(message) else "ERROR"
                _set_scene_status(
                    scene,
                    message,
                    kind=status_kind,
                    phase="Failed" if status_kind == "ERROR" else "Session",
                    progress=0,
                    busy=False,
                    task_id=scene.hydrilla_job_task_id or "",
                )
                _JOB["busy"] = False
                _JOB["cancel"] = False
                scene.hydrilla_busy = False
                _tag_hydrilla_redraw()
                popup_title = (
                    "Hydrilla — Session expired"
                    if status_kind == "SESSION"
                    else "Hydrilla — Failed"
                )
                _show_hydrilla_popup(message, title=popup_title, icon="ERROR")
                try:
                    _start_jobs_fetch(bpy.context, quiet=True)
                except Exception:
                    pass
                return 0.5
            elif kind == "done":
                path = event.get("path") or ""
                try:
                    if path and os.path.isfile(path):
                        bpy.ops.import_scene.gltf(filepath=path)
                    _set_scene_status(
                        scene,
                        "Imported into the 3D Viewport — check the Outliner.",
                        kind="DONE",
                        phase="Imported",
                        progress=100,
                        busy=False,
                        task_id="",
                    )
                    _show_hydrilla_popup(
                        "Mesh imported into the scene.",
                        title="Hydrilla — Done",
                        icon="CHECKMARK",
                    )
                except Exception as error:
                    message = _user_error(error)
                    status_kind = "SESSION" if _is_session_error(message) else "ERROR"
                    _set_scene_status(
                        scene,
                        message,
                        kind=status_kind,
                        phase="Import failed",
                        busy=False,
                        task_id="",
                    )
                    _show_hydrilla_popup(message, title="Hydrilla — Failed", icon="ERROR")
                _JOB["busy"] = False
                _JOB["cancel"] = False
                scene.hydrilla_busy = False
                _tag_hydrilla_redraw()
                # Refresh account job list so completed jobs show as Done
                try:
                    _start_jobs_fetch(bpy.context, quiet=True)
                except Exception:
                    pass
                return 0.5
            _tag_hydrilla_redraw()
    except Empty:
        pass

    if not _JOB["busy"]:
        # Clear sticky busy once the background worker has finished
        scene.hydrilla_busy = False
        return None
    _tag_hydrilla_redraw()
    return 0.2


def _start_background_job(worker, *, mode: str = "") -> bool:
    if _JOB["busy"]:
        return False
    _JOB["busy"] = True
    _JOB["cancel"] = False
    _JOB["started_at"] = time.time()
    _JOB["mode"] = mode or ""
    while True:
        try:
            _JOB["events"].get_nowait()
        except Empty:
            break

    thread = threading.Thread(target=worker, name="hydrilla-generate", daemon=True)
    thread.start()
    if not bpy.app.timers.is_registered(_job_timer):
        bpy.app.timers.register(_job_timer, first_interval=0.05)
    return True


def _apply_jobs_to_scene(scene, jobs: list) -> None:
    normalized: list = []
    for item in jobs:
        mesh = str(item.get("mesh_url") or "").strip()
        raw_status = str(item.get("status") or "")
        status = _normalize_job_status(raw_status, has_mesh=bool(mesh))
        normalized.append(
            {
                "id": str(item.get("id") or ""),
                "status": status,
                "prompt": str(item.get("prompt") or ""),
                "mesh_url": mesh,
                "generate_type": str(item.get("generate_type") or ""),
                "created_at": str(item.get("created_at") or ""),
            }
        )
    normalized.sort(key=_job_sort_key)

    scene.hydrilla_jobs.clear()
    pending = 0
    running = 0
    done = 0
    failed = 0
    for item in normalized:
        entry = scene.hydrilla_jobs.add()
        entry.job_id = item["id"]
        entry.status = item["status"]
        entry.prompt = item["prompt"]
        entry.mesh_url = item["mesh_url"]
        entry.generate_type = item["generate_type"]
        if item["status"] == "PENDING":
            pending += 1
        elif item["status"] == "RUNNING":
            running += 1
        elif item["status"] == "DONE":
            done += 1
        elif item["status"] == "FAILED":
            failed += 1

    active = pending + running
    scene.hydrilla_jobs_active = active
    scene.hydrilla_jobs_pending = pending
    scene.hydrilla_jobs_running = running
    scene.hydrilla_jobs_done = done
    scene.hydrilla_jobs_failed = failed
    scene.hydrilla_jobs_fetched_at = time.strftime("%H:%M:%S")


def _jobs_timer() -> Optional[float]:
    scene = getattr(bpy.context, "scene", None)
    try:
        while True:
            event = _JOBS_UI["events"].get_nowait()
            if scene is None:
                _JOBS_UI["events"].put(event)
                return 0.25
            kind = event.get("kind")
            if kind == "error":
                _JOBS_UI["fetching"] = False
                message = str(event.get("text") or "Could not load jobs")
                status_kind = "SESSION" if _is_session_error(message) else "ERROR"
                # Never mark local generate busy from a jobs-list error
                _set_scene_status(
                    scene,
                    message,
                    kind=status_kind,
                    busy=_JOB["busy"],
                )
                scene.hydrilla_jobs_error = message
                _tag_hydrilla_redraw()
            elif kind == "ok":
                _JOBS_UI["fetching"] = False
                jobs = event.get("jobs") or []
                scene.hydrilla_jobs_error = ""
                _apply_jobs_to_scene(scene, jobs)
                pending = int(getattr(scene, "hydrilla_jobs_pending", 0) or 0)
                running = int(getattr(scene, "hydrilla_jobs_running", 0) or 0)
                done = int(getattr(scene, "hydrilla_jobs_done", 0) or 0)
                failed = int(getattr(scene, "hydrilla_jobs_failed", 0) or 0)
                total = len(jobs)
                local_busy = bool(_JOB["busy"])
                # If nothing local is generating, clear sticky busy from older runs
                if not local_busy:
                    scene.hydrilla_busy = False
                summary = (
                    f"{running} running · {pending} pending · "
                    f"{done} done · {failed} failed ({total} total)"
                )
                if running or pending:
                    _set_scene_status(
                        scene,
                        summary,
                        kind="INFO",
                        phase="Account jobs",
                        busy=local_busy,
                    )
                else:
                    _set_scene_status(
                        scene,
                        summary if total else "No jobs for this account yet",
                        kind="DONE" if done and not local_busy else "INFO",
                        phase="Ready" if not local_busy else scene.hydrilla_job_phase,
                        progress=100 if done and not local_busy else -1,
                        busy=local_busy,
                    )
                _tag_hydrilla_redraw()
    except Empty:
        pass

    if _JOBS_UI["fetching"]:
        return 0.25

    if scene is not None and int(getattr(scene, "hydrilla_jobs_active", 0) or 0) > 0:
        _JOBS_UI["auto"] = True
        if not _JOBS_UI["fetching"]:
            _start_jobs_fetch(bpy.context, quiet=True)
        return 8.0

    _JOBS_UI["auto"] = False
    return None


def _start_jobs_fetch(context, *, quiet: bool = False) -> bool:
    if _JOBS_UI["fetching"]:
        return False
    scene = getattr(context, "scene", None)
    if scene is None:
        return False
    try:
        client = _resolve_client(context)
        if client.mode != "clerk":
            if not quiet:
                message = "Your Jobs needs Sign in with Hydrilla (not API key alone)."
                _set_scene_status(scene, message, kind="SESSION", phase="Session")
                scene.hydrilla_jobs_error = message
            return False
        # Prefer Bridge-refreshed token; only fail hard when truly expired
        _ensure_fresh_clerk_token(client.token, client.mode)
    except Exception as error:
        message = _user_error(error)
        status_kind = "SESSION" if _is_session_error(message) else "ERROR"
        scene.hydrilla_jobs_error = message
        if not quiet:
            _set_scene_status(scene, message, kind=status_kind)
        # Still allow timer to clear loading state
        _JOBS_UI["fetching"] = False
        return False

    # Capture a fresh token right before the request (Bridge may have newer JWT)
    token = client.token
    try:
        fresh = _bridge_token_provider()()
        if fresh:
            token = str(fresh).strip() or token
    except Exception:
        pass
    base_url = client.base_url
    mode = client.mode
    _JOBS_UI["fetching"] = True
    scene.hydrilla_jobs_error = ""

    def worker():
        try:
            job_client = api_client.HydrillaClient(
                token,
                base_url=base_url,
                mode=mode,
                token_provider=_bridge_token_provider() if mode == "clerk" else None,
            )
            jobs = job_client.list_user_jobs(limit=40)
            _JOBS_UI["events"].put({"kind": "ok", "jobs": jobs})
        except Exception as error:
            _JOBS_UI["events"].put({"kind": "error", "text": _user_error(error)})

    threading.Thread(target=worker, name="hydrilla-jobs", daemon=True).start()
    if not bpy.app.timers.is_registered(_jobs_timer):
        bpy.app.timers.register(_jobs_timer, first_interval=0.05)
    return True


def _wait_task_cancellable(client, task_id: str) -> dict:
    started = time.time()
    while True:
        if _JOB["cancel"]:
            raise api_client.HydrillaApiError("Generation cancelled")
        try:
            task = client.get_task(task_id)
        except Exception as error:
            message = _user_error(error)
            if _is_session_error(message):
                _job_emit(
                    "status",
                    text=f"Session expired mid-job. {SESSION_REAUTH}",
                    phase="Session",
                    progress=0,
                    task_id=task_id,
                )
            raise
        status = str(task.get("status") or "").upper()
        progress = task.get("progress")
        phase, pct, line = _human_task_status(status, progress)
        _job_emit(
            "status",
            text=line,
            phase=phase,
            progress=pct,
            task_id=task_id,
        )
        if status in {"SUCCEEDED", "FAILED", "CANCELLED", "CANCELED"}:
            return task
        if time.time() - started >= api_client.MAX_POLL_S:
            raise api_client.HydrillaApiError(f"Task {task_id} timed out")
        time.sleep(api_client.POLL_INTERVAL_S)


def _jwt_seconds_left(token: str) -> Optional[float]:
    """Read Clerk JWT exp without verifying signature (local expiry check only)."""
    try:
        parts = (token or "").split(".")
        if len(parts) < 2:
            return None
        payload = parts[1] + ("=" * (-len(parts[1]) % 4))
        data = json.loads(base64.urlsafe_b64decode(payload.encode("utf-8")))
        exp = data.get("exp")
        if exp is None:
            return None
        return float(exp) - time.time()
    except Exception:
        return None


def _is_session_error(message: str) -> bool:
    lower = (message or "").lower()
    return any(
        needle in lower
        for needle in (
            "session expired",
            "jwt is expired",
            "jwt expired",
            "not signed in",
            "authentication failed",
            "unauthorized",
            "keep the connect tab",
            "keep the browser connect",
            "sign in with hydrilla again",
        )
    )


def _user_error(error: BaseException) -> str:
    message = str(error).strip() or error.__class__.__name__
    lower = message.lower()
    if "make_client" in message:
        return (
            "Addon files are out of date. Remove Hydrilla in Preferences → Add-ons, "
            "then install the zip from frontend/public/plugins/hydrilla-blender.zip."
        )
    if "unknown url type" in lower or "bpy.ops" in message:
        return (
            "API Base URL was corrupted (Blender pasted an operator into the field). "
            "Open Add-on Preferences → Use Local (:3000 / :4000)."
        )
    if _is_session_error(message) or getattr(error, "status", None) == 401:
        return SESSION_REAUTH
    if "gpu is currently offline" in lower or "restarting" in lower or "gpu_offline" in lower:
        return (
            "3D GPU is offline or restarting (backend is fine). "
            "Wait a minute and click Generate again."
        )
    return message


def _ensure_fresh_clerk_token(token: str, mode: str) -> None:
    """Fail before long jobs if Clerk JWT is missing/expired (Connect tab likely closed)."""
    if mode != "clerk":
        return
    # Prefer a freshly refreshed Bridge token if Connect tab is open
    fresh = None
    try:
        fresh = _bridge_token_provider()()
    except Exception:
        fresh = None
    check = (fresh or token or "").strip()
    if not check:
        raise api_client.HydrillaApiError(SESSION_REAUTH)
    left = _jwt_seconds_left(check)
    if left is not None and left < MIN_TOKEN_SECONDS:
        # One more Bridge pull — Connect may have just refreshed
        time.sleep(0.35)
        try:
            again = _bridge_token_provider()()
        except Exception:
            again = None
        check2 = (again or "").strip()
        left2 = _jwt_seconds_left(check2) if check2 else None
        if not check2 or (left2 is not None and left2 < MIN_TOKEN_SECONDS):
            raise api_client.HydrillaApiError(SESSION_REAUTH)


def _resolve_client(context):
    prefs = _prefs(context)
    clerk_token = None
    email = None
    api_base = _prefs_api_base(prefs)

    if _bridge_running(context):
        try:
            session = bridge_runtime.get_auth_session()
            if session.get("signed_in") and session.get("token"):
                clerk_token = session.get("token")
                email = session.get("email")
            else:
                # Fallback: HTTP self-check (same process may also expose session)
                session = bridge_client.BridgeClient(_prefs_bridge_url(prefs)).get_auth()
                if session.get("signed_in") and session.get("token"):
                    clerk_token = session.get("token")
                    email = session.get("email")
        except Exception:
            clerk_token = None

    if clerk_token:
        context.scene.hydrilla_account = email or "Signed in with Hydrilla"
        context.scene.hydrilla_auth_mode = "CLERK"
        return _build_client(token=clerk_token, mode="clerk", base_url=api_base)

    if prefs.api_key:
        context.scene.hydrilla_account = "API key"
        context.scene.hydrilla_auth_mode = "API"
        return _build_client(token=prefs.api_key, mode="api", base_url=api_base)

    context.scene.hydrilla_account = "Not signed in"
    context.scene.hydrilla_auth_mode = "NONE"
    if not _bridge_running(context):
        raise api_client.HydrillaApiError(
            "Bridge is off. Click Run Bridge, Sign in, Sync — or set an API key."
        )
    raise api_client.HydrillaApiError(
        "Not signed in. Click Sign in, finish in the browser, then Sync — or set an API key."
    )


class HydrillaJobItem(PropertyGroup):
    job_id: StringProperty(name="Job ID", default="")
    status: StringProperty(name="Status", default="")
    prompt: StringProperty(name="Prompt", default="")
    mesh_url: StringProperty(name="Mesh URL", default="")
    generate_type: StringProperty(name="Type", default="")


class HydrillaPreferences(AddonPreferences):
    bl_idname = ADDON_ID

    api_key: StringProperty(
        name="API Key (optional)",
        description="hyd_live_ key — only needed if you are not signed in with Hydrilla",
        subtype="PASSWORD",
        default="",
    )
    site_url: StringProperty(
        name="Hydrilla Site URL",
        description="Frontend for sign-in (live: https://hydrilla.ai). Local: http://localhost:3000",
        default=DEFAULT_SITE,
    )
    # Fresh prop name so old api_base / api_base_url values stuck on :3000 are ignored
    api_server: StringProperty(
        name="API Base URL",
        description="Backend API (live by default). Local: http://localhost:4000 — never use :3000 here",
        default=DEFAULT_API_BASE,
    )
    bridge_url: StringProperty(
        name="Bridge URL",
        default=BRIDGE_URL,
    )

    def draw(self, context):
        # Repair Site/API mix-ups and bpy.ops paste whenever prefs are shown
        site = _prefs_site_url(self)
        api = _prefs_api_base(self)
        _prefs_bridge_url(self)

        layout = self.layout
        col = layout.column(align=True)
        col.label(text="Account", icon="USER")
        col.prop(self, "api_key")
        col.separator()
        col.prop(self, "site_url")
        col.prop(self, "api_server")
        col.prop(self, "bridge_url")
        col.separator()
        row = col.row(align=True)
        row.operator("hydrilla.prefs_local", text="Use Local (:3000 / :4000)")
        row.operator("hydrilla.prefs_production", text="Use Production")
        col.label(text=f"Active → Site {site} · API {api}", icon="INFO")
        col.label(text="API must be :4000 locally — :3000 is the website only")


class HYDRILLA_OT_prefs_local(Operator):
    bl_idname = "hydrilla.prefs_local"
    bl_label = "Use Local URLs"

    def execute(self, context):
        prefs = _prefs(context)
        prefs.site_url = DEFAULT_LOCAL_SITE
        prefs.api_server = DEFAULT_LOCAL_API
        self.report({"INFO"}, "Local Site :3000 · API :4000")
        return {"FINISHED"}


class HYDRILLA_OT_prefs_production(Operator):
    bl_idname = "hydrilla.prefs_production"
    bl_label = "Use Production URLs"

    def execute(self, context):
        prefs = _prefs(context)
        prefs.site_url = DEFAULT_SITE
        prefs.api_server = DEFAULT_API_BASE
        self.report({"INFO"}, "Production Site + API")
        return {"FINISHED"}


class HYDRILLA_OT_sign_in(Operator):
    bl_idname = "hydrilla.sign_in"
    bl_label = "Sign in with Hydrilla"
    bl_description = "Start Bridge if needed and open Hydrilla sign-in"

    def execute(self, context):
        if not _bridge_running(context):
            self.report({"ERROR"}, "Click Run Bridge first, then Sign in")
            context.scene.hydrilla_status = "Click Run Bridge first"
            return {"CANCELLED"}

        prefs = _prefs(context)
        site = _prefs_site_url(prefs)
        webbrowser.open(f"{site}/integrations/connect?app=blender")
        context.scene.hydrilla_status = (
            "Browser opened — sign in, KEEP the Connect tab open, then Sync"
        )
        self.report({"INFO"}, "Sign in in the browser, keep that tab open, then Sync")
        return {"FINISHED"}


class HYDRILLA_OT_sync_account(Operator):
    bl_idname = "hydrilla.sync_account"
    bl_label = "Sync account"

    def execute(self, context):
        prefs = _prefs(context)
        scene = context.scene
        job_running = bool(scene.hydrilla_busy) or bool(_JOB["busy"])
        job_note = ""
        if job_running:
            phase = (scene.hydrilla_job_phase or "Working").strip()
            progress = int(getattr(scene, "hydrilla_job_progress", 0) or 0)
            job_note = f" Job still running · {phase}"
            if progress > 0:
                job_note += f" · {progress}%"

        if not _bridge_running(context):
            self.report({"ERROR"}, "Run Bridge first")
            _set_scene_status(
                scene,
                "Run Bridge first" + (f" —{job_note}" if job_note else ""),
                kind="ERROR",
                busy=job_running,
            )
            return {"CANCELLED"}
        try:
            session = bridge_runtime.get_auth_session()
            if not session.get("signed_in"):
                session = bridge_client.BridgeClient(_prefs_bridge_url(prefs)).get_auth()
            if not session.get("signed_in"):
                if prefs.api_key:
                    context.scene.hydrilla_account = "API key"
                    context.scene.hydrilla_auth_mode = "API"
                    _set_scene_status(
                        scene,
                        "Using API key." + job_note,
                        kind="RUNNING" if job_running else "INFO",
                        busy=job_running,
                    )
                    self.report({"INFO"}, "No Clerk session — using API key")
                    return {"FINISHED"}
                context.scene.hydrilla_account = "Not signed in"
                context.scene.hydrilla_auth_mode = "NONE"
                _set_scene_status(
                    scene,
                    SESSION_REAUTH + (f" —{job_note}" if job_note else ""),
                    kind="SESSION",
                    phase="Session",
                    busy=job_running,
                )
                self.report({"ERROR"}, "No session yet — Sign in and keep Connect tab open")
                return {"CANCELLED"}

            token = str(session.get("token") or "")
            left = _jwt_seconds_left(token)
            if left is not None and left < MIN_TOKEN_SECONDS:
                context.scene.hydrilla_account = "Session expired"
                context.scene.hydrilla_auth_mode = "NONE"
                _set_scene_status(
                    scene,
                    SESSION_REAUTH + (f" —{job_note}" if job_note else ""),
                    kind="SESSION",
                    phase="Session",
                    busy=job_running,
                )
                self.report({"ERROR"}, "Session expired — Sign in again, keep Connect tab open")
                return {"CANCELLED"}

            email = session.get("email") or "Hydrilla account"
            context.scene.hydrilla_account = email
            context.scene.hydrilla_auth_mode = "CLERK"
            if job_running:
                _set_scene_status(
                    scene,
                    f"Reconnected as {email}.{job_note}",
                    kind="RUNNING",
                    busy=True,
                )
                self.report({"INFO"}, f"Signed in as {email} — job still running")
            else:
                _set_scene_status(
                    scene,
                    f"Signed in as {email}. {SESSION_KEEP_TAB}",
                    kind="INFO",
                    phase="Ready",
                    busy=False,
                )
                self.report({"INFO"}, f"Signed in as {email} — keep Connect tab open")
            _start_jobs_fetch(context, quiet=True)
            return {"FINISHED"}
        except Exception as error:
            message = _user_error(error)
            status_kind = "SESSION" if _is_session_error(message) else "ERROR"
            _set_scene_status(
                scene,
                message + (f" —{job_note}" if job_note else ""),
                kind=status_kind,
                busy=job_running,
            )
            self.report({"ERROR"}, message)
            return {"CANCELLED"}


class HYDRILLA_OT_sign_out(Operator):
    bl_idname = "hydrilla.sign_out"
    bl_label = "Sign out"

    def execute(self, context):
        bridge_runtime.clear_auth()
        try:
            bridge_client.BridgeClient(_prefs_bridge_url(_prefs(context))).clear_auth()
        except Exception:
            pass
        context.scene.hydrilla_account = "Not signed in"
        context.scene.hydrilla_auth_mode = "NONE"
        context.scene.hydrilla_status = "Signed out"
        self.report({"INFO"}, "Signed out")
        return {"FINISHED"}


class HYDRILLA_OT_text_to_3d(Operator):
    bl_idname = "hydrilla.text_to_3d"
    bl_label = "Generate"
    bl_options = {"REGISTER"}

    def execute(self, context):
        scene = context.scene
        prompt = (scene.hydrilla_prompt or "").strip()
        if not prompt:
            self.report({"ERROR"}, "Enter a prompt")
            return {"CANCELLED"}
        if scene.hydrilla_busy or _JOB["busy"]:
            self.report({"WARNING"}, "Already generating — see Status in Hydrilla panel")
            return {"CANCELLED"}

        try:
            client = _resolve_client(context)
            _ensure_fresh_clerk_token(client.token, client.mode)
        except Exception as error:
            message = _user_error(error)
            status_kind = "SESSION" if _is_session_error(message) else "ERROR"
            _set_scene_status(scene, message, kind=status_kind, phase="Session")
            self.report({"ERROR"}, message)
            _show_hydrilla_popup(
                message,
                title="Hydrilla — Session" if status_kind == "SESSION" else "Hydrilla — Sign in",
                icon="ERROR",
            )
            return {"CANCELLED"}

        token = client.token
        base_url = client.base_url
        mode = client.mode
        _set_scene_status(
            scene,
            f"Starting text → 3D… {SESSION_KEEP_TAB}",
            kind="RUNNING",
            phase="Starting",
            progress=0,
            busy=True,
            task_id="",
        )
        _tag_hydrilla_redraw()

        def worker():
            try:
                if _JOB["cancel"]:
                    raise api_client.HydrillaApiError("Generation cancelled")
                _ensure_fresh_clerk_token(token, mode)
                job_client = api_client.HydrillaClient(
                    token,
                    base_url=base_url,
                    mode=mode,
                    token_provider=_bridge_token_provider() if mode == "clerk" else None,
                )
                if mode == "clerk":
                    _job_emit(
                        "status",
                        text=f"Creating preview image… keep Connect tab open",
                        phase="Preview",
                        progress=5,
                    )
                    image = job_client.text_to_image(prompt)
                    image_url = image.get("image_url")
                    if not image_url:
                        raise api_client.HydrillaApiError("Text-to-image did not return image_url")
                    if _JOB["cancel"]:
                        raise api_client.HydrillaApiError("Generation cancelled")
                    _ensure_fresh_clerk_token(job_client.token, mode)
                    _job_emit(
                        "status",
                        text="Submitting 3D job…",
                        phase="Submit",
                        progress=15,
                    )
                    created = job_client.image_to_3d_url(image_url, prompt=prompt)
                else:
                    _job_emit(
                        "status",
                        text="Submitting text → 3D…",
                        phase="Submit",
                        progress=10,
                    )
                    created = job_client.text_to_3d(prompt)

                task_id = created.get("id") or created.get("task_id")
                if not task_id:
                    raise api_client.HydrillaApiError("No task id returned")
                _job_emit(
                    "status",
                    text=f"Task {task_id[:8]}… waiting for GPU",
                    phase="Queued",
                    progress=20,
                    task_id=str(task_id),
                )

                task = _wait_task_cancellable(job_client, str(task_id))
                if str(task.get("status") or "").upper() != "SUCCEEDED":
                    raise api_client.HydrillaApiError(task.get("error") or "Generation failed")
                mesh_url = (task.get("result") or {}).get("mesh_url")
                if not mesh_url:
                    raise api_client.HydrillaApiError("No mesh_url on success")
                _job_emit(
                    "status",
                    text="Downloading mesh…",
                    phase="Download",
                    progress=95,
                    task_id=str(task_id),
                )
                path = api_client.download_to_temp(job_client, mesh_url, task_id)
                _job_emit("done", path=path)
            except Exception as error:
                _job_emit("error", text=_user_error(error))

        if not _start_background_job(worker, mode=mode):
            scene.hydrilla_busy = False
            self.report({"WARNING"}, "Already generating")
            return {"CANCELLED"}

        _start_jobs_fetch(context, quiet=True)
        self.report({"INFO"}, "Generating — watch Status + Your jobs")
        return {"FINISHED"}


class HYDRILLA_OT_pick_image(Operator, ImportHelper):
    bl_idname = "hydrilla.pick_image"
    bl_label = "Browse image"
    bl_description = "Pick a local PNG/JPG to preview and convert to 3D"

    filename_ext = ".png"
    filter_glob: StringProperty(
        default="*.png;*.jpg;*.jpeg;*.webp;*.bmp;*.tif;*.tiff",
        options={"HIDDEN"},
    )

    def execute(self, context):
        scene = context.scene
        path = (self.filepath or "").strip()
        if not path or not os.path.isfile(path):
            self.report({"ERROR"}, "Choose a valid image file")
            return {"CANCELLED"}
        try:
            image = bpy.data.images.load(path, check_existing=True)
        except Exception as error:
            self.report({"ERROR"}, f"Could not load image: {error}")
            return {"CANCELLED"}

        scene.hydrilla_image_path = path
        scene.hydrilla_preview = image
        scene.hydrilla_image_url = ""
        scene.hydrilla_status = f"Image ready · {os.path.basename(path)}"
        self.report({"INFO"}, f"Loaded {os.path.basename(path)}")
        return {"FINISHED"}


class HYDRILLA_OT_image_to_3d(Operator):
    bl_idname = "hydrilla.image_to_3d"
    bl_label = "Generate from image"
    bl_options = {"REGISTER"}

    def execute(self, context):
        scene = context.scene
        image_path = (scene.hydrilla_image_path or "").strip()
        image_url = (scene.hydrilla_image_url or "").strip()

        if image_path and os.path.isfile(image_path):
            source = "file"
        elif (
            image_url.startswith("http://")
            or image_url.startswith("https://")
            or image_url.startswith("data:")
        ):
            source = "url"
        else:
            message = (
                "Browse a local image (PNG/JPG), or paste an https:// image URL. "
                "Text like “hulk” belongs in Text mode."
            )
            scene.hydrilla_status = message
            self.report({"ERROR"}, message)
            return {"CANCELLED"}

        if scene.hydrilla_busy or _JOB["busy"]:
            self.report({"WARNING"}, "Already generating — see Status in Hydrilla panel")
            return {"CANCELLED"}

        try:
            client = _resolve_client(context)
            _ensure_fresh_clerk_token(client.token, client.mode)
        except Exception as error:
            message = _user_error(error)
            status_kind = "SESSION" if _is_session_error(message) else "ERROR"
            _set_scene_status(scene, message, kind=status_kind, phase="Session")
            self.report({"ERROR"}, message)
            _show_hydrilla_popup(
                message,
                title="Hydrilla — Session" if status_kind == "SESSION" else "Hydrilla — Sign in",
                icon="ERROR",
            )
            return {"CANCELLED"}

        token = client.token
        base_url = client.base_url
        mode = client.mode
        _set_scene_status(
            scene,
            f"Starting image → 3D… {SESSION_KEEP_TAB}",
            kind="RUNNING",
            phase="Starting",
            progress=0,
            busy=True,
            task_id="",
        )
        _tag_hydrilla_redraw()

        def worker():
            try:
                if _JOB["cancel"]:
                    raise api_client.HydrillaApiError("Generation cancelled")
                _ensure_fresh_clerk_token(token, mode)
                job_client = api_client.HydrillaClient(
                    token,
                    base_url=base_url,
                    mode=mode,
                    token_provider=_bridge_token_provider() if mode == "clerk" else None,
                )
                if source == "file":
                    _job_emit(
                        "status",
                        text="Uploading image…",
                        phase="Upload",
                        progress=10,
                    )
                    created = job_client.image_to_3d_file(image_path)
                else:
                    _job_emit(
                        "status",
                        text="Submitting image → 3D…",
                        phase="Submit",
                        progress=10,
                    )
                    created = job_client.image_to_3d_url(image_url)

                task_id = created.get("id") or created.get("task_id") or created.get("jobId")
                if not task_id:
                    raise api_client.HydrillaApiError("No task id returned")
                _job_emit(
                    "status",
                    text=f"Task {str(task_id)[:8]}… waiting for GPU",
                    phase="Queued",
                    progress=20,
                    task_id=str(task_id),
                )

                task = _wait_task_cancellable(job_client, str(task_id))
                if str(task.get("status") or "").upper() != "SUCCEEDED":
                    raise api_client.HydrillaApiError(task.get("error") or "Generation failed")
                mesh_url = (task.get("result") or {}).get("mesh_url")
                if not mesh_url:
                    raise api_client.HydrillaApiError("No mesh_url on success")
                _job_emit(
                    "status",
                    text="Downloading mesh…",
                    phase="Download",
                    progress=95,
                    task_id=str(task_id),
                )
                path = api_client.download_to_temp(job_client, mesh_url, task_id)
                _job_emit("done", path=path)
            except Exception as error:
                _job_emit("error", text=_user_error(error))

        if not _start_background_job(worker, mode=mode):
            scene.hydrilla_busy = False
            self.report({"WARNING"}, "Already generating")
            return {"CANCELLED"}

        _start_jobs_fetch(context, quiet=True)
        self.report({"INFO"}, "Generating — watch Status + Your jobs")
        return {"FINISHED"}


class HYDRILLA_OT_cancel_generate(Operator):
    bl_idname = "hydrilla.cancel_generate"
    bl_label = "Cancel generate"

    def execute(self, context):
        if not _JOB["busy"] and not context.scene.hydrilla_busy:
            self.report({"INFO"}, "Nothing to cancel")
            return {"CANCELLED"}
        _JOB["cancel"] = True
        _set_scene_status(
            context.scene,
            "Cancelling…",
            kind="RUNNING",
            phase="Cancelling",
            busy=True,
        )
        _tag_hydrilla_redraw()
        self.report({"INFO"}, "Cancel requested")
        return {"FINISHED"}


class HYDRILLA_OT_resume_job(Operator):
    bl_idname = "hydrilla.resume_job"
    bl_label = "Resume / poll task"
    bl_description = "If a task id was saved and the job stopped, poll again after reconnect"

    def execute(self, context):
        scene = context.scene
        task_id = (scene.hydrilla_job_task_id or "").strip()
        if not task_id:
            self.report({"ERROR"}, "No saved task id to resume")
            return {"CANCELLED"}
        if scene.hydrilla_busy or _JOB["busy"]:
            self.report({"WARNING"}, "A job is already running — see Status")
            return {"CANCELLED"}

        try:
            client = _resolve_client(context)
            _ensure_fresh_clerk_token(client.token, client.mode)
        except Exception as error:
            message = _user_error(error)
            status_kind = "SESSION" if _is_session_error(message) else "ERROR"
            _set_scene_status(scene, message, kind=status_kind, phase="Session")
            self.report({"ERROR"}, message)
            return {"CANCELLED"}

        token = client.token
        base_url = client.base_url
        mode = client.mode
        _set_scene_status(
            scene,
            f"Resuming task {task_id[:8]}…",
            kind="RUNNING",
            phase="Resume",
            progress=0,
            busy=True,
            task_id=task_id,
        )

        def worker():
            try:
                job_client = api_client.HydrillaClient(
                    token,
                    base_url=base_url,
                    mode=mode,
                    token_provider=_bridge_token_provider() if mode == "clerk" else None,
                )
                task = _wait_task_cancellable(job_client, task_id)
                if str(task.get("status") or "").upper() != "SUCCEEDED":
                    raise api_client.HydrillaApiError(task.get("error") or "Generation failed")
                mesh_url = (task.get("result") or {}).get("mesh_url")
                if not mesh_url:
                    raise api_client.HydrillaApiError("No mesh_url on success")
                _job_emit(
                    "status",
                    text="Downloading mesh…",
                    phase="Download",
                    progress=95,
                    task_id=task_id,
                )
                path = api_client.download_to_temp(job_client, mesh_url, task_id)
                _job_emit("done", path=path)
            except Exception as error:
                _job_emit("error", text=_user_error(error))

        if not _start_background_job(worker, mode=mode):
            scene.hydrilla_busy = False
            self.report({"WARNING"}, "Already generating")
            return {"CANCELLED"}

        self.report({"INFO"}, "Resumed — watch Status panel")
        return {"FINISHED"}


class HYDRILLA_OT_refresh_jobs(Operator):
    bl_idname = "hydrilla.refresh_jobs"
    bl_label = "Refresh jobs"
    bl_description = "Load pending and running jobs for your Hydrilla account"

    def execute(self, context):
        if _start_jobs_fetch(context, quiet=False):
            self.report({"INFO"}, "Loading your jobs…")
            return {"FINISHED"}
        if _JOBS_UI["fetching"]:
            self.report({"INFO"}, "Already refreshing jobs")
            return {"FINISHED"}
        self.report({"ERROR"}, context.scene.hydrilla_status or "Could not refresh jobs")
        return {"CANCELLED"}


class HYDRILLA_OT_import_account_job(Operator):
    bl_idname = "hydrilla.import_account_job"
    bl_label = "Import job"
    bl_options = {"REGISTER", "UNDO"}

    index: IntProperty(default=0)

    def execute(self, context):
        scene = context.scene
        jobs = scene.hydrilla_jobs
        if self.index < 0 or self.index >= len(jobs):
            self.report({"ERROR"}, "Invalid job")
            return {"CANCELLED"}
        item = jobs[self.index]
        job_id = (item.job_id or "").strip()
        if not job_id:
            self.report({"ERROR"}, "Job has no id")
            return {"CANCELLED"}

        label = _job_status_label(item.status)
        if label not in {"Done"}:
            self.report({"WARNING"}, f"Job is {label} — wait until Done to import")
            return {"CANCELLED"}

        if scene.hydrilla_busy or _JOB["busy"]:
            self.report({"WARNING"}, "Another generate is running")
            return {"CANCELLED"}

        try:
            client = _resolve_client(context)
            _ensure_fresh_clerk_token(client.token, client.mode)
        except Exception as error:
            message = _user_error(error)
            _set_scene_status(
                scene,
                message,
                kind="SESSION" if _is_session_error(message) else "ERROR",
            )
            self.report({"ERROR"}, message)
            return {"CANCELLED"}

        token = client.token
        base_url = client.base_url
        mode = client.mode
        mesh_url = (item.mesh_url or "").strip()
        _set_scene_status(
            scene,
            f"Importing job {job_id[:8]}…",
            kind="RUNNING",
            phase="Import",
            busy=True,
            task_id=job_id,
        )

        def worker():
            try:
                job_client = api_client.HydrillaClient(
                    token,
                    base_url=base_url,
                    mode=mode,
                    token_provider=_bridge_token_provider() if mode == "clerk" else None,
                )
                url = mesh_url
                if not url:
                    task = job_client.get_task(job_id)
                    url = ((task.get("result") or {}).get("mesh_url") or "").strip()
                if not url:
                    url = f"{base_url}/api/3d/glb/{job_id}"
                _job_emit(
                    "status",
                    text="Downloading mesh…",
                    phase="Download",
                    progress=95,
                    task_id=job_id,
                )
                path = api_client.download_to_temp(job_client, url, job_id)
                _job_emit("done", path=path)
            except Exception as error:
                _job_emit("error", text=_user_error(error))

        if not _start_background_job(worker, mode=mode):
            scene.hydrilla_busy = False
            self.report({"WARNING"}, "Already generating")
            return {"CANCELLED"}

        self.report({"INFO"}, "Importing — watch Status")
        return {"FINISHED"}


class HYDRILLA_OT_poll_bridge(Operator):
    bl_idname = "hydrilla.poll_bridge"
    bl_label = "Import from Studio"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        scene = context.scene
        if not _bridge_running(context):
            self.report({"ERROR"}, "Run Bridge first")
            return {"CANCELLED"}
        try:
            items = bridge_runtime.pop_pending("blender") or bridge_runtime.pop_pending()
            if not items:
                scene.hydrilla_status = "Nothing waiting from Studio"
                self.report({"INFO"}, "No pending items")
                return {"CANCELLED"}
            item = items[0]
            path = item.get("file_path") or item.get("path")
            name = item.get("name") or item.get("job_id") or "bridge"
            if path and os.path.exists(path):
                bpy.ops.import_scene.gltf(filepath=path)
                bridge_runtime.ack_pending(str(item.get("id") or ""))
                try:
                    os.remove(path)
                except Exception:
                    pass
            else:
                mesh_url = item.get("mesh_url")
                if not mesh_url:
                    raise RuntimeError("Bridge item missing file")
                client = _resolve_client(context)
                path = api_client.download_to_temp(client, mesh_url, str(name))
                bpy.ops.import_scene.gltf(filepath=path)
                bridge_runtime.ack_pending(str(item.get("id") or ""))
            scene.hydrilla_status = f"Imported from Studio · {name}"
            self.report({"INFO"}, "Imported from Studio")
            return {"FINISHED"}
        except Exception as error:
            scene.hydrilla_status = str(error)
            self.report({"ERROR"}, str(error))
            return {"CANCELLED"}


class HYDRILLA_PT_main(Panel):
    bl_label = "Hydrilla"
    bl_idname = "HYDRILLA_PT_main"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Hydrilla"

    def draw(self, context):
        layout = self.layout
        hero = layout.box()
        title = hero.row()
        title.label(text="Hydrilla", icon="OUTLINER_OB_MESH")
        hero.label(text="AI 3D for your scene")


class HYDRILLA_PT_bridge(Panel):
    bl_label = "Bridge"
    bl_idname = "HYDRILLA_PT_bridge"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Hydrilla"
    bl_parent_id = "HYDRILLA_PT_main"

    def draw(self, context):
        layout = self.layout
        props = context.window_manager.hydrilla_bridge_props
        box = layout.box()
        if props.bridge_running:
            box.operator(
                "hydrilla.bridge_stop",
                text="Bridge ON",
                icon="CHECKMARK",
                depress=True,
            )
            box.label(text=f"127.0.0.1:{bridge_runtime.BRIDGE_PORT}")
        else:
            box.operator("hydrilla.bridge_start", text="Run Bridge", icon="PLAY")
            box.label(text="Required for sign-in & Studio send")


class HYDRILLA_PT_account(Panel):
    bl_label = "Account"
    bl_idname = "HYDRILLA_PT_account"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Hydrilla"
    bl_parent_id = "HYDRILLA_PT_main"

    def draw(self, context):
        layout = self.layout
        scene = context.scene
        box = layout.box()
        mode = scene.hydrilla_auth_mode or "NONE"
        if mode == "CLERK":
            box.label(text=scene.hydrilla_account or "Signed in", icon="CHECKMARK")
        elif mode == "API":
            box.label(text="Using API key", icon="KEYINGSET")
        else:
            box.label(text="Not signed in", icon="ERROR")

        row = box.row(align=True)
        row.scale_y = 1.2
        row.operator("hydrilla.sign_in", text="Sign in", icon="URL")
        row.operator("hydrilla.sync_account", text="Sync", icon="FILE_REFRESH")
        box.operator("hydrilla.sign_out", text="Sign out", icon="QUIT")
        box.label(text="Or set API key in Add-on Preferences", icon="INFO")


class HYDRILLA_PT_status(Panel):
    bl_label = "Status"
    bl_idname = "HYDRILLA_PT_status"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Hydrilla"
    bl_parent_id = "HYDRILLA_PT_main"
    bl_options = set()

    def draw(self, context):
        _draw_status_block(self.layout, context.scene)


class HYDRILLA_PT_jobs(Panel):
    bl_label = "Your jobs"
    bl_idname = "HYDRILLA_PT_jobs"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Hydrilla"
    bl_parent_id = "HYDRILLA_PT_main"

    def draw(self, context):
        layout = self.layout
        scene = context.scene
        box = layout.box()

        pending = int(getattr(scene, "hydrilla_jobs_pending", 0) or 0)
        running = int(getattr(scene, "hydrilla_jobs_running", 0) or 0)
        done = int(getattr(scene, "hydrilla_jobs_done", 0) or 0)
        failed = int(getattr(scene, "hydrilla_jobs_failed", 0) or 0)

        header = box.row()
        if _JOBS_UI["fetching"]:
            header.label(text="Loading jobs…", icon="SORTTIME")
        elif running or pending:
            header.label(
                text=f"{running} running · {pending} pending",
                icon="SORTTIME",
            )
        else:
            header.label(text=f"{done} done · {failed} failed", icon="CHECKMARK")
        refresh = header.row()
        refresh.enabled = not _JOBS_UI["fetching"]
        refresh.operator("hydrilla.refresh_jobs", text="", icon="FILE_REFRESH")

        mode = scene.hydrilla_auth_mode or "NONE"
        if mode != "CLERK":
            box.label(text="Sign in + Sync to see your jobs", icon="INFO")
            return

        error = (getattr(scene, "hydrilla_jobs_error", "") or "").strip()
        if error:
            for line in _wrap_status_lines(error, width=32):
                box.label(text=line, icon="ERROR")
            row = box.row(align=True)
            row.operator("hydrilla.sign_in", text="Sign in", icon="URL")
            row.operator("hydrilla.sync_account", text="Sync", icon="FILE_REFRESH")

        fetched = getattr(scene, "hydrilla_jobs_fetched_at", "") or ""
        if fetched:
            box.label(text=f"Updated {fetched}")

        counts = box.row(align=True)
        counts.label(text=f"R {running}")
        counts.label(text=f"P {pending}")
        counts.label(text=f"D {done}")
        counts.label(text=f"F {failed}")

        box.prop(scene, "hydrilla_jobs_show_all", text="Show completed / failed")

        jobs = list(scene.hydrilla_jobs)
        show_all = bool(scene.hydrilla_jobs_show_all)
        visible = []
        for index, item in enumerate(jobs):
            status = _normalize_job_status(
                item.status or "",
                has_mesh=bool((item.mesh_url or "").strip()),
            )
            if status in {"RUNNING", "PENDING"}:
                visible.append((index, item, status))
            elif show_all and status in {"DONE", "FAILED", "CANCELLED"}:
                visible.append((index, item, status))

        # If nothing active, still show recent completed so the list is useful
        if not visible and jobs:
            for index, item in enumerate(jobs[:10]):
                status = _normalize_job_status(
                    item.status or "",
                    has_mesh=bool((item.mesh_url or "").strip()),
                )
                visible.append((index, item, status))

        if _JOBS_UI["fetching"] and not visible:
            box.label(text="Fetching from Hydrilla…", icon="SORTTIME")
            return

        if not visible and not error:
            box.label(text="No jobs yet for this account", icon="INFO")
            box.label(text="Generate once, then Refresh")
            return

        last_group = ""
        for index, item, status in visible[:16]:
            label = _job_status_label(status, has_mesh=bool(item.mesh_url))
            if label != last_group:
                box.label(text=label.upper(), icon=_job_status_icon(status, has_mesh=bool(item.mesh_url)))
                last_group = label
            col = box.box()
            top = col.row(align=True)
            top.label(text=_truncate(item.prompt, 28))
            top.label(text=str(item.job_id or "")[:8])
            meta = col.row(align=True)
            meta.label(text=label)
            if item.generate_type:
                meta.label(text=str(item.generate_type)[:14])
            if label == "Done":
                op = col.operator(
                    "hydrilla.import_account_job",
                    text="Import mesh",
                    icon="IMPORT",
                )
                op.index = index


class HYDRILLA_PT_generate(Panel):
    bl_label = "Generate"
    bl_idname = "HYDRILLA_PT_generate"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Hydrilla"
    bl_parent_id = "HYDRILLA_PT_main"

    def draw(self, context):
        layout = self.layout
        scene = context.scene

        layout.prop(scene, "hydrilla_gen_mode", expand=True)

        busy = _local_job_busy(scene)
        box = layout.box()
        if scene.hydrilla_gen_mode == "TEXT":
            box.label(text="Text to 3D", icon="FONT_DATA")
            box.prop(scene, "hydrilla_prompt", text="")
            op = box.row()
            op.scale_y = 1.35
            op.enabled = not busy
            op.operator("hydrilla.text_to_3d", text="Generate mesh", icon="MESH_CUBE")
        else:
            box.label(text="Image to 3D", icon="IMAGE_DATA")
            browse = box.row()
            browse.enabled = not busy
            browse.operator("hydrilla.pick_image", text="Browse image…", icon="FILEBROWSER")
            if scene.hydrilla_preview:
                box.template_ID_preview(scene, "hydrilla_preview", rows=3, cols=4)
                box.label(text=os.path.basename(scene.hydrilla_image_path or "") or "Preview")
            else:
                box.label(text="No image selected", icon="INFO")
            box.separator()
            box.label(text="Or paste an https image URL")
            box.prop(scene, "hydrilla_image_url", text="")
            op = box.row()
            op.scale_y = 1.35
            op.enabled = not busy
            op.operator("hydrilla.image_to_3d", text="Generate mesh", icon="MESH_CUBE")

        if busy:
            box.label(text="Generating — see Status + Your jobs", icon="SORTTIME")
        elif int(getattr(scene, "hydrilla_jobs_done", 0) or 0) > 0:
            box.label(text="Finished jobs are under Your jobs → Done", icon="CHECKMARK")


class HYDRILLA_PT_studio(Panel):
    bl_label = "From Studio"
    bl_idname = "HYDRILLA_PT_studio"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Hydrilla"
    bl_parent_id = "HYDRILLA_PT_main"
    bl_options = {"DEFAULT_CLOSED"}

    def draw(self, context):
        layout = self.layout
        running = _bridge_running(context)
        box = layout.box()
        box.label(text="Receive meshes sent from Studio", icon="IMPORT")
        if not running:
            box.label(text="Run Bridge first", icon="ERROR")
        row = box.row()
        row.scale_y = 1.25
        row.enabled = running
        row.operator("hydrilla.poll_bridge", text="Import from Studio", icon="IMPORT")


classes = (
    HydrillaJobItem,
    HydrillaPreferences,
    HYDRILLA_OT_prefs_local,
    HYDRILLA_OT_prefs_production,
    HYDRILLA_OT_sign_in,
    HYDRILLA_OT_sync_account,
    HYDRILLA_OT_sign_out,
    HYDRILLA_OT_text_to_3d,
    HYDRILLA_OT_pick_image,
    HYDRILLA_OT_image_to_3d,
    HYDRILLA_OT_cancel_generate,
    HYDRILLA_OT_resume_job,
    HYDRILLA_OT_refresh_jobs,
    HYDRILLA_OT_import_account_job,
    HYDRILLA_OT_poll_bridge,
    HYDRILLA_PT_main,
    HYDRILLA_PT_bridge,
    HYDRILLA_PT_account,
    HYDRILLA_PT_status,
    HYDRILLA_PT_jobs,
    HYDRILLA_PT_generate,
    HYDRILLA_PT_studio,
)


def register():
    # Pick up updated submodule files after zip reinstall without restarting Blender
    importlib.reload(api_client)
    importlib.reload(bridge_client)
    importlib.reload(bridge_runtime)

    bridge_runtime.register_runtime()
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Scene.hydrilla_prompt = StringProperty(name="Prompt", default="", maxlen=2000)
    bpy.types.Scene.hydrilla_image_url = StringProperty(
        name="Image URL",
        description="Optional https:// image link (or use Browse image)",
        default="",
    )
    bpy.types.Scene.hydrilla_image_path = StringProperty(
        name="Image Path",
        description="Local image selected via Browse",
        default="",
        subtype="FILE_PATH",
    )
    bpy.types.Scene.hydrilla_preview = PointerProperty(
        name="Preview",
        type=bpy.types.Image,
    )
    bpy.types.Scene.hydrilla_status = StringProperty(name="Status", default="Ready")
    bpy.types.Scene.hydrilla_status_kind = EnumProperty(
        name="Status kind",
        items=(
            ("INFO", "Info", ""),
            ("RUNNING", "Running", ""),
            ("DONE", "Done", ""),
            ("ERROR", "Error", ""),
            ("SESSION", "Session", ""),
        ),
        default="INFO",
    )
    bpy.types.Scene.hydrilla_busy = BoolProperty(
        name="Busy",
        description="True while a background generate job is running",
        default=False,
    )
    bpy.types.Scene.hydrilla_job_phase = StringProperty(name="Job phase", default="")
    bpy.types.Scene.hydrilla_job_progress = IntProperty(
        name="Job progress",
        default=0,
        min=0,
        max=100,
    )
    bpy.types.Scene.hydrilla_job_task_id = StringProperty(name="Job task id", default="")
    bpy.types.Scene.hydrilla_account = StringProperty(name="Account", default="Not signed in")
    bpy.types.Scene.hydrilla_auth_mode = EnumProperty(
        name="Auth",
        items=(
            ("NONE", "None", ""),
            ("CLERK", "Clerk", ""),
            ("API", "API key", ""),
        ),
        default="NONE",
    )
    bpy.types.Scene.hydrilla_gen_mode = EnumProperty(
        name="Mode",
        items=(
            ("TEXT", "Text", "Generate from a prompt"),
            ("IMAGE", "Image", "Generate from a local image or URL"),
        ),
        default="TEXT",
    )
    bpy.types.Scene.hydrilla_jobs = CollectionProperty(type=HydrillaJobItem)
    bpy.types.Scene.hydrilla_jobs_active = IntProperty(name="Active jobs", default=0)
    bpy.types.Scene.hydrilla_jobs_pending = IntProperty(name="Pending jobs", default=0)
    bpy.types.Scene.hydrilla_jobs_running = IntProperty(name="Running jobs", default=0)
    bpy.types.Scene.hydrilla_jobs_done = IntProperty(name="Done jobs", default=0)
    bpy.types.Scene.hydrilla_jobs_failed = IntProperty(name="Failed jobs", default=0)
    bpy.types.Scene.hydrilla_jobs_fetched_at = StringProperty(name="Jobs fetched", default="")
    bpy.types.Scene.hydrilla_jobs_error = StringProperty(name="Jobs error", default="")
    bpy.types.Scene.hydrilla_jobs_show_all = BoolProperty(
        name="Show completed",
        description="Also list recent Done/Failed jobs for this account",
        default=True,
    )


def unregister():
    _JOB["cancel"] = True
    _JOB["busy"] = False
    _JOBS_UI["fetching"] = False
    if bpy.app.timers.is_registered(_job_timer):
        bpy.app.timers.unregister(_job_timer)
    if bpy.app.timers.is_registered(_jobs_timer):
        bpy.app.timers.unregister(_jobs_timer)
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
    bridge_runtime.unregister_runtime()
    del bpy.types.Scene.hydrilla_prompt
    del bpy.types.Scene.hydrilla_image_url
    del bpy.types.Scene.hydrilla_image_path
    del bpy.types.Scene.hydrilla_preview
    del bpy.types.Scene.hydrilla_status
    del bpy.types.Scene.hydrilla_status_kind
    del bpy.types.Scene.hydrilla_busy
    del bpy.types.Scene.hydrilla_job_phase
    del bpy.types.Scene.hydrilla_job_progress
    del bpy.types.Scene.hydrilla_job_task_id
    del bpy.types.Scene.hydrilla_account
    del bpy.types.Scene.hydrilla_auth_mode
    del bpy.types.Scene.hydrilla_gen_mode
    del bpy.types.Scene.hydrilla_jobs
    del bpy.types.Scene.hydrilla_jobs_active
    del bpy.types.Scene.hydrilla_jobs_pending
    del bpy.types.Scene.hydrilla_jobs_running
    del bpy.types.Scene.hydrilla_jobs_done
    del bpy.types.Scene.hydrilla_jobs_failed
    del bpy.types.Scene.hydrilla_jobs_fetched_at
    del bpy.types.Scene.hydrilla_jobs_error
    del bpy.types.Scene.hydrilla_jobs_show_all
