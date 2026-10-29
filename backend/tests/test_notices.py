from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient


def _register_and_get_token(
    client: TestClient,
    email: str,
    handle: str,
    full_name: str,
    password: str = "SecurePass123!",
) -> str:
    """Helper to register a user and obtain a JWT access token."""
    reg_payload = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "department_major": "Computer Science",
        "graduation_year": 2027,
        "handle": handle,
        "university": "NIT",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"

    login_res = client.post(
        "/api/v1/auth/login/json",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    return login_res.json()["access_token"]


def test_create_notice_success(client: TestClient):
    """
    Verify authenticated user can publish a campus notice with all metadata fields.
    """
    token = _register_and_get_token(
        client, "dean.academic@campus.edu", "@deanacademics", "Dean Academic Office"
    )
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "title": "End-Semester Examination Schedule Autumn 2026",
        "category": "Examinations",
        "short_description": "Final timetable for B.Tech Autumn semester theory and practical exams.",
        "full_description": "All students must carry their campus ID card and examination admit card. Mobile devices strictly prohibited.",
        "department": "Office of Academic Affairs",
        "reference_number": "NIT/ACAD/2026/EX-042",
        "is_pinned": True,
        "is_important": True,
        "attachment_name": "timetable_autumn_2026.pdf",
        "attachment_size": "2.4 MB",
        "contact_email": "exams@campus.edu",
    }

    response = client.post("/api/v1/notices", json=payload, headers=headers)
    assert response.status_code == 201

    data = response.json()
    assert data["title"] == payload["title"]
    assert data["category"] == "Examinations"
    assert data["is_pinned"] is True
    assert data["is_important"] is True
    assert data["department"] == "Office of Academic Affairs"
    assert data["reference_number"] == "NIT/ACAD/2026/EX-042"
    assert data["reads_count"] == 0
    assert data["is_read"] is False


def test_create_notice_unauthenticated_rejected(client: TestClient):
    """
    Verify unauthenticated notice creation returns 401 Unauthorized.
    """
    payload = {
        "title": "Anonymous Notice",
        "category": "General",
        "short_description": "Short description here",
        "full_description": "Full description with enough text length",
        "department": "Student Council",
    }
    response = client.post("/api/v1/notices", json=payload)
    assert response.status_code == 401


