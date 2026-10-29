import math
from typing import Optional, List, Dict, Set
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_active_user, get_current_user_optional
from app.models.user import User
from app.models.notice import Notice, NoticeRead
from app.schemas.notice import (
    NoticeCreateRequest,
    NoticeUpdateRequest,
    NoticeResponse,
    PaginatedNoticesResponse,
    NoticeReadResponse,
)
from app.schemas.post import ActionMessageResponse

router = APIRouter()


def _build_notice_response(
    notice: Notice,
    reads_count: int = 0,
    is_read: bool = False,
) -> NoticeResponse:
    """Helper to assemble a NoticeResponse schema from a Notice ORM model."""
    return NoticeResponse(
        id=notice.id,
        creator_id=notice.creator_id,
        title=notice.title,
        category=notice.category,
        short_description=notice.short_description,
        full_description=notice.full_description,
        department=notice.department,
        reference_number=notice.reference_number,
        is_pinned=notice.is_pinned,
        is_important=notice.is_important,
        published_date=notice.published_date,
        expiry_date=notice.expiry_date,
        attachment_name=notice.attachment_name,
        attachment_size=notice.attachment_size,
        contact_email=notice.contact_email,
        created_at=notice.created_at,
        updated_at=notice.updated_at,
        reads_count=reads_count,
        is_read=is_read,
    )


