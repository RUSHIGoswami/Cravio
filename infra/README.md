# Cravio Infra — status

**No infrastructure-as-code here yet** beyond `CLAUDE.md` and the CI workflow at `/.github/workflows/ci.yml` (which is the one piece of "infra" that already exists and runs today — see below).

Everything else described in `CLAUDE.md` (Terraform, AWS compute/Postgres/Redis, S3+CloudFront, `deploy.yml`) is planned, not built — there's no deploy target yet, so there's nothing to run locally from this folder.

## What actually exists and runs today

- **CI**: `.github/workflows/ci.yml` — runs on every PR, scoped per changed package (`api/**`, `mobile/**`), plus secret-scanning on every PR. You don't run this manually; GitHub Actions runs it. See `infra/CLAUDE.md` for how it's wired.
- **Local dev infra** for the API (Postgres + Redis) lives in `api/docker-compose.yml`, not here — see `/api/README.md`.

## When this becomes real

When an infra/deploy target is picked up as a task, this README will be replaced with actual setup steps (Terraform init, AWS credentials, environments) — see `infra/CLAUDE.md`'s "Deploy workflow (future)" section for the plan.
