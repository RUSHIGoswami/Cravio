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
