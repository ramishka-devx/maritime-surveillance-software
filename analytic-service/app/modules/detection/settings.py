"""Detector settings, editable by admins in meta-service (SRS REQ-F-047).

Polled from GET /api/detection-settings every SETTINGS_POLL_S seconds, so changes apply
without a restart. Until the first successful fetch (or if meta-service is down) the last
known values, starting with DEFAULTS, stay in effect.
"""

from __future__ import annotations

import logging
import threading
from typing import Any

from app.modules.detection.meta_client import MetaClient

logger = logging.getLogger(__name__)

# Same keys and defaults as meta-service's detection-settings.registry.js.
DEFAULTS: dict[str, Any] = {
    "speed.score_threshold": 0.7,
    "speed.warning_threshold": 0.65,
    "speed.high_severity_score": 0.75,
    "speed.min_group_samples": 200,
    "speed.fallback_p99_kn": None,
    "speed.refit_minutes": 15,
    "alerts.cooldown_minutes": 30,
    "loitering.radius_m": 1000,
    "loitering.min_minutes": 60,
    "loitering.max_sog_kn": 2,
    "loitering.cooldown_minutes": 180,
}


class SettingsStore:
    def __init__(self, client: MetaClient | None, poll_s: float = 60.0) -> None:
        self._client = client
        self._poll_s = poll_s
        self._values: dict[str, Any] = dict(DEFAULTS)
        self._overrides: dict[int, float] = {}
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self.last_refresh_ok = False

    def get(self, key: str) -> Any:
        return self._values[key]

    @property
    def overrides(self) -> dict[int, float]:
        """Admin p99 overrides by vessel-type group."""
        return self._overrides

    def apply(self, data: dict[str, Any]) -> None:
        values = dict(self._values)
        for key, value in (data.get("values") or {}).items():
            if key in DEFAULTS:
                values[key] = value
        overrides = {
            int(t["type_group"]): float(t["p99_override"])
            for t in data.get("thresholds") or []
            if t.get("p99_override") is not None
        }
        # Swap whole dicts so readers on other threads never see a half-applied update.
        self._values, self._overrides = values, overrides

    def refresh(self) -> bool:
        if self._client is None:
            return False
        data = self._client.get_settings()
        self.last_refresh_ok = data is not None
        if data is not None:
            self.apply(data)
        return self.last_refresh_ok

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, daemon=True, name="detection-settings")
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def _run(self) -> None:
        while not self._stop.is_set():
            try:
                self.refresh()
            except Exception:
                logger.exception("Refreshing detection settings failed")
            self._stop.wait(self._poll_s)
