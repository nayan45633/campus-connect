from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator


class AuthorPublic(BaseModel):
    """
    Safe public representation of a post or comment author.
    Excludes sensitive fields like emails, passwords, and private tokens.
    """
    id: str
    name: str
    handle: str
    avatar_url: Optional[str] = None
    initials: str
    university: str
    major: str
    graduation_year: Optional[int] = None
    role: str

    class Config:
        from_attributes = True


def serialize_author_public(user: Any) -> AuthorPublic:
    """
    Converts a SQLAlchemy User (and its attached StudentProfile) into a safe AuthorPublic schema.
    """
    if not user:
        return AuthorPublic(
            id="unknown",
            name="Campus User",
            handle="@user",
            avatar_url=None,
            initials="CU",
            university="National Institute of Technology",
            major="General Studies",
            graduation_year=None,
            role="student",
        )
    profile = getattr(user, "profile", None)
    email = getattr(user, "email", "user@campus.edu")
    name = profile.full_name if profile and profile.full_name else email.split("@")[0]
    handle = profile.handle if profile and profile.handle else f"@{email.split('@')[0]}"
    initials = profile.initials if profile and profile.initials else name[:2].upper()
    university = profile.university if profile and profile.university else "National Institute of Technology"
    major = profile.department_major if profile and profile.department_major else "Computer Science"
    graduation_year = profile.graduation_year if profile else None
    avatar_url = profile.avatar_url if profile else None
    role = getattr(user, "role", "student")

    return AuthorPublic(
        id=str(user.id),
        name=name,
        handle=handle,
        avatar_url=avatar_url,
        initials=initials,
        university=university,
        major=major,
        graduation_year=graduation_year,
        role=role,
    )


class PostCreateRequest(BaseModel):
    """
    Payload for creating a new campus post.
    """
    content: str = Field(..., min_length=1, max_length=5000, description="Post text content (max 5000 characters)")
    category: str = Field(..., min_length=1, max_length=50, description="Post category (e.g., Academics, Campus Life, Technology, Opportunities)")
    tags: Optional[List[str]] = Field(default_factory=list, description="Optional hashtags or keywords")

    @field_validator("content")
    @classmethod
    def validate_content_not_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Post content cannot be empty or purely whitespace.")
        return trimmed

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Category cannot be empty.")
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
                if t and len(t) <= 30 and t not in cleaned:
                    cleaned.append(t)
        return cleaned[:10]


class PostResponse(BaseModel):
    """
    Full campus post response including author profile, like/comment counts, and like status.
    """
    id: str
    author_id: str
    author: AuthorPublic
    category: str
    content: str
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    is_liked_by_me: bool = False

    class Config:
        from_attributes = True


class PaginatedPostsResponse(BaseModel):
    """
    Paginated feed response wrapper.
    """
    items: List[PostResponse]
    total: int
    page: int
    limit: int
    pages: int


class CommentCreateRequest(BaseModel):
    """
    Payload for creating a new comment on a post.
    """
    content: str = Field(..., min_length=1, max_length=2000, description="Comment text content (max 2000 characters)")

    @field_validator("content")
    @classmethod
    def validate_content_not_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Comment content cannot be empty or purely whitespace.")
        return trimmed


class CommentResponse(BaseModel):
    """
    Comment response schema with safe author profile.
    """
    id: str
    post_id: str
    author_id: str
    author: AuthorPublic
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedCommentsResponse(BaseModel):
    """
    Paginated comments response wrapper.
    """
    items: List[CommentResponse]
    total: int
    page: int
    limit: int
    pages: int


class LikeResponse(BaseModel):
    """
    Response returned when liking or unliking a post.
    """
    post_id: str
    likes_count: int
    is_liked_by_me: bool
    message: str


class ActionMessageResponse(BaseModel):
    """
    Generic operation confirmation response (e.g. deletion).
    """
    message: str
    id: str
