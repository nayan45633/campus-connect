from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class StudentProfileUpdateRequest(BaseModel):
    """
    Payload for modifying authenticated student profile information.
    Protected user account properties (password, email, role) cannot be altered here.
    """
    full_name: Optional[str] = Field(None, min_length=2, max_length=150, description="Full student name")
    handle: Optional[str] = Field(None, min_length=2, max_length=60, description="Unique username handle, e.g. @nayankalita")
    department_major: Optional[str] = Field(None, min_length=2, max_length=255, description="Academic department or major")
    university: Optional[str] = Field(None, min_length=2, max_length=255, description="University name")
    graduation_year: Optional[int] = Field(None, ge=2020, le=2040, description="Graduation year (e.g. 2027)")
    academic_year_title: Optional[str] = Field(None, max_length=100, description="Year of study title, e.g. '3rd Year B.Tech'")
    bio: Optional[str] = Field(None, max_length=1000, description="Student bio / about me")
    skills: Optional[List[str]] = Field(None, description="Technical or design skills")
    interests: Optional[List[str]] = Field(None, description="Campus activities or academic interests")
    location: Optional[str] = Field(None, max_length=255, description="City, state, or campus hostel block")
    avatar_url: Optional[str] = Field(None, max_length=1000, description="Avatar image URL")
    banner_url: Optional[str] = Field(None, max_length=1000, description="Banner image URL")
    banner_gradient: Optional[str] = Field(None, max_length=255, description="CSS gradient preset")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Full name cannot be empty or purely whitespace.")
            return trimmed
        return v

    @field_validator("handle")
    @classmethod
    def normalize_handle(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if not clean.startswith("@"):
                clean = f"@{clean}"
            if len(clean) < 2:
                raise ValueError("Handle cannot be empty.")
            return clean
        return v

    @field_validator("skills", "interests")
    @classmethod
    def clean_str_list(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return None
        cleaned: List[str] = []
        for item in v:
            if isinstance(item, str):
                t = item.strip()
                if t and t not in cleaned:
                    cleaned.append(t)
        return cleaned[:30]


class StudentProfileResponse(BaseModel):
    """
    Authenticated student profile response returning full profile and user identity.
    """
    id: str
    user_id: str
    email: str
    role: str
    full_name: str
    handle: str
    initials: str
    university: str
    department_major: str
    graduation_year: int
    academic_year_title: str
    bio: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    banner_gradient: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudentProfilePublicResponse(BaseModel):
    """
    Safe public student profile schema excluding private account fields.
    """
    user_id: str
    full_name: str
    handle: str
    initials: str
    university: str
    department_major: str
    graduation_year: int
    academic_year_title: str
    bio: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    banner_gradient: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class MediaUploadResponse(BaseModel):
    """
    Response schema returned after uploading an avatar or banner media asset.
    """
    url: str
    filename: str
    media_type: str
    size_bytes: int
    content_type: str
