import math
from typing import Optional, List, Dict, Set
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_active_user, get_current_user_optional
from app.models.user import User
from app.models.community import Community, CommunityMembership
from app.schemas.community import (
    CommunityCreateRequest,
    CommunityUpdateRequest,
    CommunityResponse,
    PaginatedCommunitiesResponse,
    CommunityMembershipResponse,
    CommunityMemberPublic,
    PaginatedCommunityMembersResponse,
    compute_initials,
)
from app.schemas.post import ActionMessageResponse, serialize_author_public

router = APIRouter()


def _build_community_response(
    community: Community,
    members_count: int = 0,
    is_joined: bool = False,
) -> CommunityResponse:
    """Helper to assemble a CommunityResponse schema from a Community ORM model."""
    return CommunityResponse(
        id=community.id,
        name=community.name,
        category=community.category,
        description=community.description,
        short_description=community.short_description,
        full_description=community.full_description,
        avatar_initials=community.avatar_initials,
        cover_gradient=community.cover_gradient,
        meeting_schedule=community.meeting_schedule,
        location=community.location,
        lead_user_id=community.lead_user_id,
        lead_name=community.lead_name,
        lead_role=community.lead_role,
        tags=community.tags or [],
        created_at=community.created_at,
        updated_at=community.updated_at,
        members_count=members_count,
        is_joined=is_joined,
    )


