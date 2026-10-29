import math
from typing import Optional, List, Dict, Set
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_active_user, get_current_user_optional
from app.models.user import User, StudentProfile
from app.models.post import Post, PostLike, Comment
from app.schemas.profile import (
    StudentProfileUpdateRequest,
    StudentProfileResponse,
    StudentProfilePublicResponse,
)
from app.schemas.post import (
    PaginatedPostsResponse,
    PostResponse,
    serialize_author_public,
)
from app.schemas.community import compute_initials

router = APIRouter()


def _ensure_profile_exists(user: User, db: Session) -> StudentProfile:
    """Ensures a user has a corresponding StudentProfile record."""
    if user.profile:
        return user.profile

    email_prefix = user.email.split("@")[0]
    initials = email_prefix[:2].upper()
    profile = StudentProfile(
        user_id=user.id,
        full_name=email_prefix.replace(".", " ").title(),
        handle=f"@{email_prefix}",
        initials=initials,
        university="National Institute of Technology",
        department_major="General Studies",
        graduation_year=2027,
        academic_year_title="Class of 2027",
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def _build_profile_response(user: User, profile: StudentProfile) -> StudentProfileResponse:
    """Builds the comprehensive StudentProfileResponse model."""
    return StudentProfileResponse(
        id=profile.id,
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=profile.full_name,
        handle=profile.handle,
        initials=profile.initials,
        university=profile.university,
        department_major=profile.department_major,
        graduation_year=profile.graduation_year,
        academic_year_title=profile.academic_year_title,
        bio=profile.bio,
        skills=profile.skills or [],
        interests=profile.interests or [],
        location=profile.location,
        avatar_url=profile.avatar_url,
        banner_url=profile.banner_url,
        banner_gradient=profile.banner_gradient,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


# ---------------------------------------------------------------------------
# AUTHENTICATED USER PROFILE
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=StudentProfileResponse,
    summary="Retrieve current student's profile",
    description="Returns the full profile and user account details for the authenticated student.",
)
def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> StudentProfileResponse:
    profile = _ensure_profile_exists(current_user, db)
    return _build_profile_response(current_user, profile)


@router.patch(
    "/me",
    response_model=StudentProfileResponse,
    summary="Update current student's profile",
    description="Updates editable profile attributes. Strictly prevents modifications to account credentials, email, or roles.",
)
def update_my_profile(
    profile_in: StudentProfileUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> StudentProfileResponse:
    profile = _ensure_profile_exists(current_user, db)
    update_data = profile_in.model_dump(exclude_unset=True)

    # 1. Check unique handle if handle was updated
    if "handle" in update_data and update_data["handle"] is not None:
        new_handle = update_data["handle"]
        existing = (
            db.query(StudentProfile)
            .filter(
                StudentProfile.handle == new_handle,
                StudentProfile.user_id != current_user.id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username handle '{new_handle}' is already taken.",
            )
        profile.handle = new_handle

    # 2. Recompute initials if full_name was updated
    if "full_name" in update_data and update_data["full_name"] is not None:
        profile.full_name = update_data["full_name"]
        profile.initials = compute_initials(update_data["full_name"])

    # 3. Apply other profile fields
    for field in [
        "department_major",
        "university",
        "graduation_year",
        "academic_year_title",
        "bio",
        "skills",
        "interests",
        "location",
        "avatar_url",
        "banner_url",
        "banner_gradient",
    ]:
        if field in update_data:
            setattr(profile, field, update_data[field])

    db.commit()
    db.refresh(profile)

    return _build_profile_response(current_user, profile)


# ---------------------------------------------------------------------------
# PUBLIC PROFILES & USER POSTS
# ---------------------------------------------------------------------------

@router.get(
    "/{user_id}",
    response_model=StudentProfilePublicResponse,
    summary="Retrieve a student's public profile",
    description="Fetches another student's safe public profile information, omitting private email addresses or security credentials.",
)
def get_public_profile(
    user_id: str,
    db: Session = Depends(get_db),
) -> StudentProfilePublicResponse:
    user = (
        db.query(User)
        .options(joinedload(User.profile))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found.",
        )

    profile = _ensure_profile_exists(user, db)

    return StudentProfilePublicResponse(
        user_id=user.id,
        full_name=profile.full_name,
        handle=profile.handle,
        initials=profile.initials,
        university=profile.university,
        department_major=profile.department_major,
        graduation_year=profile.graduation_year,
        academic_year_title=profile.academic_year_title,
        bio=profile.bio,
        skills=profile.skills or [],
        interests=profile.interests or [],
        location=profile.location,
        avatar_url=profile.avatar_url,
        banner_url=profile.banner_url,
        banner_gradient=profile.banner_gradient,
        role=user.role,
        created_at=profile.created_at,
    )


@router.get(
    "/{user_id}/posts",
    response_model=PaginatedPostsResponse,
    summary="Retrieve a student's published posts",
    description="Returns a paginated list of campus posts published by the specified student, sorted newest first.",
)
def get_user_posts(
    user_id: str,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> PaginatedPostsResponse:
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    query = (
        db.query(Post)
        .options(joinedload(Post.author).joinedload(User.profile))
        .filter(Post.author_id == user_id)
    )

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 0
    offset = (page - 1) * limit

    posts = (
        query.order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    if not posts:
        return PaginatedPostsResponse(
            items=[],
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    post_ids = [p.id for p in posts]

    # Batch queries for likes and comments
    likes_rows = (
        db.query(PostLike.post_id, func.count(PostLike.id))
        .filter(PostLike.post_id.in_(post_ids))
        .group_by(PostLike.post_id)
        .all()
    )
    like_counts: Dict[str, int] = {row[0]: row[1] for row in likes_rows}

    comments_rows = (
        db.query(Comment.post_id, func.count(Comment.id))
        .filter(Comment.post_id.in_(post_ids))
        .group_by(Comment.post_id)
        .all()
    )
    comment_counts: Dict[str, int] = {row[0]: row[1] for row in comments_rows}

    user_liked_set: Set[str] = set()
    if current_user:
        user_likes_rows = (
            db.query(PostLike.post_id)
            .filter(PostLike.post_id.in_(post_ids), PostLike.user_id == current_user.id)
            .all()
        )
        user_liked_set = {row[0] for row in user_likes_rows}

    items = [
        PostResponse(
            id=p.id,
            author_id=p.author_id,
            author=serialize_author_public(p.author),
            category=p.category,
            content=p.content,
            tags=p.tags or [],
            created_at=p.created_at,
            updated_at=p.updated_at,
            likes_count=like_counts.get(p.id, 0),
            comments_count=comment_counts.get(p.id, 0),
            is_liked_by_me=(p.id in user_liked_set),
        )
        for p in posts
    ]

    return PaginatedPostsResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )
