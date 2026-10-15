bl_info = {
    "name": "Hydrilla",
    "author": "Hydrilla",
    "version": (1, 3, 11),
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
from typing import Optional
from urllib.parse import urlparse

import bpy
from bpy.props import BoolProperty, EnumProperty, PointerProperty, StringProperty
from bpy.types import AddonPreferences, Operator, Panel
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
    "Keep the browser Connect tab open while generating "
    "(it refreshes your login every ~20s)."
)
MIN_TOKEN_SECONDS = 20


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
}


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


def _draw_status_block(layout, scene) -> None:
    """Full status text as wrapped labels only (no editable field)."""
    busy = bool(scene.hydrilla_busy)
    box = layout.box()
    header = box.row()
    if busy:
        header.label(text="Working…", icon="SORTTIME")
    else:
        header.label(text="Status", icon="TIME")
    for line in _wrap_status_lines(scene.hydrilla_status or "Ready"):
        box.label(text=line)
    if busy:
        box.operator("hydrilla.cancel_generate", text="Cancel", icon="X")


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
                scene.hydrilla_status = str(event.get("text") or "")
                scene.hydrilla_busy = True
            elif kind == "error":
                message = str(event.get("text") or "Failed")
                scene.hydrilla_status = message
                scene.hydrilla_busy = False
                _JOB["busy"] = False
                _JOB["cancel"] = False
                _tag_hydrilla_redraw()
                _show_hydrilla_popup(message, title="Hydrilla — Failed", icon="ERROR")
                return None
            elif kind == "done":
                path = event.get("path") or ""
                try:
                    if path and os.path.isfile(path):
                        bpy.ops.import_scene.gltf(filepath=path)
                    scene.hydrilla_status = "Imported into scene"
                    _show_hydrilla_popup(
                        "Mesh imported into the scene.",
                        title="Hydrilla — Done",
                        icon="CHECKMARK",
                    )
                except Exception as error:
                    message = _user_error(error)
                    scene.hydrilla_status = message
                    _show_hydrilla_popup(message, title="Hydrilla — Failed", icon="ERROR")
                scene.hydrilla_busy = False
                _JOB["busy"] = False
                _JOB["cancel"] = False
                _tag_hydrilla_redraw()
                return None
            _tag_hydrilla_redraw()
    except Empty:
        pass

    if not _JOB["busy"]:
        scene.hydrilla_busy = False
        return None
    _tag_hydrilla_redraw()
    return 0.2


def _start_background_job(worker) -> bool:
    if _JOB["busy"]:
        return False
    _JOB["busy"] = True
    _JOB["cancel"] = False
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


