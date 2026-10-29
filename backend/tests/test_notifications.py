import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User


def _register_and_get_user_info(
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
        "university": "NIT",
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


def test_get_notifications_and_unread_count(client: TestClient, db_session: Session):
    """
    Verify authenticated user can fetch their notifications and accurate unread count.
    """
    token1, user1_id = _register_and_get_user_info(
        client, db_session, "notif.user1@campus.edu", "@notifuser1", "Notif User One"
    )
    token2, user2_id = _register_and_get_user_info(
        client, db_session, "notif.user2@campus.edu", "@notifuser2", "Notif User Two"
    )

    # Seed 3 notifications for User 1 (2 unread, 1 read)
    n1 = Notification(
        recipient_id=user1_id,
        actor_id=user2_id,
        type="like",
        title="Post Liked",
        message="Notif User Two liked your post.",
        target_url="/posts/1",
        is_read=False,
    )
    n2 = Notification(
        recipient_id=user1_id,
        actor_id=user2_id,
        type="comment",
        title="New Comment",
        message="Notif User Two commented on your post.",
        target_url="/posts/1",
        is_read=False,
    )
    n3 = Notification(
        recipient_id=user1_id,
        actor_id=user2_id,
        type="event_announced",
        title="Event Reminder",
        message="Hackathon starts tomorrow.",
        target_url="/events/1",
        is_read=True,
    )
    db_session.add_all([n1, n2, n3])
    db_session.commit()

    headers = {"Authorization": f"Bearer {token1}"}

    # 1. Unread count check
    count_res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert count_res.status_code == 200
    assert count_res.json()["unread_count"] == 2

    # 2. Get all notifications (paginated, limit 2)
    list_res = client.get("/api/v1/notifications?page=1&limit=2", headers=headers)
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] == 3
    assert data["pages"] == 2
    assert len(data["items"]) == 2
    assert data["items"][0]["actor"]["name"] == "Notif User Two"


def test_mark_single_notification_read(client: TestClient, db_session: Session):
    """
    Verify marking a specific notification as read updates its status and decrements unread count.
    """
    token, user_id = _register_and_get_user_info(
        client, db_session, "mark.single@campus.edu", "@marksingle", "Mark Single"
    )
    headers = {"Authorization": f"Bearer {token}"}

    n = Notification(
        recipient_id=user_id,
        type="community_joined",
        title="Community Welcome",
        message="Welcome to GDSC!",
        is_read=False,
    )
    db_session.add(n)
    db_session.commit()
    db_session.refresh(n)

    # Initial count is 1
    c1 = client.get("/api/v1/notifications/unread-count", headers=headers).json()
    assert c1["unread_count"] == 1

    # Mark as read
    patch_res = client.patch(f"/api/v1/notifications/{n.id}/read", headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["is_read"] is True

    # Count is now 0
    c2 = client.get("/api/v1/notifications/unread-count", headers=headers).json()
    assert c2["unread_count"] == 0


def test_mark_all_notifications_read(client: TestClient, db_session: Session):
    """
    Verify PATCH /notifications/read-all marks all unread notifications as read.
    """
    token, user_id = _register_and_get_user_info(
        client, db_session, "mark.all@campus.edu", "@markall", "Mark All"
    )
    headers = {"Authorization": f"Bearer {token}"}

    for i in range(3):
        db_session.add(
            Notification(
                recipient_id=user_id,
                type="notice_published",
                title=f"Circular {i}",
                message=f"Notice circular {i} published.",
                is_read=False,
            )
        )
    db_session.commit()

    # Initial count is 3
    assert client.get("/api/v1/notifications/unread-count", headers=headers).json()["unread_count"] == 3

    # Mark all read
    read_all_res = client.patch("/api/v1/notifications/read-all", headers=headers)
    assert read_all_res.status_code == 200
    assert "3" in read_all_res.json()["message"]

    # Count is now 0
    assert client.get("/api/v1/notifications/unread-count", headers=headers).json()["unread_count"] == 0


def test_delete_notification_by_owner_vs_other_user(client: TestClient, db_session: Session):
    """
    Verify users can only delete their own notifications (403 for others).
    """
    token_owner, owner_id = _register_and_get_user_info(
        client, db_session, "notif.owner@campus.edu", "@notifowner", "Notif Owner"
    )
    token_other, other_id = _register_and_get_user_info(
        client, db_session, "notif.other@campus.edu", "@notifother", "Notif Other"
    )

    n = Notification(
        recipient_id=owner_id,
        type="like",
        title="Owner's notification",
        message="Someone liked your post.",
        is_read=False,
    )
    db_session.add(n)
    db_session.commit()
    db_session.refresh(n)

    # 1. Other user attempts delete -> 403 Forbidden
    del_forbidden = client.delete(
        f"/api/v1/notifications/{n.id}",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert del_forbidden.status_code == 403

    # 2. Owner deletes notification -> 200 OK
    del_ok = client.delete(
        f"/api/v1/notifications/{n.id}",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert del_ok.status_code == 200

    # 3. Subsequent delete -> 404
    del_again = client.delete(
        f"/api/v1/notifications/{n.id}",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert del_again.status_code == 404


def test_notification_isolation_between_users(client: TestClient, db_session: Session):
    """
    Verify strict data isolation: User 2 cannot view or mark User 1's notifications.
    """
    token1, user1_id = _register_and_get_user_info(
        client, db_session, "iso.user1@campus.edu", "@isouser1", "Iso User One"
    )
    token2, user2_id = _register_and_get_user_info(
        client, db_session, "iso.user2@campus.edu", "@isouser2", "Iso User Two"
    )

    n1 = Notification(
        recipient_id=user1_id,
        type="comment",
        title="Private notice for User 1",
        message="Someone commented on User 1's post.",
        is_read=False,
    )
    db_session.add(n1)
    db_session.commit()
    db_session.refresh(n1)

    # User 2 list notifications -> 0 items
    u2_list = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token2}"})
    assert u2_list.status_code == 200
    assert u2_list.json()["total"] == 0
    assert len(u2_list.json()["items"]) == 0

    # User 2 unread count -> 0
    u2_count = client.get("/api/v1/notifications/unread-count", headers={"Authorization": f"Bearer {token2}"})
    assert u2_count.json()["unread_count"] == 0

    # User 2 cannot mark User 1's notification as read -> 403 Forbidden
    u2_patch = client.patch(
        f"/api/v1/notifications/{n1.id}/read",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert u2_patch.status_code == 403


def test_notifications_unauthenticated_rejected(client: TestClient):
    """
    Verify unauthenticated requests to notifications endpoints return 401 Unauthorized.
    """
    assert client.get("/api/v1/notifications").status_code == 401
    assert client.get("/api/v1/notifications/unread-count").status_code == 401
    assert client.patch("/api/v1/notifications/read-all").status_code == 401
    assert client.patch("/api/v1/notifications/fake-id/read").status_code == 401
    assert client.delete("/api/v1/notifications/fake-id").status_code == 401
