"""Batch speed-anomaly detection over a CSV (POST /detection/speed-anomalies).

Same pipeline as the stream (speed_model): fit on the dataset, gate each row on its vessel
type's p99, score the candidates with the IsolationForest.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

from app.modules.detection.meta_client import MetaClient
from app.modules.detection.payloads import speed_payload
from app.modules.detection.speed_model import SpeedModel, evaluate, fit_speed_model

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
    settings: Any,
    n_estimators: int = 100,
) -> tuple[pd.DataFrame, SpeedModel]:
    """Adds p99_speed, threshold_source, score, outcome and speed_anomaly (outcome == 'alert')."""
    model = fit_speed_model(df, n_estimators, source="batch")
    records = df.astype(object).where(pd.notna(df), None).to_dict("records")
    verdicts = [evaluate(record, model, settings) for record in records]

    out = df.copy()
    out["p99_speed"] = [v.threshold for v in verdicts]
    out["threshold_source"] = [v.threshold_source for v in verdicts]
    out["score"] = [v.score for v in verdicts]
    out["outcome"] = [v.outcome for v in verdicts]
    out["speed_anomaly"] = out["outcome"] == "alert"
    return out, model


def push_anomalies(
    df: pd.DataFrame,
    model: SpeedModel,
    settings: Any,
    client: MetaClient,
    max_anomalies: int | None = None,
) -> dict[str, Any]:
    anomalies = df[df["speed_anomaly"]]
    if max_anomalies is not None:
        anomalies = anomalies.head(max_anomalies)

    sent = 0
    for record in anomalies.astype(object).where(pd.notna(anomalies), None).to_dict("records"):
        verdict = evaluate(record, model, settings)
        if client.post_anomaly(speed_payload(record, verdict, model.version)):
            sent += 1

    detected = int(anomalies.shape[0])
    return {"anomalies_detected": detected, "anomalies_sent": sent, "errors": detected - sent}
