from fastapi import APIRouter


router = APIRouter()


@router.get("/health")
def inspections_health() -> dict[str, str]:
    return {"status": "ok", "module": "inspections"}


