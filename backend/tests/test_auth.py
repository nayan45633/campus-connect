from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from app.core.security import hash_password, verify_password, create_access_token


def test_password_hashing_and_verification():
    """
    Verify Argon2 password hashing produces secure hashes and validates correctly.
    """
    raw_pwd = "SuperSecretPassword123!"
    hashed = hash_password(raw_pwd)

    # Hash must not contain plaintext
    assert raw_pwd not in hashed
    assert hashed.startswith("$argon2")

    # Correct password verifies
    assert verify_password(raw_pwd, hashed) is True

    # Incorrect password fails
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False


def test_successful_student_registration(client: TestClient):
    """
    Verify successful student registration returns public user and profile data.
    """
    payload = {
        "email": "nayan.kalita@campus.edu",
        "password": "SecurePassword2026!",
        "full_name": "Nayan Kalita",
        "department_major": "Computer Science & Engineering",
        "graduation_year": 2027,
        "handle": "@nayankalita",
        "university": "National Institute of Technology",
        "academic_year_title": "3rd Year B.Tech (Class of 2027)",
        "bio": "CS junior passionate about accessible interfaces.",
        "skills": ["React", "TypeScript", "Python"],
        "interests": ["Open Source", "Design Systems"],
    }

    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["email"] == "nayan.kalita@campus.edu"
    assert data["role"] == "student"
    assert data["is_active"] is True
    assert "id" in data

    # Password must NEVER be exposed
    assert "password" not in data
    assert "hashed_password" not in data

    # Profile must be created and populated
    profile = data["profile"]
    assert profile is not None
    assert profile["full_name"] == "Nayan Kalita"
    assert profile["handle"] == "@nayankalita"
    assert profile["initials"] == "NK"
    assert profile["department_major"] == "Computer Science & Engineering"
    assert profile["graduation_year"] == 2027
    assert profile["skills"] == ["React", "TypeScript", "Python"]


def test_duplicate_email_registration_rejected(client: TestClient):
    """
    Ensure duplicate email registration is rejected with 400.
    """
    payload = {
        "email": "arjun.bora@campus.edu",
        "password": "Password123!",
        "full_name": "Arjun Bora",
        "department_major": "Mechanical Engineering",
        "graduation_year": 2027,
    }

    # First registration succeeds
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration with same email (even with different case/trailing space)
    payload_duplicate = payload.copy()
    payload_duplicate["email"] = "  ARJUN.BORA@campus.edu "
    payload_duplicate["handle"] = "@arjun_different"

    res2 = client.post("/api/v1/auth/register", json=payload_duplicate)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_invalid_registration_data_validation(client: TestClient):
    """
    Ensure Pydantic validation rejects invalid inputs (short password, invalid email, missing major).
    """
    # 1. Short password (< 8 chars)
    res_short_pwd = client.post(
        "/api/v1/auth/register",
        json={
            "email": "valid@campus.edu",
            "password": "short",
            "full_name": "Test Student",
            "department_major": "Physics",
            "graduation_year": 2027,
        },
    )
    assert res_short_pwd.status_code == 422

    # 2. Invalid email format
    res_bad_email = client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "password": "ValidPassword123!",
            "full_name": "Test Student",
            "department_major": "Physics",
            "graduation_year": 2027,
        },
    )
    assert res_bad_email.status_code == 422

    # 3. Missing required department_major
    res_missing_major = client.post(
        "/api/v1/auth/register",
        json={
            "email": "valid2@campus.edu",
            "password": "ValidPassword123!",
            "full_name": "Test Student",
            "graduation_year": 2027,
        },
    )
    assert res_missing_major.status_code == 422


def test_duplicate_handle_registration_rejected(client: TestClient):
    """
    Ensure duplicate student handles are prevented.
    """
    payload1 = {
        "email": "student1@campus.edu",
        "password": "Password123!",
        "full_name": "Priya Saikia",
        "department_major": "Electrical Engineering",
        "graduation_year": 2028,
        "handle": "@priya_design",
    }
    res1 = client.post("/api/v1/auth/register", json=payload1)
    assert res1.status_code == 201

    payload2 = {
        "email": "student2@campus.edu",
        "password": "Password123!",
        "full_name": "Priya Sharma",
        "department_major": "Computer Science",
        "graduation_year": 2028,
        "handle": "@priya_design",
    }
    res2 = client.post("/api/v1/auth/register", json=payload2)
    assert res2.status_code == 400
    assert "already taken" in res2.json()["detail"].lower()


def test_successful_login_oauth2_form(client: TestClient):
    """
    Verify OAuth2 form login endpoint returns valid access token.
    """
    reg_payload = {
        "email": "rohit.verma@campus.edu",
        "password": "Password12345!",
        "full_name": "Rohit Verma",
        "department_major": "Physics",
        "graduation_year": 2027,
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    # OAuth2 form login (username=email, password=password)
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "rohit.verma@campus.edu", "password": "Password12345!"},
    )
    assert login_response.status_code == 200
    data = login_response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0
    assert data["user"]["email"] == "rohit.verma@campus.edu"


def test_successful_login_json(client: TestClient):
    """
    Verify JSON body login endpoint returns valid access token.
    """
    reg_payload = {
        "email": "ishita.c@campus.edu",
        "password": "Password12345!",
        "full_name": "Ishita Choudhury",
        "department_major": "Business Analytics",
        "graduation_year": 2026,
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    login_response = client.post(
        "/api/v1/auth/login/json",
        json={"email": "ishita.c@campus.edu", "password": "Password12345!"},
    )
    assert login_response.status_code == 200
    data = login_response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "ishita.c@campus.edu"


def test_login_incorrect_password(client: TestClient):
    """
    Verify login with wrong password returns 401 Unauthorized.
    """
    reg_payload = {
        "email": "sneha.deka@campus.edu",
        "password": "CorrectPassword123!",
        "full_name": "Sneha Deka",
        "department_major": "Design",
        "graduation_year": 2026,
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    response = client.post(
        "/api/v1/auth/login",
        data={"username": "sneha.deka@campus.edu", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert "incorrect email or password" in response.json()["detail"].lower()
    assert "WWW-Authenticate" in response.headers


def test_login_unknown_email(client: TestClient):
    """
    Verify login with non-existent email returns 401 Unauthorized.
    """
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "nonexistent@campus.edu", "password": "SomePassword123!"},
    )
    assert response.status_code == 401
    assert "incorrect email or password" in response.json()["detail"].lower()


def test_protected_me_endpoint_with_valid_token(client: TestClient):
    """
    Verify access to /api/v1/auth/me with valid Bearer token.
    """
    reg_payload = {
        "email": "auth.user@campus.edu",
        "password": "Password123!",
        "full_name": "Auth User",
        "department_major": "Computer Science",
        "graduation_year": 2027,
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "auth.user@campus.edu", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "auth.user@campus.edu"
    assert data["profile"]["full_name"] == "Auth User"


def test_protected_me_endpoint_unauthenticated(client: TestClient):
    """
    Verify calling /api/v1/auth/me without authorization header returns 401.
    """
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_protected_me_endpoint_invalid_token(client: TestClient):
    """
    Verify calling /api/v1/auth/me with an invalid or malformed token returns 401.
    """
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.value"},
    )
    assert response.status_code == 401


def test_protected_me_endpoint_expired_token(client: TestClient):
    """
    Verify calling /api/v1/auth/me with an expired token returns 401 with appropriate message.
    """
    # Create an already expired token (e.g. 5 minutes in the past)
    expired_token = create_access_token(
        subject="dummy-user-id",
        expires_delta=timedelta(minutes=-5),
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()
