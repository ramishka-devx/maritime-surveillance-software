from __future__ import annotations

import json
import os
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

import httpx
import pandas as pd
from confluent_kafka import Consumer, KafkaError
from sklearn.ensemble import IsolationForest

from app.modules.detection.speed_anomalies import detect_speed_anomalies


@dataclass
class ConsumerStats:
    messages_seen: int = 0
    static_seen: int = 0
    position_seen: int = 0
    anomalies_sent: int = 0
    anomalies_flagged: int = 0
    skipped_no_static: int = 0
    skipped_no_dimensions: int = 0
    skipped_min_samples: int = 0
    errors: int = 0
    last_message_at: str | None = None


@dataclass
class SpeedAnomalyConsumer:
    brokers: list[str]
    topic: str
    group_id: str
    auto_offset_reset: str
    meta_service_url: str
    meta_service_token: str | None
    contamination: float
    n_estimators: int
    window_size: int
    min_samples: int
    timeout_s: float
    _thread: threading.Thread | None = field(default=None, init=False)
    _stop_event: threading.Event = field(default_factory=threading.Event, init=False)
    _consumer: Consumer | None = field(default=None, init=False)
    stats: ConsumerStats = field(default_factory=ConsumerStats, init=False)
    _static_cache: dict[int, dict[str, Any]] = field(default_factory=dict, init=False)
    _buffers: dict[tuple[Any, ...], list[dict[str, Any]]] = field(default_factory=dict, init=False)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._consumer is not None:
            self._consumer.close()
        if self._thread:
            self._thread.join(timeout=5)

    def _run(self) -> None:
        self._consumer = Consumer(
            {
                "bootstrap.servers": ",".join(self.brokers),
                "group.id": self.group_id,
                "auto.offset.reset": self.auto_offset_reset,
                "enable.auto.commit": True,
            }
        )
        self._consumer.subscribe([self.topic])

        while not self._stop_event.is_set():
            message = self._consumer.poll(1.0)
            if message is None:
                continue
            if message.error():
                if message.error().code() != KafkaError._PARTITION_EOF:
                    self.stats.errors += 1
                continue
            try:
                payload = json.loads(message.value().decode("utf-8"))
                self.stats.messages_seen += 1
                self.stats.last_message_at = datetime.now(timezone.utc).isoformat()
                self._process_message(payload)
            except Exception:
                self.stats.errors += 1

    def _process_message(self, msg: dict[str, Any]) -> None:
        parsed = parse_ais_message(msg)
        if parsed is None:
            return

        if parsed["type"] == "static":
            self.stats.static_seen += 1
            self._static_cache[parsed["mmsi"]] = parsed
            return

        if parsed["type"] != "position":
            return

        self.stats.position_seen += 1

        mmsi = parsed["mmsi"]
        static = self._static_cache.get(mmsi)

        record = {
            "mmsi": mmsi,
            "sog": parsed.get("sog"),
            "cog": parsed.get("cog"),
            "heading": parsed.get("heading"),
            "nav_status": parsed.get("nav_status"),
            "lon": parsed.get("lon"),
            "lat": parsed.get("lat"),
            "width": static.get("width") if static else None,
            "length": static.get("length") if static else None,
            "ship_type": static.get("ship_type") if static else None,
        }

        use_static_group = not any(record[key] is None for key in ("width", "length", "ship_type"))
        if not use_static_group and static is None:
            self.stats.skipped_no_static += 1

        if use_static_group:
            key = ("group", int(record["width"]), int(record["length"]), int(record["ship_type"]))
        else:
            self.stats.skipped_no_dimensions += 1 if static is not None else 0
            key = ("mmsi", int(record["mmsi"]))
        buffer = self._buffers.setdefault(key, [])
        buffer.append(record)
        if len(buffer) > self.window_size:
            buffer.pop(0)

        if len(buffer) < self.min_samples:
            self.stats.skipped_min_samples += 1
            return

        df = pd.DataFrame(buffer)
        if use_static_group:
            df = detect_speed_anomalies(
                df,
                contamination=self.contamination,
                n_estimators=self.n_estimators,
            )
        else:
            df = detect_speed_anomalies_minimal(
                df,
                contamination=self.contamination,
                n_estimators=self.n_estimators,
            )

        latest = df.iloc[-1]
        if not bool(latest.get("speed_anomaly")):
            return

        self.stats.anomalies_flagged += 1
        self._post_anomaly(latest)

    def _post_anomaly(self, row: pd.Series) -> None:
        detected_at = datetime.now(timezone.utc).isoformat()
        payload = {
            "mmsi": int(row.get("mmsi")),
            "anomaly_type": "speed",
            "sog": float(row.get("sog")) if row.get("sog") is not None else None,
            "cog": float(row.get("cog")) if row.get("cog") is not None else None,
            "heading": int(row.get("heading")) if row.get("heading") is not None else None,
            "nav_status": int(row.get("nav_status")) if row.get("nav_status") is not None else None,
            "p99_speed": float(row.get("p99_speed")) if row.get("p99_speed") is not None else None,
            "details": {
                "iso_anomaly": bool(row.get("iso_anomaly")),
                "p99_anomaly": bool(row.get("p99_anomaly")),
                "speed_anomaly": bool(row.get("speed_anomaly")),
                "lat": float(row.get("lat")) if row.get("lat") is not None else None,
            },
            "lon": float(row.get("lon")) if row.get("lon") is not None else None,
            "alt": None,
            "detected_at": detected_at,
        }

        headers = {"content-type": "application/json"}
        if self.meta_service_token:
            headers["Authorization"] = f"Bearer {self.meta_service_token}"

        with httpx.Client(timeout=self.timeout_s) as client:
            response = client.post(f"{self.meta_service_url}/api/anomalies", json=payload, headers=headers)

        if response.status_code >= 400:
            self.stats.errors += 1
            return
        self.stats.anomalies_sent += 1


