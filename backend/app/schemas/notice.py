from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class NoticeCreateRequest(BaseModel):
    """
    Payload for creating an official campus notice.
    """
    title: str = Field(..., min_length=3, max_length=255, description="Notice headline")
    category: str = Field(..., min_length=2, max_length=50, description="Notice category (e.g. Academics, Examinations, Placements, Scholarships, Events)")
    short_description: str = Field(..., min_length=5, max_length=1000, description="Brief summary")
    full_description: str = Field(..., min_length=10, max_length=10000, description="Full notice text")
    department: str = Field(..., min_length=2, max_length=150, description="Publishing department, e.g. 'Dean of Academic Affairs'")

    reference_number: Optional[str] = Field(None, max_length=100, description="Official dispatch/circular reference number")
    is_pinned: bool = Field(False, description="Pin to top of notice board")
    is_important: bool = Field(False, description="Flag as high priority/urgent")
    expiry_date: Optional[datetime] = Field(None, description="Expiration date (ISO 8601)")

    attachment_name: Optional[str] = Field(None, max_length=255, description="Document attachment filename")
    attachment_size: Optional[str] = Field(None, max_length=50, description="Formatted size, e.g. '1.4 MB'")
    contact_email: Optional[str] = Field(None, max_length=255, description="Inquiry contact email")

    @field_validator("title", "short_description", "full_description", "department")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Field cannot be empty or purely whitespace.")
        return trimmed


class NoticeUpdateRequest(BaseModel):
    """
    Payload for updating an existing notice (all fields optional).
    """
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    short_description: Optional[str] = Field(None, min_length=5, max_length=1000)
    full_description: Optional[str] = Field(None, min_length=10, max_length=10000)
    department: Optional[str] = Field(None, min_length=2, max_length=150)

    reference_number: Optional[str] = Field(None, max_length=100)
    is_pinned: Optional[bool] = None
    is_important: Optional[bool] = None
    expiry_date: Optional[datetime] = None

    attachment_name: Optional[str] = Field(None, max_length=255)
    attachment_size: Optional[str] = Field(None, max_length=50)
    contact_email: Optional[str] = Field(None, max_length=255)

    @field_validator("title", "short_description", "full_description", "department")
    @classmethod
    def validate_optional_non_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Field cannot be empty or purely whitespace.")
            return trimmed
        return v


class NoticeResponse(BaseModel):
    """
    Full campus notice response model including read counts and read status.
    """
    id: str
    creator_id: Optional[str] = None
    title: str
    category: str
    short_description: str
    full_description: str
    department: str
    reference_number: Optional[str] = None
    is_pinned: bool = False
    is_important: bool = False
    published_date: datetime
    expiry_date: Optional[datetime] = None
    attachment_name: Optional[str] = None
    attachment_size: Optional[str] = None
    contact_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    reads_count: int = 0
    is_read: bool = False

    class Config:
        from_attributes = True


class PaginatedNoticesResponse(BaseModel):
    """
    Paginated notices response wrapper.
    """
    items: List[NoticeResponse]
    total: int
    page: int
    limit: int
    pages: int


class NoticeReadResponse(BaseModel):
    """
    Response returned when marking a notice as read.
    """
    notice_id: str
    reads_count: int
    is_read: bool
    message: str
