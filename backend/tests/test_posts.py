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


def test_create_post_success(client: TestClient):
    """
    Verify authenticated student can create a new post with category and tags.
    """
    token = _register_and_get_token(
        client, "aarav.patel@campus.edu", "@aaravpatel", "Aarav Patel"
    )
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "content": "Excited for the upcoming hackathon this weekend!",
        "category": "Technology",
        "tags": ["hackathon", "#coding", "tech"],
    }
    response = client.post("/api/v1/posts", json=payload, headers=headers)
    assert response.status_code == 201

    data = response.json()
    assert data["content"] == payload["content"]
    assert data["category"] == "Technology"
    assert "hackathon" in data["tags"]
    assert "coding" in data["tags"]  # Cleaned of '#'
    assert data["likes_count"] == 0
    assert data["comments_count"] == 0
    assert data["is_liked_by_me"] is False
    assert data["author"]["name"] == "Aarav Patel"
    assert data["author"]["handle"] == "@aaravpatel"
    assert "email" not in data["author"]  # Sensitive email never exposed


def test_create_post_unauthenticated_rejected(client: TestClient):
    """
    Verify unauthenticated post creation returns 401 Unauthorized.
    """
    payload = {
        "content": "Anonymous attempt",
        "category": "Campus Life",
    }
    response = client.post("/api/v1/posts", json=payload)
    assert response.status_code == 401


