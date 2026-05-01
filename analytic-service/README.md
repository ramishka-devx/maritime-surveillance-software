# Analytic Service

FastAPI service for the analytics and AI part of the maritime surveillance system.

## Endpoints

- `GET /health`
- `GET /inspections/health`
- `GET /detection/health`

## Run locally

```bash
cd analytic-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Speed anomaly consumer

The streaming speed anomaly consumer starts with the FastAPI app.

Useful environment variables:

- `KAFKA_TOPIC` defaults to `ais.raw.messages`
- `KAFKA_GROUP_ID` defaults to `analytic-speed-anomalies`
- `KAFKA_AUTO_OFFSET_RESET` defaults to `earliest`
- `ANOMALY_WINDOW_SIZE` defaults to `100000`
- `ANOMALY_MIN_SAMPLES` defaults to `8000`

For replay/testing, use a fresh `KAFKA_GROUP_ID` if the current consumer group has already committed offsets.
