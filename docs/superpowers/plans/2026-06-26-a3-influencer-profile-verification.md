# A3: Influencer Profile Setup + Verification Connect (API) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add influencer profile (niche/bio/categories), social account connection via `VerificationProvider` stub, verified-metrics storage, verified-badge assignment, and a metric-snapshot table for fraud-delta history.

**Architecture:** Three new DB tables (`influencer_profiles`, `social_accounts`, `metric_snapshots`) hang off `users`. A new `/influencer` router exposes profile CRUD and a connect-social endpoint. `VerificationProvider.fetch_metrics` is called on connect; results write to `social_accounts` and a snapshot row.

**Tech Stack:** FastAPI + Pydantic v2, SQLAlchemy 2 async, Alembic, pytest, existing `StubVerificationProvider`.

## Global Constraints

- Python 3.12, FastAPI, Pydantic v2 — no other versions.
- No vendor SDK imports outside `api/app/services/verification/`.
- `verification_provider` config flag selects stub (`"stub"`) vs live; tests run against stub.
- All DB changes via Alembic migration; CI runs `alembic upgrade head`.
- OpenAPI regenerated after every route/schema change: `cd api && python -m app.scripts.export_openapi`.
- Secrets by name only (env vars). No committed values.
- All commands prefixed `rtk` per CLAUDE.md.
- Branch: `a3/influencer-profile-verification` from `main`.

---

### Task 1: DB Models + Alembic Migration

**Files:**
- Create: `api/app/models/influencer.py`
- Create: `api/migrations/versions/0003_add_influencer_profile_social_snapshot.py`
- Modify: `api/app/models/__init__.py` (import new models so Alembic sees them)

**Interfaces:**
- Produces:
  - `InfluencerProfile` SQLAlchemy model: `id` (UUID PK), `user_id` (UUID FK→users.id, unique), `niche` (str, nullable), `bio` (str, nullable), `categories` (ARRAY[str]), `verified` (bool, default False), `created_at`, `updated_at`
  - `SocialAccount` model: `id` (UUID PK), `influencer_id` (UUID FK→influencer_profiles.id), `platform` (Enum: instagram/youtube), `followers` (int), `reach` (int), `engagement_rate` (float), `connected_at` (datetime)
  - `MetricSnapshot` model: `id` (UUID PK), `influencer_id` (UUID FK→influencer_profiles.id), `platform` (Enum), `followers` (int), `reach` (int), `engagement_rate` (float), `created_at` (datetime, server_default=now())
  - Unique constraint: `(influencer_id, platform)` on `social_accounts`

- [ ] **Step 1: Write failing model tests**

