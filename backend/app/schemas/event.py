from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class EventOrganizerPublic(BaseModel):
    """
    Public organizer details for an event.
    """
    name: str
    role: Optional[str] = None
    avatar_initials: str

    class Config:
        from_attributes = True


class EventCreateRequest(BaseModel):
    """
    Payload for creating a new campus event.
    """
    title: str = Field(..., min_length=2, max_length=255, description="Event title")
    category: str = Field(..., min_length=2, max_length=50, description="Category (e.g. Technical, Cultural, Workshop, Sports, General)")
    short_description: str = Field(..., min_length=5, max_length=1000, description="Brief summary")
    full_description: str = Field(..., min_length=10, max_length=10000, description="Detailed event information")
    event_date: datetime = Field(..., description="Date and time of the event (ISO 8601)")
    location: str = Field(..., min_length=2, max_length=255, description="Campus venue or virtual link")

    time_str: Optional[str] = Field(None, max_length=100, description="Formatted time string, e.g. '10:00 AM – 4:00 PM'")
    month: Optional[str] = Field(None, max_length=10, description="3-letter month abbreviation, e.g. 'NOV'")
    day: Optional[str] = Field(None, max_length=10, description="Day of month, e.g. '15'")

    organizer_name: Optional[str] = Field(None, max_length=150, description="Organizer name (defaults to student's name)")
    organizer_role: Optional[str] = Field(None, max_length=100, description="Organizer role, e.g. 'Club Lead'")
    organizer_initials: Optional[str] = Field(None, max_length=10, description="Organizer initials, e.g. 'CS'")

    is_featured: bool = Field(False, description="Whether to feature this event")
    capacity: Optional[int] = Field(None, ge=1, le=10000, description="Maximum RSVP capacity")
    tags: Optional[List[str]] = Field(default_factory=list, description="Categorization tags")
    highlights: Optional[List[str]] = Field(default_factory=list, description="Key agenda highlights or perks")

    @field_validator("title", "short_description", "full_description", "location")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Field cannot be empty or purely whitespace.")
        return trimmed

    @field_validator("tags", "highlights")
    @classmethod
    def clean_str_list(cls, v: Optional[List[str]]) -> List[str]:
        if not v:
            return []
        cleaned: List[str] = []
        for item in v:
            if isinstance(item, str):
                t = item.strip()
                if t and t not in cleaned:
                    cleaned.append(t)
        return cleaned[:20]


class EventUpdateRequest(BaseModel):
    """
    Payload for modifying an existing campus event (all fields optional).
    """
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    short_description: Optional[str] = Field(None, min_length=5, max_length=1000)
    full_description: Optional[str] = Field(None, min_length=10, max_length=10000)
    event_date: Optional[datetime] = None
    location: Optional[str] = Field(None, min_length=2, max_length=255)

    time_str: Optional[str] = Field(None, max_length=100)
    month: Optional[str] = Field(None, max_length=10)
    day: Optional[str] = Field(None, max_length=10)

    organizer_name: Optional[str] = Field(None, max_length=150)
    organizer_role: Optional[str] = Field(None, max_length=100)
    organizer_initials: Optional[str] = Field(None, max_length=10)

    is_featured: Optional[bool] = None
    capacity: Optional[int] = Field(None, ge=1, le=10000)
    tags: Optional[List[str]] = None
    highlights: Optional[List[str]] = None

    @field_validator("title", "short_description", "full_description", "location")
    @classmethod
    def validate_optional_non_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Field cannot be empty or purely whitespace.")
            return trimmed
        return v


class EventResponse(BaseModel):
    """
    Full campus event response model including attendee RSVP count and user RSVP status.
    """
    id: str
    creator_id: Optional[str] = None
    title: str
    category: str
    short_description: str
    full_description: str
    event_date: datetime
    month: str
    day: str
    time_str: str
    location: str
    organizer: EventOrganizerPublic
    is_featured: bool = False
    capacity: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    rsvps_count: int = 0
    is_rsvpd: bool = False

    class Config:
        from_attributes = True


class PaginatedEventsResponse(BaseModel):
    """
    Paginated event list response.
    """
    items: List[EventResponse]
    total: int
    page: int
    limit: int
    pages: int


class RSVPResponse(BaseModel):
    """
    Response schema when creating or canceling an event RSVP.
    """
    event_id: str
    rsvps_count: int
    is_rsvpd: bool
    message: str
