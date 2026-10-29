import math
from typing import Optional, List, Set, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_active_user, get_current_user_optional
from app.models.user import User
from app.models.post import Post, Comment, PostLike
from app.schemas.post import (
    PostCreateRequest,
    PostResponse,
    PaginatedPostsResponse,
    CommentCreateRequest,
    CommentResponse,
    PaginatedCommentsResponse,
    LikeResponse,
    ActionMessageResponse,
    serialize_author_public,
)

router = APIRouter()


def _build_post_response(
    post: Post,
    likes_count: int = 0,
    comments_count: int = 0,
    is_liked_by_me: bool = False,
) -> PostResponse:
    """Helper to assemble a PostResponse from a Post model and precalculated stats."""
    return PostResponse(
        id=post.id,
        author_id=post.author_id,
        author=serialize_author_public(post.author),
        category=post.category,
        content=post.content,
        tags=post.tags or [],
        created_at=post.created_at,
        updated_at=post.updated_at,
        likes_count=likes_count,
        comments_count=comments_count,
        is_liked_by_me=is_liked_by_me,
    )


# ---------------------------------------------------------------------------
# POSTS CRUD
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new campus post",
    description="Publishes a new campus post authored by the authenticated student.",
)
def create_post(
    post_in: PostCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> PostResponse:
    new_post = Post(
        author_id=current_user.id,
        category=post_in.category,
        content=post_in.content,
        tags=post_in.tags or [],
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Attach loaded author for response serialization
    new_post.author = current_user

    return _build_post_response(
        post=new_post,
        likes_count=0,
        comments_count=0,
        is_liked_by_me=False,
    )


@router.get(
    "",
    response_model=PaginatedPostsResponse,
    summary="Retrieve the campus feed",
    description="Returns a paginated list of campus posts sorted newest first. Safe for unauthenticated guests, while authenticated users receive per-post like status.",
)
def get_posts(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    search: Optional[str] = Query(None, description="Optional text search in post content"),
    author_id: Optional[str] = Query(None, description="Optional filter by author user ID"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> PaginatedPostsResponse:
    query = db.query(Post)

    if category:
        query = query.filter(Post.category.ilike(category.strip()))
    if search:
        query = query.filter(Post.content.ilike(f"%{search.strip()}%"))
    if author_id:
        query = query.filter(Post.author_id == author_id)

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 0
    offset = (page - 1) * limit

    posts = (
        query.options(joinedload(Post.author).joinedload(User.profile))
        .order_by(Post.created_at.desc())
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

    # Efficient batch queries for like counts, comment counts, and current user like status
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
        _build_post_response(
            post=p,
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


@router.get(
    "/{post_id}",
    response_model=PostResponse,
    summary="Retrieve a single campus post",
    description="Fetches full details of a single post by ID including author, like counts, and comment counts.",
)
def get_post(
    post_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> PostResponse:
    post = (
        db.query(Post)
        .options(joinedload(Post.author).joinedload(User.profile))
        .filter(Post.id == post_id)
        .first()
    )
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    likes_count = (
        db.query(func.count(PostLike.id)).filter(PostLike.post_id == post_id).scalar() or 0
    )
    comments_count = (
        db.query(func.count(Comment.id)).filter(Comment.post_id == post_id).scalar() or 0
    )

    is_liked = False
    if current_user:
        is_liked = (
            db.query(PostLike.id)
            .filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
            .first()
            is not None
        )

    return _build_post_response(
        post=post,
        likes_count=likes_count,
        comments_count=comments_count,
        is_liked_by_me=is_liked,
    )


@router.delete(
    "/{post_id}",
    response_model=ActionMessageResponse,
    summary="Delete a post",
    description="Allows the original author of the post (or an admin) to delete it.",
)
def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ActionMessageResponse:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    if post.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post.",
        )

    db.delete(post)
    db.commit()

    return ActionMessageResponse(
        message="Post deleted successfully.",
        id=post_id,
    )


# ---------------------------------------------------------------------------
# LIKES
# ---------------------------------------------------------------------------

@router.post(
    "/{post_id}/like",
    response_model=LikeResponse,
    summary="Like a post",
    description="Adds a like to the target post for the authenticated user. Prevents duplicate likes.",
)
def like_post(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> LikeResponse:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    existing_like = (
        db.query(PostLike)
        .filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
        .first()
    )
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already liked this post.",
        )

    new_like = PostLike(post_id=post_id, user_id=current_user.id)
    db.add(new_like)
    db.commit()

    likes_count = (
        db.query(func.count(PostLike.id)).filter(PostLike.post_id == post_id).scalar() or 0
    )

    return LikeResponse(
        post_id=post_id,
        likes_count=likes_count,
        is_liked_by_me=True,
        message="Post liked successfully.",
    )


@router.delete(
    "/{post_id}/like",
    response_model=LikeResponse,
    summary="Unlike a post",
    description="Removes a previously recorded like from the target post.",
)
def unlike_post(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> LikeResponse:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    existing_like = (
        db.query(PostLike)
        .filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
        .first()
    )
    if not existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have not liked this post.",
        )

    db.delete(existing_like)
    db.commit()

    likes_count = (
        db.query(func.count(PostLike.id)).filter(PostLike.post_id == post_id).scalar() or 0
    )

    return LikeResponse(
        post_id=post_id,
        likes_count=likes_count,
        is_liked_by_me=False,
        message="Post unliked successfully.",
    )


# ---------------------------------------------------------------------------
# COMMENTS
# ---------------------------------------------------------------------------

@router.post(
    "/{post_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a comment to a post",
    description="Publishes a reply comment under the specified campus post.",
)
def add_comment(
    post_id: str,
    comment_in: CommentCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> CommentResponse:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    new_comment = Comment(
        post_id=post_id,
        author_id=current_user.id,
        content=comment_in.content,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # Attach loaded author for response serialization
    new_comment.author = current_user

    return CommentResponse(
        id=new_comment.id,
        post_id=new_comment.post_id,
        author_id=new_comment.author_id,
        author=serialize_author_public(current_user),
        content=new_comment.content,
        created_at=new_comment.created_at,
        updated_at=new_comment.updated_at,
    )


@router.get(
    "/{post_id}/comments",
    response_model=PaginatedCommentsResponse,
    summary="Retrieve comments for a post",
    description="Fetches paginated comments in consistent chronological order (oldest first).",
)
def get_post_comments(
    post_id: str,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(50, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
) -> PaginatedCommentsResponse:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    total = (
        db.query(func.count(Comment.id)).filter(Comment.post_id == post_id).scalar() or 0
    )
    pages = math.ceil(total / limit) if total > 0 else 0
    offset = (page - 1) * limit

    comments = (
        db.query(Comment)
        .options(joinedload(Comment.author).joinedload(User.profile))
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [
        CommentResponse(
            id=c.id,
            post_id=c.post_id,
            author_id=c.author_id,
            author=serialize_author_public(c.author),
            content=c.content,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in comments
    ]

    return PaginatedCommentsResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.delete(
    "/{post_id}/comments/{comment_id}",
    response_model=ActionMessageResponse,
    summary="Delete a comment (nested route)",
    description="Deletes a comment if owned by authenticated user or admin.",
)
def delete_nested_comment(
    post_id: str,
    comment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ActionMessageResponse:
    comment = (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.post_id == post_id)
        .first()
    )
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )

    if comment.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment.",
        )

    db.delete(comment)
    db.commit()

    return ActionMessageResponse(
        message="Comment deleted successfully.",
        id=comment_id,
    )