```python
# api/tests/test_influencer_models.py
import asyncio
import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.db import Base
from app.models.influencer import InfluencerProfile, SocialAccount, MetricSnapshot
from app.models.user import User
from app.services.verification.base import Platform


async def _make_engine():
    engine = create_async_engine(settings.database_url)
    return engine


def run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@pytest.fixture(scope="module")
def db_session():
    async def _setup():
        engine = await _make_engine()
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with engine.begin() as conn:
            await conn.execute(text("DELETE FROM metric_snapshots"))
            await conn.execute(text("DELETE FROM social_accounts"))
            await conn.execute(text("DELETE FROM influencer_profiles"))
            await conn.execute(text("DELETE FROM users WHERE firebase_uid LIKE 'a3-model-%'"))
        return engine, async_session

    engine, factory = asyncio.get_event_loop().run_until_complete(_setup())
    yield factory
    asyncio.get_event_loop().run_until_complete(engine.dispose())


def test_influencer_profile_persists(db_session):
    async def _run():
        async with db_session() as session:
            user = User(id=uuid.uuid4(), firebase_uid="a3-model-u1", email="a3u1@test.com")
            session.add(user)
            await session.flush()
            profile = InfluencerProfile(
                id=uuid.uuid4(),
                user_id=user.id,
                niche="fitness",
                bio="I run stuff",
                categories=["health", "sport"],
            )
            session.add(profile)
            await session.commit()
            result = await session.execute(
                select(InfluencerProfile).where(InfluencerProfile.user_id == user.id)
            )
            p = result.scalar_one()
            assert p.niche == "fitness"
            assert p.categories == ["health", "sport"]
            assert p.verified is False

    asyncio.get_event_loop().run_until_complete(_run())


def test_social_account_persists(db_session):
    async def _run():
        async with db_session() as session:
            user = User(id=uuid.uuid4(), firebase_uid="a3-model-u2", email="a3u2@test.com")
            session.add(user)
            await session.flush()
            profile = InfluencerProfile(id=uuid.uuid4(), user_id=user.id)
            session.add(profile)
            await session.flush()
            acct = SocialAccount(
                id=uuid.uuid4(),
                influencer_id=profile.id,
                platform=Platform.instagram,
                followers=12000,
                reach=48000,
                engagement_rate=4.2,
                connected_at=datetime.now(timezone.utc),
            )
            session.add(acct)
            await session.commit()
            result = await session.execute(
                select(SocialAccount).where(SocialAccount.influencer_id == profile.id)
            )
            a = result.scalar_one()
            assert a.followers == 12000
            assert a.platform == Platform.instagram

    asyncio.get_event_loop().run_until_complete(_run())


def test_metric_snapshot_persists_with_timestamp(db_session):
    async def _run():
        async with db_session() as session:
            user = User(id=uuid.uuid4(), firebase_uid="a3-model-u3", email="a3u3@test.com")
            session.add(user)
            await session.flush()
            profile = InfluencerProfile(id=uuid.uuid4(), user_id=user.id)
            session.add(profile)
            await session.flush()
            snap = MetricSnapshot(
                id=uuid.uuid4(),
                influencer_id=profile.id,
                platform=Platform.youtube,
                followers=5000,
                reach=20000,
                engagement_rate=3.1,
            )
            session.add(snap)
            await session.commit()
            result = await session.execute(
                select(MetricSnapshot).where(MetricSnapshot.influencer_id == profile.id)
            )
            s = result.scalar_one()
            assert s.created_at is not None
            assert isinstance(s.created_at, datetime)

    asyncio.get_event_loop().run_until_complete(_run())
```

