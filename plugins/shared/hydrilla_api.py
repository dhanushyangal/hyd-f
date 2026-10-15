"""Hydrilla API client for DCC plugins — API key (/v1) or Clerk session (/api/3d)."""

from __future__ import annotations

import json
import mimetypes
import os
import tempfile
import time
import uuid
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Callable, Dict, Optional, Tuple

DEFAULT_BASE_URL = "https://api.hydrilla.ai"
DEFAULT_TIMEOUT_S = 120
POLL_INTERVAL_S = 2.0
MAX_POLL_S = 20 * 60
TokenProvider = Callable[[], Optional[str]]


class HydrillaApiError(Exception):
    def __init__(self, message: str, status: Optional[int] = None, body: Any = None):
        super().__init__(message)
        self.status = status
        self.body = body


def _unreachable_message(base_url: str, reason: Any) -> str:
    reason_s = str(reason or "unknown")
    lower = reason_s.lower()
    host = urllib.parse.urlparse(base_url).netloc or base_url
    if (
        "refused" in lower
        or "errno 61" in lower
        or "errno 111" in lower
        or "winerror 10061" in lower
    ):
        return (
            f"Hydrilla API offline ({host}). "
            "Start the backend, or set Preferences → API Base URL "
            "(local: http://localhost:4000)."
        )
    if "timed out" in lower or "timeout" in lower:
        return f"Hydrilla API timed out ({host}). Is the server running?"
    if (
        "nodename" in lower
        or "name or service" in lower
        or "getaddrinfo" in lower
        or "gaierror" in lower
    ):
        return (
            f"Cannot resolve Hydrilla API host ({host}). "
            "Check Preferences → API Base URL."
        )
    return f"Could not reach Hydrilla API ({host}): {reason_s}"


def _map_studio_status(raw: Optional[str]) -> str:
    status = (raw or "").upper()
    if status in {"DONE", "SUCCESS", "COMPLETED", "SUCCEEDED"}:
        return "SUCCEEDED"
    if status in {"FAIL", "FAILED", "ERROR"}:
        return "FAILED"
    if status in {"CANCELLED", "CANCELED"}:
        return "CANCELLED"
    if status in {"RUN", "RUNNING", "PROCESSING", "WAIT", "QUEUED"}:
        return "IN_PROGRESS"
    return "PENDING"


