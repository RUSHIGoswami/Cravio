# Cravio — P0 Task Cards (Phase 1 MVP)

These are the Phase 1 MVP gate items ("all P0 features shipped + iOS/Android live") sliced into **agent-sized vertical slices** — one feature, one Claude Code session. Conventions (from the PRD / README):

- **Tests first.** Each card's acceptance criteria are testable assertions; Claude Code writes tests, then implementation.
- **Build order = priority.** Do cards top to bottom. Foundation (F) cards gate everything; feature cards list their `Depends on`.
- **Integrations stubbed first.** Meta/YouTube, Razorpay, Firebase, Claude sit behind interfaces with deterministic stubs (ADR-0005/0007/0008/0009/0010). A card is "done" against the stub; live wiring is a separate card.
- **P0 features deferred to Phase 2 by the roadmap** (e.g. escrow, Collab Pass subscription, two-way rating) are noted but **not** in this list.

Card format: **ID · Title** — package(s) · depends on · description · acceptance criteria.

---

## Foundation (do first — Phase 0 → Phase 1 boundary)

### F1 · Monorepo + CI skeleton
**Package:** /infra, root · **Depends on:** — 
Stand up the monorepo (`/api`, `/mobile`, `/admin`, `/infra`, `/docs`) with per-package `CLAUDE.md` (already drafted), GitHub Actions running lint + tests per changed package, and secret-scanning.
**Acceptance criteria:**
- CI runs on PR, scopes jobs to changed packages, and blocks merge on lint/test failure.
- A trivial passing test in `/api` and `/mobile` is green in CI.
- Secret-scanning is enabled and fails on a planted dummy secret.

### F2 · API app + DB + migration baseline
**Package:** /api · **Depends on:** F1 
FastAPI app boots; SQLAlchemy + Alembic configured against Postgres; Redis connected; health endpoint.
**Acceptance criteria:**
- `GET /health` returns 200 with DB + Redis connectivity status.
- `alembic upgrade head` runs cleanly on an empty DB in CI.
- A baseline migration creates the `users` table.

### F3 · OpenAPI export + drift check
**Package:** /api, /infra · **Depends on:** F2 
Script regenerates `/docs/openapi.yaml` from FastAPI; CI fails if the committed spec drifts from code.
**Acceptance criteria:**
- `python -m app.scripts.export_openapi` writes `/docs/openapi.yaml`.
- CI regenerates and fails the build if the committed file differs.

### F4 · Provider interfaces + stubs
**Package:** /api · **Depends on:** F2 
Define and stub `AuthProvider` (Firebase), `VerificationProvider` (Meta/YouTube), `PaymentProvider` (Razorpay), `AIService` (Claude), `SearchService`, `NotificationService` (FCM). Deterministic test stubs only.
**Acceptance criteria:**
- Each interface has a stub returning deterministic fixtures.
- Unit tests cover each stub; no vendor SDK is imported outside its provider module.
- A config flag selects stub vs live implementation per provider.

### F5 · Mobile app shell + generated API client + design system bootstrap
**Package:** /mobile · **Depends on:** F3 
RN app boots on iOS + Android; API client generated from `/docs/openapi.yaml`; design tokens/component-library scaffold wired (synced from Claude Design).
**Acceptance criteria:**
- App builds and runs on iOS simulator and Android emulator.
- Generated API client compiles and calls `GET /health` successfully against local API.
- At least one design-system component (Button) renders from the shared library using synced tokens.

---

## Authentication & Onboarding (P0)

### A1 · Social sign-up + role selection (API)
**Package:** /api · **Depends on:** F4 
Verify Firebase ID tokens; create/lookup user; persist role (Influencer/Brand) chosen at onboarding.
**Acceptance criteria:**
- Valid Firebase token (stub) creates a user and returns an internal session/JWT + role state.
- Invalid/expired token returns 401.
- Role can be set once at onboarding; endpoint rejects an unset role on role-gated routes.

### A2 · Social sign-up + role selection (mobile)
**Package:** /mobile · **Depends on:** A1, F5 
Sign-up/login via Google, Apple, mobile OTP; "I am an Influencer / I am a Brand" selection.
**Acceptance criteria:**
- User can complete Google, Apple, and OTP sign-in (against Firebase Auth) and land on role selection.
- Selected role routes the user into the correct onboarding flow.
- Auth token is stored securely and attached to API calls.

