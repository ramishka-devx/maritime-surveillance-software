"""Bodies for meta-service POST /api/anomalies."""

from __future__ import annotations

from typing import Any

from app.modules.detection.speed_model import SpeedVerdict
from app.modules.detection.type_groups import type_group

HEADING_NOT_AVAILABLE = 511


def speed_payload(record: dict[str, Any], verdict: SpeedVerdict, model_version: str | None) -> dict[str, Any]:
    heading = record.get("heading")
    return {
        "mmsi": int(record["mmsi"]),
        "anomaly_type": "speed",
        "sog": record.get("sog"),
        "cog": record.get("cog"),
        "heading": None if heading in (None, HEADING_NOT_AVAILABLE) else heading,
        "nav_status": record.get("nav_status"),
        "p99_speed": round(verdict.threshold, 2) if verdict.threshold is not None else None,
        "score": round(verdict.score, 3) if verdict.score is not None else None,
        "model_version": model_version if verdict.score is not None else None,
        "lat": record.get("lat"),
        "lon": record.get("lon"),
        "alt": None,
        "detected_at": record.get("time"),
        "details": {
            "type_group": type_group(record.get("ship_type")),
            "threshold_source": verdict.threshold_source,
        },
    }


def loitering_payload(record: dict[str, Any], found: dict[str, Any]) -> dict[str, Any]:
    return {
        "mmsi": int(record["mmsi"]),
        "anomaly_type": "loitering",
        "sog": found["mean_sog"],
        "cog": None,
        "heading": None,
        "nav_status": record.get("nav_status"),
        "p99_speed": None,
        "score": None,
        "model_version": None,
        "lat": found["lat"],
        "lon": found["lon"],
        "alt": None,
        "detected_at": record.get("time"),
        "details": {
            "rule": "loitering",
            "radius_m": found["radius_m"],
            "duration_min": found["duration_min"],
            "points": found["points"],
            "since": found["since"],
        },
    }
