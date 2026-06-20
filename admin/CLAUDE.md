# /admin — Cravio internal + brand web dashboard

Internal web dashboard for platform management, and the brand-facing web dashboard. Scaffolded in Phase 0; basic brand web flows ship in Phase 1, expanded in Phase 2.

## Stack
- React (web) + the committed FastAPI backend (consumes `/docs/openapi.yaml`)
- TypeScript
- Same generated API client approach as /mobile

## Conventions
- **Generated API types** from `/docs/openapi.yaml`.
- **Role-gated.** Admin routes require platform-admin role; brand routes require brand role. Enforce server-side regardless of UI gating.
- **Reuse design tokens** from the shared design system where practical.
- **Secrets by name only.**

## P0/early scope (this package)
- Admin (P0): content moderation, fake-campaign reporting review, brand/influencer banning.
- Brand web (Phase 1 basic): brand onboarding + campaign creation mirroring the mobile builder.
- Platform analytics dashboard (P1): GMV, DAU, campaign success rates (from PostHog + backend).