### A3 · Influencer profile setup + verification connect (API)
**Package:** /api · **Depends on:** A1, F4 
Influencer enters niche/bio/content categories; connect Instagram (Meta) + YouTube via `VerificationProvider`; pull and store verified metrics; assign verified badge; snapshot metrics for later fraud-delta.
**Acceptance criteria:**
- Connecting via stubbed `VerificationProvider` stores follower count, reach, engagement, and a verified badge flag.
- A metric snapshot row is written with a timestamp (for fraud-delta history).
- Profile fields (niche, bio, categories) validate and persist.

### A4 · Influencer onboarding flow (mobile)
**Package:** /mobile · **Depends on:** A3, A2 
Full flow: role → sign-up → connect Instagram/YouTube → verified metrics shown → set niche/bio/categories → (optional Collab Pass placeholder) → land on campaign feed.
**Acceptance criteria:**
- End-to-end flow completes against stubbed verification and shows verified metrics + badge.
- Validation errors are surfaced inline; flow is resumable if abandoned.
- On completion the user lands on the campaign discovery feed.

### A5 · Brand profile setup (API + mobile)
**Package:** /api, /mobile · **Depends on:** A1, A2 
Company name, industry, website, optional GST; brand lands ready to create a campaign.
**Acceptance criteria:**
- Brand profile validates and persists; GST optional.
- Brand role can reach the campaign builder; influencer role cannot (server-enforced).

---

## Influencer Discovery — Brand-facing (P0)

### D1 · Search + filters + location filter (API)
**Package:** /api · **Depends on:** A3 
Discovery query via `SearchService` (Postgres FT + trigram): filter by niche, city/state/region, follower range, engagement rate, platform, language.
**Acceptance criteria:**
- Each filter narrows results correctly; combined filters AND together.
- Trigram name search returns fuzzy matches; results are paginated.
- Query p95 stays within target on a seeded dataset (document the seed size).

### D2 · Verified metrics + portfolio view (API)
**Package:** /api · **Depends on:** A3 
Return live verified metrics and the "My Influence" portfolio (past collabs, samples, ratings) for a given influencer.
**Acceptance criteria:**
- Verified metrics endpoint returns follower/reach/engagement sourced from the verification path (cached in Redis with TTL).
- Portfolio endpoint returns collaborations, content samples, and rating summary.

### D3 · Discovery + shortlist UI (mobile/admin brand view)
**Package:** /mobile, /admin · **Depends on:** D1, D2, A5 
Brand searches/filters influencers, views verified metrics + portfolio, saves to a per-campaign shortlist.
**Acceptance criteria:**
- Brand can apply filters and see verified-metric cards.
- Brand can save/remove influencers to a named shortlist; shortlist persists per campaign.
- Tapping an influencer opens portfolio (My Influence) view.

---

## Campaign Management — Brand-facing (P0)

### C1 · Campaign builder + types + deadlines (API)
**Package:** /api · **Depends on:** A5 
5-step campaign model (title → brief → requirements → budget/timeline → review); types: Paid, Barter, Performance-based; content-delivery + posting deadlines; multi-influencer support; auto-filter so only matching influencers can apply.
**Acceptance criteria:**
- A campaign can be created with all 5 steps, a type, and deadlines; goes live on publish.
- Matching rules (niche/location/etc.) determine eligible applicants; non-matching applications are rejected by the API.
- A campaign supports multiple selected influencers.

### C2 · Campaign builder UI (mobile + brand web)
**Package:** /mobile, /admin · **Depends on:** C1 
5-step wizard with review screen; set type, budget, timeline, deadlines.
**Acceptance criteria:**
- Wizard validates each step; review screen reflects all entered data before publish.
- Published campaign appears in the influencer discovery feed (E1).
- Brand web mirror creates an equivalent campaign.

---

## Influencer Tools (P0)

### E1 · Campaign discovery feed (API + mobile)
**Package:** /api, /mobile · **Depends on:** C1, A4 
Browse open campaigns filterable by niche, pay, collab type; only matching campaigns are eligible to apply.
**Acceptance criteria:**
- Feed returns live, matching campaigns with filters applied; paginated.
- Non-matching campaigns are not applyable (server-enforced).

### E2 · Application flow + tracker (API)
**Package:** /api · **Depends on:** E1, C1 
Influencer applies; brand reviews applicants with verified metrics; brand selects influencer(s). Status: Applied → Under Review → Selected/Rejected.
**Acceptance criteria:**
- Apply creates an application in `Applied`; duplicate applications are rejected.
- Brand can list applicants with verified metrics and move status; influencer sees status updates.
- Selecting an influencer transitions state and triggers a notification event (G1).

