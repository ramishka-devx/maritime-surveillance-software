"""Speed anomaly model (SRS §3.4, REQ-F-040 to 042).

Two layers:
1. Gate: a position is a candidate only if its SOG is above the p99 SOG of its vessel-type
   group (an admin override, the group's own p99 once it has enough samples, else a fallback).
2. Score: candidates are scored by an IsolationForest on relative speed, sog / the vessel
   type's p99. Raw (sog, width, length, ship_type) features barely separated a 40 kn cargo
   ship from a normal one (0.56 vs 0.38), because only one of four random split features is
   speed; relative speed carries the vessel type through its p99 and separates cleanly
   (normal ~0.43, just over p99 ~0.67, clear outliers ~0.76 on synthetic data). The score is
   the standard IsolationForest anomaly score, -score_samples(x): in (0, 1], about 0.5 for
   ordinary points. It saturates beyond the training range (20 and 40 kn score the same), so
   it says how confidently the speed is abnormal, not by how much. An alert needs
   score >= the configured threshold.

The model is fitted in the background from recent positions (never per message), saved to
disk, and bootstrapped from the training CSV so a restart doesn't start cold.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from app.modules.detection.type_groups import LABELS, type_group

logger = logging.getLogger(__name__)

FEATURES = ["relative_speed"]
# AIS SOG 102.3 means "not available"; 102.2 means "102.2 knots or higher".
MAX_VALID_SOG = 102.2
# A group of mostly moored vessels can have a p99 near 0; don't gate (or divide) on that.
MIN_THRESHOLD_KN = 1.0
# Groups with fewer training positions are normalised by the all-vessel p99 when fitting.
DEFAULT_MIN_GROUP_SAMPLES = 200


def clean_training_frame(df: pd.DataFrame) -> pd.DataFrame:
    """Valid SOG and known vessel type only, with a type_group column."""
    out = df[["sog", "ship_type"]].apply(pd.to_numeric, errors="coerce")
    out = out[out["sog"].notna() & (out["sog"] >= 0) & (out["sog"] <= MAX_VALID_SOG)]
    out = out.dropna(subset=["ship_type"])
    out["type_group"] = out["ship_type"].map(type_group)
    return out.reset_index(drop=True)


def _features(relative_speed: float | list[float]) -> pd.DataFrame:
    values = relative_speed if isinstance(relative_speed, list) else [relative_speed]
    return pd.DataFrame({"relative_speed": values})


@dataclass
class SpeedModel:
    forest: IsolationForest | None
    p99_by_group: dict[int, float]
    samples_by_group: dict[int, int]
    p99_all: float | None
    version: str
    fitted_at: str
    n_samples: int = 0
    meta: dict[str, Any] = field(default_factory=dict)

    def threshold_for(
        self,
        group: int,
        overrides: dict[int, float],
        min_group_samples: int,
        fallback_p99: float | None,
    ) -> tuple[float | None, str]:
        """(p99 threshold in knots, where it came from).

        A type group with too few samples gets the fallback (the configured one, else the
        all-vessel p99), raised to its own p99 when that is higher: a small sample can't make
        a type stricter, but it does show the type is fast (high-speed ferries otherwise get
        flagged at their normal 30 kn against an all-vessel p99 of ~17 kn).
        """
        if group in overrides:
            return overrides[group], "override"
        own = self.p99_by_group.get(group)
        if own is not None and self.samples_by_group.get(group, 0) >= min_group_samples:
            return own, "type"
        if fallback_p99 is not None:
            base, source = float(fallback_p99), "fallback"
        else:
            base, source = self.p99_all, "all_vessels"
        if own is not None and base is not None and own > base:
            return own, "type_sparse"
        return base, source

    def score(self, sog: float, threshold: float) -> float | None:
        """Anomaly score of a speed relative to the threshold its vessel type was gated on."""
        if self.forest is None:
            return None
        relative = float(sog) / max(float(threshold), MIN_THRESHOLD_KN)
        return float(-self.forest.score_samples(_features(relative))[0])

    def computed_thresholds(self) -> list[dict[str, Any]]:
        """Rows for meta-service's speed_thresholds (PUT /computed-thresholds)."""
        return [
            {
                "type_group": group,
                "label": LABELS.get(group),
                "p99": round(float(p99), 2),
                "sample_count": int(self.samples_by_group.get(group, 0)),
            }
            for group, p99 in sorted(self.p99_by_group.items())
        ]

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".tmp")
        joblib.dump(self, tmp)
        tmp.replace(path)

    @staticmethod
    def load(path: Path) -> "SpeedModel | None":
        if not path.exists():
            return None
        try:
            model = joblib.load(path)
        except Exception:
            logger.exception("Could not load saved speed model from %s", path)
            return None
        return model if isinstance(model, SpeedModel) else None