def test_create_notice_validation_errors(client: TestClient):
    """
    Verify empty or invalid notice fields trigger 422 Unprocessable Content.
    """
    token = _register_and_get_token(
        client, "notice.val@campus.edu", "@noticeval", "Notice Validator"
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Empty title
    res1 = client.post(
        "/api/v1/notices",
        json={
            "title": "   ",
            "category": "Academics",
            "short_description": "Short text",
            "full_description": "Full description text long enough",
            "department": "CSE",
        },
        headers=headers,
    )
    assert res1.status_code == 422

    # Missing department
    res2 = client.post(
        "/api/v1/notices",
        json={
            "title": "Valid Title Here",
            "category": "Academics",
            "short_description": "Short text",
            "full_description": "Full description text long enough",
        },
        headers=headers,
    )
    assert res2.status_code == 422


def test_get_notices_pagination_ordering_and_filters(client: TestClient):
    """
    Verify listing notices returns pinned notices first, supports pagination and category filtering.
    """
    token = _register_and_get_token(
        client, "notice.admin@campus.edu", "@noticeadmin", "Notice Publisher"
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create unpinned notice
    client.post(
        "/api/v1/notices",
        json={
            "title": "Library Book Return Reminder",
            "category": "Academics",
            "short_description": "Return overdue library books before semester end.",
            "full_description": "Late fine waivers applicable until Friday 5:00 PM.",
            "department": "Central Library",
            "is_pinned": False,
        },
        headers=headers,
    )

    # Create pinned notice
    client.post(
        "/api/v1/notices",
        json={
            "title": "Urgent: Fee Payment Deadline",
            "category": "Scholarships",
            "short_description": "Last date to clear semester dues.",
            "full_description": "Late fee of INR 500 applicable after the cutoff date.",
            "department": "Finance Section",
            "is_pinned": True,
        },
        headers=headers,
    )

    # 1. Pinned notice must be first
    res = client.get("/api/v1/notices")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert data["items"][0]["title"] == "Urgent: Fee Payment Deadline"
    assert data["items"][0]["is_pinned"] is True

    # 2. Filter by category
    res_cat = client.get("/api/v1/notices?category=Academics")
    assert res_cat.status_code == 200
    assert res_cat.json()["total"] == 1
    assert res_cat.json()["items"][0]["title"] == "Library Book Return Reminder"

    # 3. Filter by department
    res_dept = client.get("/api/v1/notices?department=Library")
    assert res_dept.status_code == 200
    assert res_dept.json()["total"] == 1


def test_get_single_notice_and_404(client: TestClient):
    """
    Verify GET /notices/{notice_id} retrieves notice details and 404 for invalid ID.
    """
    token = _register_and_get_token(
        client, "single.notice@campus.edu", "@singlenotice", "Notice Reader"
    )
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/notices",
        json={
            "title": "Placement Drive: TechCorp Interview Schedule",
            "category": "Placements",
            "short_description": "Shortlisted candidates for TechCorp on-campus drive.",
            "full_description": "Interviews will be conducted in the Training & Placement cell.",
            "department": "Training and Placement",
        },
        headers=headers,
    )
    notice_id = create_res.json()["id"]

    # Valid notice
    get_res = client.get(f"/api/v1/notices/{notice_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == notice_id

    # Nonexistent notice
    bad_res = client.get("/api/v1/notices/nonexistent-notice-id")
    assert bad_res.status_code == 404
    assert bad_res.json()["detail"] == "Notice not found."


def test_update_and_delete_notice_permissions(client: TestClient):
    """
    Verify only the notice creator can update or delete a notice (403 for other users).
    """
    token_creator = _register_and_get_token(
        client, "notice.creator@campus.edu", "@noticecreator", "Notice Author"
    )
    token_other = _register_and_get_token(
        client, "notice.other@campus.edu", "@noticeother", "Unauthorized User"
    )

    create_res = client.post(
        "/api/v1/notices",
        json={
            "title": "Original Circular Title",
            "category": "Events",
            "short_description": "Annual sports meet schedule announcement.",
            "full_description": "Detailed schedule for track and field events.",
            "department": "Sports Board",
        },
        headers={"Authorization": f"Bearer {token_creator}"},
    )
    notice_id = create_res.json()["id"]

    # 1. Other user attempts update -> 403 Forbidden
    patch_forbidden = client.patch(
        f"/api/v1/notices/{notice_id}",
        json={"title": "Unauthorized Modification"},
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert patch_forbidden.status_code == 403

    # 2. Creator updates notice -> 200 OK
    patch_ok = client.patch(
        f"/api/v1/notices/{notice_id}",
        json={"title": "Updated Circular Title", "is_important": True},
        headers={"Authorization": f"Bearer {token_creator}"},
    )
    assert patch_ok.status_code == 200
    assert patch_ok.json()["title"] == "Updated Circular Title"
    assert patch_ok.json()["is_important"] is True

    # 3. Other user attempts delete -> 403 Forbidden
    del_forbidden = client.delete(
        f"/api/v1/notices/{notice_id}",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert del_forbidden.status_code == 403

    # 4. Creator deletes notice -> 200 OK
    del_ok = client.delete(
        f"/api/v1/notices/{notice_id}",
        headers={"Authorization": f"Bearer {token_creator}"},
    )
    assert del_ok.status_code == 200

    # 5. Confirm notice deleted -> 404
    get_deleted = client.get(f"/api/v1/notices/{notice_id}")
    assert get_deleted.status_code == 404


def test_mark_notice_as_read_flow(client: TestClient):
    """
    Verify marking a notice as read updates reads_count and reflects per-user is_read status.
    """
    token_publisher = _register_and_get_token(
        client, "pub.user@campus.edu", "@pubuser", "Pub User"
    )
    token_reader = _register_and_get_token(
        client, "reader.student@campus.edu", "@readerstudent", "Student Reader"
    )

    create_res = client.post(
        "/api/v1/notices",
        json={
            "title": "Hostel Maintenance Downtime Notice",
            "category": "Academics",
            "short_description": "Water pipeline maintenance in Block A & B.",
            "full_description": "Water supply will be suspended from 1:00 PM to 4:00 PM on Saturday.",
            "department": "Estate & Works",
        },
        headers={"Authorization": f"Bearer {token_publisher}"},
    )
    notice_id = create_res.json()["id"]

    # 1. Unauthenticated mark read -> 401
    unauth_read = client.post(f"/api/v1/notices/{notice_id}/read")
    assert unauth_read.status_code == 401

    # 2. Student marks notice as read -> 200 OK
    read_res = client.post(
        f"/api/v1/notices/{notice_id}/read",
        headers={"Authorization": f"Bearer {token_reader}"},
    )
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True
    assert read_res.json()["reads_count"] == 1

    # 3. Marking read again is idempotent
    read_res2 = client.post(
        f"/api/v1/notices/{notice_id}/read",
        headers={"Authorization": f"Bearer {token_reader}"},
    )
    assert read_res2.status_code == 200
    assert read_res2.json()["reads_count"] == 1

    # 4. View notice as student reader -> is_read: True
    view_reader = client.get(
        f"/api/v1/notices/{notice_id}",
        headers={"Authorization": f"Bearer {token_reader}"},
    )
    assert view_reader.json()["is_read"] is True
    assert view_reader.json()["reads_count"] == 1

    # 5. View notice as publisher -> is_read: False
    view_pub = client.get(
        f"/api/v1/notices/{notice_id}",
        headers={"Authorization": f"Bearer {token_publisher}"},
    )
    assert view_pub.json()["is_read"] is False
    assert view_pub.json()["reads_count"] == 1

    # 6. View notice unauthenticated -> is_read: False
    view_unauth = client.get(f"/api/v1/notices/{notice_id}")
    assert view_unauth.json()["is_read"] is False
    assert view_unauth.json()["reads_count"] == 1