def _wait_task_cancellable(client, task_id: str) -> dict:
    started = time.time()
    while True:
        if _JOB["cancel"]:
            raise api_client.HydrillaApiError("Generation cancelled")
        task = client.get_task(task_id)
        status = str(task.get("status") or "").upper()
        progress = task.get("progress")
        _job_emit("status", text=f"{status} · {progress}%")
        if status in {"SUCCEEDED", "FAILED", "CANCELLED"}:
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
        if not _bridge_running(context):
            self.report({"ERROR"}, "Run Bridge first")
            context.scene.hydrilla_status = "Run Bridge first"
            return {"CANCELLED"}
        try:
            session = bridge_runtime.get_auth_session()
            if not session.get("signed_in"):
                session = bridge_client.BridgeClient(_prefs_bridge_url(prefs)).get_auth()
            if not session.get("signed_in"):
                if prefs.api_key:
                    context.scene.hydrilla_account = "API key"
                    context.scene.hydrilla_auth_mode = "API"
                    context.scene.hydrilla_status = "Using API key"
                    self.report({"INFO"}, "No Clerk session — using API key")
                    return {"FINISHED"}
                context.scene.hydrilla_account = "Not signed in"
                context.scene.hydrilla_auth_mode = "NONE"
                context.scene.hydrilla_status = SESSION_REAUTH
                self.report({"ERROR"}, "No session yet — Sign in and keep Connect tab open")
                return {"CANCELLED"}

            token = str(session.get("token") or "")
            left = _jwt_seconds_left(token)
            if left is not None and left < MIN_TOKEN_SECONDS:
                context.scene.hydrilla_account = "Session expired"
                context.scene.hydrilla_auth_mode = "NONE"
                context.scene.hydrilla_status = SESSION_REAUTH
                self.report({"ERROR"}, "Session expired — Sign in again, keep Connect tab open")
                return {"CANCELLED"}

            email = session.get("email") or "Hydrilla account"
            context.scene.hydrilla_account = email
            context.scene.hydrilla_auth_mode = "CLERK"
            context.scene.hydrilla_status = f"Signed in as {email}. {SESSION_KEEP_TAB}"
            self.report({"INFO"}, f"Signed in as {email} — keep Connect tab open")
            return {"FINISHED"}
        except Exception as error:
            message = _user_error(error)
            context.scene.hydrilla_status = message
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
            scene.hydrilla_status = message
            self.report({"ERROR"}, message)
            _show_hydrilla_popup(message, title="Hydrilla — Sign in", icon="ERROR")
            return {"CANCELLED"}

        token = client.token
        base_url = client.base_url
        mode = client.mode
        scene.hydrilla_busy = True
        scene.hydrilla_status = f"Queued… {SESSION_KEEP_TAB}"
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
                    _job_emit("status", text=f"Creating preview image… {SESSION_KEEP_TAB}")
                    image = job_client.text_to_image(prompt)
                    image_url = image.get("image_url")
                    if not image_url:
                        raise api_client.HydrillaApiError("Text-to-image did not return image_url")
                    if _JOB["cancel"]:
                        raise api_client.HydrillaApiError("Generation cancelled")
                    _ensure_fresh_clerk_token(job_client.token, mode)
                    _job_emit("status", text="Submitting 3D job…")
                    created = job_client.image_to_3d_url(image_url, prompt=prompt)
                else:
                    _job_emit("status", text="Submitting…")
                    created = job_client.text_to_3d(prompt)

                task_id = created.get("id") or created.get("task_id")
                if not task_id:
                    raise api_client.HydrillaApiError("No task id returned")

                task = _wait_task_cancellable(job_client, task_id)
                if str(task.get("status") or "").upper() != "SUCCEEDED":
                    raise api_client.HydrillaApiError(task.get("error") or "Generation failed")
                mesh_url = (task.get("result") or {}).get("mesh_url")
                if not mesh_url:
                    raise api_client.HydrillaApiError("No mesh_url on success")
                _job_emit("status", text="Downloading mesh…")
                path = api_client.download_to_temp(job_client, mesh_url, task_id)
                _job_emit("done", path=path)
            except Exception as error:
                _job_emit("error", text=_user_error(error))

        if not _start_background_job(worker):
            scene.hydrilla_busy = False
            self.report({"WARNING"}, "Already generating")
            return {"CANCELLED"}

        self.report({"INFO"}, "Generating — keep Connect tab open; see Status below")
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
            scene.hydrilla_status = message
            self.report({"ERROR"}, message)
            _show_hydrilla_popup(message, title="Hydrilla — Sign in", icon="ERROR")
            return {"CANCELLED"}

        token = client.token
        base_url = client.base_url
        mode = client.mode
        scene.hydrilla_busy = True
        scene.hydrilla_status = f"Queued… {SESSION_KEEP_TAB}"
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
                    _job_emit("status", text="Uploading image…")
                    created = job_client.image_to_3d_file(image_path)
                else:
                    _job_emit("status", text="Submitting…")
                    created = job_client.image_to_3d_url(image_url)

                task_id = created.get("id") or created.get("task_id") or created.get("jobId")
                if not task_id:
                    raise api_client.HydrillaApiError("No task id returned")

                task = _wait_task_cancellable(job_client, task_id)
                if str(task.get("status") or "").upper() != "SUCCEEDED":
                    raise api_client.HydrillaApiError(task.get("error") or "Generation failed")
                mesh_url = (task.get("result") or {}).get("mesh_url")
                if not mesh_url:
                    raise api_client.HydrillaApiError("No mesh_url on success")
                _job_emit("status", text="Downloading mesh…")
                path = api_client.download_to_temp(job_client, mesh_url, task_id)
                _job_emit("done", path=path)
            except Exception as error:
                _job_emit("error", text=_user_error(error))

        if not _start_background_job(worker):
            scene.hydrilla_busy = False
            self.report({"WARNING"}, "Already generating")
            return {"CANCELLED"}

        self.report({"INFO"}, "Generating — progress is in the Hydrilla Status box")
        return {"FINISHED"}


class HYDRILLA_OT_cancel_generate(Operator):
    bl_idname = "hydrilla.cancel_generate"
    bl_label = "Cancel generate"

    def execute(self, context):
        if not _JOB["busy"] and not context.scene.hydrilla_busy:
            self.report({"INFO"}, "Nothing to cancel")
            return {"CANCELLED"}
        _JOB["cancel"] = True
        context.scene.hydrilla_status = "Cancelling…"
        _tag_hydrilla_redraw()
        self.report({"INFO"}, "Cancel requested")
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

        busy = bool(scene.hydrilla_busy)
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

        _draw_status_block(layout, scene)


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
    HYDRILLA_OT_poll_bridge,
    HYDRILLA_PT_main,
    HYDRILLA_PT_bridge,
    HYDRILLA_PT_account,
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
    bpy.types.Scene.hydrilla_busy = BoolProperty(
        name="Busy",
        description="True while a background generate job is running",
        default=False,
    )
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


def unregister():
    _JOB["cancel"] = True
    _JOB["busy"] = False
    if bpy.app.timers.is_registered(_job_timer):
        bpy.app.timers.unregister(_job_timer)
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
    bridge_runtime.unregister_runtime()
    del bpy.types.Scene.hydrilla_prompt
    del bpy.types.Scene.hydrilla_image_url
    del bpy.types.Scene.hydrilla_image_path
    del bpy.types.Scene.hydrilla_preview
    del bpy.types.Scene.hydrilla_status
    del bpy.types.Scene.hydrilla_busy
    del bpy.types.Scene.hydrilla_account
    del bpy.types.Scene.hydrilla_auth_mode
    del bpy.types.Scene.hydrilla_gen_mode
