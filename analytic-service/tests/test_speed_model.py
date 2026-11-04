from __future__ import annotations

import pytest

from app.modules.detection.payloads import speed_payload
from app.modules.detection.speed_model import SpeedModel, evaluate, fit_speed_model
from app.modules.detection.type_groups import type_group
from tests.conftest import FakeSettings


@pytest.fixture(scope="module")
def model(fleet):
    return fit_speed_model(fleet, n_estimators=100)


def cargo(sog: float, **extra) -> dict:
    return {"mmsi": 123456789, "sog": sog, "width": 30, "length": 200, "ship_type": 70, **extra}


def test_type_groups():
    assert type_group(71) == 70
    assert type_group(84) == 80
    assert type_group(30) == 30
    assert type_group(36) == 36
    assert type_group(38) == 0  # reserved
    assert type_group(None) == 0
    assert type_group("abc") == 0
    assert type_group(15) == 0


def test_p99_per_vessel_type(model):
    # Normal(12, 2): p99 is about 12 + 2.33 * 2.
    assert 15 < model.p99_by_group[70] < 18.5
    assert 8 < model.p99_by_group[30] < 11
    assert model.samples_by_group[70] == 3000


def test_scores_separate_normal_marginal_and_extreme_speeds(model):
    p99 = model.p99_by_group[70]
    normal = model.score(12, p99)
    marginal = model.score(p99 + 0.1, p99)
    extreme = model.score(40, p99)
    assert 0 < normal < 0.55
    assert normal < marginal < extreme
    assert extreme >= 0.7


def test_relative_speed_makes_scores_vessel_type_aware(model):
    # 12 kn is ordinary for cargo but twice the fishing p99.
    assert model.score(12, model.p99_by_group[30]) > model.score(12, model.p99_by_group[70]) + 0.1


def test_below_p99_is_normal_and_unscored(model, settings):
    verdict = evaluate(cargo(13), model, settings)
    assert verdict.outcome == "normal"
    assert verdict.score is None
    assert verdict.threshold_source == "type"


def test_far_above_p99_alerts_with_score(model, settings):
    verdict = evaluate(cargo(40), model, settings)
    assert verdict.outcome == "alert"
    assert verdict.score >= settings.get("speed.score_threshold")
    assert verdict.threshold == pytest.approx(model.p99_by_group[70])


def test_just_over_p99_is_a_warning_not_an_alert(model, settings):
    # The second layer: barely over p99 isn't enough for an alert at the default threshold.
    verdict = evaluate(cargo(model.p99_by_group[70] + 0.1), model, settings)
    assert verdict.outcome == "warning"
    assert settings.get("speed.warning_threshold") <= verdict.score < settings.get("speed.score_threshold")


def test_above_p99_below_both_thresholds_is_normal(model):
    strict = FakeSettings(speed__score_threshold=0.99, speed__warning_threshold=0.99, speed__high_severity_score=0.99)
    verdict = evaluate(cargo(model.p99_by_group[70] + 0.1), model, strict)
    assert verdict.outcome == "normal"
    assert verdict.score is not None


def test_warning_band(model):
    s = FakeSettings(speed__score_threshold=1.0, speed__warning_threshold=0.5, speed__high_severity_score=1.0)
    assert evaluate(cargo(40), model, s).outcome == "warning"


def test_admin_override_replaces_computed_p99(model):
    s = FakeSettings(overrides={70: 30.0})
    assert evaluate(cargo(25), model, s).outcome == "normal"
    verdict = evaluate(cargo(40), model, s)
    assert verdict.threshold == 30.0 and verdict.threshold_source == "override"


def test_sparse_type_uses_fallback(model):
    tug = {"mmsi": 1, "sog": 20, "width": 10, "length": 30, "ship_type": 52}  # 50 samples < 200
    assert evaluate(tug, model, FakeSettings()).threshold_source == "all_vessels"
    verdict = evaluate(tug, model, FakeSettings(speed__fallback_p99_kn=25))
    assert verdict.threshold == 25 and verdict.outcome == "normal"


def test_sparse_fast_type_keeps_its_own_higher_p99(fleet):
    import pandas as pd
    import numpy as np

    rng = np.random.default_rng(3)
    ferries = pd.DataFrame({"mmsi": 1, "sog": rng.normal(30, 1.5, 100), "width": 8, "length": 40, "ship_type": 40})
    model = fit_speed_model(pd.concat([fleet, ferries], ignore_index=True))
    ferry = {"mmsi": 1, "sog": 31, "width": 8, "length": 40, "ship_type": 40}
    verdict = evaluate(ferry, model, FakeSettings())
    assert verdict.threshold_source == "type_sparse"
    assert verdict.outcome == "normal"


def test_not_available_sog_is_ignored(model, settings):
    assert evaluate(cargo(102.3), model, settings).outcome == "normal"
    assert evaluate(cargo(None), model, settings).outcome == "normal"


def test_missing_static_data_still_scores(model, settings):
    record = {"mmsi": 1, "sog": 60, "width": None, "length": None, "ship_type": None}
    verdict = evaluate(record, model, settings)
    assert verdict.threshold_source == "all_vessels"
    assert verdict.score is not None


def test_without_model_the_p99_layer_decides(settings):
    assert evaluate(cargo(40), None, settings).outcome == "no_threshold"
    verdict = evaluate(cargo(40), None, FakeSettings(speed__fallback_p99_kn=20))
    assert verdict.outcome == "alert" and verdict.score is None


def test_save_and_load(model, tmp_path):
    path = tmp_path / "speed.joblib"
    model.save(path)
    loaded = SpeedModel.load(path)
    assert loaded.version == model.version
    assert loaded.score(40, 16) == pytest.approx(model.score(40, 16))
    assert SpeedModel.load(tmp_path / "missing.joblib") is None


def test_computed_thresholds_report(model):
    rows = {r["type_group"]: r for r in model.computed_thresholds()}
    assert rows[70]["label"] == "Cargo"
    assert rows[70]["sample_count"] == 3000


def test_speed_payload(model, settings):
    record = cargo(40, heading=511, lat=6.9, lon=79.8, time="2026-11-04T10:00:00+00:00")
    verdict = evaluate(record, model, settings)
    body = speed_payload(record, verdict, model.version)
    assert body["anomaly_type"] == "speed"
    assert body["heading"] is None  # 511 = not available
    assert body["lat"] == 6.9 and "lat" not in body["details"]
    assert 0 < body["score"] <= 1 and body["model_version"] == model.version
    assert body["detected_at"] == "2026-11-04T10:00:00+00:00"
