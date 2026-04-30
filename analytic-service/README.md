uvicorn app.main:app --reload --host 0.0.0.0 --port 8080 --env-file .env
# Analytic Service

FastAPI service for the analytics and AI part of the maritime surveillance system.

## Endpoints

- `GET /health`
- `GET /inspections/health`
- `POST /inspections/restricted_areas`
- `GET /inspections/restricted_areas/detected_ships`
- `WS /inspections/restricted_areas/detected_ships/ws`
- `GET /detection/health`

## Environment

- `DATABASE_URL` (required for creating restricted areas)

## Create restricted area

`POST /inspections/restricted_areas`

Request body:

```json
{
	"name": "North Reef Protection",
	"type": "coral",
	"coordinates": [
		[
			[74.5, 8.1],
			[74.8, 8.1],
			[74.8, 8.3],
			[74.5, 8.1]
		]
	]
}
```

## Detect ships in restricted areas

`GET /inspections/restricted_areas/detected_ships`

Query params:

- `page` (optional, default `1`): page number.
- `limit` (optional, default `20`, max `100`): page size.
- `timeout_ms` (optional, default `20000`): DB statement timeout in milliseconds. Use `0` to disable timeout.
- `recent_minutes` (optional, default `60`): only consider AIS records from last N minutes.

Timeout behavior:

- Detection query uses a DB statement timeout (default 20 seconds).
- REST API returns `504` with `Detection query timed out.` when timeout is hit.

This endpoint runs the following SQL:

```sql
WITH latest_ais AS (
	SELECT DISTINCT ON (a.mmsi)
		a.mmsi,
		a.ship_name,
		a.sog,
		a.position,
		a.time_utc
	FROM ais_positions a
	ORDER BY a.mmsi, a.time_utc DESC
)
SELECT
	s.mmsi,
	s.ship_name,
	r.name
FROM latest_ais s
JOIN restricted_areas r
ON ST_Intersects(s.position, r.geom)
WHERE s.sog < 5;
```

Response body (200):

```json
{
	"columns": ["..."],
	"rows": [["..."]],
	"count": 1,
	"page": 1,
	"limit": 20,
	"total_items": 42,
	"total_pages": 3
}
```

## Realtime stream for restricted area detections

`WS /inspections/restricted_areas/detected_ships/ws`

Query param:

- `interval` (optional, seconds): polling interval for snapshots. Defaults to `2`, clamped to `0.5-60`.
- `timeout_ms` (optional, default `20000`): DB statement timeout in milliseconds for each snapshot query.
- `recent_minutes` (optional, default `60`): only consider AIS records from last N minutes.

Example messages:

```json
{
	"type": "snapshot",
	"interval_seconds": 2.0,
	"timeout_ms": 20000,
	"recent_minutes": 60,
	"data": {
		"columns": ["..."],
		"rows": [["..."]],
		"count": 1
	}
}
```

```json
{
	"type": "error",
	"message": "Failed to detect ships in restricted areas."
}
```

```json
{
	"type": "error",
	"message": "Detection query timed out."
}
```

Notes:

- Coordinates are `[lon, lat]`.
- Polygon ring must be closed (first point equals last point).

Response body (201):

```json
{
	"id": 42,
	"name": "North Reef Protection",
	"type": "coral",
	"geometry": {
		"type": "Polygon",
		"coordinates": [
			[
				[74.5, 8.1],
				[74.8, 8.1],
				[74.8, 8.3],
				[74.5, 8.1]
			]
		]
	}
}
```

## Run locally

```bash
cd analytic-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
