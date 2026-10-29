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


def test_create_event_success(client: TestClient):
    """
    Verify authenticated student can create a new campus event with automatic date/time fallbacks.
    """
    token = _register_and_get_token(
        client, "event.lead@campus.edu", "@eventlead", "Ananya Deshmukh"
    )
    headers = {"Authorization": f"Bearer {token}"}

    event_time = datetime(2026, 11, 20, 10, 0, 0, tzinfo=timezone.utc)
    payload = {
        "title": "Annual Hackathon 2026",
        "category": "Technical",
        "short_description": "24-hour campus hackathon with exciting prizes.",
        "full_description": "Build innovative solutions for campus life and sustainability. Mentors and food provided.",
        "event_date": event_time.isoformat(),
        "location": "Auditorium Hall B",
        "capacity": 100,
        "tags": ["hackathon", "coding", "innovation"],
        "highlights": ["Free Swag", "Cash Prizes", "Mentorship"],
        "is_featured": True,
    }

    response = client.post("/api/v1/events", json=payload, headers=headers)
    assert response.status_code == 201

    data = response.json()
    assert data["title"] == payload["title"]
    assert data["category"] == "Technical"
    assert data["month"] == "NOV"
    assert data["day"] == "20"
    assert data["location"] == "Auditorium Hall B"
    assert data["capacity"] == 100
    assert data["is_featured"] is True
    assert data["organizer"]["name"] == "Ananya Deshmukh"
    assert data["rsvps_count"] == 0
    assert data["is_rsvpd"] is False


def test_create_event_unauthenticated_rejected(client: TestClient):
    """
    Verify unauthenticated event creation returns 401 Unauthorized.
    """
    payload = {
        "title": "Unauthorized Event",
        "category": "General",
        "short_description": "Short description text.",
        "full_description": "Full description with enough text length.",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "location": "Main Lawn",
    }
    response = client.post("/api/v1/events", json=payload)
    assert response.status_code == 401


