"""Client for the local Hydrilla Bridge (127.0.0.1:7345)."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

DEFAULT_BRIDGE_URL = "http://127.0.0.1:7345"


class BridgeError(Exception):
    pass


class BridgeClient:
    def __init__(self, base_url: str = DEFAULT_BRIDGE_URL, timeout_s: float = 5.0):
        self.base_url = (base_url or DEFAULT_BRIDGE_URL).rstrip("/")
        self.timeout_s = timeout_s

    def _request(
        self,
        method: str,
        path: str,
        payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        body = None
        headers = {"Accept": "application/json", "User-Agent": "Hydrilla-DCC/1.0"}
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"
        request = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_s) as response:
                raw = response.read().decode("utf-8")
                if not raw:
                    return {}
                return json.loads(raw)
        except urllib.error.HTTPError as error:
            raise BridgeError(f"Bridge HTTP {error.code}") from error
        except urllib.error.URLError as error:
            raise BridgeError(f"Bridge unreachable: {error.reason}") from error

    def health(self) -> Dict[str, Any]:
        return self._request("GET", "/health")

    def register(self, app: str, name: Optional[str] = None) -> Dict[str, Any]:
        return self._request(
            "POST",
            "/register",
            {"app": app, "name": name or app},
        )

    def pending(self, app: Optional[str] = None) -> List[Dict[str, Any]]:
        path = "/pending"
        if app:
            path = f"/pending?app={app}"
        result = self._request("GET", path)
        items = result.get("items")
        if isinstance(items, list):
            return items
        return []

    def ack(self, item_id: str) -> Dict[str, Any]:
        return self._request("POST", "/ack", {"id": item_id})

    def import_mesh(
        self,
        mesh_url: str,
        *,
        name: Optional[str] = None,
        target: Optional[str] = None,
        job_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "POST",
            "/import",
            {
                "mesh_url": mesh_url,
                "name": name,
                "target": target,
                "job_id": job_id,
            },
        )

    def put_auth(
        self,
        token: str,
        *,
        email: Optional[str] = None,
        user_id: Optional[str] = None,
        expires_at: Optional[float] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "POST",
            "/auth",
            {
                "token": token,
                "email": email,
                "user_id": user_id,
                "expires_at": expires_at,
            },
        )

    def get_auth(self) -> Dict[str, Any]:
        try:
            return self._request("GET", "/auth/session")
        except BridgeError as error:
            # Older bridges returned 404 when signed out
            if "404" in str(error):
                return {"signed_in": False}
            raise

    def clear_auth(self) -> Dict[str, Any]:
        return self._request("POST", "/auth/logout", {})
