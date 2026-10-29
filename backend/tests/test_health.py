from fastapi.testclient import TestClient
from unittest.mock import patch


def test_health_endpoint_direct_url(client: TestClient):
    """
    Verify /health returns 200 and schema with database status.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()

    assert "status" in data
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data
    assert "database" in data
    assert "reachable" in data["database"]
    assert "status" in data["database"]


def test_health_endpoint_versioned_v1_url(client: TestClient):
    """
    Verify /api/v1/health returns matching payload structure.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data


def test_health_reports_ok_when_database_connected(client: TestClient):
    """
    Verify health returns 'ok' and database 'connected' when DB is reachable.
    """
    mock_db_result = {
        "status": "connected",
        "reachable": True,
        "message": "Database ping query succeeded.",
    }

    with patch("app.api.v1.endpoints.health.check_database_connection", return_value=mock_db_result):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "ok"
        assert data["database"]["reachable"] is True
        assert data["database"]["status"] == "connected"


def test_health_reports_degraded_when_database_unavailable(client: TestClient):
    """
    Verify health returns 'degraded' when DB is unreachable, without throwing an unhandled 500 error.
    """
    mock_db_result = {
        "status": "unavailable",
        "reachable": False,
        "message": "Database is currently unreachable: connection refused",
    }

    with patch("app.api.v1.endpoints.health.check_database_connection", return_value=mock_db_result):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "degraded"
        assert data["database"]["reachable"] is False
        assert data["database"]["status"] == "unavailable"
        assert "connection refused" in data["database"]["message"]
