# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This repo is currently **Phase 0 (foundation/scaffold)** — `docs/`, ADRs, and per-package `CLAUDE.md` files exist, but `/api`, `/mobile`, `/admin`, `/infra` contain no code yet beyond their `CLAUDE.md`. Foundation cards F1–F5 in `docs/P0-task-cards.md` are what stand up the actual app skeletons. Don't assume implementation exists — check before referencing files in those packages.

## What this is

Cravio: India's commission-free, verified, AI-augmented influencer marketplace, connecting brands directly with influencers. Built solo + AI-agent. **`Cravio requirements.docx` is the single source of truth for product scope** — the README and `docs/` are the operational layer agents build from.

## Repository structure (monorepo)

```
/api      FastAPI backend (Python 3.12) — REST + WebSocket, source of the OpenAPI contract
/mobile   React Native app (iOS + Android), single codebase
/admin    Internal web dashboard + brand web dashboard (Phase 2 expands it)
/infra    Infrastructure-as-code (AWS), CI/CD config
/docs     PRD, ADRs, OpenAPI contract, task cards
```

Each top-level package has its own `CLAUDE.md` with package-specific stack, conventions, and run/test commands — read it before working in that package:
- `api/CLAUDE.md`
- `mobile/CLAUDE.md`
- `admin/CLAUDE.md`
- `infra/CLAUDE.md`

## Committed stack (authoritative — see `docs/adr/` for rationale)

| Concern | Choice | ADR |
|---------|--------|-----|
| API backend | Python 3.12 + FastAPI | 0002 |
| Database | PostgreSQL (primary) + Redis (cache/sessions) | 0003 |
| Auth | Firebase Auth (social + OTP via Twilio/MSG91) | 0004 |
| Payments | Razorpay (Route for escrow) | 0005 |
| Media storage | AWS S3 + CloudFront | 0006 |
| AI features | Claude API (Anthropic) | 0007 |
| Social verification | Meta Business API + YouTube Data API | 0008 |
| Search | Postgres full-text + trigram (MVP) → Algolia at scale | 0009 |
| Push | Firebase FCM | 0010 |
| Analytics | PostHog | 0011 |
| Mobile | React Native | 0012 |

Monorepo structure itself is ADR-0001.

## Core build conventions (apply across all packages)

- **Tests first.** Each task's acceptance criteria are testable assertions — write the tests, then implement until green.
- **Integrations stubbed first.** Meta/YouTube (`VerificationProvider`), Razorpay (`PaymentProvider`), Firebase (`AuthProvider`), Claude (`AIService`), search (`SearchService`), FCM (`NotificationService`) all sit behind interfaces. No feature imports a vendor SDK directly — deterministic stubs first, live wiring is a separate task. A config flag selects stub vs. live per provider.
- **OpenAPI is generated, not hand-written.** `/docs/openapi.yaml` is regenerated from the FastAPI route/schema definitions (`python -m app.scripts.export_openapi` in `/api`). CI fails if the committed spec drifts from code. Mobile/admin generate their API client types from this file — never hand-maintain endpoint types.
- **Secrets by name only.** Read from environment / secret manager. Never commit values, never put them in docs.
- **Build order = priority.** P0 before P1 before P2, per `docs/P0-task-cards.md`. Foundation cards (F1–F5) gate everything else; feature cards declare explicit `Depends on` — check a card's dependency is actually done before starting it.
- **One vertical feature per task**, sized to a single agent session (e.g. "influencer onboarding API + screen"), not whole epics.

## Phase gates

- **Phase 0 — Foundation:** repo scaffold + agent conventions + integration stubs + design system ready.
- **Phase 1 — MVP:** all P0 features shipped (`docs/P0-task-cards.md`), iOS + Android live.
- **Phase 2 — Core Platform:** escrow + subscriptions + P1 features (deferred-to-Phase-2 list is at the bottom of `docs/P0-task-cards.md`).
- **Phase 3 — Scale:** cross-platform verification + regional languages + agency.

## Docs index

- `Cravio requirements.docx` — PRD, source of truth for product scope.
- `docs/adr/` — one Architecture Decision Record per committed-stack choice.
- `docs/openapi.yaml` — P0 API contract (draft, regenerated from `/api`).
- `docs/P0-task-cards.md` — Phase 1 P0 work sliced into agent-sized vertical-slice tasks with dependencies and acceptance criteria. Check this before starting any feature work.
- `docs/design-brief.md` — design system brief for Claude Design; tokens sync into `/mobile` and `/admin`.
- `docs/dev-setup.md` — local tooling prerequisites per foundation card (F1–F5).
- `docs/claude-code-foundation-prompts.md` — the prompts used to run foundation cards F1+.
