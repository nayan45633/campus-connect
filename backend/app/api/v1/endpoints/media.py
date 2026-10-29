import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, StudentProfile
from app.schemas.profile import MediaUploadResponse

router = APIRouter()


def validate_image_bytes(content: bytes) -> str:
    """
    Validates the magic byte signature of uploaded media to ensure it is a valid image.
    Returns the canonical extension (.jpg, .png, .webp, .gif) or raises 400 Bad Request.
    """
    if len(content) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is too small or malformed.",
        )

    # JPEG signature
    if content.startswith(b"\xff\xd8\xff"):
        return ".jpg"

    # PNG signature
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"

    # WebP signature (RIFF....WEBP)
    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return ".webp"

    # GIF signature
    if content.startswith((b"GIF87a", b"GIF89a")):
        return ".gif"

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported image format. Allowed formats: JPEG, PNG, WebP.",
    )


def _ensure_user_profile(user: User, db: Session) -> StudentProfile:
    """Retrieves or creates user student profile."""
    if user.profile:
        return user.profile
    profile = StudentProfile(
        user_id=user.id,
        full_name=user.email.split("@")[0].replace(".", " ").title(),
        handle=f"@{user.email.split('@')[0]}",
        initials="ST",
        university="National Institute of Technology",
        department_major="General Studies",
        graduation_year=2027,
        academic_year_title="Class of 2027",
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.post(
    "/avatar",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload profile avatar image",
    description="Uploads and validates a user profile avatar image (JPEG, PNG, WebP, max 5 MB). Updates the student profile avatar reference.",
)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> MediaUploadResponse:
    content = await file.read()

    # 1. Size validation (max 5 MB)
    if len(content) > settings.MAX_AVATAR_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum avatar size limit of {settings.MAX_AVATAR_SIZE_BYTES // (1024 * 1024)} MB.",
        )

    # 2. Magic byte content inspection
    ext = validate_image_bytes(content)

    # 3. Safe unique filename generation (never use user-supplied names)
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    target_dir = os.path.join(settings.MEDIA_DIR, "avatars")
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, safe_filename)

    # 4. Save file to disk
    with open(target_path, "wb") as f:
        f.write(content)

    media_url = f"/media/avatars/{safe_filename}"

    # 5. Automatically link into authenticated student's profile
    profile = _ensure_user_profile(current_user, db)
    profile.avatar_url = media_url
    db.commit()

    return MediaUploadResponse(
        url=media_url,
        filename=safe_filename,
        media_type="avatar",
        size_bytes=len(content),
        content_type=file.content_type or f"image/{ext.lstrip('.')}",
    )


@router.post(
    "/banner",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload profile cover banner",
    description="Uploads and validates a user profile cover banner image (JPEG, PNG, WebP, max 8 MB). Updates the student profile banner reference.",
)
async def upload_banner(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> MediaUploadResponse:
    content = await file.read()

    # 1. Size validation (max 8 MB)
    if len(content) > settings.MAX_BANNER_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum banner size limit of {settings.MAX_BANNER_SIZE_BYTES // (1024 * 1024)} MB.",
        )

    # 2. Magic byte content inspection
    ext = validate_image_bytes(content)

    # 3. Safe unique filename generation
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    target_dir = os.path.join(settings.MEDIA_DIR, "banners")
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, safe_filename)

    # 4. Save file to disk
    with open(target_path, "wb") as f:
        f.write(content)

    media_url = f"/media/banners/{safe_filename}"

    # 5. Automatically link into authenticated student's profile
    profile = _ensure_user_profile(current_user, db)
    profile.banner_url = media_url
    db.commit()

    return MediaUploadResponse(
        url=media_url,
        filename=safe_filename,
        media_type="banner",
        size_bytes=len(content),
        content_type=file.content_type or f"image/{ext.lstrip('.')}",
    )
