import json
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any

import psycopg

from app.db import get_connection
from app.modules.inspections.schemas import (
    RestrictedAreaCreateRequest,
    RestrictedAreaCreateResponse,
    RestrictedAreaShipDetectionsResponse,
)


class InvalidRestrictedAreaGeometryError(Exception):
    pass


class RestrictedAreaStorageError(Exception):
    pass


class RestrictedAreaQueryError(Exception):
    pass


class RestrictedAreaQueryTimeoutError(Exception):
    pass


def _polygon_to_wkt(coordinates: list[list[list[float]]]) -> str:
    ring = coordinates[0]
    points = ", ".join(f"{lon} {lat}" for lon, lat in ring)
    return f"POLYGON(({points}))"


def create_restricted_area(
    payload: RestrictedAreaCreateRequest,
) -> RestrictedAreaCreateResponse:
    polygon_wkt = _polygon_to_wkt(payload.coordinates)
    query = """
        INSERT INTO restricted_areas (name, type, geom)
        VALUES (%s, %s, ST_GeogFromText(%s))
        RETURNING
            id,
            name,
            type,
            ST_AsGeoJSON(geom::geometry)::text AS geometry_json
    """

    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, (payload.name, payload.type.value, polygon_wkt))
                row = cursor.fetchone()
    except psycopg.errors.InvalidParameterValue as exc:
        raise InvalidRestrictedAreaGeometryError("Invalid polygon geometry.") from exc
    except psycopg.Error as exc:
        raise RestrictedAreaStorageError("Failed writing restricted area to database.") from exc

    if row is None:
        raise RestrictedAreaStorageError("Database did not return created record.")

    geometry = json.loads(row[3])
    return RestrictedAreaCreateResponse(
        id=row[0],
        name=row[1],
        type=row[2],
        geometry=geometry,
    )


def _serialize_value(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    return str(value)


def _run_detection_query(query: str) -> tuple[list[str], list[list[Any]]]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query)
            raw_rows = cursor.fetchall()
            columns = [column.name for column in cursor.description or []]
    rows = [[_serialize_value(value) for value in row] for row in raw_rows]
    return columns, rows


def _run_paginated_detection_query(
    data_query: str,
    count_query: str,
    limit: int,
    offset: int,
    statement_timeout_ms: int,
    data_params: tuple[Any, ...],
    count_params: tuple[Any, ...],
) -> tuple[list[str], list[list[Any]], int]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            if statement_timeout_ms >= 0:
                cursor.execute(f"SET LOCAL statement_timeout = {statement_timeout_ms}")
            cursor.execute(count_query, count_params)
            count_row = cursor.fetchone()
            total_items = int(count_row[0]) if count_row else 0

            cursor.execute(data_query, data_params)
            raw_rows = cursor.fetchall()
            columns = [column.name for column in cursor.description or []]

    rows = [[_serialize_value(value) for value in row] for row in raw_rows]
    return columns, rows, total_items


def detect_ships_in_restricted_areas(
    page: int = 1,
    limit: int = 20,
    statement_timeout_ms: int = 20000,
    recent_minutes: int = 60,
) -> RestrictedAreaShipDetectionsResponse:
    offset = (page - 1) * limit

    query = """
        WITH latest_ais AS (
            SELECT DISTINCT ON (a.mmsi)
                a.mmsi,
                a.ship_name,
                a.sog,
                a.position,
                a.time_utc
            FROM ais_positions a
            WHERE a.time_utc >= NOW() - (%s * INTERVAL '1 minute')
            ORDER BY a.mmsi, a.time_utc DESC
        )
        SELECT
            s.mmsi,
            s.ship_name,
            r.name
        FROM latest_ais s
        JOIN restricted_areas r
          ON ST_Intersects(s.position, r.geom)
        WHERE s.sog < 5
        ORDER BY s.mmsi, s.ship_name, r.name
        LIMIT %s OFFSET %s;
    """

    count_query = """
        WITH latest_ais AS (
            SELECT DISTINCT ON (a.mmsi)
                a.mmsi,
                a.ship_name,
                a.sog,
                a.position,
                a.time_utc
            FROM ais_positions a
            WHERE a.time_utc >= NOW() - (%s * INTERVAL '1 minute')
            ORDER BY a.mmsi, a.time_utc DESC
        )
        SELECT COUNT(*)
        FROM latest_ais s
        JOIN restricted_areas r
          ON ST_Intersects(s.position, r.geom)
        WHERE s.sog < 5;
    """

    fallback_query = """
        SELECT
            v.mmsi,
            v.name AS ship_name,
            r.name
        FROM vessel_positions vp
        JOIN vessels v ON v.vessel_id = vp.vessel_id
        JOIN restricted_areas r
          ON ST_Intersects(
                ST_SetSRID(ST_MakePoint(vp.lon, vp.lat), 4326)::geography,
                r.geom
             )
        WHERE vp.sog_kn < 5
        ORDER BY v.mmsi, v.name, r.name
        LIMIT %s OFFSET %s;
    """

    fallback_count_query = """
        SELECT COUNT(*)
        FROM vessel_positions vp
        JOIN vessels v ON v.vessel_id = vp.vessel_id
        JOIN restricted_areas r
          ON ST_Intersects(
                ST_SetSRID(ST_MakePoint(vp.lon, vp.lat), 4326)::geography,
                r.geom
             )
        WHERE vp.sog_kn < 5;
    """

    try:
        columns, rows, total_items = _run_paginated_detection_query(
            query,
            count_query,
            limit,
            offset,
            statement_timeout_ms,
            (recent_minutes, limit, offset),
            (recent_minutes,),
        )
    except (psycopg.errors.UndefinedTable, psycopg.errors.UndefinedColumn):
        try:
            columns, rows, total_items = _run_paginated_detection_query(
                fallback_query,
                fallback_count_query,
                limit,
                offset,
                statement_timeout_ms,
                (limit, offset),
                (),
            )
        except psycopg.errors.QueryCanceled as exc:
            raise RestrictedAreaQueryTimeoutError(
                "Detection query timed out."
            ) from exc
        except psycopg.Error as exc:
            raise RestrictedAreaQueryError(
                "Failed to query ships in restricted areas."
            ) from exc
    except psycopg.errors.QueryCanceled as exc:
        raise RestrictedAreaQueryTimeoutError("Detection query timed out.") from exc
    except psycopg.Error as exc:
        raise RestrictedAreaQueryError(
            "Failed to query ships in restricted areas."
        ) from exc

    total_pages = (total_items + limit - 1) // limit if total_items else 0
    return RestrictedAreaShipDetectionsResponse(
        columns=columns,
        rows=rows,
        count=len(rows),
        page=page,
        limit=limit,
        total_items=total_items,
        total_pages=total_pages,
    )
