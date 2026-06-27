import asyncio

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings


def _wipe_all_tables() -> None:
    async def _run():
        engine = create_async_engine(settings.database_url)
        async with engine.begin() as conn:
            # Wipe in FK order so downgrade migration can ALTER COLUMN role SET NOT NULL
            await conn.execute(text("DELETE FROM metric_snapshots"))
            await conn.execute(text("DELETE FROM social_accounts"))
            await conn.execute(text("DELETE FROM influencer_profiles"))
            await conn.execute(text("DELETE FROM users"))
        await engine.dispose()

    asyncio.run(_run())


def test_alembic_upgrade_head_creates_users_table():
    _wipe_all_tables()
    alembic_cfg = Config("alembic.ini")
    command.downgrade(alembic_cfg, "base")
    command.upgrade(alembic_cfg, "head")

    columns = asyncio.run(_users_columns())

    assert columns == {"id", "firebase_uid", "email", "role", "role_set", "created_at"}


async def _users_columns() -> set:
    engine = create_async_engine(settings.database_url)
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
        )
        columns = {row[0] for row in result.fetchall()}
    await engine.dispose()
    return columns