# ---------------------------------------------------------------------------
# COMMUNITIES CRUD
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=CommunityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new student community or club",
    description="Registers a new campus community authored by the authenticated student. Automatically registers the creator as the club lead and member.",
)
def create_community(
    community_in: CommunityCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> CommunityResponse:
    # Check for duplicate community name (case-insensitive)
    existing = (
        db.query(Community)
        .filter(func.lower(Community.name) == community_in.name.strip().lower())
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A community with this name already exists.",
        )

    # Sensible defaults for descriptions and lead identity
    desc = (
        community_in.description
        or community_in.short_description
        or community_in.full_description
        or community_in.name
    )
    short_desc = community_in.short_description or desc[:200]
    full_desc = community_in.full_description or desc
    initials = community_in.avatar_initials or compute_initials(community_in.name)

    profile = current_user.profile
    lead_name = community_in.lead_name or (
        profile.full_name if profile and profile.full_name else current_user.email.split("@")[0]
    )
    lead_role = community_in.lead_role or (
        profile.academic_year_title if profile and profile.academic_year_title else "Club Lead"
    )

    new_community = Community(
        name=community_in.name.strip(),
        category=community_in.category.strip(),
        description=desc,
        short_description=short_desc,
        full_description=full_desc,
        avatar_initials=initials,
        cover_gradient=community_in.cover_gradient,
        meeting_schedule=community_in.meeting_schedule,
        location=community_in.location,
        lead_user_id=current_user.id,
        lead_name=lead_name,
        lead_role=lead_role,
        tags=community_in.tags or [],
    )
    db.add(new_community)
    db.flush()

    # Automatically add the creator as a lead member
    membership = CommunityMembership(
        community_id=new_community.id,
        user_id=current_user.id,
        role="lead",
    )
    db.add(membership)
    db.commit()
    db.refresh(new_community)

    return _build_community_response(
        community=new_community,
        members_count=1,
        is_joined=True,
    )


@router.get(
    "",
    response_model=PaginatedCommunitiesResponse,
    summary="List campus communities",
    description="Returns a paginated list of student clubs and communities with optional category and search filters.",
)
def get_communities(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    search: Optional[str] = Query(None, description="Optional search term matching name, description, or lead"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> PaginatedCommunitiesResponse:
    query = db.query(Community)

    if category:
        query = query.filter(Community.category.ilike(category.strip()))
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            Community.name.ilike(pattern)
            | Community.description.ilike(pattern)
            | Community.short_description.ilike(pattern)
            | Community.lead_name.ilike(pattern)
        )

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 0
    offset = (page - 1) * limit

    communities = (
        query.order_by(Community.name.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    if not communities:
        return PaginatedCommunitiesResponse(
            items=[],
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    community_ids = [c.id for c in communities]

    # Batch query for member counts
    member_rows = (
        db.query(CommunityMembership.community_id, func.count(CommunityMembership.id))
        .filter(CommunityMembership.community_id.in_(community_ids))
        .group_by(CommunityMembership.community_id)
        .all()
    )
    member_counts: Dict[str, int] = {row[0]: row[1] for row in member_rows}

    user_joined_set: Set[str] = set()
    if current_user:
        user_rows = (
            db.query(CommunityMembership.community_id)
            .filter(
                CommunityMembership.community_id.in_(community_ids),
                CommunityMembership.user_id == current_user.id,
            )
            .all()
        )
        user_joined_set = {row[0] for row in user_rows}

    items = [
        _build_community_response(
            community=c,
            members_count=member_counts.get(c.id, 0),
            is_joined=(c.id in user_joined_set),
        )
        for c in communities
    ]

    return PaginatedCommunitiesResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get(
    "/{community_id}",
    response_model=CommunityResponse,
    summary="Retrieve single community details",
    description="Fetches detailed information for a specific community including member count and current user's membership status.",
)
def get_community(
    community_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> CommunityResponse:
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found.",
        )

    members_count = (
        db.query(func.count(CommunityMembership.id))
        .filter(CommunityMembership.community_id == community_id)
        .scalar()
        or 0
    )

    is_joined = False
    if current_user:
        is_joined = (
            db.query(CommunityMembership.id)
            .filter(
                CommunityMembership.community_id == community_id,
                CommunityMembership.user_id == current_user.id,
            )
            .first()
            is not None
        )

    return _build_community_response(
        community=community,
        members_count=members_count,
        is_joined=is_joined,
    )


@router.patch(
    "/{community_id}",
    response_model=CommunityResponse,
    summary="Update community details",
    description="Updates community properties. Enforces that only the creator/lead can edit the community.",
)
def update_community(
    community_id: str,
    community_in: CommunityUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> CommunityResponse:
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found.",
        )

    if community.lead_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this community.",
        )

    update_data = community_in.model_dump(exclude_unset=True)

    # Check for name conflict if name is updated
    if "name" in update_data and update_data["name"] is not None:
        new_name = update_data["name"].strip()
        existing = (
            db.query(Community)
            .filter(
                func.lower(Community.name) == new_name.lower(),
                Community.id != community_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A community with this name already exists.",
            )
        update_data["name"] = new_name

    for field, value in update_data.items():
        setattr(community, field, value)

    db.commit()
    db.refresh(community)

    members_count = (
        db.query(func.count(CommunityMembership.id))
        .filter(CommunityMembership.community_id == community_id)
        .scalar()
        or 0
    )

    is_joined = (
        db.query(CommunityMembership.id)
        .filter(
            CommunityMembership.community_id == community_id,
            CommunityMembership.user_id == current_user.id,
        )
        .first()
        is not None
    )

    return _build_community_response(
        community=community,
        members_count=members_count,
        is_joined=is_joined,
    )


@router.delete(
    "/{community_id}",
    response_model=ActionMessageResponse,
    summary="Delete a community",
    description="Deletes a community and all its memberships. Enforces that only the creator/lead can delete it.",
)
def delete_community(
    community_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ActionMessageResponse:
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found.",
        )

    if community.lead_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this community.",
        )

    db.delete(community)
    db.commit()

    return ActionMessageResponse(
        message="Community deleted successfully.",
        id=community_id,
    )


# ---------------------------------------------------------------------------
# MEMBERSHIPS (JOIN / LEAVE / LIST)
# ---------------------------------------------------------------------------

@router.post(
    "/{community_id}/join",
    response_model=CommunityMembershipResponse,
    summary="Join a community",
    description="Adds the authenticated user as a member of the community. Prevents duplicate memberships.",
)
def join_community(
    community_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> CommunityMembershipResponse:
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found.",
        )

    existing = (
        db.query(CommunityMembership)
        .filter(
            CommunityMembership.community_id == community_id,
            CommunityMembership.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this community.",
        )

    new_membership = CommunityMembership(
        community_id=community_id,
        user_id=current_user.id,
        role="member",
    )
    db.add(new_membership)
    db.commit()

    members_count = (
        db.query(func.count(CommunityMembership.id))
        .filter(CommunityMembership.community_id == community_id)
        .scalar()
        or 0
    )

    return CommunityMembershipResponse(
        community_id=community_id,
        members_count=members_count,
        is_joined=True,
        role="member",
        message="Successfully joined community.",
    )


@router.delete(
    "/{community_id}/join",
    response_model=CommunityMembershipResponse,
    summary="Leave a community",
    description="Removes the authenticated user's membership from the specified community.",
)
def leave_community(
    community_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> CommunityMembershipResponse:
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found.",
        )

    membership = (
        db.query(CommunityMembership)
        .filter(
            CommunityMembership.community_id == community_id,
            CommunityMembership.user_id == current_user.id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not a member of this community.",
        )

    db.delete(membership)
    db.commit()

    members_count = (
        db.query(func.count(CommunityMembership.id))
        .filter(CommunityMembership.community_id == community_id)
        .scalar()
        or 0
    )

    return CommunityMembershipResponse(
        community_id=community_id,
        members_count=members_count,
        is_joined=False,
        role=None,
        message="Successfully left community.",
    )


@router.get(
    "/{community_id}/members",
    response_model=PaginatedCommunityMembersResponse,
    summary="List community members",
    description="Retrieves a paginated list of community members with safe public profile information.",
)
def get_community_members(
    community_id: str,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
) -> PaginatedCommunityMembersResponse:
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found.",
        )

    total = (
        db.query(func.count(CommunityMembership.id))
        .filter(CommunityMembership.community_id == community_id)
        .scalar()
        or 0
    )
    pages = math.ceil(total / limit) if total > 0 else 0
    offset = (page - 1) * limit

    memberships = (
        db.query(CommunityMembership)
        .options(joinedload(CommunityMembership.user).joinedload(User.profile))
        .filter(CommunityMembership.community_id == community_id)
        .order_by(CommunityMembership.joined_at.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [
        CommunityMemberPublic(
            user_id=m.user_id,
            role=m.role,
            joined_at=m.joined_at,
            user=serialize_author_public(m.user),
        )
        for m in memberships
    ]

    return PaginatedCommunityMembersResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )
