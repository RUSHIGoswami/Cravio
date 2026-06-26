from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.routers import auth, health


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
