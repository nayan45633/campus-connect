from datetime import datetime, timezone
from fastapi import APIRouter, status
from app.core.config import settings
from app.core.database import check_database_connection
from app.schemas.health import HealthCheckResponse, DatabaseHealth

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="API & Database Health Probe",
    description="Returns the operating status of the FastAPI backend and probes PostgreSQL connectivity.",
)
def get_health() -> HealthCheckResponse:
    db_result = check_database_connection()

    db_health = DatabaseHealth(
        status=db_result["status"],
        reachable=db_result["reachable"],
        message=db_result["message"],
    )

    overall_status = "ok" if db_health.reachable else "degraded"

    return HealthCheckResponse(
        status=overall_status,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        database=db_health,
    )
