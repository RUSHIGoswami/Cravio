# ADR-0002: FastAPI (Python 3.12) for the API backend

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Founder
- **Phase:** Phase 0

## Context
We need a backend that serves REST for the mobile app and WebSocket for real-time notifications, generates an OpenAPI contract automatically, and integrates cleanly with the Claude API and Python's data/AI ecosystem. Target: <300ms p95, 10K concurrent at MVP scaling to 100K.

## Decision
Python 3.12 + FastAPI for all backend services. REST + WebSocket. OpenAPI auto-generated from the route/schema definitions and committed to `/docs/openapi.yaml`.

## Rationale
- FastAPI generates OpenAPI from Pydantic models for free, satisfying the "one shared contract" convention.
- Async support handles WebSocket notifications and concurrent I/O-bound campaign/discovery traffic well.
- Python keeps us in one language with the Claude API and any future data/fraud-scoring work.
- Pydantic gives strong request/response validation, which pairs with the tests-first agent convention.

## Alternatives considered
- **Django / Django REST Framework:** batteries-included and the strongest alternative. Its decisive advantage is **Django Admin** — our P0 admin work (content moderation, fake-campaign reporting, banning) comes almost for free, which is a real solo-founder time saver. It loses on the dimensions we committed to: async/WebSocket is bolted on via Channels rather than native, OpenAPI requires DRF + drf-spectacular instead of being free from the schema, and it is heavier overall. We judged the admin advantage outweighed by the contract/async/AI-ecosystem fit, and mitigable (see Consequences). A hybrid Django + FastAPI deployment was rejected — it doubles the operational surface for a solo founder.
- **Node/NestJS:** strong TypeScript story, but splits us across languages from the AI tooling and offers no advantage for our workload.
- **Go:** best raw throughput, but slower to build with for a solo founder and further from the AI ecosystem.

## Consequences
- Must run an ASGI server (Uvicorn/Gunicorn) and design for async correctly (no blocking calls in handlers).
- CPU-bound work (e.g. heavy fraud scoring) should move to background workers, not request handlers.
- OpenAPI generation is wired into CI so the committed spec never drifts from code.
- **Admin panel:** because we forgo Django Admin, adopt **SQLAdmin** or **starlette-admin** early — they provide a Django-Admin-style CRUD/moderation panel over our existing SQLAlchemy models — or build admin screens in the React `/admin` app against the same API. Do not hand-build moderation tooling from scratch.
- **Revisit trigger:** if priorities shift to an admin-centric, internal-tool-first product where the mobile API is secondary, reopen this ADR in favour of Django.
