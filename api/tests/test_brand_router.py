"""Tests for A5: Brand profile setup (API).

Acceptance criteria:
1. Brand profile validates and persists; GST optional.
2. Brand role can reach the campaign builder; influencer role cannot
   (server-enforced).
"""

import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.main import app

VALID_GSTIN = "22AAAAA0000A1Z5"


def _wipe() -> None:
    async def _run():
        engine = create_async_engine(settings.database_url)
        async with engine.begin() as conn:
            await conn.execute(text("DELETE FROM brand_profiles"))
            await conn.execute(
                text("DELETE FROM users WHERE firebase_uid LIKE 'stub-uid-a5-router-%'")
            )
        await engine.dispose()
        from app.core.db import engine as _app_engine

        await _app_engine.dispose()

    asyncio.run(_run())


@pytest.fixture(scope="module")
def client():
    _wipe()
    with TestClient(app) as c:
        yield c
    _wipe()


def _create_brand(client: TestClient, token_suffix: str) -> str:
    login = client.post("/auth/login", json={"firebase_token": f"a5-router-{token_suffix}"})
    assert login.status_code == 200
    jwt = login.json()["access_token"]
    role = client.post(
        "/auth/role", json={"role": "brand"}, headers={"Authorization": f"Bearer {jwt}"}
    )
    assert role.status_code == 200
    return jwt


def _create_influencer(client: TestClient, token_suffix: str) -> str:
    login = client.post("/auth/login", json={"firebase_token": f"a5-router-{token_suffix}"})
    assert login.status_code == 200
    jwt = login.json()["access_token"]
    client.post(
        "/auth/role", json={"role": "influencer"}, headers={"Authorization": f"Bearer {jwt}"}
    )
    return jwt


# --- AC1: brand profile validates and persists; GST optional ---


def test_put_brand_profile_creates_and_returns(client: TestClient):
    jwt = _create_brand(client, "create")
    resp = client.put(
        "/brand/profile",
        json={"company_name": "Acme Foods", "industry": "FMCG", "website": "https://acme.example.in"},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["company_name"] == "Acme Foods"
    assert body["industry"] == "FMCG"
    assert body["website"] == "https://acme.example.in"
    assert body["gst"] is None


def test_put_brand_profile_with_gst(client: TestClient):
    jwt = _create_brand(client, "gst")
    resp = client.put(
        "/brand/profile",
        json={
            "company_name": "Acme",
            "industry": "Tech",
            "website": "https://acme.example.in",
            "gst": VALID_GSTIN,
        },
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert resp.status_code == 200
    assert resp.json()["gst"] == VALID_GSTIN


def test_put_brand_profile_updates_existing(client: TestClient):
    jwt = _create_brand(client, "update")
    headers = {"Authorization": f"Bearer {jwt}"}
    client.put(
        "/brand/profile",
        json={"company_name": "Old", "industry": "Tech", "website": "https://old.example.in"},
        headers=headers,
    )
    resp = client.put(
        "/brand/profile",
        json={"company_name": "New", "industry": "Retail", "website": "https://new.example.in"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["company_name"] == "New"
    assert resp.json()["industry"] == "Retail"


def test_put_brand_profile_rejects_missing_company(client: TestClient):
    jwt = _create_brand(client, "no-company")
    resp = client.put(
        "/brand/profile",
        json={"industry": "Tech", "website": "https://acme.example.in"},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert resp.status_code == 422


def test_put_brand_profile_rejects_invalid_gst(client: TestClient):
    jwt = _create_brand(client, "bad-gst")
    resp = client.put(
        "/brand/profile",
        json={
            "company_name": "Acme",
            "industry": "Tech",
            "website": "https://acme.example.in",
            "gst": "NOTAGST",
        },
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert resp.status_code == 422


def test_put_brand_profile_rejects_invalid_website(client: TestClient):
    jwt = _create_brand(client, "bad-url")
    resp = client.put(
        "/brand/profile",
        json={"company_name": "Acme", "industry": "Tech", "website": "acme.example.in"},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert resp.status_code == 422


def test_get_brand_profile_404_before_creation(client: TestClient):
    jwt = _create_brand(client, "get-404")
    resp = client.get("/brand/profile", headers={"Authorization": f"Bearer {jwt}"})
    assert resp.status_code == 404


def test_get_brand_profile_after_creation(client: TestClient):
    jwt = _create_brand(client, "get-200")
    headers = {"Authorization": f"Bearer {jwt}"}
    client.put(
        "/brand/profile",
        json={"company_name": "Acme", "industry": "Tech", "website": "https://acme.example.in"},
        headers=headers,
    )
    resp = client.get("/brand/profile", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["company_name"] == "Acme"


# --- AC2: brand reaches campaign builder; influencer cannot (server-enforced) ---


def test_brand_can_reach_campaign_builder(client: TestClient):
    jwt = _create_brand(client, "builder-brand")
    resp = client.get("/brand/campaign-builder", headers={"Authorization": f"Bearer {jwt}"})
    assert resp.status_code == 200
    assert resp.json()["can_create_campaign"] is True


def test_campaign_builder_reports_profile_complete(client: TestClient):
    jwt = _create_brand(client, "builder-complete")
    headers = {"Authorization": f"Bearer {jwt}"}
    before = client.get("/brand/campaign-builder", headers=headers)
    assert before.json()["profile_complete"] is False
    client.put(
        "/brand/profile",
        json={"company_name": "Acme", "industry": "Tech", "website": "https://acme.example.in"},
        headers=headers,
    )
    after = client.get("/brand/campaign-builder", headers=headers)
    assert after.json()["profile_complete"] is True


def test_influencer_cannot_reach_campaign_builder(client: TestClient):
    jwt = _create_influencer(client, "builder-influencer")
    resp = client.get("/brand/campaign-builder", headers={"Authorization": f"Bearer {jwt}"})
    assert resp.status_code == 403


def test_influencer_cannot_access_brand_profile(client: TestClient):
    jwt = _create_influencer(client, "profile-influencer")
    resp = client.put(
        "/brand/profile",
        json={"company_name": "Acme", "industry": "Tech", "website": "https://acme.example.in"},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert resp.status_code == 403
