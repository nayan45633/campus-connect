import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User, StudentProfile
from app.models.post import Post


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


def test_get_my_profile_authenticated(client: TestClient, db_session: Session):
    """
    Test GET /api/v1/profiles/me returns authenticated student's full profile.
    """
    token, user_id = _register_and_get_user(
        client, db_session, "alice.smith@campus.edu", "@alicesmith", "Alice Smith"
    )

    res = client.get(
        "/api/v1/profiles/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == user_id
    assert data["email"] == "alice.smith@campus.edu"
    assert data["full_name"] == "Alice Smith"
    assert data["handle"] == "@alicesmith"
    assert data["initials"] == "AS"
    assert data["role"] == "student"
    assert data["university"] == "National Institute of Technology"
    assert data["department_major"] == "Computer Science"
    assert data["graduation_year"] == 2027
    assert isinstance(data["skills"], list)
    assert isinstance(data["interests"], list)


def test_get_my_profile_unauthenticated(client: TestClient):
    """
    Test GET /api/v1/profiles/me without token returns 401 Unauthorized.
    """
    res = client.get("/api/v1/profiles/me")
    assert res.status_code == 401
    assert "detail" in res.json()


def test_update_my_profile_success(client: TestClient, db_session: Session):
    """
    Test PATCH /api/v1/profiles/me successfully updates editable fields
    and recomputes initials when full_name changes.
    """
    token, user_id = _register_and_get_user(
        client, db_session, "bob.builder@campus.edu", "@bobbuilder", "Bob Builder"
    )

    update_payload = {
        "full_name": "Robert Builder",
        "bio": "Building modern campus web and cloud applications.",
        "department_major": "Software Engineering",
        "graduation_year": 2026,
        "academic_year_title": "Class of 2026",
        "skills": ["Python", "FastAPI", "React", "PostgreSQL"],
        "interests": ["Open Source", "Hackathons", "Robotics"],
        "location": "Innovation Lab, 3rd Floor",
        "banner_gradient": "from-blue-600 via-indigo-600 to-purple-600",
    }

    res = client.patch(
        "/api/v1/profiles/me",
        headers={"Authorization": f"Bearer {token}"},
        json=update_payload,
    )
    assert res.status_code == 200
    data = res.json()

    assert data["full_name"] == "Robert Builder"
    assert data["initials"] == "RB"  # Recomputed from "Robert Builder"
    assert data["bio"] == "Building modern campus web and cloud applications."
    assert data["department_major"] == "Software Engineering"
    assert data["graduation_year"] == 2026
    assert data["academic_year_title"] == "Class of 2026"
    assert data["skills"] == ["Python", "FastAPI", "React", "PostgreSQL"]
    assert data["interests"] == ["Open Source", "Hackathons", "Robotics"]
    assert data["location"] == "Innovation Lab, 3rd Floor"
    assert data["banner_gradient"] == "from-blue-600 via-indigo-600 to-purple-600"

    # Verify database persistence
    profile = db_session.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    assert profile.full_name == "Robert Builder"
    assert profile.initials == "RB"
    assert profile.graduation_year == 2026


def test_update_my_profile_handle_change(client: TestClient, db_session: Session):
    """
    Test PATCH /api/v1/profiles/me can update the handle when unique.
    """
    token, user_id = _register_and_get_user(
        client, db_session, "carol.danvers@campus.edu", "@carold", "Carol Danvers"
    )

    res = client.patch(
        "/api/v1/profiles/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"handle": "@captaincarol"},
    )
    assert res.status_code == 200
    assert res.json()["handle"] == "@captaincarol"

    # Verify normalization/storage with leading @
    profile = db_session.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    assert profile.handle == "@captaincarol"


def test_update_my_profile_duplicate_handle(client: TestClient, db_session: Session):
    """
    Test PATCH /api/v1/profiles/me rejects a handle already used by another student.
    """
    token1, _ = _register_and_get_user(
        client, db_session, "user1@campus.edu", "@campuspro", "User One"
    )
    token2, _ = _register_and_get_user(
        client, db_session, "user2@campus.edu", "@campusrookie", "User Two"
    )

    res = client.patch(
        "/api/v1/profiles/me",
        headers={"Authorization": f"Bearer {token2}"},
        json={"handle": "@campuspro"},
    )
    assert res.status_code == 400
    assert "already taken" in res.json()["detail"].lower()


def test_update_my_profile_disallows_tampering_protected_fields(client: TestClient, db_session: Session):
    """
    Test PATCH /api/v1/profiles/me ignores attempts to alter email, password_hash, or role.
    """
    token, user_id = _register_and_get_user(
        client, db_session, "dave@campus.edu", "@davedev", "Dave Developer"
    )

    tamper_payload = {
        "full_name": "Dave Updated",
        "email": "hacked@campus.edu",
        "role": "admin",
        "password_hash": "new_hash_value",
    }

    res = client.patch(
        "/api/v1/profiles/me",
        headers={"Authorization": f"Bearer {token}"},
        json=tamper_payload,
    )
    assert res.status_code == 200

    user = db_session.query(User).filter(User.id == user_id).first()
    assert user.email == "dave@campus.edu"  # Unchanged
    assert user.role == "student"  # Unchanged


def test_get_public_profile_success(client: TestClient, db_session: Session):
    """
    Test GET /api/v1/profiles/{user_id} returns safe public profile without sensitive fields.
    """
    _, user_id = _register_and_get_user(
        client, db_session, "eve.public@campus.edu", "@evepublic", "Eve Public"
    )

    # Public endpoint does not require authentication
    res = client.get(f"/api/v1/profiles/{user_id}")
    assert res.status_code == 200
    data = res.json()

    assert data["user_id"] == user_id
    assert data["full_name"] == "Eve Public"
    assert data["handle"] == "@evepublic"
    assert data["initials"] == "EP"
    assert data["department_major"] == "Computer Science"
    assert data["university"] == "National Institute of Technology"
    assert data["role"] == "student"

    # Verify sensitive data is NOT present in public profile schema
    assert "email" not in data
    assert "password_hash" not in data
    assert "hashed_password" not in data


def test_get_public_profile_not_found(client: TestClient):
    """
    Test GET /api/v1/profiles/{user_id} with non-existent user returns 404 Not Found.
    """
    res = client.get("/api/v1/profiles/non-existent-user-id-999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_get_user_posts_empty(client: TestClient, db_session: Session):
    """
    Test GET /api/v1/profiles/{user_id}/posts returns empty paginated list if user has no posts.
    """
    _, user_id = _register_and_get_user(
        client, db_session, "frank.noposts@campus.edu", "@franknoposts", "Frank NoPosts"
    )

    res = client.get(f"/api/v1/profiles/{user_id}/posts")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0
    assert data["items"] == []
    assert data["page"] == 1
    assert data["pages"] == 0


def test_get_user_posts_with_posts_and_likes(client: TestClient, db_session: Session):
    """
    Test GET /api/v1/profiles/{user_id}/posts returns user's posts in newest-first order
    with correct likes and comments counts and is_liked_by_me tracking.
    """
    token_author, author_id = _register_and_get_user(
        client, db_session, "author.post@campus.edu", "@postauthor", "Post Author"
    )
    token_viewer, viewer_id = _register_and_get_user(
        client, db_session, "viewer.user@campus.edu", "@vieweruser", "Viewer User"
    )

    # Author creates two posts
    post1_res = client.post(
        "/api/v1/posts",
        headers={"Authorization": f"Bearer {token_author}"},
        json={
            "content": "First campus post about robotics workshop.",
            "category": "academic",
            "tags": ["robotics", "engineering"],
        },
    )
    assert post1_res.status_code == 201
    post1_id = post1_res.json()["id"]

    post2_res = client.post(
        "/api/v1/posts",
        headers={"Authorization": f"Bearer {token_author}"},
        json={
            "content": "Second post announcing hackathon team formation.",
            "category": "events",
            "tags": ["hackathon", "teams"],
        },
    )
    assert post2_res.status_code == 201
    post2_id = post2_res.json()["id"]

    # Explicitly set post2 timestamp slightly later to verify newest-first ordering deterministically
    from datetime import datetime, timezone, timedelta
    p2_record = db_session.query(Post).filter(Post.id == post2_id).first()
    p2_record.created_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    db_session.commit()

    # Viewer likes post 1
    like_res = client.post(
        f"/api/v1/posts/{post1_id}/like",
        headers={"Authorization": f"Bearer {token_viewer}"},
    )
    assert like_res.status_code == 200

    # Viewer comments on post 1
    comment_res = client.post(
        f"/api/v1/posts/{post1_id}/comments",
        headers={"Authorization": f"Bearer {token_viewer}"},
        json={"content": "Count me in for the robotics workshop!"},
    )
    assert comment_res.status_code == 201

    # Viewer queries author's posts
    res = client.get(
        f"/api/v1/profiles/{author_id}/posts",
        headers={"Authorization": f"Bearer {token_viewer}"},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["total"] == 2
    items = data["items"]
    assert len(items) == 2

    # Newest first: post2 should be first, post1 should be second
    assert items[0]["id"] == post2_id
    assert items[1]["id"] == post1_id

    # Verify counts on post1
    assert items[1]["likes_count"] == 1
    assert items[1]["comments_count"] == 1
    assert items[1]["is_liked_by_me"] is True

    # Verify post2 has 0 likes
    assert items[0]["likes_count"] == 0
    assert items[0]["is_liked_by_me"] is False


def test_get_user_posts_non_existent_user(client: TestClient):
    """
    Test GET /api/v1/profiles/{user_id}/posts returns 404 for non-existent user.
    """
    res = client.get("/api/v1/profiles/unknown-user-id/posts")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
