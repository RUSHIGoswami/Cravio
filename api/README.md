# Cravio API — local setup

FastAPI backend. This is the practical "how do I run this on my machine" doc — see `CLAUDE.md` in this folder for conventions/architecture, and `/docs/dev-setup.md` for one-time machine prerequisites (Python 3.12, Docker Desktop, etc.) if you haven't installed those yet.

## 1. Start Postgres + Redis

```bash
cd api
docker compose up -d
```

This starts two containers defined in `api/docker-compose.yml`:

| Service  | Local port | Credentials                      |
| -------- | ---------- | -------------------------------- |
| Postgres | `55432`    | `cravio` / `cravio`, db `cravio` |
| Redis    | `56379`    | none                             |

Check they're healthy: `docker compose ps` (both should show `healthy`).

When you're done for the day: `docker compose stop` (keeps the data volume — fast to resume with `docker compose up -d`). Only use `docker compose down -v` if you actually want to wipe local data.

## 2. Create a virtualenv and install dependencies

All dependencies — runtime **and** dev/test tooling — live in `pyproject.toml`. There is no `requirements*.txt`; don't add one.

```bash
cd api
uv venv

.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

uv sync --frozen

```

`.venv/` is git-ignored — safe to delete and recreate any time.

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` so it points at the containers from step 1:

```
DATABASE_URL=postgresql+asyncpg://cravio:cravio@localhost:55432/cravio
REDIS_URL=redis://localhost:56379/0
```

The `*_PROVIDER`/`*_SERVICE` flags in `.env.example` default to `stub` — leave them alone until a feature card explicitly wires the live integration (see ADR-0005/0007/0008/0009/0010). Never commit real values to `.env` — it's git-ignored.

## 4. Apply migrations

```bash
alembic upgrade head
```

## 5. Run it

```bash
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/health` — should return `{"status": "ok", "db": true, "redis": true}`. Interactive API docs: `http://localhost:8000/docs`.

## 6. Tests, lint, type-check, OpenAPI

```bash
pytest -q                              # run the test suite
ruff check .                           # lint
ty check                               # type-check (Astral)
python -m app.scripts.export_openapi   # regenerate /docs/openapi.yaml — run after any route/schema change
```

**When to run `ty check`** — before opening a PR, alongside `ruff` and `pytest`. It statically type-checks the code (FastAPI/Pydantic/SQLAlchemy) and catches type mismatches `ruff` doesn't. `ty` is **preview (pre-1.0)** from Astral (the `uv`/`ruff` team): fast, near-zero config (`[tool.ty.*]` in `pyproject.toml`), but expect occasional false positives — treat findings as signal, fix the real ones. For inline editor diagnostics, point your LSP client at `ty server`.

CI (`.github/workflows/ci.yml`) runs `ruff`, `pytest`, and the OpenAPI export (plus `alembic upgrade head` against a fresh DB) on every PR that touches `api/**`, and fails the build if `docs/openapi.yaml` drifts from what the script generates — always regenerate and commit it together with the route/schema change that caused the drift. `ty check` also runs in CI but is **advisory (non-blocking)** while it's pre-1.0 — it surfaces type errors in the job log without failing the build.

## Troubleshooting

- **`pytest`/`uvicorn` can't connect to Postgres/Redis** — containers aren't running (`docker compose up -d`) or your `.env` ports don't match the table in step 1.
- **`ModuleNotFoundError: app`** — you're not in the activated venv, or `uv sync --frozen` wasn't run after pulling new dependencies.
- **CI fails on "OpenAPI drift"** — you changed a route/schema but didn't run `python -m app.scripts.export_openapi` and commit the updated `docs/openapi.yaml`.
