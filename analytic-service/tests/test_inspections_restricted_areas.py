from fastapi.testclient import TestClient

from app.main import app
from app.modules.inspections.schemas import (
    RestrictedAreaCreateRequest,
    RestrictedAreaCreateResponse,
    RestrictedAreaShipDetectionsResponse,
)
from app.modules.inspections.service import (
    InvalidRestrictedAreaGeometryError,
    RestrictedAreaQueryError,
    RestrictedAreaQueryTimeoutError,
    RestrictedAreaStorageError,
)


client = TestClient(app)


def _valid_payload() -> dict:
    return {
        "name": "Delta Exclusion Zone",
        "type": "restricted",
        "coordinates": [
            [
                [72.10, 6.55],
                [72.25, 6.55],
                [72.25, 6.70],
                [72.10, 6.55],
            ]
        ],
    }


def test_create_restricted_area_success(monkeypatch):
    def fake_create_restricted_area(
        payload: RestrictedAreaCreateRequest,
    ) -> RestrictedAreaCreateResponse:
        assert payload.name == "Delta Exclusion Zone"
        return RestrictedAreaCreateResponse(
            id=11,
            name=payload.name,
            type=payload.type,
            geometry={
                "type": "Polygon",
                "coordinates": payload.coordinates,
            },
        )

    monkeypatch.setattr(
        "app.modules.inspections.routes.create_restricted_area",
        fake_create_restricted_area,
    )

    response = client.post("/inspections/restricted_areas", json=_valid_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 11
    assert body["name"] == "Delta Exclusion Zone"
    assert body["type"] == "restricted"
    assert body["geometry"]["type"] == "Polygon"


def test_create_restricted_area_invalid_type_returns_422():
    payload = _valid_payload()
    payload["type"] = "port"

    response = client.post("/inspections/restricted_areas", json=payload)

    assert response.status_code == 422


def test_create_restricted_area_open_ring_returns_422():
    payload = _valid_payload()
    payload["coordinates"][0] = [
        [72.10, 6.55],
        [72.25, 6.55],
        [72.25, 6.70],
        [72.15, 6.60],
    ]

    response = client.post("/inspections/restricted_areas", json=payload)

    assert response.status_code == 422


def test_create_restricted_area_out_of_bounds_coordinate_returns_422():
    payload = _valid_payload()
    payload["coordinates"][0][0] = [190, 91]

    response = client.post("/inspections/restricted_areas", json=payload)

    assert response.status_code == 422


def test_create_restricted_area_maps_invalid_geometry_to_400(monkeypatch):
    def fake_create_restricted_area(_: RestrictedAreaCreateRequest) -> RestrictedAreaCreateResponse:
        raise InvalidRestrictedAreaGeometryError("Invalid polygon geometry.")

    monkeypatch.setattr(
        "app.modules.inspections.routes.create_restricted_area",
        fake_create_restricted_area,
    )

    response = client.post("/inspections/restricted_areas", json=_valid_payload())

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid polygon geometry."


def test_create_restricted_area_maps_storage_error_to_500(monkeypatch):
    def fake_create_restricted_area(_: RestrictedAreaCreateRequest) -> RestrictedAreaCreateResponse:
        raise RestrictedAreaStorageError("db down")

    monkeypatch.setattr(
        "app.modules.inspections.routes.create_restricted_area",
        fake_create_restricted_area,
    )

    response = client.post("/inspections/restricted_areas", json=_valid_payload())

    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to create restricted area."


def test_detected_ships_in_restricted_areas_success(monkeypatch):
    def fake_detect_ships_in_restricted_areas(
        page: int = 1,
        limit: int = 20,
        statement_timeout_ms: int = 20000,
        recent_minutes: int = 60,
    ) -> RestrictedAreaShipDetectionsResponse:
        assert page == 2
        assert limit == 1
        assert statement_timeout_ms == 15000
        assert recent_minutes == 120
        return RestrictedAreaShipDetectionsResponse(
            columns=["mmsi", "ship_name", "name"],
            rows=[["123456789", "Sea Runner", "North Reef Protection"]],
            count=1,
            page=page,
            limit=limit,
            total_items=4,
            total_pages=4,
        )

    monkeypatch.setattr(
        "app.modules.inspections.routes.detect_ships_in_restricted_areas",
        fake_detect_ships_in_restricted_areas,
    )

    response = client.get(
        "/inspections/restricted_areas/detected_ships?page=2&limit=1&timeout_ms=15000&recent_minutes=120"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["columns"][0] == "mmsi"
    assert body["rows"][0][2] == "North Reef Protection"
    assert body["page"] == 2
    assert body["limit"] == 1
    assert body["total_items"] == 4
    assert body["total_pages"] == 4


def test_detected_ships_in_restricted_areas_maps_query_error_to_500(monkeypatch):
    def fake_detect_ships_in_restricted_areas(
        page: int = 1,
        limit: int = 20,
        statement_timeout_ms: int = 20000,
        recent_minutes: int = 60,
    ) -> RestrictedAreaShipDetectionsResponse:
        raise RestrictedAreaQueryError("query failed")

    monkeypatch.setattr(
        "app.modules.inspections.routes.detect_ships_in_restricted_areas",
        fake_detect_ships_in_restricted_areas,
    )

    response = client.get("/inspections/restricted_areas/detected_ships")

    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to detect ships in restricted areas."


def test_detected_ships_in_restricted_areas_maps_query_timeout_to_504(monkeypatch):
    def fake_detect_ships_in_restricted_areas(
        page: int = 1,
        limit: int = 20,
        statement_timeout_ms: int = 20000,
        recent_minutes: int = 60,
    ) -> RestrictedAreaShipDetectionsResponse:
        raise RestrictedAreaQueryTimeoutError("timeout")

    monkeypatch.setattr(
        "app.modules.inspections.routes.detect_ships_in_restricted_areas",
        fake_detect_ships_in_restricted_areas,
    )

    response = client.get("/inspections/restricted_areas/detected_ships")

    assert response.status_code == 504
    assert response.json()["detail"] == "Detection query timed out."


def test_detected_ships_in_restricted_areas_websocket_streams_snapshot(monkeypatch):
    def fake_detect_ships_in_restricted_areas(
        page: int = 1,
        limit: int = 20,
        statement_timeout_ms: int = 20000,
        recent_minutes: int = 60,
    ) -> RestrictedAreaShipDetectionsResponse:
        assert statement_timeout_ms == 25000
        assert recent_minutes == 30
        return RestrictedAreaShipDetectionsResponse(
            columns=["mmsi", "ship_name", "name"],
            rows=[["123456789", "Sea Runner", "North Reef Protection"]],
            count=1,
            page=page,
            limit=limit,
            total_items=1,
            total_pages=1,
        )

    monkeypatch.setattr(
        "app.modules.inspections.routes.detect_ships_in_restricted_areas",
        fake_detect_ships_in_restricted_areas,
    )

    with client.websocket_connect(
        "/inspections/restricted_areas/detected_ships/ws?interval=0.5&timeout_ms=25000&recent_minutes=30"
    ) as websocket:
        message = websocket.receive_json()

    assert message["type"] == "snapshot"
    assert message["timeout_ms"] == 25000
    assert message["recent_minutes"] == 30
    assert message["data"]["count"] == 1
    assert message["data"]["rows"][0][0] == "123456789"


def test_detected_ships_in_restricted_areas_websocket_streams_error(monkeypatch):
    def fake_detect_ships_in_restricted_areas(
        page: int = 1,
        limit: int = 20,
        statement_timeout_ms: int = 20000,
        recent_minutes: int = 60,
    ) -> RestrictedAreaShipDetectionsResponse:
        raise RestrictedAreaQueryError("query failed")

    monkeypatch.setattr(
        "app.modules.inspections.routes.detect_ships_in_restricted_areas",
        fake_detect_ships_in_restricted_areas,
    )

    with client.websocket_connect(
        "/inspections/restricted_areas/detected_ships/ws?interval=0.5"
    ) as websocket:
        message = websocket.receive_json()

    assert message["type"] == "error"
    assert message["message"] == "Failed to detect ships in restricted areas."


def test_detected_ships_in_restricted_areas_websocket_streams_timeout_error(monkeypatch):
    def fake_detect_ships_in_restricted_areas(
        page: int = 1,
        limit: int = 20,
        statement_timeout_ms: int = 20000,
        recent_minutes: int = 60,
    ) -> RestrictedAreaShipDetectionsResponse:
        raise RestrictedAreaQueryTimeoutError("timeout")

    monkeypatch.setattr(
        "app.modules.inspections.routes.detect_ships_in_restricted_areas",
        fake_detect_ships_in_restricted_areas,
    )

    with client.websocket_connect(
        "/inspections/restricted_areas/detected_ships/ws?interval=0.5"
    ) as websocket:
        message = websocket.receive_json()

    assert message["type"] == "error"
    assert message["message"] == "Detection query timed out."
