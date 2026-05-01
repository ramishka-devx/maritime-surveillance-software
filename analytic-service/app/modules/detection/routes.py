import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.modules.detection.speed_anomalies import (
    detect_speed_anomalies,
    load_dataset,
    push_anomalies,
)
from app.modules.detection.kafka_consumer import get_speed_anomaly_consumer


router = APIRouter()


class SpeedAnomalyRequest(BaseModel):
    csv_path: str = Field(default="AI/ais_dataset.csv")
    contamination: float = Field(default=0.01, ge=0.0001, le=0.5)
    n_estimators: int = Field(default=100, ge=10, le=1000)
    max_records: int | None = Field(default=None, ge=1)
    max_anomalies: int | None = Field(default=None, ge=1)
    meta_service_url: str | None = None
    meta_service_token: str | None = None


@router.get("/health")
def detection_health() -> dict[str, str]:
    return {"status": "ok", "module": "detection"}


@router.get("/speed-anomalies/status")
def speed_anomaly_status() -> dict[str, int | str | None]:
    consumer = get_speed_anomaly_consumer()
    return {
        "topic": consumer.topic,
        "group_id": consumer.group_id,
        "auto_offset_reset": consumer.auto_offset_reset,
        "window_size": consumer.window_size,
        "min_samples": consumer.min_samples,
        "messages_seen": consumer.stats.messages_seen,
        "static_seen": consumer.stats.static_seen,
        "position_seen": consumer.stats.position_seen,
        "anomalies_sent": consumer.stats.anomalies_sent,
        "anomalies_flagged": consumer.stats.anomalies_flagged,
        "skipped_no_static": consumer.stats.skipped_no_static,
        "skipped_no_dimensions": consumer.stats.skipped_no_dimensions,
        "skipped_min_samples": consumer.stats.skipped_min_samples,
        "errors": consumer.stats.errors,
        "last_message_at": consumer.stats.last_message_at,
    }


@router.post("/speed-anomalies")
def run_speed_anomalies(payload: SpeedAnomalyRequest) -> dict[str, int | list[dict[str, int | str]]]:
    base_url = payload.meta_service_url or os.getenv("META_SERVICE_URL", "http://localhost:5000")
    token = payload.meta_service_token or os.getenv("META_SERVICE_TOKEN")

    try:
        df = load_dataset(payload.csv_path, payload.max_records)
        df = detect_speed_anomalies(df, payload.contamination, payload.n_estimators)
        result = push_anomalies(df, base_url, token, payload.max_anomalies)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {
        "anomalies_detected": result["anomalies_detected"],
        "anomalies_sent": result["anomalies_sent"],
        "errors": result["errors"],
        "results": result["results"],
    }
