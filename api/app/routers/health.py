from fastapi import APIRouter
from sqlalchemy import text

from app.core.db import async_session
from app.core.redis_client import redis_client

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    db_ok = await _check_db()
    redis_ok = await _check_redis()
    return {"status": "ok", "db": db_ok, "redis": redis_ok}


async def _check_db() -> bool:
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def _check_redis() -> bool:
    try:
        await redis_client.ping()
        return True
    except Exception:
        return False
