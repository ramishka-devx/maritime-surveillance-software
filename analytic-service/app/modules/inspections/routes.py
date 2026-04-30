import asyncio

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, status

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
    create_restricted_area,
    detect_ships_in_restricted_areas,
)


router = APIRouter()


def _parse_interval_seconds(websocket: WebSocket) -> float:
    raw_interval = websocket.query_params.get("interval", "2")
    try:
        interval = float(raw_interval)
    except ValueError:
        interval = 2.0
    return max(0.5, min(interval, 60.0))


def _parse_timeout_ms(websocket: WebSocket) -> int:
    raw_timeout = websocket.query_params.get("timeout_ms", "20000")
    try:
        timeout_ms = int(raw_timeout)
    except ValueError:
        timeout_ms = 20000
    return max(0, min(timeout_ms, 300000))


def _parse_recent_minutes(websocket: WebSocket) -> int:
    raw_minutes = websocket.query_params.get("recent_minutes", "60")
    try:
        minutes = int(raw_minutes)
    except ValueError:
        minutes = 60
    return max(1, min(minutes, 1440))


@router.get("/health")
def inspections_health() -> dict[str, str]:
    return {"status": "ok", "module": "inspections"}


@router.post(
    "/restricted_areas",
    status_code=status.HTTP_201_CREATED,
    response_model=RestrictedAreaCreateResponse,
)
def create_restricted_area_handler(
    payload: RestrictedAreaCreateRequest,
) -> RestrictedAreaCreateResponse:
    try:
        return create_restricted_area(payload)
    except InvalidRestrictedAreaGeometryError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except RestrictedAreaStorageError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create restricted area.",
        ) from exc


@router.get(
    "/restricted_areas/detected_ships",
    response_model=RestrictedAreaShipDetectionsResponse,
)
def detected_ships_in_restricted_areas_handler(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    timeout_ms: int = Query(default=20000, ge=0, le=300000),
    recent_minutes: int = Query(default=60, ge=1, le=1440),
) -> RestrictedAreaShipDetectionsResponse:
    try:
        return detect_ships_in_restricted_areas(
            page=page,
            limit=limit,
            statement_timeout_ms=timeout_ms,
            recent_minutes=recent_minutes,
        )
    except RestrictedAreaQueryTimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Detection query timed out.",
        ) from exc
    except RestrictedAreaQueryError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to detect ships in restricted areas.",
        ) from exc


@router.websocket("/restricted_areas/detected_ships/ws")
async def detected_ships_in_restricted_areas_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    interval_seconds = _parse_interval_seconds(websocket)
    timeout_ms = _parse_timeout_ms(websocket)
    recent_minutes = _parse_recent_minutes(websocket)

    while True:
        try:
            detection_result = detect_ships_in_restricted_areas(
                statement_timeout_ms=timeout_ms,
                recent_minutes=recent_minutes,
            )
            await websocket.send_json(
                {
                    "type": "snapshot",
                    "interval_seconds": interval_seconds,
                    "timeout_ms": timeout_ms,
                    "recent_minutes": recent_minutes,
                    "data": detection_result.model_dump(),
                }
            )
            await asyncio.sleep(interval_seconds)
        except RestrictedAreaQueryError:
            await websocket.send_json(
                {
                    "type": "error",
                    "message": "Failed to detect ships in restricted areas.",
                }
            )
            await asyncio.sleep(interval_seconds)
        except RestrictedAreaQueryTimeoutError:
            await websocket.send_json(
                {
                    "type": "error",
                    "message": "Detection query timed out.",
                }
            )
            await asyncio.sleep(interval_seconds)
        except WebSocketDisconnect:
            break


