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
