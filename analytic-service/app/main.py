from fastapi import FastAPI

from app.modules.detection.routes import router as detection_router
from app.modules.inspections.routes import router as inspections_router


app = FastAPI(
    title="Analytic Service",
    version="1.0.0",
    description="Analytics and AI service for maritime surveillance workflows.",
)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "analytic-service"}


app.include_router(inspections_router, prefix="/inspections", tags=["inspections"])
app.include_router(detection_router, prefix="/detection", tags=["detection"])