- [ ] **Step 2: Run tests — expect FAIL (models don't exist)**

```bash
cd api && rtk pytest tests/test_influencer_models.py -v
```
Expected: `ImportError: cannot import name 'InfluencerProfile'`

- [ ] **Step 3: Write the models**

```python
# api/app/models/influencer.py
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.services.verification.base import Platform


class InfluencerProfile(Base):
    __tablename__ = "influencer_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    niche: Mapped[str | None] = mapped_column(String(120), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    categories: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, server_default="{}")
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    social_accounts: Mapped[list["SocialAccount"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    metric_snapshots: Mapped[list["MetricSnapshot"]] = relationship(back_populates="profile", cascade="all, delete-orphan")


class SocialAccount(Base):
    __tablename__ = "social_accounts"
    __table_args__ = (
        {"comment": "One row per platform per influencer; upsert on reconnect"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    influencer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("influencer_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    platform: Mapped[Platform] = mapped_column(Enum(Platform, name="platform"), nullable=False)
    followers: Mapped[int] = mapped_column(Integer, nullable=False)
    reach: Mapped[int] = mapped_column(Integer, nullable=False)
    engagement_rate: Mapped[float] = mapped_column(Float, nullable=False)
    connected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    profile: Mapped["InfluencerProfile"] = relationship(back_populates="social_accounts")


class MetricSnapshot(Base):
    __tablename__ = "metric_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    influencer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("influencer_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    platform: Mapped[Platform] = mapped_column(Enum(Platform, name="platform"), nullable=False)
    followers: Mapped[int] = mapped_column(Integer, nullable=False)
    reach: Mapped[int] = mapped_column(Integer, nullable=False)
    engagement_rate: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    profile: Mapped["InfluencerProfile"] = relationship(back_populates="metric_snapshots")
```

- [ ] **Step 4: Update `api/app/models/__init__.py` to import new models**

```python
# api/app/models/__init__.py
from app.models.influencer import InfluencerProfile, MetricSnapshot, SocialAccount  # noqa: F401
from app.models.user import User  # noqa: F401
```

- [ ] **Step 5: Write Alembic migration**

```python
# api/migrations/versions/0003_add_influencer_profile_social_snapshot.py
"""add influencer_profiles, social_accounts, metric_snapshots

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-26
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "influencer_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("niche", sa.String(length=120), nullable=True),
        sa.Column("bio", sa.String(length=500), nullable=True),
        sa.Column("categories", postgresql.ARRAY(sa.String()), server_default="{}", nullable=False),
        sa.Column("verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_influencer_profiles_user_id", "influencer_profiles", ["user_id"], unique=True)

    # Create platform enum (may already exist if future migrations ran; guard with checkfirst)
    platform_enum = postgresql.ENUM("instagram", "youtube", name="platform", create_type=False)
    platform_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "social_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("influencer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform", sa.Enum("instagram", "youtube", name="platform"), nullable=False),
        sa.Column("followers", sa.Integer(), nullable=False),
        sa.Column("reach", sa.Integer(), nullable=False),
        sa.Column("engagement_rate", sa.Float(), nullable=False),
        sa.Column("connected_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["influencer_id"], ["influencer_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        comment="One row per platform per influencer; upsert on reconnect",
    )
    op.create_index("ix_social_accounts_influencer_id", "social_accounts", ["influencer_id"])
    op.create_unique_constraint(
        "uq_social_accounts_influencer_platform", "social_accounts", ["influencer_id", "platform"]
    )

    op.create_table(
        "metric_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("influencer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform", sa.Enum("instagram", "youtube", name="platform"), nullable=False),
        sa.Column("followers", sa.Integer(), nullable=False),
        sa.Column("reach", sa.Integer(), nullable=False),
        sa.Column("engagement_rate", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["influencer_id"], ["influencer_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_metric_snapshots_influencer_id", "metric_snapshots", ["influencer_id"])


def downgrade() -> None:
    op.drop_table("metric_snapshots")
    op.drop_constraint("uq_social_accounts_influencer_platform", "social_accounts", type_="unique")
    op.drop_table("social_accounts")
    op.drop_table("influencer_profiles")
```

- [ ] **Step 6: Apply migration**

```bash
cd api && alembic upgrade head
```
Expected: `Running upgrade 0002 -> 0003, add influencer_profiles, social_accounts, metric_snapshots`

- [ ] **Step 7: Run model tests — expect PASS**

```bash
cd api && rtk pytest tests/test_influencer_models.py -v
```
Expected: 3 tests PASS

- [ ] **Step 8: Commit**

```bash
rtk git add api/app/models/influencer.py api/app/models/__init__.py api/migrations/versions/0003_add_influencer_profile_social_snapshot.py api/tests/test_influencer_models.py
rtk git commit -m "feat(a3): add InfluencerProfile, SocialAccount, MetricSnapshot models + migration 0003"
```

---

### Task 2: Pydantic Schemas

**Files:**
- Create: `api/app/schemas/influencer.py`

**Interfaces:**
- Consumes: `Platform` enum from `app.services.verification.base`
- Produces:
  - `ProfileUpdateRequest`: `niche: str | None` (max 120), `bio: str | None` (max 500), `categories: list[str]` (max 10 items)
  - `ConnectSocialRequest`: `platform: Platform`, `oauth_code: str` (non-empty)
  - `SocialAccountOut`: `platform`, `followers`, `reach`, `engagement_rate`, `connected_at`
  - `MetricSnapshotOut`: `platform`, `followers`, `reach`, `engagement_rate`, `created_at`
  - `ProfileResponse`: `user_id: UUID`, `niche`, `bio`, `categories`, `verified`, `social_accounts: list[SocialAccountOut]`

- [ ] **Step 1: Write failing schema tests**

```python
# api/tests/test_influencer_schemas.py
import pytest
from pydantic import ValidationError

from app.schemas.influencer import ConnectSocialRequest, ProfileUpdateRequest
from app.services.verification.base import Platform


def test_profile_update_valid():
    req = ProfileUpdateRequest(niche="fitness", bio="hello", categories=["health"])
    assert req.niche == "fitness"
    assert req.categories == ["health"]


def test_profile_update_niche_too_long():
    with pytest.raises(ValidationError):
        ProfileUpdateRequest(niche="x" * 121, bio=None, categories=[])


def test_profile_update_bio_too_long():
    with pytest.raises(ValidationError):
        ProfileUpdateRequest(niche=None, bio="x" * 501, categories=[])


def test_profile_update_too_many_categories():
    with pytest.raises(ValidationError):
        ProfileUpdateRequest(niche=None, bio=None, categories=[f"cat{i}" for i in range(11)])


def test_connect_social_valid():
    req = ConnectSocialRequest(platform=Platform.instagram, oauth_code="abc123")
    assert req.platform == Platform.instagram


def test_connect_social_empty_code_rejected():
    with pytest.raises(ValidationError):
        ConnectSocialRequest(platform=Platform.youtube, oauth_code="")
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd api && rtk pytest tests/test_influencer_schemas.py -v
```
Expected: `ImportError: cannot import name 'ProfileUpdateRequest'`

- [ ] **Step 3: Write schemas**

```python
# api/app/schemas/influencer.py
import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.services.verification.base import Platform


class ProfileUpdateRequest(BaseModel):
    niche: str | None = Field(None, max_length=120)
    bio: str | None = Field(None, max_length=500)
    categories: list[str] = Field(default_factory=list, max_length=10)


class ConnectSocialRequest(BaseModel):
    platform: Platform
    oauth_code: str

    @field_validator("oauth_code")
    @classmethod
    def code_non_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("oauth_code must not be empty")
        return v


class SocialAccountOut(BaseModel):
    platform: Platform
    followers: int
    reach: int
    engagement_rate: float
    connected_at: datetime

    model_config = {"from_attributes": True}


class MetricSnapshotOut(BaseModel):
    platform: Platform
    followers: int
    reach: int
    engagement_rate: float
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    user_id: uuid.UUID
    niche: str | None
    bio: str | None
    categories: list[str]
    verified: bool
    social_accounts: list[SocialAccountOut] = []

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd api && rtk pytest tests/test_influencer_schemas.py -v
```
Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
rtk git add api/app/schemas/influencer.py api/tests/test_influencer_schemas.py
rtk git commit -m "feat(a3): add influencer Pydantic schemas with validation"
```

---

### Task 3: Influencer Router (Profile + Connect)

**Files:**
- Create: `api/app/routers/influencer.py`
- Modify: `api/app/main.py` (register new router)

**Interfaces:**
- Consumes:
  - `get_db` → `AsyncSession` from `app.core.dependencies`
  - `get_current_user` → `User` from `app.core.dependencies`
  - `require_role_set` → `User` (influencer role enforcement happens in router)
  - `get_verification_provider` → `VerificationProvider` from `app.services.registry`
  - `InfluencerProfile`, `SocialAccount`, `MetricSnapshot` models
  - `ProfileUpdateRequest`, `ConnectSocialRequest`, `ProfileResponse` schemas
- Produces:
  - `GET /influencer/profile` → `ProfileResponse` (200) or 404 if no profile yet
  - `PUT /influencer/profile` → `ProfileResponse` (200); creates profile if none, else updates
  - `POST /influencer/profile/connect` → `ProfileResponse` (200); calls `VerificationProvider.fetch_metrics`, upserts `SocialAccount`, inserts `MetricSnapshot`, sets `verified=True` if any account verified
  - All routes require influencer role (`role == Role.influencer`)

**Dependency helper (inside router file):**

```python
async def require_influencer(user: User = Depends(require_role_set)) -> User:
    if user.role != Role.influencer:
        raise HTTPException(status_code=403, detail="Influencer role required")
    return user
```

- [ ] **Step 1: Write failing router tests (acceptance criteria tests)**

```python
# api/tests/test_influencer_router.py
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
            await conn.execute(text("DELETE FROM users WHERE firebase_uid LIKE 'a3-router-%'"))
        await engine.dispose()

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
                .where(UserModel.firebase_uid == "a3-router-connect-snap-append")
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
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd api && rtk pytest tests/test_influencer_router.py -v
```
Expected: `404 Not Found` for `/influencer/profile` (router not registered)

- [ ] **Step 3: Write the router**

```python
# api/app/routers/influencer.py
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_role_set
from app.models.influencer import InfluencerProfile, MetricSnapshot, SocialAccount
from app.models.user import Role, User
from app.schemas.influencer import ConnectSocialRequest, ProfileResponse, ProfileUpdateRequest
from app.services.registry import get_verification_provider
from app.services.verification.base import VerificationProvider

router = APIRouter(prefix="/influencer", tags=["Influencer"])


async def _require_influencer(user: User = Depends(require_role_set)) -> User:
    if user.role != Role.influencer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Influencer role required")
    return user


async def _get_or_404(user: User, db: AsyncSession) -> InfluencerProfile:
    result = await db.execute(
        select(InfluencerProfile).where(InfluencerProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


async def _load_with_accounts(profile_id: uuid.UUID, db: AsyncSession) -> InfluencerProfile:
    result = await db.execute(
        select(InfluencerProfile).where(InfluencerProfile.id == profile_id)
    )
    profile = result.scalar_one()
    acct_result = await db.execute(
        select(SocialAccount).where(SocialAccount.influencer_id == profile_id)
    )
    profile.social_accounts = list(acct_result.scalars().all())
    return profile


@router.get("/profile", response_model=ProfileResponse, summary="Get influencer profile")
async def get_profile(
    user: User = Depends(_require_influencer),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    profile = await _get_or_404(user, db)
    acct_result = await db.execute(
        select(SocialAccount).where(SocialAccount.influencer_id == profile.id)
    )
    profile.social_accounts = list(acct_result.scalars().all())
    return ProfileResponse.model_validate(profile)


@router.put("/profile", response_model=ProfileResponse, summary="Create or update influencer profile")
async def put_profile(
    body: ProfileUpdateRequest,
    user: User = Depends(_require_influencer),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    result = await db.execute(
        select(InfluencerProfile).where(InfluencerProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()

    if profile is None:
        profile = InfluencerProfile(id=uuid.uuid4(), user_id=user.id)
        db.add(profile)

    profile.niche = body.niche
    profile.bio = body.bio
    profile.categories = body.categories
    await db.commit()
    await db.refresh(profile)

    profile = await _load_with_accounts(profile.id, db)
    return ProfileResponse.model_validate(profile)


@router.post(
    "/profile/connect",
    response_model=ProfileResponse,
    summary="Connect Instagram or YouTube; fetches and stores verified metrics",
)
async def connect_social(
    body: ConnectSocialRequest,
    user: User = Depends(_require_influencer),
    db: AsyncSession = Depends(get_db),
    verification: VerificationProvider = Depends(get_verification_provider),
) -> ProfileResponse:
    profile = await _get_or_404(user, db)

    metrics = await verification.fetch_metrics(body.platform, body.oauth_code)

    # Upsert social_accounts (one row per platform)
    acct_result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.influencer_id == profile.id,
            SocialAccount.platform == body.platform,
        )
    )
    acct = acct_result.scalar_one_or_none()
    if acct is None:
        acct = SocialAccount(id=uuid.uuid4(), influencer_id=profile.id, platform=body.platform)
        db.add(acct)

    acct.followers = metrics.followers
    acct.reach = metrics.reach
    acct.engagement_rate = metrics.engagement_rate
    acct.connected_at = datetime.now(timezone.utc)

    # Always append a snapshot row
    snap = MetricSnapshot(
        id=uuid.uuid4(),
        influencer_id=profile.id,
        platform=body.platform,
        followers=metrics.followers,
        reach=metrics.reach,
        engagement_rate=metrics.engagement_rate,
    )
    db.add(snap)

    # Set verified badge if any connected account returned verified=True
    if metrics.verified:
        profile.verified = True

    await db.commit()
    await db.refresh(profile)

    profile = await _load_with_accounts(profile.id, db)
    return ProfileResponse.model_validate(profile)
```

- [ ] **Step 4: Register router in `api/app/main.py`**

```python
# api/app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.routers import auth, health, influencer


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    from app.core.db import engine
    await engine.dispose()


app = FastAPI(
    lifespan=lifespan,
    title="Cravio API",
    version="0.1.0",
    description=(
        "P0 contract for the Cravio influencer marketplace. Generated from FastAPI "
        "route and Pydantic schema definitions, committed to docs/openapi.yaml, and "
        "drift-checked in CI (see ADR-0001/0002)."
    ),
    servers=[
        {"url": "https://api.cravio.in", "description": "Production"},
        {"url": "http://localhost:8000", "description": "Local"},
    ],
)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(influencer.router)
```

- [ ] **Step 5: Run router tests — expect PASS**

```bash
cd api && rtk pytest tests/test_influencer_router.py -v
```
Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
rtk git add api/app/routers/influencer.py api/app/main.py api/tests/test_influencer_router.py
rtk git commit -m "feat(a3): add /influencer/profile router with connect-social endpoint"
```

---

### Task 4: Regenerate OpenAPI + Full Test Run

**Files:**
- Modify: `docs/openapi.yaml` (regenerated, not hand-edited)

**Interfaces:**
- Consumes: all routes now registered in `app.main:app`
- Produces: updated `docs/openapi.yaml` with new `/influencer/profile` paths

- [ ] **Step 1: Regenerate OpenAPI spec**

```bash
cd api && python -m app.scripts.export_openapi
```
Expected: no errors; `docs/openapi.yaml` updated with `/influencer/profile` GET, PUT, POST paths.

- [ ] **Step 2: Run full test suite**

```bash
cd api && rtk pytest -v
```
Expected: all tests PASS (including pre-existing `test_auth_router.py`, `test_health.py`, `test_migrations.py`, `test_openapi_export.py`).

- [ ] **Step 3: Commit updated spec**

```bash
rtk git add docs/openapi.yaml
rtk git commit -m "chore: regenerate openapi.yaml for A3 influencer profile routes"
```

---

## Self-Review

**Spec coverage check:**

| AC | Task covering it |
|----|-----------------|
| AC1: VerificationProvider stores followers/reach/engagement + verified badge | Task 3, `connect_social` endpoint; tests `test_connect_instagram_stores_metrics_and_badge`, `test_connect_youtube_stores_metrics` |
| AC2: Metric snapshot row with timestamp | Task 1 (model), Task 3 (insert in connect); tests `test_connect_writes_snapshot_row`, `test_reconnect_appends_new_snapshot_row` |
| AC3: Profile fields validate/persist; invalid input rejected | Task 2 (schema validation), Task 3 (PUT endpoint); tests `test_put_profile_*` series |

**Placeholder scan:** None found.

**Type consistency check:**
- `Platform` enum imported from `app.services.verification.base` in all three layers (models, schemas, router) — consistent.
- `ProfileResponse.social_accounts` uses `SocialAccountOut` which reads from `SocialAccount` model via `from_attributes=True` — consistent.
- `_load_with_accounts` manually loads social_accounts list to avoid lazy-load issues in async context — correct pattern for SQLAlchemy 2 async.
- Upsert logic in `connect_social` uses select-then-add pattern consistent with auth router — no raw SQL.
