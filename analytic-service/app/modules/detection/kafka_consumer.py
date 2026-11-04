from __future__ import annotations

import json
import logging
import os
import threading
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
from confluent_kafka import Consumer, KafkaError

from app.modules.detection.loitering import LoiteringDetector
from app.modules.detection.meta_client import MetaClient
from app.modules.detection.payloads import loitering_payload, speed_payload
from app.modules.detection.settings import SettingsStore
from app.modules.detection.speed_anomalies import load_dataset
from app.modules.detection.speed_model import SpeedModel, evaluate, fit_speed_model

logger = logging.getLogger(__name__)

SERVICE_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MODEL_PATH = SERVICE_ROOT / "models" / "speed_model.joblib"
DEFAULT_TRAINING_CSV = SERVICE_ROOT.parent / "AI" / "ais_dataset.csv"


@dataclass
class ConsumerStats:
    messages_seen: int = 0
    static_seen: int = 0
    position_seen: int = 0
    speed_candidates: int = 0
    speed_alerts: int = 0
    speed_warnings: int = 0
    speed_no_threshold: int = 0
    loitering_flagged: int = 0
    anomalies_sent: int = 0
    anomalies_failed: int = 0
    errors: int = 0
    last_message_at: str | None = None
    model_version: str | None = None
    model_fitted_at: str | None = None
    model_samples: int = 0
    last_fit_error: str | None = None


@dataclass
class SpeedAnomalyConsumer:
    """Kafka consumer running the speed (p99 gate + IsolationForest score) and loitering detectors."""

    brokers: list[str]
    topic: str
    group_id: str
    auto_offset_reset: str
    client: MetaClient
    settings: SettingsStore
    model_path: Path
    training_csv: Path | None
    n_estimators: int
    train_window: int
    min_train_samples: int
    model: SpeedModel | None = field(default=None, init=False)
    stats: ConsumerStats = field(default_factory=ConsumerStats, init=False)
    loitering: LoiteringDetector = field(default_factory=LoiteringDetector, init=False)
    _thread: threading.Thread | None = field(default=None, init=False)
    _stop_event: threading.Event = field(default_factory=threading.Event, init=False)
    _consumer: Consumer | None = field(default=None, init=False)
    _static_cache: dict[int, dict[str, Any]] = field(default_factory=dict, init=False)
    _training: deque = field(init=False)
    _fitting: bool = field(default=False, init=False)
    _last_fit: float = field(default=0.0, init=False)

    def __post_init__(self) -> None:
        self._training = deque(maxlen=self.train_window)

    # -- lifecycle -----------------------------------------------------------------------

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self.settings.start()
        self._thread = threading.Thread(target=self._run, daemon=True, name="detection-consumer")
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        self.settings.stop()
        if self._thread:
            self._thread.join(timeout=5)
        if self._consumer is not None:
            self._consumer.close()

    def _run(self) -> None:
        self._load_initial_model()
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
            self._maybe_refit()
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
                logger.exception("Processing AIS message failed")
            if self.stats.messages_seen % 10_000 == 0:
                self.loitering.prune(datetime.now(timezone.utc))

    # -- model ---------------------------------------------------------------------------

    def _use_model(self, model: SpeedModel) -> None:
        self.model = model
        self.stats.model_version = model.version
        self.stats.model_fitted_at = model.fitted_at
        self.stats.model_samples = model.n_samples
        self.client.report_thresholds(model.computed_thresholds(), model.version)

    def _load_initial_model(self) -> None:
        """Saved model, else bootstrap from the training CSV, so restarts don't start cold."""
        model = SpeedModel.load(self.model_path)
        if model is None and self.training_csv is not None and self.training_csv.exists():
            try:
                model = fit_speed_model(
                    load_dataset(str(self.training_csv)),
                    self.n_estimators,
                    source="training_csv",
                    min_group_samples=int(self.settings.get("speed.min_group_samples")),
                )
                model.save(self.model_path)
            except Exception as exc:
                self.stats.last_fit_error = str(exc)
                logger.exception("Bootstrapping the speed model from %s failed", self.training_csv)
        if model is None:
            logger.warning("No speed model yet; alerting on the p99 gate alone until the first refit")
            return
        self._use_model(model)
        self._last_fit = time.monotonic()
        logger.info("Speed model %s loaded (%s samples)", model.version, model.n_samples)

    def _maybe_refit(self) -> None:
        refit_s = float(self.settings.get("speed.refit_minutes")) * 60
        due = time.monotonic() - self._last_fit >= refit_s
        if self._fitting or not due or len(self._training) < self.min_train_samples:
            return
        self._fitting = True
        self._last_fit = time.monotonic()
        snapshot = pd.DataFrame(list(self._training))
        threading.Thread(target=self._refit, args=(snapshot,), daemon=True, name="speed-refit").start()

    def _refit(self, snapshot: pd.DataFrame) -> None:
        try:
            model = fit_speed_model(
                snapshot, self.n_estimators, min_group_samples=int(self.settings.get("speed.min_group_samples"))
            )
            model.save(self.model_path)
            self._use_model(model)
            self.stats.last_fit_error = None
            logger.info("Speed model refitted: %s", model.version)
        except Exception as exc:
            self.stats.last_fit_error = str(exc)
            logger.exception("Refitting the speed model failed")
        finally:
            self._fitting = False

    # -- messages ------------------------------------------------------------------------

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
        static = self._static_cache.get(mmsi) or {}
        record = {
            "mmsi": mmsi,
            "time": parsed["time"],
            "sog": parsed.get("sog"),
            "cog": parsed.get("cog"),
            "heading": parsed.get("heading"),
            "nav_status": parsed.get("nav_status"),
            "lat": parsed["lat"],
            "lon": parsed["lon"],
            "width": static.get("width"),
            "length": static.get("length"),
            "ship_type": static.get("ship_type"),
        }

        # The model only learns from positions whose vessel type is known.
        if record["ship_type"] is not None and record["sog"] is not None:
            self._training.append({"sog": record["sog"], "ship_type": record["ship_type"]})

        self._check_speed(record)
        self._check_loitering(record)

    def _check_speed(self, record: dict[str, Any]) -> None:
        verdict = evaluate(record, self.model, self.settings)
        if verdict.outcome == "no_threshold":
            self.stats.speed_no_threshold += 1
            return
        if verdict.outcome == "normal":
            if verdict.score is not None:
                self.stats.speed_candidates += 1
            return

        self.stats.speed_candidates += 1
        if verdict.outcome == "warning":
            # Below the alert threshold: logged for analyst review only (UC-004.AC.2).
            self.stats.speed_warnings += 1
            logger.info(
                "Low-confidence speed anomaly MMSI %s: %.1f kn over p99 %.1f kn, score %.3f",
                record["mmsi"], record["sog"], verdict.threshold, verdict.score,
            )
            return

        self.stats.speed_alerts += 1
        self._send(speed_payload(record, verdict, self.model.version if self.model else None))

    def _check_loitering(self, record: dict[str, Any]) -> None:
        try:
            t = datetime.fromisoformat(record["time"])
        except (TypeError, ValueError):
            return
        found = self.loitering.update(
            record["mmsi"], t, record["lat"], record["lon"], record["sog"], record["nav_status"], self.settings
        )
        if found:
            self.stats.loitering_flagged += 1
            self._send(loitering_payload(record, found))

    def _send(self, payload: dict[str, Any]) -> None:
        if self.client.post_anomaly(payload):
            self.stats.anomalies_sent += 1
        else:
            self.stats.anomalies_failed += 1


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


