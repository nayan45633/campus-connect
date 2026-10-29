from typing import Optional, Generic, TypeVar, Any
from pydantic import BaseModel

T = TypeVar("T")


class RootInfoResponse(BaseModel):
    """
    Response schema for the root '/' endpoint.
    """
    project: str
    description: str
    version: str
    environment: str
    docs_url: str
    redoc_url: str
    api_v1_prefix: str


class ErrorDetail(BaseModel):
    """
    Standard error response detail.
    """
    code: str
    message: str
    details: Optional[Any] = None
