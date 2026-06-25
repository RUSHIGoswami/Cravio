# /api — Cravio backend

FastAPI (Python 3.12) backend. REST + WebSocket. This package is the source of the OpenAPI contract.

## Stack
- Python 3.12, FastAPI, Pydantic v2
- PostgreSQL (SQLAlchemy 2.x + Alembic migrations), Redis
- Uvicorn (ASGI), Gunicorn workers in prod
- pytest for tests

## Conventions
- **Tests first.** For each task, write tests asserting the acceptance criteria, then implement until green.
- **Contract is generated, not hand-written.** The committed `/docs/openapi.yaml` is regenerated from FastAPI route+schema definitions. CI fails if the committed spec drifts from code.
- **Integrations behind interfaces.** `VerificationProvider` (Meta/YouTube), `PaymentProvider` (Razorpay), `AuthProvider` (Firebase), `AIService` (Claude), `SearchService`, `NotificationService` (FCM). Provide deterministic stubs; no feature imports a vendor SDK directly. See ADR-0005/0007/0008/0009/0010.
- **Async correctly.** No blocking calls in request handlers. CPU-bound and long-running work goes to background workers.
- **Secrets by name only.** Read from environment / secret manager. Never commit values.
- **Migrations ship with schema changes.** Every model change has an Alembic migration; CI runs them.

## Suggested layout
```
api/
  app/
    main.py            # FastAPI app + router registration
    core/              # config, security (Firebase token verify), db, redis
    models/            # SQLAlchemy models
    schemas/           # Pydantic request/response models
    routers/           # auth, onboarding, discovery, campaigns, applications
    services/          # provider interfaces + stubs (verification, payment, ai, search, notifications)
    workers/           # background jobs (media processing, metric snapshots, fraud delta)
  migrations/          # Alembic
  tests/
  pyproject.toml
```

## Run / test
```
uv sync --group dev                     # all deps — runtime + dev — come from pyproject.toml/uv.lock only
uvicorn app.main:app --reload          # dev server
pytest                                  # tests
alembic upgrade head                    # apply migrations
python -m app.scripts.export_openapi    # regenerate /docs/openapi.yaml (wired into CI)
```
See `README.md` for full local setup (Docker Postgres/Redis, `.env`, venv).

## P0 scope (this package)
Auth/token verification, influencer + brand onboarding, influencer discovery (search + filters), campaign builder + lifecycle, application flow, direct payout (Razorpay, non-escrow), push notifications, verified-metrics read path (via stubbed then live VerificationProvider). See `/docs/P0-task-cards.md`.
