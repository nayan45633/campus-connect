from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class StudentProfilePublic(BaseModel):
    """
    Public student profile response schema.
    """
    id: str
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

    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """
    Public user model returning safe account information (never passwords).
    """
    id: str
    email: EmailStr
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    profile: Optional[StudentProfilePublic] = None

    class Config:
        from_attributes = True


class UserRegisterRequest(BaseModel):
    """
    Registration request payload for creating a new student account.
    """
    email: EmailStr = Field(..., description="Student university or personal email address")
    password: str = Field(..., min_length=8, max_length=128, description="Secure account password (min 8 characters)")
    full_name: str = Field(..., min_length=2, max_length=150, description="Full name of student")
    department_major: str = Field(..., min_length=2, max_length=255, description="Academic department or major")
    graduation_year: int = Field(..., ge=2020, le=2040, description="Expected graduation year (e.g., 2027)")
    handle: Optional[str] = Field(None, max_length=60, description="Student username/handle (e.g., @nayankalita)")
    university: Optional[str] = Field("National Institute of Technology", max_length=255, description="University name")
    academic_year_title: Optional[str] = Field(None, max_length=100, description="e.g. '3rd Year B.Tech (Class of 2027)'")
    bio: Optional[str] = Field(None, max_length=1000, description="Short student bio")
    skills: Optional[List[str]] = Field(default_factory=list, description="List of technical or design skills")
    interests: Optional[List[str]] = Field(default_factory=list, description="List of campus or academic interests")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("handle", mode="before")
    @classmethod
    def normalize_handle(cls, v: Optional[str]) -> Optional[str]:
        if v and isinstance(v, str):
            clean = v.strip()
            if not clean.startswith("@"):
                clean = f"@{clean}"
            return clean
        return v


class LoginRequest(BaseModel):
    """
    Standard JSON login request payload.
    """
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class TokenResponse(BaseModel):
    """
    Authentication token response containing JWT access token and user metadata.
    """
    access_token: str = Field(..., description="Signed Bearer JWT access token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Access token lifetime in seconds")
    user: UserPublic = Field(..., description="Authenticated user account details")
