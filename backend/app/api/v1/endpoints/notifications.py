import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationResponse,
    PaginatedNotificationsResponse,
    UnreadCountResponse,
)
from app.schemas.post import ActionMessageResponse, serialize_author_public

router = APIRouter()


def _build_notification_response(notification: Notification) -> NotificationResponse:
    """Helper to assemble a NotificationResponse schema from a Notification ORM model."""
    actor_public = serialize_author_public(notification.actor) if notification.actor else None
    return NotificationResponse(
        id=notification.id,
        recipient_id=notification.recipient_id,
        actor_id=notification.actor_id,
        actor=actor_public,
        type=notification.type,
        title=notification.title,
        message=notification.message,
        target_url=notification.target_url,
        is_read=notification.is_read,
        created_at=notification.created_at,
    )


# ---------------------------------------------------------------------------
# NOTIFICATIONS
# ---------------------------------------------------------------------------

@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Get unread notification count",
    description="Returns the number of unread notifications for the authenticated user.",
)
def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> UnreadCountResponse:
    unread_count = (
        db.query(Notification)
        .filter(
            Notification.recipient_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
        .count()
    )
    return UnreadCountResponse(unread_count=unread_count)


@router.patch(
    "/read-all",
    response_model=ActionMessageResponse,
    summary="Mark all notifications as read",
    description="Marks all unread notifications belonging to the authenticated user as read.",
)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ActionMessageResponse:
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.recipient_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
        .update({"is_read": True}, synchronize_session=False)
    )
    db.commit()

    return ActionMessageResponse(
        message=f"Marked {updated_count} notification(s) as read.",
        id=current_user.id,
    )


@router.get(
    "",
    response_model=PaginatedNotificationsResponse,
    summary="Retrieve notifications for authenticated user",
    description="Returns a paginated list of notifications for the authenticated user, sorted newest first.",
)
def get_notifications(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    is_read: Optional[bool] = Query(None, description="Optional read status filter"),
    type: Optional[str] = Query(None, description="Optional notification type filter"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> PaginatedNotificationsResponse:
    query = (
        db.query(Notification)
        .options(joinedload(Notification.actor).joinedload(User.profile))
        .filter(Notification.recipient_id == current_user.id)
    )

    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if type:
        query = query.filter(Notification.type == type)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 0
    offset = (page - 1) * limit

    notifications = (
        query.order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [_build_notification_response(n) for n in notifications]

    return PaginatedNotificationsResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark single notification as read",
    description="Marks a specific notification as read. Enforces that only the recipient can mark it as read.",
)
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> NotificationResponse:
    notification = (
        db.query(Notification)
        .options(joinedload(Notification.actor).joinedload(User.profile))
        .filter(Notification.id == notification_id)
        .first()
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    if notification.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this notification.",
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return _build_notification_response(notification)


@router.delete(
    "/{notification_id}",
    response_model=ActionMessageResponse,
    summary="Delete a notification",
    description="Deletes a notification. Enforces that only the recipient can delete it.",
)
def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ActionMessageResponse:
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    if notification.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this notification.",
        )

    db.delete(notification)
    db.commit()

    return ActionMessageResponse(
        message="Notification deleted successfully.",
        id=notification_id,
    )
