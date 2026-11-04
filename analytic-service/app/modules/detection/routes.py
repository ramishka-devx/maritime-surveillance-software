from dataclasses import asdict

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
    n_estimators: int = Field(default=100, ge=10, le=1000)
    max_records: int | None = Field(default=None, ge=1)
    max_anomalies: int | None = Field(default=None, ge=1)
    dry_run: bool = Field(default=False, description="Score only; don't post anomalies to meta-service")


@router.get("/health")
def detection_health() -> dict[str, str]:
    return {"status": "ok", "module": "detection"}


@router.get("/speed-anomalies/status")
def speed_anomaly_status() -> dict:
    consumer = get_speed_anomaly_consumer()
    return {
        "topic": consumer.topic,
        "group_id": consumer.group_id,
        "auto_offset_reset": consumer.auto_offset_reset,
        "training_samples_buffered": len(consumer._training),
        "settings_loaded_from_meta_service": consumer.settings.last_refresh_ok,
        **asdict(consumer.stats),
    }


@router.post("/speed-anomalies")
def run_speed_anomalies(payload: SpeedAnomalyRequest) -> dict:
    consumer = get_speed_anomaly_consumer()
    try:
        df = load_dataset(payload.csv_path, payload.max_records)
        df, model = detect_speed_anomalies(df, consumer.settings, payload.n_estimators)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    flagged = df[df["speed_anomaly"]]
    summary = {
        "model_version": model.version,
        "rows": int(df.shape[0]),
        "candidates_above_p99": int(df["score"].notna().sum()),
        "warnings": int((df["outcome"] == "warning").sum()),
        "anomalies_detected": int(flagged.shape[0]),
    }
    if payload.dry_run:
        return summary
    result = push_anomalies(df, model, consumer.settings, consumer.client, payload.max_anomalies)
    return {**summary, **result}
