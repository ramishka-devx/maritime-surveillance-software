from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


REQUIRED_COLUMNS = {
    "mmsi",
    "sog",
    "cog",
    "heading",
    "nav_status",
    "lon",
    "lat",
    "width",
    "length",
    "ship_type",
}


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, float):
        return value
    if isinstance(value, (int, np.integer)):
        return float(value)
    text = str(value).strip()
    if text == "" or text.lower() == "nan":
        return None
    return float(text)


def _coerce_int(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, np.integer)):
        return int(value)
    text = str(value).strip()
    if text == "" or text.lower() == "nan":
        return None
    return int(float(text))


def load_dataset(csv_path: str, max_records: int | None = None) -> pd.DataFrame:
    path = Path(csv_path)
    if not path.is_absolute():
        repo_root = Path(__file__).resolve().parents[4]
        candidate = repo_root / csv_path
        if candidate.is_file():
            path = candidate

    if not path.is_file():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    df = pd.read_csv(path)
    missing = REQUIRED_COLUMNS.difference(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    if max_records is not None:
        df = df.head(max_records)

    df = df[df["sog"] >= 0].copy()
    return df


def detect_speed_anomalies(
    df: pd.DataFrame,
    contamination: float = 0.01,
    n_estimators: int = 100,
) -> pd.DataFrame:
    group_cols = ["width", "length", "ship_type"]
    percentiles = (
        df.groupby(group_cols)["sog"]
        .quantile(0.99)
        .reset_index()
        .rename(columns={"sog": "p99_speed"})
    )
    df = df.merge(percentiles, on=group_cols, how="left")

    features = ["sog", "width", "length", "ship_type"]
    X = df[features]

    iso = IsolationForest(
        n_estimators=n_estimators,
        contamination=contamination,
        random_state=42,
    )

    df["iso_flag"] = iso.fit_predict(X)
    df["iso_anomaly"] = df["iso_flag"] == -1
    df["p99_anomaly"] = df["sog"] > df["p99_speed"]
    df["speed_anomaly"] = df["iso_anomaly"] | df["p99_anomaly"]

    return df


def build_payload(row: pd.Series, detected_at: str) -> dict[str, Any]:
    return {
        "mmsi": _coerce_int(row.get("mmsi")),
        "anomaly_type": "speed",
        "sog": _coerce_float(row.get("sog")),
        "cog": _coerce_float(row.get("cog")),
        "heading": _coerce_int(row.get("heading")),
        "nav_status": _coerce_int(row.get("nav_status")),
        "p99_speed": _coerce_float(row.get("p99_speed")),
        "details": {
            "iso_anomaly": bool(row.get("iso_anomaly")),
            "p99_anomaly": bool(row.get("p99_anomaly")),
            "speed_anomaly": bool(row.get("speed_anomaly")),
            "lat": _coerce_float(row.get("lat")),
        },
        "lon": _coerce_float(row.get("lon")),
        "alt": None,
        "detected_at": detected_at,
    }


def push_anomalies(
    df: pd.DataFrame,
    base_url: str,
    token: str | None,
    max_anomalies: int | None = None,
    timeout_s: float = 10.0,
) -> dict[str, Any]:
    anomalies = df[df["speed_anomaly"]].copy()
    if max_anomalies is not None:
        anomalies = anomalies.head(max_anomalies)

    detected_at = datetime.now(timezone.utc).isoformat()
    headers = {"content-type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    results: list[dict[str, Any]] = []
    error_count = 0

    with httpx.Client(timeout=timeout_s) as client:
        for _, row in anomalies.iterrows():
            payload = build_payload(row, detected_at)
            response = client.post(f"{base_url}/api/anomalies", json=payload, headers=headers)
            if response.status_code >= 400:
                error_count += 1
                results.append({"status": response.status_code, "error": response.text})
            else:
                results.append({"status": response.status_code})

    return {
        "anomalies_detected": int(anomalies.shape[0]),
        "anomalies_sent": int(anomalies.shape[0]) - error_count,
        "errors": error_count,
        "results": results,
    }
