import math
from datetime import datetime, timezone
from typing import Optional, List, Dict, Set
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_active_user, get_current_user_optional
from app.models.user import User
from app.models.event import Event, EventRSVP
from app.schemas.event import (
    EventCreateRequest,
    EventUpdateRequest,
    EventResponse,
    PaginatedEventsResponse,
    RSVPResponse,
    EventOrganizerPublic,
)
from app.schemas.post import ActionMessageResponse

router = APIRouter()


def _build_event_response(
    event: Event,
    rsvps_count: int = 0,
    is_rsvpd: bool = False,
) -> EventResponse:
    """Helper to assemble an EventResponse schema from an Event ORM model."""
    organizer = EventOrganizerPublic(
        name=event.organizer_name,
        role=event.organizer_role,
        avatar_initials=event.organizer_initials,
    )
    return EventResponse(
        id=event.id,
        creator_id=event.creator_id,
        title=event.title,
        category=event.category,
        short_description=event.short_description,
        full_description=event.full_description,
        event_date=event.event_date,
        month=event.month,
        day=event.day,
        time_str=event.time_str,
        location=event.location,
        organizer=organizer,
        is_featured=event.is_featured,
        capacity=event.capacity,
        tags=event.tags or [],
        highlights=event.highlights or [],
        created_at=event.created_at,
        updated_at=event.updated_at,
        rsvps_count=rsvps_count,
        is_rsvpd=is_rsvpd,
    )


