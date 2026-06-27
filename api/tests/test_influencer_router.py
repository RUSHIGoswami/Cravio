"""Tests for A3: Influencer profile setup + verification connect.

Acceptance criteria:
1. Connecting via stubbed VerificationProvider stores follower count, reach,
   engagement, and a verified-badge flag on the influencer profile.
2. A metric snapshot row is written with a timestamp.
3. Profile fields (niche, bio, categories) validate and persist;
   invalid input is rejected with clear errors.
"""

import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.main import app
from app.models.influencer import MetricSnapshot


def _wipe() -> None:
    async def _run():
        engine = create_async_engine(settings.database_url)
        async with engine.begin() as conn:
            await conn.execute(text("DELETE FROM metric_snapshots"))
            await conn.execute(text("DELETE FROM social_accounts"))
            await conn.execute(text("DELETE FROM influencer_profiles"))
            await conn.execute(text("DELETE FROM users WHERE firebase_uid LIKE 'stub-uid-a3-router-%'"))
        await engine.dispose()
        # Dispose the global app engine so the TestClient's new anyio event loop gets
        # fresh asyncpg connections rather than reusing connections tied to a prior loop.
        from app.core.db import engine as _app_engine
        await _app_engine.dispose()

    asyncio.run(_run())


@pytest.fixture(scope="module")
def client():
    _wipe()
    with TestClient(app) as c:
        yield c
    _wipe()


