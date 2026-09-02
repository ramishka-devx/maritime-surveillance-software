# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Maritime surveillance platform ("SerenGuard"). A monorepo of four independently-run
services plus AI notebooks, all backed by a **single shared PostgreSQL database**
(`ais_db`, with PostGIS):

| Dir | Stack | Role |
| --- | --- | --- |
| `ingest-service/` | Node (CommonJS), kafkajs, pg, ws | Connects to aisstream.io over WebSocket, publishes raw AIS to Kafka, and consumes it back to persist `ships` / `ais_positions` |
| `analytic-service/` | Python, FastAPI, confluent-kafka, scikit-learn, pandas | Consumes the same Kafka topic, runs IsolationForest speed-anomaly detection, POSTs findings to meta-service |
| `meta-service/` | Node (ESM), Express, pg, JWT | REST API: RBAC/users, vessels, positions, alerts, anomalies, AIS, restricted areas. Swagger at `/api-docs` |
| `ui/` | React 19, Vite 7, Tailwind 3, react-router 7, MapLibre GL + Leaflet | Operator dashboard |
| `AI/`, `test/` | Jupyter notebooks, scratch scripts | Model development and data export; not part of the runtime |

### Data flow

```
aisstream.io --ws--> ingest-service --> Kafka topic "ais.raw.messages"
                                          |-> ingest-service consumer -> ships, ais_positions (PostGIS)
                                          |-> analytic-service consumer -> speed anomaly model -> POST meta-service /api/anomalies
ui  --/api proxy-->  meta-service  --pg-->  ais_db
```

Kafka can be disabled per-service (`KAFKA_ENABLED=false` in ingest); ingest then writes
straight to the DB with no queue.

### Local infra (Docker)
```bash
docker compose up -d          # Postgres+PostGIS on :5432 (ais_db) + single-node Kafka on :9092
docker compose down           # stop, keep data
docker compose down -v        # stop and wipe (DB re-inits from meta-service/db/* on next up)
```
`docker-compose.yml` (repo root) loads the full schema on first start, in order:
redesign patch (AIS tables) → `restricted-areas` patch → `db/schema.sql` → `db/seed.sql`
→ `scripts/seed-permissions.sql`. If host port 5432 is taken, set `POSTGRES_HOST_PORT`
in a root `./.env` and `DB_PORT` to match in the service `.env` files. The app services
run on the host (not containerised). Seeded dev logins: `admin@example.com` /
`operator@example.com`, password `Password123!`.

### meta-service
```bash
cd meta-service
npm install
cp .env.example .env          # set DB_HOST=localhost, DB_PASSWORD=seren0Guard, PORT=5000, JWT_SECRET
npm run db:reset             # drop + rebuild ais_db from all SQL in the right order (non-Docker path)
# or piecemeal: npm run db:schema / db:seed / db:seed-permissions
npm run dev                   # nodemon src/server.js
npm run lint                  # eslint src/**/*.js
npm run format                # prettier
```
`npm run db:schema` alone is **not** enough on a fresh DB — `anomalies` in `schema.sql`
FK-references `ships`, which only the redesign patch creates. Use `db:reset`, or apply
patches first: `node scripts/run-sql.js db/patches/<file>.sql` in date order.
`scripts/run-sql.js` creates the database if missing and splits on `;` (comment- and
dollar-quote-aware).

### analytic-service
```bash
cd analytic-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.sample .env
uvicorn app.main:app --reload   # serves on :8000; the Kafka consumer starts with the app
```
`cp .env.example .env` (the committed example; `.env.sample` is git-ignored).
There is no test runner or linter configured. `.pytest_cache` exists but no tests are checked in.
For Kafka replay, use a fresh `KAFKA_GROUP_ID` so offsets aren't already committed.

### ingest-service
```bash
cd ingest-service
npm install
cp .env.example .env           # DB_PASSWORD, AIS_STREAM_IO_API_KEY, KAFKA_BROKERS
npm run dev                     # nodemon index.js
```
No lint/test. Requires a reachable Kafka broker unless `KAFKA_ENABLED=false`.

### ui
```bash
cd ui
npm install
npm run dev       # Vite dev server; proxies /api -> meta-service (see below)
npm run build
npm run lint      # eslint (flat config, eslint.config.js)
```

## Architecture notes that span multiple files

### meta-service was forked from a MySQL template ("machine-cure-api")

`src/config/db.config.js` is a **compatibility shim**. Models are written in MySQL
dialect and the shim rewrites them for Postgres at query time:
- `?` placeholders → `$1, $2, …`
- `INSERT` statements get ` RETURNING <pk> AS insert_id` appended (PK inferred per
  table from a hard-coded map in `getInsertReturningClause`)