class HydrillaClient:
    """Bearer token client. mode='api' uses /v1; mode='clerk' uses /api/3d Studio routes."""

    def __init__(
        self,
        token: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout_s: int = DEFAULT_TIMEOUT_S,
        mode: str = "api",
        token_provider: Optional[TokenProvider] = None,
    ):
        self.token = (token or "").strip()
        self.api_key = self.token  # backward compatible alias
        self.base_url = (base_url or DEFAULT_BASE_URL).rstrip("/")
        self.timeout_s = timeout_s
        self.mode = "clerk" if mode == "clerk" else "api"
        # Clerk JWTs ~60s — refresh from Bridge before each request when possible
        self.token_provider = token_provider

    def _refresh_token(self) -> None:
        if not self.token_provider:
            return
        try:
            fresh = self.token_provider()
        except Exception:
            return
        if fresh and str(fresh).strip():
            self.token = str(fresh).strip()
            self.api_key = self.token

    def _headers(self, content_type: Optional[str] = "application/json") -> Dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/json",
            "User-Agent": "Hydrilla-DCC/1.0",
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def _request(
        self,
        method: str,
        path: str,
        payload: Optional[Dict[str, Any]] = None,
        data: Optional[bytes] = None,
        content_type: Optional[str] = "application/json",
    ) -> Dict[str, Any]:
        self._refresh_token()
        if not self.token:
            raise HydrillaApiError(
                "Not signed in. Use Sign in with Hydrilla, or set a hyd_live_ API key."
            )

        url = f"{self.base_url}{path}"
        body = data
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")

        request = urllib.request.Request(
            url,
            data=body,
            headers=self._headers(content_type),
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_s) as response:
                raw = response.read().decode("utf-8")
                if not raw:
                    return {}
                return json.loads(raw)
        except urllib.error.HTTPError as error:
            err_body: Any = None
            try:
                err_body = json.loads(error.read().decode("utf-8"))
            except Exception:
                err_body = None
            message = "Hydrilla API request failed"
            if isinstance(err_body, dict):
                nested = err_body.get("error")
                if isinstance(nested, dict) and nested.get("message"):
                    message = str(nested["message"])
                elif isinstance(nested, str):
                    message = nested
                elif err_body.get("message"):
                    message = str(err_body["message"])
            if error.code == 401:
                message = (
                    "Session expired. Click Sign in, finish in the browser, "
                    "KEEP the Connect tab open, then Sync and Generate again."
                )
            elif error.code == 402:
                message = message if message != "Hydrilla API request failed" else (
                    "Insufficient credits. Top up at hydrilla.ai."
                )
            elif error.code == 403:
                message = message if message != "Hydrilla API request failed" else (
                    "Not allowed. Check your account or API key."
                )
            elif error.code == 404:
                message = (
                    f"API route not found on {self.base_url}. "
                    "For local Studio use http://localhost:4000 in Preferences → API Base URL."
                )
            elif error.code >= 500:
                lower = message.lower()
                if "timeout" in lower or "aborted" in lower:
                    message = (
                        "3D GPU submit timed out (credits refunded). "
                        "Backend is up — retry Generate in a moment."
                    )
                elif message == "Hydrilla API request failed":
                    message = (
                        f"Generation service unavailable ({error.code}). "
                        "Backend is reachable but the GPU/job submit failed — retry shortly."
                    )
            raise HydrillaApiError(message, status=error.code, body=err_body) from error
        except TimeoutError as error:
            raise HydrillaApiError(
                f"Hydrilla API timed out ({self.base_url}). "
                "Text-to-image can take 20–40s — retry, or check the backend."
            ) from error
        except urllib.error.URLError as error:
            raise HydrillaApiError(_unreachable_message(self.base_url, error.reason)) from error

    def me(self) -> Dict[str, Any]:
        if self.mode == "clerk":
            return self._request("GET", "/api/3d/me")
        return self._request("GET", "/v1/user/me")

    def text_to_image(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        """Studio preview image step (Clerk). Caller should refresh token before /generate."""
        if self.mode != "clerk":
            raise HydrillaApiError("text_to_image is only available in Clerk/Studio mode")
        payload: Dict[str, Any] = {
            "prompt": prompt,
            "provider": kwargs.get("provider", "openai"),
            "quality": kwargs.get("quality", "low"),
            "aspect": kwargs.get("aspect", "1:1"),
        }
        # Backend skips image gen when GPU is down if for3d is set (no wasted credits)
        if kwargs.get("for3d", True):
            payload["for3d"] = True
            payload["intent"] = "text-to-3d"
        return self._request("POST", "/api/3d/text-to-image", payload=payload)

    def text_to_3d(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        if self.mode == "clerk":
            image_kwargs = {**kwargs, "for3d": True}
            image = self.text_to_image(prompt, **image_kwargs)
            image_url = image.get("image_url")
            if not image_url:
                raise HydrillaApiError("Text-to-image did not return image_url")
            # Refresh JWT between long steps when Bridge has a newer session
            self._refresh_token()
            generated = self._request(
                "POST",
                "/api/3d/generate",
                payload={"imageUrl": image_url, "prompt": prompt},
            )
            job_id = generated.get("jobId") or generated.get("job_id")
            if not job_id:
                raise HydrillaApiError("Generate did not return jobId")
            return {"id": job_id, "object": "task", "type": "text-to-3d", "status": "PENDING"}

        payload: Dict[str, Any] = {"prompt": prompt}
        payload.update(kwargs)
        return self._request("POST", "/v1/3d/text-to-3d", payload=payload)

    def image_to_3d_url(self, image_url: str, **kwargs: Any) -> Dict[str, Any]:
        if self.mode == "clerk":
            generated = self._request(
                "POST",
                "/api/3d/generate",
                payload={"imageUrl": image_url, "prompt": kwargs.get("prompt")},
            )
            job_id = generated.get("jobId") or generated.get("job_id")
            if not job_id:
                raise HydrillaApiError("Generate did not return jobId")
            return {"id": job_id, "object": "task", "type": "image-to-3d", "status": "PENDING"}

        payload: Dict[str, Any] = {"image_url": image_url}
        payload.update(kwargs)
        return self._request("POST", "/v1/3d/image-to-3d", payload=payload)

    def upload_image_file(self, file_path: str) -> str:
        """Upload a local image; returns a public/https URL for /generate."""
        if not os.path.isfile(file_path):
            raise HydrillaApiError(f"Image file not found: {file_path}")
        if self.mode != "clerk":
            raise HydrillaApiError(
                "Local image upload needs Clerk sign-in. "
                "Use Sign in + Sync, or paste an https image URL with an API key."
            )
        result = self._multipart_request(
            "POST",
            "/api/3d/upload-image",
            file_field="file",
            file_path=file_path,
        )
        url = result.get("url") or result.get("image_url")
        if not url:
            raise HydrillaApiError("Upload did not return an image URL")
        return str(url)

    def image_to_3d_file(self, file_path: str, **kwargs: Any) -> Dict[str, Any]:
        """Image-to-3D from a local file (upload for Clerk, multipart for API key)."""
        if not os.path.isfile(file_path):
            raise HydrillaApiError(f"Image file not found: {file_path}")

        if self.mode == "clerk":
            image_url = self.upload_image_file(file_path)
            self._refresh_token()
            return self.image_to_3d_url(image_url, **kwargs)

        return self._multipart_request(
            "POST",
            "/v1/3d/image-to-3d",
            file_field="image",
            file_path=file_path,
            fields={k: str(v) for k, v in kwargs.items() if v is not None},
        )

    def _multipart_request(
        self,
        method: str,
        path: str,
        *,
        file_field: str,
        file_path: str,
        fields: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        self._refresh_token()
        if not self.token:
            raise HydrillaApiError(
                "Not signed in. Use Sign in with Hydrilla, or set a hyd_live_ API key."
            )

        body, content_type = _encode_multipart_file(
            file_field,
            file_path,
            fields=fields or {},
        )
        url = f"{self.base_url}{path}"
        request = urllib.request.Request(
            url,
            data=body,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Accept": "application/json",
                "User-Agent": "Hydrilla-DCC/1.0",
                "Content-Type": content_type,
            },
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_s) as response:
                raw = response.read().decode("utf-8")
                if not raw:
                    return {}
                return json.loads(raw)
        except urllib.error.HTTPError as error:
            err_body: Any = None
            try:
                err_body = json.loads(error.read().decode("utf-8"))
            except Exception:
                err_body = None
            message = "Hydrilla upload/request failed"
            if isinstance(err_body, dict):
                nested = err_body.get("error")
                if isinstance(nested, dict) and nested.get("message"):
                    message = str(nested["message"])
                elif isinstance(nested, str):
                    message = nested
                elif err_body.get("message"):
                    message = str(err_body["message"])
            if error.code == 401:
                message = (
                    "Session expired. Click Sign in, finish in the browser, "
                    "KEEP the Connect tab open, then Sync and Generate again."
                )
            raise HydrillaApiError(message, status=error.code, body=err_body) from error
        except urllib.error.URLError as error:
            raise HydrillaApiError(_unreachable_message(self.base_url, error.reason)) from error

    def get_task(self, task_id: str) -> Dict[str, Any]:
        encoded = urllib.parse.quote(task_id, safe="")
        if self.mode == "clerk":
            data = self._request("GET", f"/api/3d/status/{encoded}")
            job = data.get("job") if isinstance(data.get("job"), dict) else data
            mapped = _map_studio_status(job.get("status") if isinstance(job, dict) else None)
            progress = 100 if mapped == "SUCCEEDED" else (0 if mapped == "FAILED" else 40)
            if isinstance(job, dict) and isinstance(job.get("progress"), (int, float)):
                progress = int(job["progress"])
            result = None
            if mapped == "SUCCEEDED":
                mesh = None
                if isinstance(job, dict):
                    mesh = job.get("resultGlbUrl") or job.get("result_glb_url")
                if not mesh:
                    mesh = f"{self.base_url}/api/3d/glb/{encoded}"
                result = {"mesh_url": mesh, "format": "glb", "model": "bluefox-1"}
            error = None
            if mapped == "FAILED" and isinstance(job, dict):
                error = job.get("errorMessage") or job.get("error") or "Generation failed"
            return {
                "id": task_id,
                "object": "task",
                "status": mapped,
                "progress": progress,
                "result": result,
                "error": error,
            }

        return self._request("GET", f"/v1/3d/tasks/{encoded}")

    def wait_for_task(
        self,
        task_id: str,
        on_progress: Optional[Callable[[Dict[str, Any]], None]] = None,
        poll_interval_s: float = POLL_INTERVAL_S,
        max_wait_s: float = MAX_POLL_S,
    ) -> Dict[str, Any]:
        started = time.time()
        while True:
            task = self.get_task(task_id)
            if on_progress is not None:
                on_progress(task)
            status = str(task.get("status") or "").upper()
            if status in {"SUCCEEDED", "FAILED", "CANCELLED"}:
                return task
            if time.time() - started >= max_wait_s:
                raise HydrillaApiError(f"Task {task_id} timed out after {int(max_wait_s)}s")
            time.sleep(poll_interval_s)

    def download_file(self, url: str, dest_path: str, *, authed: Optional[bool] = None) -> str:
        use_auth = self.mode == "clerk" if authed is None else authed
        if use_auth is False and url.startswith(self.base_url) and "/api/3d/glb/" in url:
            use_auth = True
        headers = {"User-Agent": "Hydrilla-DCC/1.0"}
        if use_auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        request = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(request, timeout=self.timeout_s) as response:
            data = response.read()
        with open(dest_path, "wb") as handle:
            handle.write(data)
        return dest_path


def _encode_multipart_file(
    field_name: str,
    file_path: str,
    fields: Optional[Dict[str, str]] = None,
) -> Tuple[bytes, str]:
    boundary = f"----HydrillaBoundary{uuid.uuid4().hex}"
    filename = os.path.basename(file_path) or "image.png"
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    with open(file_path, "rb") as handle:
        file_bytes = handle.read()

    chunks: list[bytes] = []
    for key, value in (fields or {}).items():
        chunks.append(f"--{boundary}\r\n".encode("utf-8"))
        chunks.append(
            f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8")
        )
        chunks.append(str(value).encode("utf-8"))
        chunks.append(b"\r\n")

    chunks.append(f"--{boundary}\r\n".encode("utf-8"))
    chunks.append(
        (
            f'Content-Disposition: form-data; name="{field_name}"; '
            f'filename="{filename}"\r\n'
        ).encode("utf-8")
    )
    chunks.append(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    chunks.append(file_bytes)
    chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode("utf-8"))
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def download_to_temp(client: HydrillaClient, mesh_url: str, stem: str) -> str:
    safe = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in stem)[:48] or "hydrilla"
    dest = os.path.join(tempfile.gettempdir(), f"hydrilla-{safe}.glb")
    return client.download_file(mesh_url, dest)


def make_client(
    *,
    clerk_token: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: str = DEFAULT_BASE_URL,
    token_provider: Optional[TokenProvider] = None,
) -> HydrillaClient:
    if clerk_token:
        return HydrillaClient(
            clerk_token,
            base_url=base_url,
            mode="clerk",
            token_provider=token_provider,
        )
    if api_key:
        return HydrillaClient(api_key, base_url=base_url, mode="api")
    raise HydrillaApiError(
        "Not signed in. Use Sign in with Hydrilla, or set a hyd_live_ API key."
    )