def _create_influencer(client: TestClient, token_suffix: str) -> str:
    """Login, set role=influencer, return JWT."""
    login_resp = client.post("/auth/login", json={"firebase_token": f"a3-router-{token_suffix}"})
    assert login_resp.status_code == 200
    jwt = login_resp.json()["access_token"]
    role_resp = client.post(
        "/auth/role",
        json={"role": "influencer"},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert role_resp.status_code == 200
    return jwt


def _create_brand(client: TestClient, token_suffix: str) -> str:
    login_resp = client.post("/auth/login", json={"firebase_token": f"a3-router-{token_suffix}"})
    assert login_resp.status_code == 200
    jwt = login_resp.json()["access_token"]
    client.post(
        "/auth/role",
        json={"role": "brand"},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    return jwt


# --- AC3: profile fields validate and persist ---


def test_put_profile_creates_and_returns(client: TestClient):
    jwt = _create_influencer(client, "profile-create")
    resp = client.put(
        "/influencer/profile",
        json={"niche": "fitness", "bio": "I run marathons", "categories": ["health", "sport"]},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["niche"] == "fitness"
    assert body["bio"] == "I run marathons"
    assert body["categories"] == ["health", "sport"]
    assert body["verified"] is False


def test_put_profile_updates_existing(client: TestClient):
    jwt = _create_influencer(client, "profile-update")
    headers = {"Authorization": f"Bearer {jwt}"}
    client.put("/influencer/profile", json={"niche": "food", "bio": "old", "categories": []}, headers=headers)
    resp = client.put("/influencer/profile", json={"niche": "travel", "bio": "new bio", "categories": ["travel"]}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["niche"] == "travel"
    assert resp.json()["bio"] == "new bio"


def test_put_profile_rejects_niche_too_long(client: TestClient):
    jwt = _create_influencer(client, "profile-niche-long")
    resp = client.put(
        "/influencer/profile",
        json={"niche": "x" * 121, "bio": None, "categories": []},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert resp.status_code == 422


def test_put_profile_rejects_bio_too_long(client: TestClient):
    jwt = _create_influencer(client, "profile-bio-long")
    resp = client.put(
        "/influencer/profile",
        json={"niche": None, "bio": "x" * 501, "categories": []},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert resp.status_code == 422


def test_put_profile_rejects_too_many_categories(client: TestClient):
    jwt = _create_influencer(client, "profile-cats-too-many")
    resp = client.put(
        "/influencer/profile",
        json={"niche": None, "bio": None, "categories": [f"c{i}" for i in range(11)]},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert resp.status_code == 422


def test_get_profile_returns_404_before_creation(client: TestClient):
    jwt = _create_influencer(client, "profile-get-404")
    resp = client.get("/influencer/profile", headers={"Authorization": f"Bearer {jwt}"})
    assert resp.status_code == 404


def test_get_profile_returns_profile_after_creation(client: TestClient):
    jwt = _create_influencer(client, "profile-get-200")
    headers = {"Authorization": f"Bearer {jwt}"}
    client.put("/influencer/profile", json={"niche": "art", "bio": None, "categories": ["art"]}, headers=headers)
    resp = client.get("/influencer/profile", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["niche"] == "art"


def test_brand_cannot_access_influencer_profile_endpoint(client: TestClient):
    jwt = _create_brand(client, "profile-brand-403")
    resp = client.put(
        "/influencer/profile",
        json={"niche": "x", "bio": None, "categories": []},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert resp.status_code == 403


# --- AC1: connect stores follower/reach/engagement + verified badge ---


def test_connect_instagram_stores_metrics_and_badge(client: TestClient):
    jwt = _create_influencer(client, "connect-ig")
    headers = {"Authorization": f"Bearer {jwt}"}
    client.put("/influencer/profile", json={"niche": "fitness", "bio": None, "categories": []}, headers=headers)

    resp = client.post(
        "/influencer/profile/connect",
        json={"platform": "instagram", "oauth_code": "stub-oauth-token"},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["verified"] is True
    accounts = {a["platform"]: a for a in body["social_accounts"]}
    assert "instagram" in accounts
    ig = accounts["instagram"]
    assert ig["followers"] == 12000
    assert ig["reach"] == 48000
    assert ig["engagement_rate"] == pytest.approx(4.2)


def test_connect_youtube_stores_metrics(client: TestClient):
    jwt = _create_influencer(client, "connect-yt")
    headers = {"Authorization": f"Bearer {jwt}"}
    client.put("/influencer/profile", json={"niche": "gaming", "bio": None, "categories": []}, headers=headers)

    resp = client.post(
        "/influencer/profile/connect",
        json={"platform": "youtube", "oauth_code": "stub-oauth-yt"},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["verified"] is True
    accounts = {a["platform"]: a for a in body["social_accounts"]}
    assert "youtube" in accounts


def test_reconnect_same_platform_upserts(client: TestClient):
    """Second connect for same platform updates, doesn't duplicate."""
    jwt = _create_influencer(client, "connect-upsert")
    headers = {"Authorization": f"Bearer {jwt}"}
    client.put("/influencer/profile", json={"niche": "food", "bio": None, "categories": []}, headers=headers)
    client.post("/influencer/profile/connect", json={"platform": "instagram", "oauth_code": "tok1"}, headers=headers)
    resp = client.post("/influencer/profile/connect", json={"platform": "instagram", "oauth_code": "tok2"}, headers=headers)
    assert resp.status_code == 200
    accounts = [a for a in resp.json()["social_accounts"] if a["platform"] == "instagram"]
    assert len(accounts) == 1  # upserted, not duplicated


def test_connect_empty_oauth_code_rejected(client: TestClient):
    jwt = _create_influencer(client, "connect-empty-code")
    headers = {"Authorization": f"Bearer {jwt}"}
    client.put("/influencer/profile", json={"niche": "x", "bio": None, "categories": []}, headers=headers)
    resp = client.post(
        "/influencer/profile/connect",
        json={"platform": "instagram", "oauth_code": ""},
        headers=headers,
    )
    assert resp.status_code == 422


# --- AC2: metric snapshot row written with timestamp ---


def test_connect_writes_snapshot_row(client: TestClient):
    jwt = _create_influencer(client, "connect-snapshot")
    headers = {"Authorization": f"Bearer {jwt}"}
    client.put("/influencer/profile", json={"niche": "tech", "bio": None, "categories": []}, headers=headers)
    client.post("/influencer/profile/connect", json={"platform": "instagram", "oauth_code": "snap-tok"}, headers=headers)

    # Verify snapshot exists in DB
    async def _check():
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.orm import sessionmaker
        engine = create_async_engine(settings.database_url)
        factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with factory() as session:
            result = await session.execute(select(MetricSnapshot))
            snaps = result.scalars().all()
            assert len(snaps) >= 1
            snap = snaps[-1]
            assert snap.followers == 12000
            assert snap.created_at is not None
        await engine.dispose()

    asyncio.run(_check())


def test_reconnect_appends_new_snapshot_row(client: TestClient):
    """Each connect call writes a new snapshot row, even for same platform."""
    jwt = _create_influencer(client, "connect-snap-append")
    headers = {"Authorization": f"Bearer {jwt}"}
    client.put("/influencer/profile", json={"niche": "art", "bio": None, "categories": []}, headers=headers)

    async def _count_snaps_for_user() -> int:
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.orm import sessionmaker
        from app.models.user import User as UserModel
        from app.models.influencer import InfluencerProfile as IP
        engine = create_async_engine(settings.database_url)
        factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with factory() as session:
            result = await session.execute(
                select(IP).join(UserModel, IP.user_id == UserModel.id)
                .where(UserModel.firebase_uid == "stub-uid-a3-router-connect-snap-append")
            )
            profile = result.scalar_one_or_none()
            if profile is None:
                await engine.dispose()
                return 0
            snaps = await session.execute(
                select(MetricSnapshot).where(MetricSnapshot.influencer_id == profile.id)
            )
            count = len(snaps.scalars().all())
        await engine.dispose()
        return count

    client.post("/influencer/profile/connect", json={"platform": "instagram", "oauth_code": "tok-a"}, headers=headers)
    count_after_first = asyncio.run(_count_snaps_for_user())
    client.post("/influencer/profile/connect", json={"platform": "instagram", "oauth_code": "tok-b"}, headers=headers)
    count_after_second = asyncio.run(_count_snaps_for_user())
    assert count_after_second == count_after_first + 1
