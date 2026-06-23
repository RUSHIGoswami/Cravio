from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok_with_db_and_redis_connectivity():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body == {"status": "ok", "db": True, "redis": True}
