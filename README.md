# Cravio

India's commission-free, verified, AI-augmented influencer marketplace — connecting brands directly with influencers, with payment security and AI-powered collaboration.

This is a **solo + AI-agent build**. The PRD (`docs/Cravio requirements.docx`) is the single source of truth for product scope. This README and the documents under `docs/` are the operational layer agents build from.

## Division of labor

| Actor | Owns |
|-------|------|
| **Claude Code** | Repo scaffolding, FastAPI services, DB schema/migrations, React Native app, integrations (Razorpay/Meta/Firebase), tests, CI/CD, infra-as-code. |
| **Cowork** | Market validation, waitlist/landing copy, Knowledge Hub content, App Store assets, competitor monitoring, founder ops, and turning roadmap items into scoped agent tasks. |
| **Founder (Rushi)** | Product decisions, the PRD Open Questions, design direction approval, accepting/rejecting agent output. |

## Repository structure (monorepo)

```
/api      FastAPI backend (Python 3.12) — REST + WebSocket, OpenAPI contract
/mobile   React Native app (iOS + Android), single codebase
/admin    Internal web dashboard + brand web dashboard (Phase 2)
/infra    Infrastructure-as-code (AWS), CI/CD config
/docs     PRD, ADRs, OpenAPI contract, task cards
```

Each top-level package owns a `CLAUDE.md` describing its conventions, entry points, and how to run/test it, so Claude Code has local context per package.

## Committed stack (authoritative — see ADRs for rationale)

| Concern | Choice |
|---------|--------|
| API backend | Python 3.12 + FastAPI |
| Database | PostgreSQL (primary) + Redis (cache/sessions) |
| Media storage | AWS S3 + CloudFront |
| Auth | Firebase Auth (social + OTP via Twilio/MSG91) |
| Payments | Razorpay (Route for escrow) |
| AI features | Claude API (Anthropic) |
| Social verification | Meta Business API + YouTube Data API |
| Search | Postgres full-text + trigram (MVP) → Algolia at scale |
| Push | Firebase FCM |
| Analytics | PostHog |
| Mobile | React Native |

## Agent task conventions

- **One vertical feature per task** (e.g. "influencer onboarding API + screen"), sized to a single agent session — not whole epics.
- **Acceptance criteria as testable assertions.** Claude Code writes tests first, then implementation.
- **Priority order:** build all P0 for a phase before P1. P0/P1/P2 in the PRD Feature Requirements map directly to task ordering. See `docs/P0-task-cards.md`.
- **Integrations stubbed first.** Meta API, Razorpay, Firebase sit behind interfaces so features can be built and tested before live credentials exist.

## Build conventions

- API is REST + WebSocket. The OpenAPI spec (`docs/openapi.yaml`) is auto-generated from the backend and committed, so agents and the mobile app share one contract.
- Secrets live in environment / secret manager only — never in code or docs. Reference key *names*, not values.
- Every PR runs lint + tests in CI before merge. Agent-authored changes are reviewed by the founder against the task's acceptance criteria.

## Phase gates

- **Phase 0 — Foundation:** repo scaffold + agent conventions + integration stubs + design system ready. (These docs are part of Phase 0.)
- **Phase 1 — MVP:** all P0 features shipped, iOS + Android live.
- **Phase 2 — Core Platform:** escrow + subscriptions + P1 features.
- **Phase 3 — Scale:** cross-platform verification + regional languages + agency.

## Docs index

- `docs/adr/` — one Architecture Decision Record per committed-stack choice.
- `docs/openapi.yaml` — P0 API contract (draft).
- `docs/P0-task-cards.md` — Phase 1 P0 work sliced into agent-sized tasks.