def fit_speed_model(
    df: pd.DataFrame,
    n_estimators: int = 100,
    source: str = "stream",
    min_group_samples: int = DEFAULT_MIN_GROUP_SAMPLES,
) -> SpeedModel:
    """Fit per-type p99 thresholds and the IsolationForest on positions with known vessel type."""
    data = clean_training_frame(df)
    if data.empty:
        raise ValueError("No usable training rows (need sog and ship_type)")

    grouped = data.groupby("type_group")["sog"]
    p99_by_group = {int(g): max(float(v), MIN_THRESHOLD_KN) for g, v in grouped.quantile(0.99).items()}
    samples_by_group = {int(g): int(v) for g, v in grouped.size().items()}
    p99_all = max(float(np.quantile(data["sog"], 0.99)), MIN_THRESHOLD_KN)

    # Normalise each position by the threshold its type would be gated on (see threshold_for).
    denominators = {
        g: p99_by_group[g] if samples_by_group[g] >= min_group_samples else max(p99_by_group[g], p99_all)
        for g in p99_by_group
    }
    relative = (data["sog"] / data["type_group"].map(denominators)).tolist()
    # contamination only sets predict()'s cut-off; alerting uses score thresholds instead.
    forest = IsolationForest(n_estimators=n_estimators, random_state=42).fit(_features(relative))

    now = datetime.now(timezone.utc)
    return SpeedModel(
        forest=forest,
        p99_by_group=p99_by_group,
        samples_by_group=samples_by_group,
        p99_all=p99_all,
        version=f"if-{now:%Y%m%dT%H%M}Z-n{len(data)}",
        fitted_at=now.isoformat(),
        n_samples=len(data),
        meta={"source": source},
    )


@dataclass
class SpeedVerdict:
    """Outcome for one position: 'normal', 'warning', 'alert' or 'no_threshold'."""

    outcome: str
    threshold: float | None = None
    threshold_source: str | None = None
    score: float | None = None


def evaluate(
    record: dict[str, Any],
    model: SpeedModel | None,
    settings: Any,
) -> SpeedVerdict:
    """Apply the p99 gate, then the score thresholds. `settings` needs get() and overrides."""
    sog = record.get("sog")
    if sog is None or sog < 0 or sog > MAX_VALID_SOG:
        return SpeedVerdict("normal")

    group = type_group(record.get("ship_type"))
    fallback = settings.get("speed.fallback_p99_kn")
    if model is not None:
        threshold, source = model.threshold_for(
            group, settings.overrides, int(settings.get("speed.min_group_samples")), fallback
        )
    elif group in settings.overrides:
        threshold, source = settings.overrides[group], "override"
    elif fallback is not None:
        threshold, source = float(fallback), "fallback"
    else:
        return SpeedVerdict("no_threshold")

    if threshold is None or sog <= threshold:
        return SpeedVerdict("normal", threshold, source)

    score = model.score(sog, threshold) if model is not None else None
    if score is None:
        # No model loaded: the statistical layer alone decides (UC-004.EX.1).
        return SpeedVerdict("alert", threshold, source, None)
    if score >= settings.get("speed.score_threshold"):
        return SpeedVerdict("alert", threshold, source, score)
    if score >= settings.get("speed.warning_threshold"):
        return SpeedVerdict("warning", threshold, source, score)
    return SpeedVerdict("normal", threshold, source, score)