def test_create_event_validation_errors(client: TestClient):
    """
    Verify invalid input triggers 422 Unprocessable Content.
    """
    token = _register_and_get_token(
        client, "valid.tester@campus.edu", "@validtester", "Tester User"
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Missing required title and event_date
    res1 = client.post(
        "/api/v1/events",
        json={"category": "General", "location": "Room 101"},
        headers=headers,
    )
    assert res1.status_code == 422

    # Empty title string
    res2 = client.post(
        "/api/v1/events",
        json={
            "title": "   ",
            "category": "General",
            "short_description": "Short text here",
            "full_description": "Full text is long enough",
            "event_date": datetime.now(timezone.utc).isoformat(),
            "location": "Room 101",
        },
        headers=headers,
    )
    assert res2.status_code == 422


def test_get_events_pagination_and_filters(client: TestClient):
    """
    Verify listing events supports pagination and filtering by category and search.
    """
    token = _register_and_get_token(
        client, "organizer1@campus.edu", "@org1", "Organizer One"
    )
    headers = {"Authorization": f"Bearer {token}"}

    base_time = datetime(2026, 12, 1, 14, 0, 0, tzinfo=timezone.utc)
    # Create 3 events
    client.post(
        "/api/v1/events",
        json={
            "title": "Robotics Workshop",
            "category": "Technical",
            "short_description": "Hands-on robotics workshop.",
            "full_description": "Build an autonomous rover with Arduino microcontrollers.",
            "event_date": (base_time + timedelta(days=1)).isoformat(),
            "location": "ECE Lab 3",
        },
        headers=headers,
    )
    client.post(
        "/api/v1/events",
        json={
            "title": "Classical Dance Night",
            "category": "Cultural",
            "short_description": "Cultural performance evening.",
            "full_description": "Showcase of classical and contemporary dances by student troupes.",
            "event_date": (base_time + timedelta(days=2)).isoformat(),
            "location": "Open Air Theatre",
        },
        headers=headers,
    )
    client.post(
        "/api/v1/events",
        json={
            "title": "AI Seminar",
            "category": "Technical",
            "short_description": "Guest lecture on LLMs.",
            "full_description": "Deep dive into attention mechanisms and agentic architecture.",
            "event_date": (base_time + timedelta(days=3)).isoformat(),
            "location": "Seminar Hall A",
        },
        headers=headers,
    )

    # 1. Pagination: page 1 with limit 2
    res_page = client.get("/api/v1/events?page=1&limit=2")
    assert res_page.status_code == 200
    p_data = res_page.json()
    assert p_data["total"] == 3
    assert p_data["pages"] == 2
    assert len(p_data["items"]) == 2

    # 2. Filter by category
    res_cat = client.get("/api/v1/events?category=Cultural")
    assert res_cat.status_code == 200
    cat_data = res_cat.json()
    assert cat_data["total"] == 1
    assert cat_data["items"][0]["title"] == "Classical Dance Night"

    # 3. Filter by search term
    res_search = client.get("/api/v1/events?search=Arduino")
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert search_data["total"] == 1
    assert search_data["items"][0]["title"] == "Robotics Workshop"


def test_get_single_event_and_404(client: TestClient):
    """
    Verify GET /events/{event_id} retrieves details, and invalid ID yields 404.
    """
    token = _register_and_get_token(
        client, "event.fetcher@campus.edu", "@fetcher", "Fetcher User"
    )
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/events",
        json={
            "title": "Single Event Check",
            "category": "Sports",
            "short_description": "Inter-hostel football tournament.",
            "full_description": "Annual tournament between hostels with league matches.",
            "event_date": datetime(2026, 12, 10, 16, 0, tzinfo=timezone.utc).isoformat(),
            "location": "Sports Complex Ground",
        },
        headers=headers,
    )
    event_id = create_res.json()["id"]

    # Valid event
    get_res = client.get(f"/api/v1/events/{event_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == event_id

    # Nonexistent event
    bad_res = client.get("/api/v1/events/nonexistent-event-id")
    assert bad_res.status_code == 404
    assert bad_res.json()["detail"] == "Event not found."


def test_update_and_delete_event_permissions(client: TestClient):
    """
    Verify only the event creator can edit or delete an event (403 for other users).
    """
    token_creator = _register_and_get_token(
        client, "creator@campus.edu", "@eventcreator", "Creator User"
    )
    token_other = _register_and_get_token(
        client, "other@campus.edu", "@othereventuser", "Other User"
    )

    create_res = client.post(
        "/api/v1/events",
        json={
            "title": "Original Event Title",
            "category": "Workshop",
            "short_description": "Short original description.",
            "full_description": "Full original description text.",
            "event_date": datetime(2026, 12, 15, 10, 0, tzinfo=timezone.utc).isoformat(),
            "location": "Lab 204",
        },
        headers={"Authorization": f"Bearer {token_creator}"},
    )
    event_id = create_res.json()["id"]

    # 1. Other user attempts update -> 403 Forbidden
    patch_forbidden = client.patch(
        f"/api/v1/events/{event_id}",
        json={"title": "Hacked Event Title"},
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert patch_forbidden.status_code == 403

    # 2. Creator updates event -> 200 OK
    patch_ok = client.patch(
        f"/api/v1/events/{event_id}",
        json={"title": "Updated Event Title", "location": "Lab 305"},
        headers={"Authorization": f"Bearer {token_creator}"},
    )
    assert patch_ok.status_code == 200
    assert patch_ok.json()["title"] == "Updated Event Title"
    assert patch_ok.json()["location"] == "Lab 305"

    # 3. Other user attempts delete -> 403 Forbidden
    del_forbidden = client.delete(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert del_forbidden.status_code == 403

    # 4. Creator deletes event -> 200 OK
    del_ok = client.delete(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {token_creator}"},
    )
    assert del_ok.status_code == 200

    # 5. Confirm event deleted -> 404
    get_deleted = client.get(f"/api/v1/events/{event_id}")
    assert get_deleted.status_code == 404


def test_rsvp_and_cancel_flow_with_duplicate_protection(client: TestClient):
    """
    Verify RSVP creation, duplicate protection, status visibility, and cancellation.
    """
    token_organizer = _register_and_get_token(
        client, "org.rsvp@campus.edu", "@orgrsvp", "Org User"
    )
    token_student = _register_and_get_token(
        client, "attendee@campus.edu", "@attendee", "Student Attendee"
    )

    create_res = client.post(
        "/api/v1/events",
        json={
            "title": "Guest Talk on Cloud Architecture",
            "category": "Technical",
            "short_description": "Talk by industry architect on cloud scale.",
            "full_description": "Understanding distributed consensus and microservices at scale.",
            "event_date": datetime(2026, 12, 20, 11, 0, tzinfo=timezone.utc).isoformat(),
            "location": "Auditorium A",
        },
        headers={"Authorization": f"Bearer {token_organizer}"},
    )
    event_id = create_res.json()["id"]

    # 1. Unauthenticated RSVP attempt -> 401
    unauth_rsvp = client.post(f"/api/v1/events/{event_id}/rsvp")
    assert unauth_rsvp.status_code == 401

    # 2. Student RSVPs to event
    rsvp_res = client.post(
        f"/api/v1/events/{event_id}/rsvp",
        headers={"Authorization": f"Bearer {token_student}"},
    )
    assert rsvp_res.status_code == 200
    assert rsvp_res.json()["is_rsvpd"] is True
    assert rsvp_res.json()["rsvps_count"] == 1

    # 3. Duplicate RSVP rejected -> 400 Bad Request
    dup_rsvp = client.post(
        f"/api/v1/events/{event_id}/rsvp",
        headers={"Authorization": f"Bearer {token_student}"},
    )
    assert dup_rsvp.status_code == 400
    assert "already RSVP" in dup_rsvp.json()["detail"]

    # 4. View event as attendee -> is_rsvpd: True
    view_attendee = client.get(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {token_student}"},
    )
    assert view_attendee.json()["is_rsvpd"] is True
    assert view_attendee.json()["rsvps_count"] == 1

    # 5. View event as organizer -> is_rsvpd: False
    view_org = client.get(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {token_organizer}"},
    )
    assert view_org.json()["is_rsvpd"] is False
    assert view_org.json()["rsvps_count"] == 1

    # 6. Cancel RSVP -> 200 OK
    cancel_res = client.delete(
        f"/api/v1/events/{event_id}/rsvp",
        headers={"Authorization": f"Bearer {token_student}"},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["is_rsvpd"] is False
    assert cancel_res.json()["rsvps_count"] == 0

    # 7. Cancel again when not RSVP'd -> 400 Bad Request
    cancel_again = client.delete(
        f"/api/v1/events/{event_id}/rsvp",
        headers={"Authorization": f"Bearer {token_student}"},
    )
    assert cancel_again.status_code == 400


def test_rsvp_capacity_limit_enforced(client: TestClient):
    """
    Verify capacity limit prevents RSVPs once event is full.
    """
    token_creator = _register_and_get_token(
        client, "cap.creator@campus.edu", "@capcreator", "Cap Creator"
    )
    token_user1 = _register_and_get_token(
        client, "seat1@campus.edu", "@seat1", "User One"
    )
    token_user2 = _register_and_get_token(
        client, "seat2@campus.edu", "@seat2", "User Two"
    )

    create_res = client.post(
        "/api/v1/events",
        json={
            "title": "Exclusive Lab Tour",
            "category": "Workshop",
            "short_description": "Limited seats tour of quantum lab.",
            "full_description": "Visit cryogenic facilities with physics faculty.",
            "event_date": datetime(2026, 12, 22, 15, 0, tzinfo=timezone.utc).isoformat(),
            "location": "Physics Quantum Wing",
            "capacity": 1,  # Only 1 seat available
        },
        headers={"Authorization": f"Bearer {token_creator}"},
    )
    event_id = create_res.json()["id"]

    # First user gets the seat -> 200
    res1 = client.post(
        f"/api/v1/events/{event_id}/rsvp",
        headers={"Authorization": f"Bearer {token_user1}"},
    )
    assert res1.status_code == 200

    # Second user is rejected because capacity is full -> 400
    res2 = client.post(
        f"/api/v1/events/{event_id}/rsvp",
        headers={"Authorization": f"Bearer {token_user2}"},
    )
    assert res2.status_code == 400
    assert "capacity" in res2.json()["detail"].lower()
