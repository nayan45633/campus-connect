import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, JSON, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Community(Base):
    """
    Student communities & clubs directory model.
    """
    __tablename__ = "communities"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # Technology, Academics, Gaming, Arts, Entrepreneurship
    description: Mapped[str] = mapped_column(Text, nullable=False)
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    full_description: Mapped[str] = mapped_column(Text, nullable=False)

    avatar_initials: Mapped[str] = mapped_column(String(10), nullable=False)
    cover_gradient: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meeting_schedule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    lead_user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    lead_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    lead_role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    tags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    memberships: Mapped[List["CommunityMembership"]] = relationship(
        "CommunityMembership", back_populates="community", cascade="all, delete-orphan"
    )


class CommunityMembership(Base):
    """
    Membership linking a student user with a community.
    """
    __tablename__ = "community_memberships"
    __table_args__ = (
        UniqueConstraint("community_id", "user_id", name="uq_community_membership_user"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    community_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("communities.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    role: Mapped[str] = mapped_column(
        String(50), default="member", nullable=False
    )  # member, lead, moderator

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    community: Mapped["Community"] = relationship("Community", back_populates="memberships")
    user: Mapped["User"] = relationship("User", back_populates="community_memberships")