# ---------------------------------------------------------------------------
# NOTICES CRUD
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=NoticeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new campus notice",
    description="Publishes an official campus announcement or circular. Requires user authentication.",
)
def create_notice(
    notice_in: NoticeCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> NoticeResponse:
    new_notice = Notice(
        creator_id=current_user.id,
        title=notice_in.title,
        category=notice_in.category,
        short_description=notice_in.short_description,
        full_description=notice_in.full_description,
        department=notice_in.department,
        reference_number=notice_in.reference_number,
        is_pinned=notice_in.is_pinned,
        is_important=notice_in.is_important,
        expiry_date=notice_in.expiry_date,
        attachment_name=notice_in.attachment_name,
        attachment_size=notice_in.attachment_size,
        contact_email=notice_in.contact_email,
    )

    db.add(new_notice)
    db.commit()
    db.refresh(new_notice)

    return _build_notice_response(
        notice=new_notice,
        reads_count=0,
        is_read=False,
    )


@router.get(
    "",
    response_model=PaginatedNoticesResponse,
    summary="List campus notices",
    description="Retrieves a paginated list of notices ordered with pinned notices first, followed by newest published dates.",
)
def get_notices(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    department: Optional[str] = Query(None, description="Filter by publishing department"),
    is_pinned: Optional[bool] = Query(None, description="Filter by pinned status"),
    is_important: Optional[bool] = Query(None, description="Filter by important/urgent status"),
    search: Optional[str] = Query(None, description="Search keyword in title, summary, or department"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> PaginatedNoticesResponse:
    query = db.query(Notice)

    if category:
        query = query.filter(Notice.category.ilike(category.strip()))
    if department:
        query = query.filter(Notice.department.ilike(f"%{department.strip()}%"))
    if is_pinned is not None:
        query = query.filter(Notice.is_pinned == is_pinned)
    if is_important is not None:
        query = query.filter(Notice.is_important == is_important)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            Notice.title.ilike(pattern)
            | Notice.short_description.ilike(pattern)
            | Notice.full_description.ilike(pattern)
            | Notice.department.ilike(pattern)
            | Notice.reference_number.ilike(pattern)
        )

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 0
    offset = (page - 1) * limit

    notices = (
        query.order_by(Notice.is_pinned.desc(), Notice.published_date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    if not notices:
        return PaginatedNoticesResponse(
            items=[],
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    notice_ids = [n.id for n in notices]

    # Batch query for read counts
    read_rows = (
        db.query(NoticeRead.notice_id, func.count(NoticeRead.id))
        .filter(NoticeRead.notice_id.in_(notice_ids))
        .group_by(NoticeRead.notice_id)
        .all()
    )
    read_counts: Dict[str, int] = {row[0]: row[1] for row in read_rows}

    user_read_set: Set[str] = set()
    if current_user:
        user_read_rows = (
            db.query(NoticeRead.notice_id)
            .filter(
                NoticeRead.notice_id.in_(notice_ids),
                NoticeRead.user_id == current_user.id,
            )
            .all()
        )
        user_read_set = {row[0] for row in user_read_rows}

    items = [
        _build_notice_response(
            notice=n,
            reads_count=read_counts.get(n.id, 0),
            is_read=(n.id in user_read_set),
        )
        for n in notices
    ]

    return PaginatedNoticesResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get(
    "/{notice_id}",
    response_model=NoticeResponse,
    summary="Retrieve single notice details",
    description="Fetches full details of a campus notice including read count and whether the requesting user has read it.",
)
def get_notice(
    notice_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> NoticeResponse:
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found.",
        )

    reads_count = (
        db.query(func.count(NoticeRead.id))
        .filter(NoticeRead.notice_id == notice_id)
        .scalar()
        or 0
    )

    is_read = False
    if current_user:
        is_read = (
            db.query(NoticeRead.id)
            .filter(NoticeRead.notice_id == notice_id, NoticeRead.user_id == current_user.id)
            .first()
            is not None
        )

    return _build_notice_response(
        notice=notice,
        reads_count=reads_count,
        is_read=is_read,
    )


@router.patch(
    "/{notice_id}",
    response_model=NoticeResponse,
    summary="Edit a notice",
    description="Updates notice contents. Enforces that only the creator of the notice can edit it.",
)
def update_notice(
    notice_id: str,
    notice_in: NoticeUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> NoticeResponse:
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found.",
        )

    if notice.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this notice.",
        )

    update_data = notice_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(notice, field, value)

    db.commit()
    db.refresh(notice)

    reads_count = (
        db.query(func.count(NoticeRead.id))
        .filter(NoticeRead.notice_id == notice_id)
        .scalar()
        or 0
    )

    is_read = (
        db.query(NoticeRead.id)
        .filter(NoticeRead.notice_id == notice_id, NoticeRead.user_id == current_user.id)
        .first()
        is not None
    )

    return _build_notice_response(
        notice=notice,
        reads_count=reads_count,
        is_read=is_read,
    )


@router.delete(
    "/{notice_id}",
    response_model=ActionMessageResponse,
    summary="Delete a notice",
    description="Deletes a notice. Enforces that only the creator of the notice can delete it.",
)
def delete_notice(
    notice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ActionMessageResponse:
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found.",
        )

    if notice.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this notice.",
        )

    db.delete(notice)
    db.commit()

    return ActionMessageResponse(
        message="Notice deleted successfully.",
        id=notice_id,
    )


# ---------------------------------------------------------------------------
# NOTICE READ TRACKING
# ---------------------------------------------------------------------------

@router.post(
    "/{notice_id}/read",
    response_model=NoticeReadResponse,
    summary="Mark a notice as read",
    description="Records that the authenticated user has viewed/read this notice.",
)
def mark_notice_as_read(
    notice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> NoticeReadResponse:
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found.",
        )

    existing_read = (
        db.query(NoticeRead)
        .filter(NoticeRead.notice_id == notice_id, NoticeRead.user_id == current_user.id)
        .first()
    )

    if not existing_read:
        new_read = NoticeRead(
            notice_id=notice_id,
            user_id=current_user.id,
        )
        db.add(new_read)
        db.commit()

    reads_count = (
        db.query(func.count(NoticeRead.id))
        .filter(NoticeRead.notice_id == notice_id)
        .scalar()
        or 0
    )

    return NoticeReadResponse(
        notice_id=notice_id,
        reads_count=reads_count,
        is_read=True,
        message="Notice marked as read.",
    )