def test_create_post_validation_error(client: TestClient):
    """
    Verify empty or whitespace-only content fails schema validation with 422.
    """
    token = _register_and_get_token(
        client, "riya.sharma@campus.edu", "@riyasharma", "Riya Sharma"
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Empty content
    res1 = client.post(
        "/api/v1/posts",
        json={"content": "   ", "category": "Academics"},
        headers=headers,
    )
    assert res1.status_code == 422

    # Missing category
    res2 = client.post(
        "/api/v1/posts",
        json={"content": "Valid content"},
        headers=headers,
    )
    assert res2.status_code == 422


def test_get_posts_pagination_and_ordering(client: TestClient):
    """
    Verify campus feed pagination and newest-first ordering.
    """
    token = _register_and_get_token(
        client, "kabir.verma@campus.edu", "@kabirverma", "Kabir Verma"
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create 3 posts
    for i in range(1, 4):
        res = client.post(
            "/api/v1/posts",
            json={"content": f"Post number {i}", "category": "Campus Life"},
            headers=headers,
        )
        assert res.status_code == 201

    # Fetch page 1 with limit 2
    response = client.get("/api/v1/posts?page=1&limit=2")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 3
    assert data["page"] == 1
    assert data["limit"] == 2
    assert data["pages"] == 2
    assert len(data["items"]) == 2
    # Newest post first
    assert data["items"][0]["content"] == "Post number 3"
    assert data["items"][1]["content"] == "Post number 2"

    # Fetch page 2
    page2_res = client.get("/api/v1/posts?page=2&limit=2")
    assert page2_res.status_code == 200
    p2_data = page2_res.json()
    assert len(p2_data["items"]) == 1
    assert p2_data["items"][0]["content"] == "Post number 1"


def test_get_posts_category_filter(client: TestClient):
    """
    Verify filtering posts by category returns only matching items.
    """
    token = _register_and_get_token(
        client, "priya.nair@campus.edu", "@priyanair", "Priya Nair"
    )
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/api/v1/posts",
        json={"content": "Math assignment due tomorrow", "category": "Academics"},
        headers=headers,
    )
    client.post(
        "/api/v1/posts",
        json={"content": "New Python release is out!", "category": "Technology"},
        headers=headers,
    )

    filter_res = client.get("/api/v1/posts?category=Academics")
    assert filter_res.status_code == 200
    data = filter_res.json()
    assert data["total"] == 1
    assert data["items"][0]["category"] == "Academics"
    assert "Math" in data["items"][0]["content"]


def test_get_single_post_and_nonexistent_404(client: TestClient):
    """
    Verify GET /posts/{post_id} retrieves a post, and nonexistent ID yields 404.
    """
    token = _register_and_get_token(
        client, "tanvi.rao@campus.edu", "@tanvirao", "Tanvi Rao"
    )
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/posts",
        json={"content": "Single post content check", "category": "Opportunities"},
        headers=headers,
    )
    post_id = create_res.json()["id"]

    # Retrieve existing post
    get_res = client.get(f"/api/v1/posts/{post_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == post_id
    assert get_res.json()["content"] == "Single post content check"

    # Retrieve nonexistent post
    bad_res = client.get("/api/v1/posts/nonexistent-id-999")
    assert bad_res.status_code == 404
    assert bad_res.json()["detail"] == "Post not found."


def test_delete_post_owner_vs_other_user(client: TestClient):
    """
    Verify post deletion succeeds for author but is rejected for non-authors with 403.
    """
    token1 = _register_and_get_token(
        client, "author.user@campus.edu", "@authoruser", "Author User"
    )
    token2 = _register_and_get_token(
        client, "intruder.user@campus.edu", "@intruderuser", "Intruder User"
    )

    # Author creates a post
    post_res = client.post(
        "/api/v1/posts",
        json={"content": "Post to be deleted", "category": "Campus Life"},
        headers={"Authorization": f"Bearer {token1}"},
    )
    post_id = post_res.json()["id"]

    # Other user attempts deletion -> 403 Forbidden
    del_forbidden = client.delete(
        f"/api/v1/posts/{post_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert del_forbidden.status_code == 403
    assert "Not authorized" in del_forbidden.json()["detail"]

    # Unauthenticated deletion attempt -> 401 Unauthorized
    del_unauth = client.delete(f"/api/v1/posts/{post_id}")
    assert del_unauth.status_code == 401

    # Original author deletes -> 200 OK
    del_ok = client.delete(
        f"/api/v1/posts/{post_id}",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert del_ok.status_code == 200
    assert del_ok.json()["message"] == "Post deleted successfully."

    # Deleting nonexistent post -> 404 Not Found
    del_again = client.delete(
        f"/api/v1/posts/{post_id}",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert del_again.status_code == 404

    # Post is confirmed gone -> 404 Not Found
    get_after = client.get(f"/api/v1/posts/{post_id}")
    assert get_after.status_code == 404


def test_like_and_unlike_flow_with_duplicate_protection(client: TestClient):
    """
    Verify liking, unliking, and protection against duplicate likes.
    """
    token1 = _register_and_get_token(
        client, "post.creator@campus.edu", "@postcreator", "Post Creator"
    )
    token2 = _register_and_get_token(
        client, "liker.user@campus.edu", "@likeruser", "Liker User"
    )

    create_res = client.post(
        "/api/v1/posts",
        json={"content": "Like me!", "category": "Campus Life"},
        headers={"Authorization": f"Bearer {token1}"},
    )
    post_id = create_res.json()["id"]

    # Unauthenticated like attempt -> 401
    unauth_like = client.post(f"/api/v1/posts/{post_id}/like")
    assert unauth_like.status_code == 401

    # Like nonexistent post -> 404
    bad_like = client.post(
        "/api/v1/posts/nonexistent-id/like",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert bad_like.status_code == 404

    # 1. Like the post
    like_res = client.post(
        f"/api/v1/posts/{post_id}/like",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert like_res.status_code == 200
    like_data = like_res.json()
    assert like_data["likes_count"] == 1
    assert like_data["is_liked_by_me"] is True

    # 2. Duplicate like rejected -> 400 Bad Request
    dup_res = client.post(
        f"/api/v1/posts/{post_id}/like",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert dup_res.status_code == 400
    assert "already liked" in dup_res.json()["detail"]

    # 3. View post as liker -> is_liked_by_me is True
    view_as_liker = client.get(
        f"/api/v1/posts/{post_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert view_as_liker.json()["is_liked_by_me"] is True
    assert view_as_liker.json()["likes_count"] == 1

    # 4. View post as creator -> is_liked_by_me is False
    view_as_creator = client.get(
        f"/api/v1/posts/{post_id}",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert view_as_creator.json()["is_liked_by_me"] is False
    assert view_as_creator.json()["likes_count"] == 1

    # 5. View post unauthenticated -> is_liked_by_me is False
    view_unauth = client.get(f"/api/v1/posts/{post_id}")
    assert view_unauth.json()["is_liked_by_me"] is False
    assert view_unauth.json()["likes_count"] == 1

    # 6. Unlike the post
    unlike_res = client.delete(
        f"/api/v1/posts/{post_id}/like",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert unlike_res.status_code == 200
    assert unlike_res.json()["likes_count"] == 0
    assert unlike_res.json()["is_liked_by_me"] is False

    # 7. Unliking again -> 400 Bad Request
    unlike_again = client.delete(
        f"/api/v1/posts/{post_id}/like",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert unlike_again.status_code == 400
    assert "not liked" in unlike_again.json()["detail"]


def test_comments_create_retrieve_and_delete_flow(client: TestClient):
    """
    Verify adding comments, retrieving with ordering, and comment deletion permissions.
    """
    token1 = _register_and_get_token(
        client, "post.author2@campus.edu", "@author2", "Author Two"
    )
    token2 = _register_and_get_token(
        client, "commenter@campus.edu", "@commenter", "Commenter One"
    )

    # Post created
    post_res = client.post(
        "/api/v1/posts",
        json={"content": "Any thoughts on the library timings?", "category": "Academics"},
        headers={"Authorization": f"Bearer {token1}"},
    )
    post_id = post_res.json()["id"]

    # Unauthenticated comment attempt -> 401
    unauth_comm = client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"content": "Unauthenticated comment"},
    )
    assert unauth_comm.status_code == 401

    # Comment on nonexistent post -> 404
    bad_comm = client.post(
        "/api/v1/posts/nonexistent-id/comments",
        json={"content": "Hello"},
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert bad_comm.status_code == 404

    # 1. Add comment
    c1_res = client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"content": "They should extend it until midnight!"},
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert c1_res.status_code == 201
    c1_data = c1_res.json()
    assert c1_data["content"] == "They should extend it until midnight!"
    assert c1_data["author"]["name"] == "Commenter One"
    comment_id = c1_data["id"]

    # Add second comment
    c2_res = client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"content": "Agreed, especially during finals."},
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert c2_res.status_code == 201

    # 2. Retrieve comments
    get_c_res = client.get(f"/api/v1/posts/{post_id}/comments")
    assert get_c_res.status_code == 200
    c_list = get_c_res.json()
    assert c_list["total"] == 2
    assert c_list["items"][0]["content"] == "They should extend it until midnight!"
    assert c_list["items"][1]["content"] == "Agreed, especially during finals."

    # 3. Check post comments_count in feed
    post_check = client.get(f"/api/v1/posts/{post_id}")
    assert post_check.json()["comments_count"] == 2

    # 4. Attempt to delete comment by non-owner -> 403 Forbidden
    del_forbidden = client.delete(
        f"/api/v1/comments/{comment_id}",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert del_forbidden.status_code == 403

    # 5. Owner deletes comment via direct route -> 200 OK
    del_ok = client.delete(
        f"/api/v1/comments/{comment_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert del_ok.status_code == 200

    # 6. Verify comments count decremented
    post_check2 = client.get(f"/api/v1/posts/{post_id}")
    assert post_check2.json()["comments_count"] == 1

    # 7. Delete nonexistent comment -> 404
    del_bad = client.delete(
        f"/api/v1/comments/{comment_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert del_bad.status_code == 404