- `INSERT IGNORE` → `INSERT ... ON CONFLICT DO NOTHING`
- non-SELECT results are reshaped to `{ insertId, affectedRows, rowCount }`

When adding a model, **follow the existing convention**: use `?` placeholders, call the
exported `query(sql, params)` from `db.config.js`, and read `result.insertId` /
`result.affectedRows`. If you add a table whose PK isn't in the `tableToPk` map,
add it there or write an explicit `RETURNING`.

### Two overlapping schemas

- `db/schema.sql` — RBAC (`roles`, `permissions`, `users`, `role_permissions`,
  `user_roles`, `user_permissions`), plus `vessels`, `vessel_positions`, `alerts`,
  `activities`, `notifications`, and `anomalies`.
- `db/patches/2026-04-30-db-redesign.sql` — `ship_types`, `ships`, and `ais_positions`
  (`position GEOGRAPHY(Point,4326)`, **range-partitioned by `time_utc`**, with a DEFAULT
  partition + the `create_next_two_partitions()` function). Reconstructed from the
  consuming code after the original hand-built DB was lost — the column set is authored
  to match `ingest-service/insert.js` and the meta-service AIS/restricted-area queries.
- `db/patches/2026-09-02-restricted-areas.sql` — `restricted_areas` (GEOGRAPHY polygon),
  used by the restricted-areas module.

`ingest-service` operates on the `ships` / `ais_positions` world (analytic-service uses
no DB — it POSTs to meta-service over HTTP). `meta-service` mostly operates on `vessels`
/ `vessel_positions`, but `anomalies` in `schema.sql` FK-references `ships(mmsi)`, so the
redesign patch must load **before** `schema.sql` (`npm run db:reset` and the Docker init
both do this).

Partitions for `ais_positions` are created by `create_next_two_partitions()` (defined in
the redesign patch), invoked nightly from `meta-service/cron/partition-cron.js` (imported
by `src/server.js`). The DEFAULT partition means inserts never fail if that job lapses.

### meta-service request pipeline

Every route in `src/app.js` mounts a module from `src/modules/<name>/` with files
`*.routes.js / *.controller.js / *.service.js / *.model.js / *.validation.js`.
Standard middleware chain per protected route:
`authMiddleware` → `permissionMiddleware('<module>.<action>')` → `activityLogger('<perm>')`
→ `validate(<joiSchema>)` → controller.

- Permission strings are seeded by `npm run db:seed-permissions`.
- `PERMISSIONS_BYPASS=true` (dev only) skips permission checks.
- `SUPER_ADMIN_REGISTRATION_SECRET` gates super-admin self-registration via public
  `/api/users/register`.
- All responses use the envelope `{ success, message, data }`.

### Ports / wiring

- meta-service: `PORT` defaults to 3000 in `env.js`, but the rest of the system expects
  **5000** (with automatic fallback to **5001** if 5000 is busy — see the port-retry loop
  in `src/server.js`). Set `PORT=5000` in `.env`.
- ui: `vite.config.js` probes 5000 then 5001 and proxies `/api` there; in production
  builds `src/lib/api.js` falls back to `http://127.0.0.1:5000`. Override with
  `VITE_API_BASE_URL` / `VITE_API_PROXY_TARGET`.
- analytic-service: `META_SERVICE_URL` (default `http://localhost:5000`) +
  `META_SERVICE_TOKEN` (a JWT) for posting anomalies.

### AIS parsing is duplicated

`ingest-service/parser.js` and `analytic-service/app/modules/detection/kafka_consumer.py`
each implement their own normalization of the aisstream.io `PositionReport` /
`ShipStaticData` message shapes (dimensions A/B/C/D → width/length, `time_utc` →
ISO 8601). Keep them in sync when the upstream format changes.

### Speed-anomaly detection

`analytic-service` buffers position reports keyed by static group
`(width, length, ship_type)` — or by `mmsi` when static data is unavailable — and only
scores once a buffer reaches `ANOMALY_MIN_SAMPLES`. It flags a row if IsolationForest
marks it an outlier **or** `sog` exceeds the buffer's p99. The batch/offline version
lives in `speed_anomalies.py` and is exposed at `POST /detection/speed-anomalies`.

### UI auth

`src/auth/AuthContext.jsx` holds token + user + roles. Route guards:
`RequireAuth`, `RequirePermission`, `PermissionGate`, `RequestAccessGate`
(`src/App.jsx` wraps each page in `RequestAccessGate permission="..."`). Super-admin is
`role_id === 1` or a role named `super_admin`. `src/lib/api.js` `apiRequest()` unwraps
the `{ success, data }` envelope and throws on `success === false`.

## API client collection

`meta-service/SeranGuard/` is a Bruno collection covering the meta-service endpoints
(Auth, Users, Vessels, Anomalies, Alerts, Permissions, …) with `dev` / `pro` environments.
