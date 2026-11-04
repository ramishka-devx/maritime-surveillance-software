"""HTTP client for meta-service, authenticated as analytic-service's service account.

Logs in with META_SERVICE_EMAIL / META_SERVICE_PASSWORD (created by meta-service's
`npm run service-account`) and logs in again on a 401 or every RELOGIN_SECONDS, so an expired
JWT can't silently stop anomalies being posted. A fixed META_SERVICE_TOKEN still works for
quick local testing, but it can't be renewed.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# meta-service tokens default to 1 day; renew well before that.
RELOGIN_SECONDS = 12 * 3600


class MetaClient:
    def __init__(
        self,
        base_url: str,
        email: str | None = None,
        password: str | None = None,
        token: str | None = None,
        timeout_s: float = 10.0,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.email = email or None
        self.password = password or None
        self._token = token or None
        self._token_at = time.monotonic() if self._token else 0.0
        self._lock = threading.Lock()
        self._http = httpx.Client(timeout=timeout_s, transport=transport)
        if not (self.email and self.password) and not self._token:
            logger.warning("No META_SERVICE_EMAIL/META_SERVICE_PASSWORD or META_SERVICE_TOKEN; meta-service calls will fail")

    @property
    def can_login(self) -> bool:
        return bool(self.email and self.password)

    def _login(self) -> None:
        response = self._http.post(
            f"{self.base_url}/api/users/login",
            json={"identifier": self.email, "password": self.password},
        )
        response.raise_for_status()
        self._token = response.json()["data"]["token"]
        self._token_at = time.monotonic()

    def _headers(self, force_login: bool = False) -> dict[str, str]:
        with self._lock:
            stale = not self._token or time.monotonic() - self._token_at > RELOGIN_SECONDS
            if self.can_login and (force_login or stale):
                try:
                    self._login()
                except Exception:
                    logger.exception("Login to meta-service as %s failed", self.email)
            return {"Authorization": f"Bearer {self._token}"} if self._token else {}

    def request(self, method: str, path: str, json: Any = None) -> httpx.Response:
        url = f"{self.base_url}{path}"
        response = self._http.request(method, url, json=json, headers=self._headers())
        if response.status_code == 401 and self.can_login:
            response = self._http.request(method, url, json=json, headers=self._headers(force_login=True))
        return response

    def post_anomaly(self, payload: dict[str, Any]) -> bool:
        try:
            response = self.request("POST", "/api/anomalies", payload)
        except httpx.HTTPError:
            logger.exception("Posting anomaly for MMSI %s failed", payload.get("mmsi"))
            return False
        if response.status_code >= 400:
            logger.warning("meta-service rejected anomaly (%s): %s", response.status_code, response.text[:300])
            return False
        return True

    def get_settings(self) -> dict[str, Any] | None:
        """{ values: {key: value}, thresholds: [...] } from GET /api/detection-settings."""
        try:
            response = self.request("GET", "/api/detection-settings")
        except httpx.HTTPError:
            logger.warning("Fetching detection settings failed", exc_info=True)
            return None
        if response.status_code >= 400:
            logger.warning("Fetching detection settings failed (%s)", response.status_code)
            return None
        return response.json().get("data")

    def report_thresholds(self, thresholds: list[dict[str, Any]], model_version: str) -> bool:
        try:
            response = self.request(
                "PUT",
                "/api/detection-settings/computed-thresholds",
                {"model_version": model_version, "thresholds": thresholds},
            )
        except httpx.HTTPError:
            logger.warning("Reporting computed thresholds failed", exc_info=True)
            return False
        return response.status_code < 400

    def close(self) -> None:
        self._http.close()
