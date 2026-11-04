from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.modules.detection.loitering import LoiteringDetector, haversine_m
from tests.conftest import FakeSettings

T0 = datetime(2026, 11, 4, 8, 0, tzinfo=timezone.utc)
LAT, LON = 6.9, 79.8


def feed(detector, minutes, step=2, mmsi=1, nav_status=0, sog=0.5, drift_deg_per_step=0.0, start=T0, settings=None):
    """Positions every `step` minutes; returns the detections."""
    settings = settings or FakeSettings()
    found = []
    for i, minute in enumerate(range(0, minutes + 1, step)):
        # Small wobble (~100 m) around the spot, plus optional steady drift.
        lat = LAT + (0.0005 if i % 2 else -0.0005) + drift_deg_per_step * i
        hit = detector.update(mmsi, start + timedelta(minutes=minute), lat, LON, sog, nav_status, settings)
        if hit:
            found.append(hit)
    return found


def test_haversine():
    assert 110_000 < haversine_m(0, 0, 1, 0) < 112_000


def test_vessel_holding_position_for_an_hour_is_loitering():
    found = feed(LoiteringDetector(), minutes=70)
    assert len(found) == 1
    hit = found[0]
    assert hit["duration_min"] >= 60
    assert hit["radius_m"] < 1000
    assert abs(hit["lat"] - LAT) < 0.001


def test_cooldown_allows_one_detection():
    detector = LoiteringDetector()
    assert len(feed(detector, minutes=170)) == 1


def test_short_stop_is_not_loitering():
    assert feed(LoiteringDetector(), minutes=40) == []


def test_anchored_and_moored_vessels_are_exempt():
    assert feed(LoiteringDetector(), minutes=90, nav_status=1) == []
    assert feed(LoiteringDetector(), minutes=90, nav_status=5) == []


def test_vessel_in_transit_is_not_loitering():
    # ~10 kn: 0.0055 degrees latitude per 2 minutes.
    assert feed(LoiteringDetector(), minutes=90, sog=10, drift_deg_per_step=0.0055) == []


def test_fast_average_speed_is_not_loitering():
    assert feed(LoiteringDetector(), minutes=90, sog=3) == []


def test_gap_restarts_the_track():
    detector = LoiteringDetector()
    assert feed(detector, minutes=30) == []
    # 40 minutes of silence, then 30 more minutes in the same spot: never 60 continuous.
    assert feed(detector, minutes=30, start=T0 + timedelta(minutes=70)) == []


def test_settings_are_read_live():
    found = feed(LoiteringDetector(), minutes=40, settings=FakeSettings(loitering__min_minutes=30))
    assert len(found) == 1


def test_prune_forgets_idle_vessels():
    detector = LoiteringDetector()
    feed(detector, minutes=10)
    detector.prune(T0 + timedelta(hours=7))
    assert detector.tracks == {}