# ---------------------------------------------------------------------------
# EVENTS CRUD
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new campus event",
    description="Registers a new event authored by the authenticated user with automated scheduling and organizer fallbacks.",
)
def create_event(
    event_in: EventCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> EventResponse:
    profile = current_user.profile
    default_name = profile.full_name if profile and profile.full_name else current_user.email.split("@")[0]
    default_role = profile.academic_year_title if profile and profile.academic_year_title else "Student Organizer"
    default_initials = profile.initials if profile and profile.initials else default_name[:2].upper()

    month = event_in.month or event_in.event_date.strftime("%b").upper()
    day = event_in.day or str(event_in.event_date.day)
    time_str = event_in.time_str or event_in.event_date.strftime("%I:%M %p")

    new_event = Event(
        creator_id=current_user.id,
        title=event_in.title,
        category=event_in.category,
        short_description=event_in.short_description,
        full_description=event_in.full_description,
        event_date=event_in.event_date,
        month=month,
        day=day,
        time_str=time_str,
        location=event_in.location,
        organizer_name=event_in.organizer_name or default_name,
        organizer_role=event_in.organizer_role or default_role,
        organizer_initials=event_in.organizer_initials or default_initials,
        is_featured=event_in.is_featured,
        capacity=event_in.capacity,
        tags=event_in.tags or [],
        highlights=event_in.highlights or [],
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return _build_event_response(
        event=new_event,
        rsvps_count=0,
        is_rsvpd=False,
    )


@router.get(
    "",
    response_model=PaginatedEventsResponse,
    summary="List campus events",
    description="Returns a paginated list of events with filtering by category, search text, or featured status.",
)
def get_events(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    search: Optional[str] = Query(None, description="Optional search term matching title, description, or location"),
    is_featured: Optional[bool] = Query(None, description="Filter for featured events"),
    upcoming_only: bool = Query(False, description="Filter for events occurring from current time onward"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> PaginatedEventsResponse:
    query = db.query(Event)

    if category:
        query = query.filter(Event.category.ilike(category.strip()))
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            Event.title.ilike(pattern)
            | Event.short_description.ilike(pattern)
            | Event.full_description.ilike(pattern)
            | Event.location.ilike(pattern)
        )
    if is_featured is not None:
        query = query.filter(Event.is_featured == is_featured)
    if upcoming_only:
        now = datetime.now(timezone.utc)
        query = query.filter(Event.event_date >= now)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 0
    offset = (page - 1) * limit

    events = (
        query.order_by(Event.event_date.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    if not events:
        return PaginatedEventsResponse(
            items=[],
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    event_ids = [e.id for e in events]

    # Batch query for confirmed RSVP counts
    rsvp_rows = (
        db.query(EventRSVP.event_id, func.count(EventRSVP.id))
        .filter(EventRSVP.event_id.in_(event_ids), EventRSVP.status == "confirmed")
        .group_by(EventRSVP.event_id)
        .all()
    )
    rsvp_counts: Dict[str, int] = {row[0]: row[1] for row in rsvp_rows}

    user_rsvpd_set: Set[str] = set()
    if current_user:
        user_rsvp_rows = (
            db.query(EventRSVP.event_id)
            .filter(
                EventRSVP.event_id.in_(event_ids),
                EventRSVP.user_id == current_user.id,
                EventRSVP.status == "confirmed",
            )
            .all()
        )
        user_rsvpd_set = {row[0] for row in user_rsvp_rows}

    items = [
        _build_event_response(
            event=e,
            rsvps_count=rsvp_counts.get(e.id, 0),
            is_rsvpd=(e.id in user_rsvpd_set),
        )
        for e in events
    ]

    return PaginatedEventsResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="Retrieve single event details",
    description="Fetches comprehensive details for a specific event including RSVP count and current user RSVP status.",
)
def get_event(
    event_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> EventResponse:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    rsvps_count = (
        db.query(func.count(EventRSVP.id))
        .filter(EventRSVP.event_id == event_id, EventRSVP.status == "confirmed")
        .scalar()
        or 0
    )

    is_rsvpd = False
    if current_user:
        is_rsvpd = (
            db.query(EventRSVP.id)
            .filter(
                EventRSVP.event_id == event_id,
                EventRSVP.user_id == current_user.id,
                EventRSVP.status == "confirmed",
            )
            .first()
            is not None
        )

    return _build_event_response(
        event=event,
        rsvps_count=rsvps_count,
        is_rsvpd=is_rsvpd,
    )


@router.patch(
    "/{event_id}",
    response_model=EventResponse,
    summary="Update an event",
    description="Updates event information. Enforces that only the creator of the event can edit it.",
)
def update_event(
    event_id: str,
    event_in: EventUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> EventResponse:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    if event.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this event.",
        )

    update_data = event_in.model_dump(exclude_unset=True)

    # Re-derive month/day if event_date was updated without explicit month/day
    if "event_date" in update_data and update_data["event_date"] is not None:
        new_date = update_data["event_date"]
        if "month" not in update_data or update_data["month"] is None:
            update_data["month"] = new_date.strftime("%b").upper()
        if "day" not in update_data or update_data["day"] is None:
            update_data["day"] = str(new_date.day)

    for field, value in update_data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)

    rsvps_count = (
        db.query(func.count(EventRSVP.id))
        .filter(EventRSVP.event_id == event_id, EventRSVP.status == "confirmed")
        .scalar()
        or 0
    )

    is_rsvpd = (
        db.query(EventRSVP.id)
        .filter(
            EventRSVP.event_id == event_id,
            EventRSVP.user_id == current_user.id,
            EventRSVP.status == "confirmed",
        )
        .first()
        is not None
    )

    return _build_event_response(
        event=event,
        rsvps_count=rsvps_count,
        is_rsvpd=is_rsvpd,
    )


@router.delete(
    "/{event_id}",
    response_model=ActionMessageResponse,
    summary="Delete an event",
    description="Deletes an event. Enforces that only the creator of the event can delete it.",
)
def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ActionMessageResponse:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    if event.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this event.",
        )

    db.delete(event)
    db.commit()

    return ActionMessageResponse(
        message="Event deleted successfully.",
        id=event_id,
    )


# ---------------------------------------------------------------------------
# RSVPs
# ---------------------------------------------------------------------------

@router.post(
    "/{event_id}/rsvp",
    response_model=RSVPResponse,
    summary="RSVP to an event",
    description="Registers an RSVP confirmation for the authenticated user. Enforces capacity limits and prevents duplicate RSVPs.",
)
def rsvp_to_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> RSVPResponse:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    # Check capacity limit if set
    current_count = (
        db.query(func.count(EventRSVP.id))
        .filter(EventRSVP.event_id == event_id, EventRSVP.status == "confirmed")
        .scalar()
        or 0
    )
    if event.capacity is not None and current_count >= event.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is at full capacity.",
        )

    existing_rsvp = (
        db.query(EventRSVP)
        .filter(EventRSVP.event_id == event_id, EventRSVP.user_id == current_user.id)
        .first()
    )

    if existing_rsvp:
        if existing_rsvp.status == "confirmed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already RSVP'd to this event.",
            )
        existing_rsvp.status = "confirmed"
    else:
        new_rsvp = EventRSVP(
            event_id=event_id,
            user_id=current_user.id,
            status="confirmed",
        )
        db.add(new_rsvp)

    db.commit()

    updated_count = (
        db.query(func.count(EventRSVP.id))
        .filter(EventRSVP.event_id == event_id, EventRSVP.status == "confirmed")
        .scalar()
        or 0
    )

    return RSVPResponse(
        event_id=event_id,
        rsvps_count=updated_count,
        is_rsvpd=True,
        message="RSVP confirmed successfully.",
    )


@router.delete(
    "/{event_id}/rsvp",
    response_model=RSVPResponse,
    summary="Cancel an event RSVP",
    description="Cancels an existing confirmed RSVP for the authenticated user.",
)
def cancel_event_rsvp(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> RSVPResponse:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    existing_rsvp = (
        db.query(EventRSVP)
        .filter(
            EventRSVP.event_id == event_id,
            EventRSVP.user_id == current_user.id,
            EventRSVP.status == "confirmed",
        )
        .first()
    )

    if not existing_rsvp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have not RSVP'd to this event.",
        )

    db.delete(existing_rsvp)
    db.commit()

    updated_count = (
        db.query(func.count(EventRSVP.id))
        .filter(EventRSVP.event_id == event_id, EventRSVP.status == "confirmed")
        .scalar()
        or 0
    )

    return RSVPResponse(
        event_id=event_id,
        rsvps_count=updated_count,
        is_rsvpd=False,
        message="RSVP cancelled successfully.",
    )
