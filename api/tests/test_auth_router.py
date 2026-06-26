"""Tests for A1: Social sign-up + role selection (API).

Acceptance criteria:
1. Valid Firebase token (stub) creates a user and returns an internal session/JWT + role state.
2. Invalid/expired token returns 401.
3. Role can be set once at onboarding; endpoint rejects an unset role on role-gated routes.
"""

import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.main import app

INVALID_TOKEN = "invalid.bad-signature"
EXPIRED_TOKEN = "expired.old-token"


def _wipe_users() -> None:
    async def _run() -> None:
        engine = create_async_engine(settings.database_url)
        async with engine.begin() as conn:
            await conn.execute(text("DELETE FROM users"))
        await engine.dispose()

    asyncio.run(_run())


@pytest.fixture(scope="module")
def client():
    """Module-scoped client: one event loop for all tests; wipe users at boundaries."""
    _wipe_users()
    with TestClient(app) as c:
        yield c
    _wipe_users()


# --- AC1: valid token creates user + returns JWT + role state ---


def test_login_valid_token_returns_jwt_and_role_state(client: TestClient) -> None:
    response = client.post("/auth/login", json={"firebase_token": "ac1-token-a"})

    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["role"] is None
    assert body["role_set"] is False


def test_login_same_token_twice_returns_same_user(client: TestClient) -> None:
    token = "ac1-token-same"
    r1 = client.post("/auth/login", json={"firebase_token": token})
    r2 = client.post("/auth/login", json={"firebase_token": token})

    assert r1.status_code == 200
    assert r2.status_code == 200

    import jwt as _jwt  # PyJWT

    uid1 = _jwt.decode(r1.json()["access_token"], options={"verify_signature": False})["sub"]
    uid2 = _jwt.decode(r2.json()["access_token"], options={"verify_signature": False})["sub"]
    assert uid1 == uid2


# --- AC2: invalid/expired token returns 401 ---


def test_login_invalid_token_returns_401(client: TestClient) -> None:
    response = client.post("/auth/login", json={"firebase_token": INVALID_TOKEN})
    assert response.status_code == 401


def test_login_empty_token_returns_401(client: TestClient) -> None:
    response = client.post("/auth/login", json={"firebase_token": ""})
    assert response.status_code == 401


def test_login_expired_token_returns_401(client: TestClient) -> None:
    response = client.post("/auth/login", json={"firebase_token": EXPIRED_TOKEN})
    assert response.status_code == 401


# --- AC3a: role can be set once ---


def _login(client: TestClient, token: str) -> str:
    resp = client.post("/auth/login", json={"firebase_token": token})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_set_role_persists_role(client: TestClient) -> None:
    access = _login(client, "ac3-token-set-role")

    response = client.post(
        "/auth/role",
        json={"role": "influencer"},
        headers={"Authorization": f"Bearer {access}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "influencer"
    assert body["role_set"] is True


def test_set_role_rejected_on_second_call(client: TestClient) -> None:
    access = _login(client, "ac3-token-double-role")
    headers = {"Authorization": f"Bearer {access}"}

    client.post("/auth/role", json={"role": "influencer"}, headers=headers)
    second = client.post("/auth/role", json={"role": "brand"}, headers=headers)

    assert second.status_code == 409


# --- AC3b: role-gated route rejects user without role set ---


def test_role_gated_me_rejects_unset_role(client: TestClient) -> None:
    access = _login(client, "ac3-token-no-role")

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {access}"})

    assert response.status_code == 403


def test_role_gated_me_allows_user_with_role(client: TestClient) -> None:
    access = _login(client, "ac3-token-with-role")
    headers = {"Authorization": f"Bearer {access}"}

    client.post("/auth/role", json={"role": "brand"}, headers=headers)
    response = client.get("/auth/me", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "brand"
    assert body["role_set"] is True
