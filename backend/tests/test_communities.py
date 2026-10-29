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


def test_create_community_success(client: TestClient):
    """
    Verify authenticated student can create a new community.
    Creator is automatically assigned as lead and first member.
    """
    token = _register_and_get_token(
        client, "club.lead@campus.edu", "@clublead", "Dev Sharma"
    )
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "Google Developer Student Club",
        "category": "Technology",
        "description": "Campus community for developers and designers.",
        "short_description": "Tech community building real-world projects.",
        "full_description": "Join GDSC to collaborate on open-source, mobile apps, and machine learning projects.",
        "meeting_schedule": "Every Thursday at 5:30 PM",
        "location": "Seminar Hall C",
        "tags": ["web", "mobile", "ai", "cloud"],
    }

    response = client.post("/api/v1/communities", json=payload, headers=headers)
    assert response.status_code == 201

    data = response.json()
    assert data["name"] == payload["name"]
    assert data["category"] == "Technology"
    assert data["avatar_initials"] == "GC"  # Derived from first and last words (Google ... Club)
    assert data["lead_name"] == "Dev Sharma"
    assert data["members_count"] == 1
    assert data["is_joined"] is True
    assert "web" in data["tags"]


def test_create_duplicate_community_name_rejected(client: TestClient):
    """
    Verify attempting to create a community with an existing name returns 400 Bad Request.
    """
    token = _register_and_get_token(
        client, "dup.lead@campus.edu", "@duplead", "Vikram Sen"
    )
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "Robotics & Automation Society",
        "category": "Technology",
        "description": "Hardware and robotics club.",
    }
    res1 = client.post("/api/v1/communities", json=payload, headers=headers)
    assert res1.status_code == 201

    # Duplicate creation with case insensitivity
    res2 = client.post(
        "/api/v1/communities",
        json={
            "name": "robotics & automation society",
            "category": "Technology",
            "description": "Duplicate attempt.",
        },
        headers=headers,
    )
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_create_community_unauthenticated_rejected(client: TestClient):
    """
    Verify unauthenticated community creation returns 401 Unauthorized.
    """
    payload = {
        "name": "Anonymous Club",
        "category": "General",
        "description": "No auth provided.",
    }
    response = client.post("/api/v1/communities", json=payload)
    assert response.status_code == 401


def test_get_communities_pagination_and_search(client: TestClient):
    """
    Verify listing communities supports pagination, search, and category filtering.
    """
    token = _register_and_get_token(
        client, "comm.browser@campus.edu", "@commbrowser", "Browser User"
    )
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/api/v1/communities",
        json={"name": "Cybersecurity Alliance", "category": "Technology", "description": "Ethical hacking and CTFs."},
        headers=headers,
    )
    client.post(
        "/api/v1/communities",
        json={"name": "Literary & Debate Guild", "category": "Arts", "description": "Debates and creative writing."},
        headers=headers,
    )
    client.post(
        "/api/v1/communities",
        json={"name": "Fintech & Trading Club", "category": "Entrepreneurship", "description": "Financial markets and algotrading."},
        headers=headers,
    )

    # 1. Pagination: page 1 with limit 2
    res_page = client.get("/api/v1/communities?page=1&limit=2")
    assert res_page.status_code == 200
    p_data = res_page.json()
    assert p_data["total"] == 3
    assert p_data["pages"] == 2
    assert len(p_data["items"]) == 2

    # 2. Category filter
    res_cat = client.get("/api/v1/communities?category=Arts")
    assert res_cat.status_code == 200
    assert res_cat.json()["total"] == 1
    assert res_cat.json()["items"][0]["name"] == "Literary & Debate Guild"

    # 3. Search query
    res_search = client.get("/api/v1/communities?search=Hacking")
    assert res_search.status_code == 200
    assert res_search.json()["total"] == 1
    assert res_search.json()["items"][0]["name"] == "Cybersecurity Alliance"


