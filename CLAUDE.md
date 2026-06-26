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

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->