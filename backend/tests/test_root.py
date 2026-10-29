from fastapi.testclient import TestClient


def test_root_endpoint_returns_200_and_metadata(client: TestClient):
    """
    Ensure root endpoint returns platform metadata, version, and documentation links.
    """
    response = client.get("/")
    assert response.status_code == 200

    data = response.json()
    assert data["project"] == "Campus Connect API"
    assert "version" in data
    assert data["docs_url"] == "/docs"
    assert data["redoc_url"] == "/redoc"
    assert data["api_v1_prefix"] == "/api/v1"


def test_cors_headers_on_preflight_options(client: TestClient):
    """
    Verify CORS configuration permits requests from local frontend origin.
    """
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_nonexistent_route_returns_404_json(client: TestClient):
    """
    Verify standard 404 response payload structure for nonexistent endpoints.
    """
    response = client.get("/api/v1/nonexistent-resource")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "HTTP_404"