def test_get_single_community_and_404(client: TestClient):
    """
    Verify retrieving a single community by ID and 404 for invalid ID.
    """
    token = _register_and_get_token(
        client, "comm.single@campus.edu", "@commsingle", "Single Tester"
    )
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/communities",
        json={"name": "Astronomy Society", "category": "Academics", "description": "Stargazing and astrophotography."},
        headers=headers,
    )
    community_id = create_res.json()["id"]

    # Valid community
    get_res = client.get(f"/api/v1/communities/{community_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Astronomy Society"

    # Nonexistent community
    bad_res = client.get("/api/v1/communities/nonexistent-id-000")
    assert bad_res.status_code == 404
    assert bad_res.json()["detail"] == "Community not found."


def test_update_and_delete_community_permissions(client: TestClient):
    """
    Verify only the community creator can edit or delete a community (403 for other users).
    """
    token_creator = _register_and_get_token(
        client, "comm.owner@campus.edu", "@commowner", "Owner User"
    )
    token_other = _register_and_get_token(
        client, "comm.intruder@campus.edu", "@commintruder", "Intruder User"
    )

    create_res = client.post(
        "/api/v1/communities",
        json={"name": "Game Dev Collective", "category": "Gaming", "description": "Indie game development in Unity."},
        headers={"Authorization": f"Bearer {token_creator}"},
    )
    community_id = create_res.json()["id"]

    # 1. Other user attempts update -> 403 Forbidden
    patch_forbidden = client.patch(
        f"/api/v1/communities/{community_id}",
        json={"name": "Hacked Community"},
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert patch_forbidden.status_code == 403

    # 2. Creator updates community -> 200 OK
    patch_ok = client.patch(
        f"/api/v1/communities/{community_id}",
        json={"location": "Media Lab 2", "meeting_schedule": "Fridays 6:00 PM"},
        headers={"Authorization": f"Bearer {token_creator}"},
    )
    assert patch_ok.status_code == 200
    assert patch_ok.json()["location"] == "Media Lab 2"
    assert patch_ok.json()["meeting_schedule"] == "Fridays 6:00 PM"

    # 3. Other user attempts delete -> 403 Forbidden
    del_forbidden = client.delete(
        f"/api/v1/communities/{community_id}",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert del_forbidden.status_code == 403

    # 4. Creator deletes community -> 200 OK
    del_ok = client.delete(
        f"/api/v1/communities/{community_id}",
        headers={"Authorization": f"Bearer {token_creator}"},
    )
    assert del_ok.status_code == 200

    # 5. Confirm community is gone -> 404
    get_after = client.get(f"/api/v1/communities/{community_id}")
    assert get_after.status_code == 404


def test_join_and_leave_community_flow(client: TestClient):
    """
    Verify joining and leaving communities, preventing duplicate memberships,
    and enforcing membership checks when leaving.
    """
    token_lead = _register_and_get_token(
        client, "lead.member@campus.edu", "@leadmember", "Lead Student"
    )
    token_joiner = _register_and_get_token(
        client, "new.member@campus.edu", "@newmember", "New Member"
    )

    create_res = client.post(
        "/api/v1/communities",
        json={"name": "Open Source Club", "category": "Technology", "description": "Contributing to OSS."},
        headers={"Authorization": f"Bearer {token_lead}"},
    )
    community_id = create_res.json()["id"]

    # 1. Unauthenticated join -> 401
    unauth_join = client.post(f"/api/v1/communities/{community_id}/join")
    assert unauth_join.status_code == 401

    # 2. Student joins community -> 200 OK
    join_res = client.post(
        f"/api/v1/communities/{community_id}/join",
        headers={"Authorization": f"Bearer {token_joiner}"},
    )
    assert join_res.status_code == 200
    assert join_res.json()["is_joined"] is True
    assert join_res.json()["members_count"] == 2  # Lead + New member

    # 3. Duplicate join rejected -> 400 Bad Request
    dup_join = client.post(
        f"/api/v1/communities/{community_id}/join",
        headers={"Authorization": f"Bearer {token_joiner}"},
    )
    assert dup_join.status_code == 400
    assert "already a member" in dup_join.json()["detail"].lower()

    # 4. View community as member -> is_joined: True
    view_member = client.get(
        f"/api/v1/communities/{community_id}",
        headers={"Authorization": f"Bearer {token_joiner}"},
    )
    assert view_member.json()["is_joined"] is True
    assert view_member.json()["members_count"] == 2

    # 5. Student leaves community -> 200 OK
    leave_res = client.delete(
        f"/api/v1/communities/{community_id}/join",
        headers={"Authorization": f"Bearer {token_joiner}"},
    )
    assert leave_res.status_code == 200
    assert leave_res.json()["is_joined"] is False
    assert leave_res.json()["members_count"] == 1

    # 6. Leaving again when not a member -> 400 Bad Request
    leave_again = client.delete(
        f"/api/v1/communities/{community_id}/join",
        headers={"Authorization": f"Bearer {token_joiner}"},
    )
    assert leave_again.status_code == 400
    assert "not a member" in leave_again.json()["detail"].lower()


def test_get_community_members_paginated(client: TestClient):
    """
    Verify GET /communities/{community_id}/members returns members with safe public profiles.
    """
    token_lead = _register_and_get_token(
        client, "lead.list@campus.edu", "@leadlist", "Lead List User"
    )
    token_m1 = _register_and_get_token(
        client, "m1@campus.edu", "@memberone", "Member One"
    )
    token_m2 = _register_and_get_token(
        client, "m2@campus.edu", "@membertwo", "Member Two"
    )

    create_res = client.post(
        "/api/v1/communities",
        json={"name": "Competitive Programming Club", "category": "Technology", "description": "ICPC and LeetCode prep."},
        headers={"Authorization": f"Bearer {token_lead}"},
    )
    community_id = create_res.json()["id"]

    # Members join
    client.post(f"/api/v1/communities/{community_id}/join", headers={"Authorization": f"Bearer {token_m1}"})
    client.post(f"/api/v1/communities/{community_id}/join", headers={"Authorization": f"Bearer {token_m2}"})

    # Retrieve members list
    members_res = client.get(f"/api/v1/communities/{community_id}/members?page=1&limit=2")
    assert members_res.status_code == 200
    data = members_res.json()

    assert data["total"] == 3
    assert data["pages"] == 2
    assert len(data["items"]) == 2
    # Lead is first
    assert data["items"][0]["role"] == "lead"
    assert data["items"][0]["user"]["name"] == "Lead List User"
    assert "email" not in data["items"][0]["user"]  # Safe public representation