def _env_path(name: str, default: Path) -> Path | None:
    value = os.getenv(name)
    if value is None:
        return default
    return Path(value) if value.strip() else None


def get_speed_anomaly_consumer() -> SpeedAnomalyConsumer:
    global _consumer_instance
    if _consumer_instance is None:
        brokers = [broker.strip() for broker in os.getenv("KAFKA_BROKERS", "localhost:9092").split(",") if broker.strip()]
        client = MetaClient(
            base_url=os.getenv("META_SERVICE_URL", "http://localhost:5000"),
            email=os.getenv("META_SERVICE_EMAIL"),
            password=os.getenv("META_SERVICE_PASSWORD"),
            token=os.getenv("META_SERVICE_TOKEN"),
            timeout_s=float(os.getenv("ANOMALY_HTTP_TIMEOUT", "10")),
        )
        _consumer_instance = SpeedAnomalyConsumer(
            brokers=brokers,
            topic=os.getenv("KAFKA_TOPIC", "ais.raw.messages"),
            group_id=os.getenv("KAFKA_GROUP_ID", "analytic-speed-anomalies"),
            auto_offset_reset=os.getenv("KAFKA_AUTO_OFFSET_RESET", "earliest"),
            client=client,
            settings=SettingsStore(client, poll_s=float(os.getenv("SETTINGS_POLL_S", "60"))),
            model_path=_env_path("SPEED_MODEL_PATH", DEFAULT_MODEL_PATH) or DEFAULT_MODEL_PATH,
            training_csv=_env_path("SPEED_TRAINING_CSV", DEFAULT_TRAINING_CSV),
            n_estimators=int(os.getenv("ANOMALY_N_ESTIMATORS", "100")),
            train_window=int(os.getenv("SPEED_TRAIN_WINDOW", "50000")),
            min_train_samples=int(os.getenv("SPEED_MIN_TRAIN_SAMPLES", "2000")),
        )
    return _consumer_instance
