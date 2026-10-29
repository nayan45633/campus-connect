from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.schemas.post import AuthorPublic


def compute_initials(name: str) -> str:
    """Computes a 2-letter uppercase initials abbreviation from a name."""
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "CC"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


class CommunityCreateRequest(BaseModel):
    """
    Payload for creating a new student community or club.
    """
    name: str = Field(..., min_length=2, max_length=150, description="Community or club name")
    category: str = Field(..., min_length=2, max_length=50, description="Category (Technology, Academics, Gaming, Arts, Entrepreneurship)")
    description: Optional[str] = Field(None, max_length=2000, description="General description")
    short_description: Optional[str] = Field(None, max_length=500, description="Brief summary for directory listings")
    full_description: Optional[str] = Field(None, max_length=10000, description="Comprehensive details about the club")

    avatar_initials: Optional[str] = Field(None, max_length=10, description="Avatar abbreviation, e.g. 'GD'")
    cover_gradient: Optional[str] = Field(None, max_length=255, description="CSS gradient preset for card banner")
    meeting_schedule: Optional[str] = Field(None, max_length=255, description="Meeting time/day, e.g. 'Wednesdays 5:00 PM'")
    location: Optional[str] = Field(None, max_length=255, description="Primary meeting place or Discord link")

    lead_name: Optional[str] = Field(None, max_length=150, description="Organizer or lead student name")
    lead_role: Optional[str] = Field(None, max_length=100, description="Leadership title, e.g. 'President', 'Club Lead'")
    tags: Optional[List[str]] = Field(default_factory=list, description="Keywords or topic tags")

    @field_validator("name", "category")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Field cannot be empty or purely whitespace.")
        return trimmed

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, v: Optional[List[str]]) -> List[str]:
        if not v:
            return []
        cleaned: List[str] = []
        for tag in v:
            if isinstance(tag, str):
                t = tag.strip().lstrip("#")
                if t and t not in cleaned:
                    cleaned.append(t)
        return cleaned[:20]


class CommunityUpdateRequest(BaseModel):
    """
    Payload for modifying an existing community (all fields optional).
    """
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=2000)
    short_description: Optional[str] = Field(None, max_length=500)
    full_description: Optional[str] = Field(None, max_length=10000)

    avatar_initials: Optional[str] = Field(None, max_length=10)
    cover_gradient: Optional[str] = Field(None, max_length=255)
    meeting_schedule: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)

    lead_name: Optional[str] = Field(None, max_length=150)
    lead_role: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None

    @field_validator("name", "category")
    @classmethod
    def validate_optional_non_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Field cannot be empty or purely whitespace.")
            return trimmed
        return v


class CommunityResponse(BaseModel):
    """
    Full student community model including member count and membership status.
    """
    id: str
    name: str
    category: str
    description: str
    short_description: str
    full_description: str
    avatar_initials: str
    cover_gradient: Optional[str] = None
    meeting_schedule: Optional[str] = None
    location: Optional[str] = None
    lead_user_id: Optional[str] = None
    lead_name: Optional[str] = None
    lead_role: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    members_count: int = 0
    is_joined: bool = False

    class Config:
        from_attributes = True


class PaginatedCommunitiesResponse(BaseModel):
    """
    Paginated community list response wrapper.
    """
    items: List[CommunityResponse]
    total: int
    page: int
    limit: int
    pages: int


class CommunityMembershipResponse(BaseModel):
    """
    Response schema when joining or leaving a community.
    """
    community_id: str
    members_count: int
    is_joined: bool
    role: Optional[str] = None
    message: str


class CommunityMemberPublic(BaseModel):
    """
    Public representation of a community member.
    """
    user_id: str
    role: str
    joined_at: datetime
    user: AuthorPublic

    class Config:
        from_attributes = True


class PaginatedCommunityMembersResponse(BaseModel):
    """
    Paginated members list response.
    """
    items: List[CommunityMemberPublic]
    total: int
    page: int
    limit: int
    pages: int
