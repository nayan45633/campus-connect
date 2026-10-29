import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, JSON, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Event(Base):
    """
    Campus events model with organizer info, scheduling, capacity, and creator reference.
    """
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    creator_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # Technical, Cultural, Workshop, Sports, General
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    full_description: Mapped[str] = mapped_column(Text, nullable=False)

    event_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )
    month: Mapped[str] = mapped_column(String(10), nullable=False)  # "NOV", "DEC"
    day: Mapped[str] = mapped_column(String(10), nullable=False)    # "14", "22"
    time_str: Mapped[str] = mapped_column(String(100), nullable=False)  # "9:30 AM – 5:00 PM"
    location: Mapped[str] = mapped_column(String(255), nullable=False)

    organizer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    organizer_role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    organizer_initials: Mapped[str] = mapped_column(String(10), nullable=False)

    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    tags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    highlights: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    creator: Mapped[Optional["User"]] = relationship("User", back_populates="events")
    rsvps: Mapped[List["EventRSVP"]] = relationship(
        "EventRSVP", back_populates="event", cascade="all, delete-orphan"
    )


class EventRSVP(Base):
    """
    RSVP registration record linking a user with an event.
    """
    __tablename__ = "event_rsvps"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_rsvp_user"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("events.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20), default="confirmed", nullable=False
    )  # confirmed, cancelled

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="rsvps")
    user: Mapped["User"] = relationship("User", back_populates="event_rsvps")
