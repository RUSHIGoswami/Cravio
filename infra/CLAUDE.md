# /infra — Cravio infrastructure-as-code

AWS infrastructure and CI/CD, defined as code.

## Stack
- AWS (S3 + CloudFront for media per ADR-0006; compute for FastAPI; managed Postgres + Redis)
- IaC: Terraform (recommended) — pick and record in an ADR at scaffold time
- CI/CD: GitHub Actions

## Conventions
- **Everything reproducible.** No click-ops; all infra in code and reviewed.
- **Secrets in a secret manager** (AWS Secrets Manager / SSM). Code and CI reference key names only.
- **Per-package CI jobs.** Scope lint/test/build by changed package to keep runs fast (monorepo, ADR-0001).
- **OpenAPI drift check.** CI regenerates `/docs/openapi.yaml` from `/api` and fails if it differs from the committed file.
- **CI on PR, deploy on main.** Validation (`ci.yml`) runs on `pull_request` only — `main` is protected (PR required), so the PR check already validates the merge result and re-running checks on the `push` to `main` is redundant. Deployment (a separate `deploy.yml`) is what triggers on `push: main` (and/or release tags). This split depends on the branch-protection settings below being in place.
- **Deploy gates on CI, doesn't re-validate it.** The deploy workflow must not skip safety: make `ci.yml` reusable (`workflow_call`) and have `deploy.yml` call it (build + smoke) before shipping, so a broken `main` never reaches prod — but it does not duplicate the PR-time validation.
- **Environments.** At minimum: a staging and a production environment with separate credentials.

## CI must enforce
- Lint + tests pass per changed package before merge.
- Migrations apply cleanly (`alembic upgrade head`) on a throwaway DB.
- OpenAPI spec is in sync with `/api`.
- No secrets committed (secret-scanning).

## Scope
S3 + CloudFront, Postgres (with planned read replicas + PgBouncer), Redis, compute/auto-scaling toward 10K→100K concurrent, FCM/Firebase project config references, monitoring/uptime (99.5% SLA target). Encryption at rest (AES-256) for PAN/bank data; HTTPS everywhere; DPDP/PCI-DSS posture.

## CI implementation (F1)
Workflow: `.github/workflows/ci.yml`, runs on `pull_request` and `workflow_dispatch` (manual). It no longer runs on `push: main` — `main` is PR-protected, so the PR check already validates the merge result (a squash merge produces the same tree the PR tested). A `concurrency` group cancels superseded runs on the same ref, except on `main` (`cancel-in-progress` is false for `refs/heads/main`).
- **detect-changes** — `dorny/paths-filter` diffs the PR against the base to decide which top-level packages changed; downstream jobs are skipped (not just no-op'd) when their package didn't change, keeping runs fast per ADR-0001.
- **api** — only runs when `api/**` changed: `ruff check` + `pytest` on Python 3.12, installed via `pip install -e ".[dev]"` (`api/pyproject.toml` — single source of truth, no separate requirements file).
- **mobile** — only runs when `mobile/**` changed: `eslint` + `jest` on Node 20 (`mobile/package.json`).
- **secret-scan** — always runs (every PR/push, regardless of changed paths), via `gitleaks/gitleaks-action@v2` with full git history (`fetch-depth: 0`) so it catches secrets introduced anywhere in the diff. Fails the build on any finding.
- **required-checks** — fans in `api`, `mobile`, `secret-scan` and fails if any of them failed; this is the single status check branch protection should require, so skipped (not-changed) jobs don't block merges but failures always do.

Verified by planting a dummy secret on a throwaway branch and confirming `secret-scan` failed, then removing it before merge — see PR history for the throwaway branch/run.

**Branch protection on `main` (ruleset — partly done):**
- Require a PR before merging (no direct pushes) — **done**.
- Require the `required-checks` status check to pass before merge.
- **Require branches to be up to date before merging** — important: this is what makes "CI on PR, none on main" safe. Without it, two PRs that each pass independently can break `main` when merged close together; with it, a PR must re-validate against current `main` right before merge.

## Deploy workflow (future — when an infra/deploy target exists)
Not built yet (no deploy target until infra lands). When added:
- Separate file `.github/workflows/deploy.yml`, triggered on `push: main` (and/or release tags).
- Reuse `ci.yml` via `workflow_call` as a pre-deploy gate (build + smoke), then deploy — so a broken `main` never ships, without duplicating PR-time validation.
- Deploy to **staging** automatically on `main`; gate **production** behind a manual approval / release tag and the GitHub Environments protection rules.
