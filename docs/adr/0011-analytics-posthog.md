# ADR-0011: PostHog for product analytics

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Founder
- **Phase:** Phase 0 (decision) / Phase 1 (instrument)

## Context
We need funnel tracking and behavioral analytics (onboarding completion, application conversion, Collab Pass conversion) to manage success metrics, without heavy cost pre-revenue. DPDP Act 2023 compliance constrains what we collect and where.

## Decision
Use PostHog for product analytics and funnels. Instrument key events client- and server-side. Configure data handling for DPDP compliance (consent, retention, India data considerations).

## Rationale
- Generous free tier and self-serve funnels suit a bootstrapped solo founder.
- Single tool for events, funnels, and feature flags reduces vendor sprawl.
- Self-host option exists if data-residency requirements tighten.

## Alternatives considered
- **Mixpanel/Amplitude:** strong analytics but pricier and another vendor; PostHog covers funnels + flags together.
- **GA4:** weak for product funnels and event modeling.

## Consequences
- Event taxonomy must be designed up front and documented so metrics are comparable over time.
- PII handling and consent are mandatory under DPDP — no raw PAN/bank data in analytics, ever.
- If residency requires it, plan a self-hosted PostHog migration path.