def _normalize_number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed


def _normalize_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _normalize_string(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def _normalize_timestamp(value: Any) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed.astimezone(timezone.utc).isoformat()


def _coerce_feature_frame(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    features = df[columns].copy()
    for column in columns:
        features[column] = pd.to_numeric(features[column], errors="coerce")
    return features.fillna(features.median(numeric_only=True))


def detect_speed_anomalies_minimal(
    df: pd.DataFrame,
    contamination: float,
    n_estimators: int,
) -> pd.DataFrame:
    df = df.copy()
    df["p99_speed"] = df["sog"].quantile(0.99)

    feature_cols = ["sog", "cog", "heading"]
    features = _coerce_feature_frame(df, feature_cols)

    iso = IsolationForest(
        n_estimators=n_estimators,
        contamination=contamination,
        random_state=42,
    )
    df["iso_flag"] = iso.fit_predict(features)
    df["iso_anomaly"] = df["iso_flag"] == -1
    df["p99_anomaly"] = df["sog"] > df["p99_speed"]
    df["speed_anomaly"] = df["iso_anomaly"] | df["p99_anomaly"]

    return df


def _parse_dimensions(raw: dict[str, Any] | None) -> tuple[int | None, int | None]:
    if not raw:
        return None, None
    a = _normalize_number(raw.get("A") or raw.get("Bow"))
    b = _normalize_number(raw.get("B") or raw.get("Stern"))
    c = _normalize_number(raw.get("C") or raw.get("Port"))
    d = _normalize_number(raw.get("D") or raw.get("Starboard"))

    if all(value is None for value in (a, b, c, d)):
        return None, None

    length = (a or 0) + (b or 0) if a is not None or b is not None else None
    width = (c or 0) + (d or 0) if c is not None or d is not None else None
    return (int(width) if width is not None else None, int(length) if length is not None else None)


def parse_ais_message(msg: dict[str, Any]) -> dict[str, Any] | None:
    meta = msg.get("MetaData")
    message_type = _normalize_string(msg.get("MessageType"))

    if not meta or not message_type:
        return None

    mmsi = _normalize_int(meta.get("MMSI"))
    if mmsi is None:
        return None

    if message_type == "ShipStaticData":
        report = msg.get("Message", {}).get("ShipStaticData")
        if not report:
            return None
        width, length = _parse_dimensions(report.get("Dimension"))
        return {
            "type": "static",
            "mmsi": mmsi,
            "ship_type": _normalize_int(report.get("Type")),
            "width": width,
            "length": length,
        }

    if message_type == "PositionReport":
        report = msg.get("Message", {}).get("PositionReport")
        if not report:
            return None

        lat = _normalize_number(meta.get("latitude"))
        lon = _normalize_number(meta.get("longitude"))
        timestamp = _normalize_timestamp(meta.get("time_utc"))

        if lat is None or lon is None or timestamp is None:
            return None

        return {
            "type": "position",
            "mmsi": mmsi,
            "lat": lat,
            "lon": lon,
            "time": timestamp,
            "sog": _normalize_number(report.get("Sog")),
            "cog": _normalize_number(report.get("Cog")),
            "heading": _normalize_int(report.get("TrueHeading")),
            "nav_status": _normalize_int(report.get("NavigationalStatus")),
        }

    return None


_consumer_instance: SpeedAnomalyConsumer | None = None


def get_speed_anomaly_consumer() -> SpeedAnomalyConsumer:
    global _consumer_instance
    if _consumer_instance is None:
        brokers = [broker.strip() for broker in os.getenv("KAFKA_BROKERS", "localhost:9092").split(",") if broker.strip()]
        _consumer_instance = SpeedAnomalyConsumer(
            brokers=brokers,
            topic=os.getenv("KAFKA_TOPIC", "ais.raw.messages"),
            group_id=os.getenv("KAFKA_GROUP_ID", "analytic-speed-anomalies"),
            auto_offset_reset=os.getenv("KAFKA_AUTO_OFFSET_RESET", "earliest"),
            meta_service_url=os.getenv("META_SERVICE_URL", "http://localhost:5000"),
            meta_service_token=os.getenv("META_SERVICE_TOKEN"),
            contamination=float(os.getenv("ANOMALY_CONTAMINATION", "0.01")),
            n_estimators=int(os.getenv("ANOMALY_N_ESTIMATORS", "100")),
            window_size=int(os.getenv("ANOMALY_WINDOW_SIZE", "100000")),
            min_samples=int(os.getenv("ANOMALY_MIN_SAMPLES", "8000")),
            timeout_s=float(os.getenv("ANOMALY_HTTP_TIMEOUT", "10")),
        )
    return _consumer_instance
