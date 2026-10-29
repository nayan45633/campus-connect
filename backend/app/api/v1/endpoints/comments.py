from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.post import Comment
from app.schemas.post import ActionMessageResponse

router = APIRouter()


@router.delete(
    "/{comment_id}",
    response_model=ActionMessageResponse,
    summary="Delete a comment",
    description="Allows the original author of the comment (or an admin) to delete it.",
)
def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ActionMessageResponse:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
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
