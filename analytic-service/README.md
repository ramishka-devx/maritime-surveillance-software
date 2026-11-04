# Analytic Service

FastAPI service for the analytics and AI part of the maritime surveillance system.

## Endpoints

- `GET /health`
- `GET /inspections/health`
- `GET /detection/health`

- `GET /detection/speed-anomalies/status` (consumer and model counters)
- `POST /detection/speed-anomalies` (batch run over a CSV; `dry_run: true` only scores)

## Run locally

```bash
cd analytic-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # set META_SERVICE_EMAIL / META_SERVICE_PASSWORD (see below)
uvicorn app.main:app --reload
```

Tests: `pip install -r requirements-dev.txt && pytest`

## Service account

analytic-service talks to meta-service as a machine account with the `service` role (post
anomalies, read detector settings, report computed thresholds). Create it, or reset its
password, with:

```bash
cd meta-service
npm run db:seed-permissions
npm run service-account      # prints META_SERVICE_EMAIL / META_SERVICE_PASSWORD once
```

## Detection consumer

The Kafka consumer starts with the FastAPI app and runs two detectors (SRS §3.4):

- **Speed:** a position is a candidate when its SOG is above the p99 SOG of its vessel-type
  group (an admin override, the group's own p99, or a fallback for sparse groups). Candidates
  are scored by an IsolationForest on speed relative to that p99; the score (0-1, about 0.45
  for ordinary speeds) must reach the alert threshold, and scores in the warning band are
  only logged. The model is refitted every `speed.refit_minutes` from recent positions in a
  background thread, saved to `models/speed_model.joblib`, and bootstrapped from
  `AI/ais_dataset.csv` when there is no saved model. After each fit the computed p99 per
  vessel type is reported to meta-service.
- **Loitering:** rule-based; a vessel staying within `loitering.radius_m` for
  `loitering.min_minutes` at an average below `loitering.max_sog_kn`. Vessels reporting at
  anchor or moored are exempt.

Thresholds and rules are admin settings in meta-service (web: Detection settings), polled
every `SETTINGS_POLL_S` seconds, so changes apply without a restart.

For replay/testing, use a fresh `KAFKA_GROUP_ID` if the current consumer group has already committed offsets.
