from fastapi import FastAPI

from app.modules.detection.routes import router as detection_router
from app.modules.inspections.routes import router as inspections_router
from app.modules.detection.kafka_consumer import get_speed_anomaly_consumer


app = FastAPI(
    title="Analytic Service",
    version="1.0.0",
    description="Analytics and AI service for maritime surveillance workflows.",
)


@app.on_event("startup")
def start_anomaly_consumer() -> None:
    consumer = get_speed_anomaly_consumer()
    consumer.start()


@app.on_event("shutdown")
def stop_anomaly_consumer() -> None:
    consumer = get_speed_anomaly_consumer()
    consumer.stop()


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "analytic-service"}


app.include_router(inspections_router, prefix="/inspections", tags=["inspections"])
app.include_router(detection_router, prefix="/detection", tags=["detection"])
