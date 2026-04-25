from fastapi import APIRouter


router = APIRouter()


@router.get("/health")
def detection_health() -> dict[str, str]:
    return {"status": "ok", "module": "detection"}
