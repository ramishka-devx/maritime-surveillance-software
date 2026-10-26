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
docker compose down -v        # stop and wipe
cd meta-service && npm run db:migrate && npm run db:seed && npm run db:seed-permissions
```
The container starts as an empty `ais_db` with PostGIS, and the schema comes only from the
meta-service TypeORM migrations (see below). If host port 5432 is taken, set `POSTGRES_HOST_PORT`
in a root `./.env` and `DB_PORT` to match in the service `.env` files. The app services
run on the host (not containerised). Seeded dev logins: `admin@example.com` /
`operator@example.com`, password `Password123!`.

### meta-service
```bash
cd meta-service
npm install
cp .env.example .env          # set DB_HOST=localhost, DB_PASSWORD=seren0Guard, PORT=5000, JWT_SECRET
npm run db:reset             # drop + recreate ais_db → migrations → seed.sql → seed-permissions
# or piecemeal: npm run db:migrate / db:seed / db:seed-permissions
npm run db:migrate:revert     # undo the last migration
npm run db:migration:generate -- src/db/migrations/<Name>   # diff entities vs DB → new JS migration
npm run dev                   # nodemon src/server.js
npm run lint                  # eslint src/**/*.js
npm run format                # prettier
node --test tests/            # node:test suite (no npm script)
```
`scripts/run-sql.js` (used for the seeds) creates the database if missing and splits on
`;` (comment- and dollar-quote-aware). `db/patches/` now only holds legacy MySQL RBAC
patches and one-off data fixes; it is not part of schema setup.

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

### Schema: TypeORM entities + migrations (schema only, not queries)

`meta-service/src/db/` owns the schema for the whole shared DB:
- `entities/*.entity.js` — one JS `EntitySchema` per table (16 tables).
- `migrations/*.js` — `InitialSchema` is the hand-written baseline (all `IF NOT EXISTS`, so
  it also just records itself on a DB built from the old SQL files).
- `data-source.js` — used **only** by the TypeORM CLI. The app does not import it; models
  still query through the `db.config.js` shim above.

Rules when changing the schema:
- Edit the entity, then generate (or hand-write) a migration. Run
  `npx typeorm schema:log -d src/db/data-source.js`; it should print "up to date" afterwards.
- Entities pin the **Postgres-generated constraint names** (`users_role_id_fkey`,
  `users_email_key`, `chk_*`, `idx_*`). TypeORM matches FKs, uniques and indexes by name,
  so leaving a name out makes `migration:generate` emit pointless drop/recreate pairs.
- `ais_positions` is **range-partitioned by `time_utc`** (DEFAULT partition +
  `create_next_two_partitions()`, run nightly by `meta-service/cron/partition-cron.js`).
  TypeORM can't express partitioning or the function, so review any generated migration
  that touches this table. The entity's `idx_ais_positions_mmsi_time` has no `DESC`;
  the migration has it. `partition-cron.js` runs at startup and nightly: it creates today +
  2 days of partitions and calls `drop_old_ais_partitions(7)` (**7-day retention**).
- `ships` also holds each vessel's **latest position** (`lat`, `lon`, `sog`, `cog`, `heading`,
  `nav_status`, `last_position_at`), updated by `ingest-service/insert.js` right after each
  `ais_positions` insert. The map endpoints (`/api/ais/positions/latest`, `/api/ais/vessels`)
  read `ships` by `idx_ships_last_position_at`. Don't point them back at `ais_positions`;
  `DISTINCT ON` over the full history gets slower with every row.
- `anomaly_type_enum` keeps the `'behavoir'` typo; code depends on it.

Two table groups share the DB. `ingest-service` writes `ships` / `ais_positions` (it does
not run migrations, so meta-service's must have run first). analytic-service uses no DB;
it POSTs to meta-service over HTTP. `meta-service` mostly uses `vessels` /
`vessel_positions`, but `anomalies.mmsi` FK-references `ships(mmsi)`. The AIS tables were
reconstructed from the consuming code (`ingest-service/insert.js`, the meta-service
AIS/restricted-area queries) after the original hand-built DB was lost.

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
