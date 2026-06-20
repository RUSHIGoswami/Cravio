# Claude Code — Foundation Prompts (F1–F5)

Ready-to-run prompts for the five foundation cards in `docs/P0-task-cards.md`. Run them **in order** — each gates the next. Run each in its own Claude Code session from the repo root.

**How to use:** paste a prompt as the session's task. Each tells Claude Code to read the relevant docs first, work tests-first, and stop at the card's acceptance criteria. Review the diff against the acceptance criteria before merging, then move to the next card.

**Global context to assume in every session:** monorepo per ADR-0001; committed stack per `docs/adr/`; secrets by name only; OpenAPI is generated from `/api` and CI fails on drift; integrations behind interfaces with deterministic stubs.

---

## F1 — Monorepo + CI skeleton

```
Read README.md, docs/adr/0001-monorepo-structure.md, and infra/CLAUDE.md before starting.

Task: Stand up the monorepo skeleton and CI.

Do:
1. Create the package layout: /api, /mobile, /admin, /infra (keep existing CLAUDE.md files). Add a root .gitignore for Python, Node, RN, and env files.
2. Add GitHub Actions in /infra (or .github/workflows) that, on pull_request and push to main:
   - detect which top-level packages changed and scope jobs to them,
   - run lint + tests for /api (Python) and /mobile (Node) when those packages change,
   - run secret-scanning (e.g. gitleaks) and fail on findings.
3. Add a trivial passing test in /api (pytest) and /mobile (jest) so CI has something green.
4. Add a planted dummy secret in a throwaway branch only to confirm secret-scanning fails — then remove it; document the check in infra/CLAUDE.md.

Acceptance criteria (verify before finishing):
- CI runs on PR, scopes jobs to changed packages, blocks merge on lint/test failure.
- The trivial tests in /api and /mobile are green in CI.
- Secret-scanning is enabled and fails on a planted dummy secret.

Work tests-first where applicable. Do not add feature code. Stop when criteria are met and summarize the diff.
```

---

## F2 — API app + DB + migration baseline

```
Read api/CLAUDE.md, docs/adr/0002-backend-fastapi.md, and docs/adr/0003-database-postgres-redis.md before starting.

Task: Boot the FastAPI app with Postgres + Redis and a migration baseline.

Do:
1. Scaffold /api per the suggested layout in api/CLAUDE.md (app/main.py, core/config, core/db, core/redis, models, schemas, routers, services, workers, tests). Use FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2, Uvicorn. Manage deps with pyproject.toml.
2. Config reads connection strings from environment only (no values committed). Provide a .env.example with key NAMES.
3. Implement GET /health returning 200 with {status, db, redis} reflecting real connectivity.
4. Configure Alembic; create a baseline migration that creates the users table (id uuid pk, email, role, role_set bool, created_at). Match the User schema in docs/openapi.yaml.
5. Add docker-compose (or equivalent) for local Postgres + Redis so the app and CI can run.

Acceptance criteria:
- GET /health returns 200 with DB + Redis connectivity status.
- `alembic upgrade head` runs cleanly on an empty DB in CI.
- The baseline migration creates the users table.

Tests-first: write tests for /health and for the migration applying cleanly, then implement. Stop when criteria are met.
```

---

## F3 — OpenAPI export + drift check

```
Read api/CLAUDE.md and docs/adr/0001-monorepo-structure.md before starting. The committed contract is docs/openapi.yaml.

Task: Generate the OpenAPI contract from FastAPI and enforce no drift in CI.

Do:
1. Add app/scripts/export_openapi.py that writes the FastAPI-generated schema to docs/openapi.yaml (stable key ordering so diffs are clean).
2. Align the existing routes/schemas so the generated spec matches the intent of the current hand-authored docs/openapi.yaml for the endpoints implemented so far (start with /health and the User/auth schemas; the full set fills in as feature cards land). Treat the hand-authored file as the target contract, not the source of truth going forward — after this card, the generated file is canonical.
3. Add a CI job that regenerates the spec and fails the build if the committed docs/openapi.yaml differs.

Acceptance criteria:
- `python -m app.scripts.export_openapi` writes docs/openapi.yaml.
- CI regenerates and fails the build if the committed file differs.

Note: from this card on, docs/openapi.yaml is a generated artifact. Stop when criteria are met.
```

---

## F4 — Provider interfaces + stubs

```
Read api/CLAUDE.md and docs/adr/0004 (auth), 0005 (payments), 0007 (ai), 0008 (verification), 0009 (search), 0010 (notifications) before starting.

Task: Define provider interfaces with deterministic stubs so feature cards can build before live credentials exist.

Do:
1. In api/app/services, define interfaces (abstract base classes / Protocols):
   - AuthProvider (verify Firebase ID token -> uid/email),
   - VerificationProvider (Meta/YouTube: fetch verified metrics for a connected account),
   - PaymentProvider (Razorpay: create payout, handle webhook verification),
   - AIService (Claude: generate text),
   - SearchService (query influencers with filters),
   - NotificationService (FCM: send push, register/prune device tokens).
2. Provide a deterministic Stub implementation of each returning fixed fixtures (e.g. StubVerificationProvider returns followers=12000, engagement=4.2, verified=True).
3. Add a config flag per provider to select stub vs live; default to stub in dev/test.
4. Ensure no vendor SDK is imported anywhere except inside its live provider module (add a lint check or test asserting this if practical).

Acceptance criteria:
- Each interface has a stub returning deterministic fixtures.
- Unit tests cover each stub; no vendor SDK is imported outside its provider module.
- A config flag selects stub vs live per provider.

Tests-first for each stub. Stop when criteria are met.
```

---

## F5 — Mobile app shell + generated API client + design-system bootstrap

```
Read mobile/CLAUDE.md and docs/adr/0012-mobile-react-native.md before starting. The contract is docs/openapi.yaml.

Task: Boot the React Native app, generate the API client, and wire the design-system scaffold.

Do:
1. Scaffold /mobile as a React Native + TypeScript app. Decide Expo vs bare RN per ADR-0012 and record the choice in mobile/CLAUDE.md (default: Expo, plan to eject if Razorpay/Meta native modules require it).
2. Generate a typed API client from docs/openapi.yaml (e.g. openapi-typescript + a fetch wrapper). Do not hand-write endpoint types. Add a script to regenerate it.
3. Create a minimal theme/ for design tokens (colors, spacing, typography) structured to receive Claude Design's design-sync output later, plus one shared Button component consuming the tokens.
4. Add a smoke screen that calls GET /health through the generated client and renders the result.

Acceptance criteria:
- App builds and runs on iOS simulator and Android emulator.
- The generated API client compiles and calls GET /health against the local API.
- A Button from the shared component library renders using tokens from theme/.

Tests-first where practical (component test for Button, integration test for the health call against a mocked client). Stop when criteria are met.
```

---

### After F1–F5
The foundation gate is met. Move to the feature cards in `docs/P0-task-cards.md` starting at A1, top to bottom — all P0 before any P1. When you reach admin work (M1), adopt SQLAdmin or starlette-admin per ADR-0002 rather than hand-building moderation tooling.
