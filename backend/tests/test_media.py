import io
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User, StudentProfile
from app.core.config import settings


# Magic byte samples for valid image formats
SAMPLE_PNG = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 64
SAMPLE_JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 64
SAMPLE_WEBP = b"RIFF\x20\x00\x00\x00WEBPVP8 " + b"\x00" * 64


def _register_and_get_user(
    client: TestClient,
    db_session: Session,
    email: str,
    handle: str,
    full_name: str,
    password: str = "SecurePass123!",
) -> tuple[str, str]:
    """Helper to register a user, returning (jwt_token, user_id)."""
    reg_payload = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "department_major": "Computer Science",
        "graduation_year": 2027,
        "handle": handle,
        "university": "National Institute of Technology",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201

    login_res = client.post(
        "/api/v1/auth/login/json",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    user = db_session.query(User).filter(User.email == email).first()
    assert user is not None
    return token, user.id


@pytest.fixture(autouse=True)
def cleanup_uploaded_media():
    """Tracks and cleans up files uploaded to media directory during testing."""
    created_files = []
    yield created_files
    for filepath in created_files:
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass


def test_upload_avatar_png_success(
    client: TestClient,
    db_session: Session,
    cleanup_uploaded_media: list,
):
    """
    Test POST /api/v1/media/avatar successfully uploads a valid PNG image,
    returns url and filename, and links to user's profile avatar_url.
    """
    token, user_id = _register_and_get_user(
        client, db_session, "avatar.user@campus.edu", "@avataruser", "Avatar User"
    )

    files = {
        "file": ("avatar.png", io.BytesIO(SAMPLE_PNG), "image/png"),
    }

    res = client.post(
        "/api/v1/media/avatar",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
    )
    assert res.status_code == 201
    data = res.json()

    assert data["media_type"] == "avatar"
    assert data["url"].startswith("/media/avatars/")
    assert data["filename"].endswith(".png")
    assert data["size_bytes"] == len(SAMPLE_PNG)

    # Track file for cleanup
    disk_path = os.path.join(settings.MEDIA_DIR, "avatars", data["filename"])
    cleanup_uploaded_media.append(disk_path)
    assert os.path.exists(disk_path)

    # Check profile updated
    profile = db_session.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    assert profile.avatar_url == data["url"]

    # Test static file serving
    get_res = client.get(data["url"])
    assert get_res.status_code == 200
    assert get_res.content == SAMPLE_PNG


def test_upload_avatar_jpeg_success(
    client: TestClient,
    db_session: Session,
    cleanup_uploaded_media: list,
):
    """
    Test POST /api/v1/media/avatar successfully handles a valid JPEG image.
    """
    token, user_id = _register_and_get_user(
        client, db_session, "jpeg.user@campus.edu", "@jpeguser", "JPEG User"
    )

    files = {
        "file": ("profile.jpg", io.BytesIO(SAMPLE_JPEG), "image/jpeg"),
    }

    res = client.post(
        "/api/v1/media/avatar",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["url"].startswith("/media/avatars/")
    assert data["filename"].endswith(".jpg")

    disk_path = os.path.join(settings.MEDIA_DIR, "avatars", data["filename"])
    cleanup_uploaded_media.append(disk_path)


def test_upload_banner_webp_success(
    client: TestClient,
    db_session: Session,
    cleanup_uploaded_media: list,
):
    """
    Test POST /api/v1/media/banner successfully uploads a valid WebP cover banner
    and links to user's profile banner_url.
    """
    token, user_id = _register_and_get_user(
        client, db_session, "banner.user@campus.edu", "@banneruser", "Banner User"
    )

    files = {
        "file": ("cover.webp", io.BytesIO(SAMPLE_WEBP), "image/webp"),
    }

    res = client.post(
        "/api/v1/media/banner",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
    )
    assert res.status_code == 201
    data = res.json()

    assert data["media_type"] == "banner"
    assert data["url"].startswith("/media/banners/")
    assert data["filename"].endswith(".webp")

    # Track file for cleanup
    disk_path = os.path.join(settings.MEDIA_DIR, "banners", data["filename"])
    cleanup_uploaded_media.append(disk_path)
    assert os.path.exists(disk_path)

    # Check profile updated
    profile = db_session.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    assert profile.banner_url == data["url"]


def test_upload_media_unauthenticated(client: TestClient):
    """
    Test POST /api/v1/media/avatar and /banner without auth returns 401 Unauthorized.
    """
    files = {"file": ("avatar.png", io.BytesIO(SAMPLE_PNG), "image/png")}

    res_avatar = client.post("/api/v1/media/avatar", files=files)
    assert res_avatar.status_code == 401

    res_banner = client.post("/api/v1/media/banner", files=files)
    assert res_banner.status_code == 401


def test_upload_media_invalid_content_magic_bytes(
    client: TestClient,
    db_session: Session,
):
    """
    Test upload rejects non-image files even if sent with image/png content-type header.
    """
    token, _ = _register_and_get_user(
        client, db_session, "fake.image@campus.edu", "@fakeimage", "Fake Image"
    )

    fake_content = b"echo 'Malicious shell script payload masquerading as png'"
    files = {"file": ("fake.png", io.BytesIO(fake_content), "image/png")}

    res = client.post(
        "/api/v1/media/avatar",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
    )
    assert res.status_code == 400
    assert "unsupported image format" in res.json()["detail"].lower()


def test_upload_media_too_small(
    client: TestClient,
    db_session: Session,
):
    """
    Test upload rejects files smaller than 12 bytes as malformed.
    """
    token, _ = _register_and_get_user(
        client, db_session, "small.file@campus.edu", "@smallfile", "Small File"
    )

    files = {"file": ("tiny.png", io.BytesIO(b"short"), "image/png")}

    res = client.post(
        "/api/v1/media/avatar",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
    )
    assert res.status_code == 400
    assert "too small" in res.json()["detail"].lower()


def test_upload_avatar_exceeds_size_limit(
    client: TestClient,
    db_session: Session,
):
    """
    Test upload rejects avatar exceeding 5 MB limit.
    """
    token, _ = _register_and_get_user(
        client, db_session, "heavy.user@campus.edu", "@heavyuser", "Heavy User"
    )

    # 5 MB + 10 bytes: start with valid PNG header so size check triggers
    oversized_data = SAMPLE_PNG[:16] + b"A" * (5 * 1024 * 1024)
    files = {"file": ("large_avatar.png", io.BytesIO(oversized_data), "image/png")}

    res = client.post(
        "/api/v1/media/avatar",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
    )
    assert res.status_code == 400
    assert "exceeds maximum avatar size" in res.json()["detail"].lower()
