from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.post import AuthorPublic


class NotificationResponse(BaseModel):
    """
    Campus activity notification response schema.
    """
    id: str
    recipient_id: str
    actor_id: Optional[str] = None
    actor: Optional[AuthorPublic] = None
    type: str
    title: str
    message: str
    target_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedNotificationsResponse(BaseModel):
    """
    Paginated notification list response wrapper.
    """
    items: List[NotificationResponse]
    total: int
    page: int
    limit: int
    pages: int


class UnreadCountResponse(BaseModel):
    """
    Response schema returning count of unread notifications.
    """
    unread_count: int