### E3 · Application UI + tracker (mobile)
**Package:** /mobile · **Depends on:** E2 
Apply from feed (tap to apply; swipe-right is P1/Phase 2), view application status tracker.
**Acceptance criteria:**
- Influencer can apply from a campaign and see it in the tracker with correct status.
- Status changes from the brand reflect in the influencer's tracker.

### E4 · My Influence portfolio (API + mobile)
**Package:** /api, /mobile · **Depends on:** A3 
Verified showcase: past collaborations, follower stats, niche tags, content samples.
**Acceptance criteria:**
- Completed collaborations appear automatically in the influencer's My Influence.
- Verified follower stats and niche tags render; content samples upload via S3 pre-signed URLs (ADR-0006).

---

## Payments — direct payout (P0; escrow deferred to Phase 2)

### P1 · Direct payout + payout methods (API)
**Package:** /api · **Depends on:** E2, F4 
Via stubbed then live `PaymentProvider` (Razorpay Payouts): pay influencer after content approval; methods: bank transfer, UPI, Paytm, Razorpay; guaranteed payout within N days of approval.
**Acceptance criteria:**
- After a brand approves delivered content, a payout is initiated through the provider (stub) and recorded.
- Payout method selection (UPI/bank/Paytm) is validated and stored.
- Razorpay webhooks (payment/payout/refund) are signature-verified and idempotent.

### P2 · Content delivery + approval + payout UX (mobile + brand web)
**Package:** /mobile, /admin · **Depends on:** P1 
Influencer delivers content; brand reviews + approves; payout released; both see status.
**Acceptance criteria:**
- Influencer can submit deliverables; brand can approve/request changes.
- Approval triggers payout (P1) and a notification (G1); both parties see payout status.

---

## Notifications (P0)

### G1 · Push notifications (API + mobile)
**Package:** /api, /mobile · **Depends on:** F4, A2 
FCM device-token registration; send on key events: new matching campaign, application status change, content approval, payout.
**Acceptance criteria:**
- Device token is registered on login and refreshed; stale tokens pruned.
- Each domain event sends a push via the `NotificationService` (stub asserts payload); respects user preferences.

---

## Admin & Platform (P0)

### M1 · Moderation, reporting, banning (API + admin web)
**Package:** /api, /admin · **Depends on:** F2, A1 
Content moderation queue; influencers flag suspicious campaigns; admin bans repeat offenders.
**Acceptance criteria:**
- Flagged campaigns/profiles appear in a moderation queue; admin can action them.
- Influencer can report a campaign; report is recorded and surfaced to admin.
- Banning an account blocks its access (server-enforced) and is auditable.

---

## Launch (P0 gate)

### L0 · Deploy pipeline
**Package:** /infra · **Depends on:** F1, first deploy target 
Add `.github/workflows/deploy.yml` triggered on `push: main` (and/or release tags). Reuse `ci.yml` via `workflow_call` as a pre-deploy build+smoke gate, then deploy. Auto-deploy to staging on `main`; gate production behind manual approval / release tag via GitHub Environments. (CI validation stays PR-only — see `infra/CLAUDE.md` "CI on PR, deploy on main".)
**Acceptance criteria:**
- `deploy.yml` runs only on `main` (and/or tags); it calls the CI workflow and aborts the deploy if that gate fails.
- A push to `main` deploys to staging; production requires explicit approval/tag.
- Secrets come from the secret manager / GitHub Environments, by name only.

### L1 · Store readiness + observability
**Package:** /infra, /mobile · **Depends on:** all above 
PostHog instrumentation for core funnels (onboarding, application, payout), crash/error reporting, uptime monitoring (99.5% target), iOS + Android store builds.
**Acceptance criteria:**
- Onboarding, application, and payout funnels are tracked in PostHog (no PAN/bank PII per ADR-0011).
- Release builds pass store validation for iOS and Android.
- Uptime/error monitoring is live with alerting.

---

### Deferred to Phase 2 (listed in PRD as P0/P1 but gated later by the roadmap)
Escrow payments, OTP-backed contracts, Collab Pass subscription, brand subscription plans, AI caption/script generator, swipe-right apply UX, in-app dispute resolution, two-way rating, basic campaign analytics, blog/Rising Influencer.
