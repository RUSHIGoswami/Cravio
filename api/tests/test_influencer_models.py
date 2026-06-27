import asyncio
import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.influencer import InfluencerProfile, MetricSnapshot, SocialAccount
from app.models.user import User
from app.services.verification.base import Platform


async def _make_engine():
    engine = create_async_engine(settings.database_url)
    return engine


@pytest.fixture(scope="module")
def db_session():
    loop = asyncio.new_event_loop()

    async def _setup():
        engine = await _make_engine()
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with engine.begin() as conn:
            await conn.execute(text("DELETE FROM metric_snapshots"))
            await conn.execute(text("DELETE FROM social_accounts"))
            await conn.execute(text("DELETE FROM influencer_profiles"))
            await conn.execute(text("DELETE FROM users WHERE firebase_uid LIKE 'a3-model-%'"))
        return engine, async_session

    engine, factory = loop.run_until_complete(_setup())
    yield factory, loop
    loop.run_until_complete(engine.dispose())
    loop.close()


def test_influencer_profile_persists(db_session):
    factory, loop = db_session

    async def _run():
        async with factory() as session:
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

    loop.run_until_complete(_run())


def test_social_account_persists(db_session):
    factory, loop = db_session

    async def _run():
        async with factory() as session:
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

    loop.run_until_complete(_run())


def test_metric_snapshot_persists_with_timestamp(db_session):
    factory, loop = db_session

    async def _run():
        async with factory() as session:
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

    loop.run_until_complete(_run())
