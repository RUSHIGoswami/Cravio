import asyncio

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings


def test_alembic_upgrade_head_creates_users_table():
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
