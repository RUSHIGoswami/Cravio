# ADR-0008: Meta Business API + YouTube Data API for verification (stub-first)

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Founder
- **Phase:** Phase 0 (interface + stub) / Phase 1 (live)

## Context
Verified follower/engagement data is the core trust differentiator — screenshots are faked, so we pull live metrics via official APIs. Cross-platform verification (Instagram + YouTube) is a Phase 1 differentiator. Live credentials and app review take time, so features must be buildable before they exist.

## Decision
Integrate Meta Business API (Instagram) and YouTube Data API for verified metrics and audience insights. Define a `VerificationProvider` interface with deterministic stubs; build and test all dependent P0 features against the stub, then wire live providers.

## Rationale
- Official APIs are the only credible anti-fake-follower signal; this is the moat.
- A provider interface decouples feature work from Meta/YouTube app-review timelines.
- Stubs give reproducible test fixtures for discovery, profiles, and fraud-delta logic.

## Alternatives considered
- **Scraping / third-party metric vendors:** fragile, ToS-risky, and not credibly "verified." Kept only as a manual fallback per the risk register.
- **Instagram only at MVP:** rejected — YouTube in Phase 1 is an explicit differentiator vs Influish.

## Consequences
- Hard dependency on Meta/YouTube API access and rate limits; risk register mandates a manual-verification fallback.
- Fraud detection consumes metric deltas over time — store historical snapshots from day one.
- All integration code lives behind the interface; no feature imports the Meta/YouTube SDK directly.
