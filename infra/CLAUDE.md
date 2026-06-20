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
- **Environments.** At minimum: a staging and a production environment with separate credentials.

## CI must enforce
- Lint + tests pass per changed package before merge.
- Migrations apply cleanly (`alembic upgrade head`) on a throwaway DB.
- OpenAPI spec is in sync with `/api`.
- No secrets committed (secret-scanning).

## Scope
S3 + CloudFront, Postgres (with planned read replicas + PgBouncer), Redis, compute/auto-scaling toward 10K→100K concurrent, FCM/Firebase project config references, monitoring/uptime (99.5% SLA target). Encryption at rest (AES-256) for PAN/bank data; HTTPS everywhere; DPDP/PCI-DSS posture.

## CI implementation (F1)
Workflow: `.github/workflows/ci.yml`, runs on `pull_request` and `push` to `main`.
- **detect-changes** — `dorny/paths-filter` diffs the PR/push against the base to decide which top-level packages changed; downstream jobs are skipped (not just no-op'd) when their package didn't change, keeping runs fast per ADR-0001.
- **api** — only runs when `api/**` changed: `ruff check` + `pytest` on Python 3.12 (`api/requirements-dev.txt`).
- **mobile** — only runs when `mobile/**` changed: `eslint` + `jest` on Node 20 (`mobile/package.json`).
- **secret-scan** — always runs (every PR/push, regardless of changed paths), via `gitleaks/gitleaks-action@v2` with full git history (`fetch-depth: 0`) so it catches secrets introduced anywhere in the diff. Fails the build on any finding.
- **required-checks** — fans in `api`, `mobile`, `secret-scan` and fails if any of them failed; this is the single status check branch protection should require, so skipped (not-changed) jobs don't block merges but failures always do.

Verified by planting a dummy secret on a throwaway branch and confirming `secret-scan` failed, then removing it before merge — see PR history for the throwaway branch/run.

**Still needed (manual, one-time, in GitHub repo settings):** enable a branch protection rule on `main` requiring the `required-checks` status check, so failing CI actually blocks merge rather than just reporting red.
