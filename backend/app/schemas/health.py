from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    """
    Sub-schema describing the database connectivity state.
    """
    status: str = Field(..., description="Connection status: 'connected' or 'unavailable'")
    reachable: bool = Field(..., description="Whether the database responded to a ping query")
    message: str = Field(..., description="Diagnostic detail or failure message")


class HealthCheckResponse(BaseModel):
    """
    Overall health check status response for monitoring and load balancers.
    """
    status: str = Field(
        ...,
        description="Overall API health status: 'ok' if all systems operational, 'degraded' if DB unavailable",
    )
    version: str = Field(..., description="API semantic version")
    environment: str = Field(..., description="Current running environment")
    timestamp: datetime = Field(..., description="UTC timestamp of the health probe")
    database: DatabaseHealth = Field(..., description="Database connectivity status")
