from __future__ import annotations

import json

import httpx

from app.modules.detection.meta_client import MetaClient
from app.modules.detection.settings import DEFAULTS, SettingsStore


def make_client(handler):
    return MetaClient(
        "http://meta",
        email="svc@example.com",
        password="secret",
        transport=httpx.MockTransport(handler),
    )


def test_logs_in_then_sends_bearer_token():
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append((request.method, request.url.path, request.headers.get("authorization")))
        if request.url.path == "/api/users/login":
            assert json.loads(request.content) == {"identifier": "svc@example.com", "password": "secret"}
            return httpx.Response(200, json={"success": True, "data": {"token": "T1"}})
        return httpx.Response(201, json={"success": True, "data": {}})

    assert make_client(handler).post_anomaly({"mmsi": 1})
    assert seen == [("POST", "/api/users/login", None), ("POST", "/api/anomalies", "Bearer T1")]


def test_expired_token_triggers_one_relogin_and_retry():
    tokens = iter(["OLD", "NEW"])
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/users/login":
            return httpx.Response(200, json={"success": True, "data": {"token": next(tokens)}})
        calls.append(request.headers["authorization"])
        if request.headers["authorization"] == "Bearer OLD":
            return httpx.Response(401, json={"success": False, "message": "Invalid token"})
        return httpx.Response(201, json={"success": True})

    assert make_client(handler).post_anomaly({"mmsi": 1})
    assert calls == ["Bearer OLD", "Bearer NEW"]


def test_rejected_anomaly_returns_false():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/users/login":
            return httpx.Response(200, json={"data": {"token": "T"}})
        return httpx.Response(400, json={"success": False, "message": "bad"})

    assert make_client(handler).post_anomaly({"mmsi": 1}) is False


def test_settings_store_applies_values_and_overrides():
    payload = {
        "values": {"speed.score_threshold": 0.7, "unknown.key": 5, "speed.fallback_p99_kn": None},
        "thresholds": [
            {"type_group": 70, "p99_override": 22.5},
            {"type_group": 30, "p99_override": None},
        ],
    }

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/users/login":
            return httpx.Response(200, json={"data": {"token": "T"}})
        assert request.url.path == "/api/detection-settings"
        return httpx.Response(200, json={"success": True, "data": payload})

    store = SettingsStore(make_client(handler))
    assert store.get("speed.score_threshold") == DEFAULTS["speed.score_threshold"]
    assert store.refresh()
    assert store.get("speed.score_threshold") == 0.7
    assert store.get("loitering.radius_m") == DEFAULTS["loitering.radius_m"]
    assert store.overrides == {70: 22.5}


def test_settings_store_keeps_last_values_when_meta_service_is_down():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/users/login":
            return httpx.Response(200, json={"data": {"token": "T"}})
        return httpx.Response(503)

    store = SettingsStore(make_client(handler))
    store.apply({"values": {"loitering.radius_m": 500}})
    assert store.refresh() is False
    assert store.get("loitering.radius_m") == 500
