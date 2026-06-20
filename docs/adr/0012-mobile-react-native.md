# ADR-0012: React Native for the mobile app

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Founder
- **Phase:** Phase 0

## Context
The product is mobile-first (iOS 14+, Android 8+) and must ship both platforms on a solo budget, with <2s load on 4G. A shared design system/component library is a Phase 0 gate item and now flows from Claude Design via design-sync.

## Decision
React Native, single codebase for iOS + Android. A shared component library implements the design system; design tokens are imported from Claude Design and kept in sync with the repo.

## Rationale
- One codebase for both platforms is the only realistic path for a solo founder to launch both.
- Large ecosystem and mature SDKs for Firebase Auth/FCM, Razorpay, and Meta OAuth.
- Design-system handoff from Claude Design to React Native components reduces design-to-code drift.

## Alternatives considered
- **Flutter:** excellent performance, but pulls us into Dart, away from the JS/React ecosystem and the design-sync flow.
- **Native iOS + Android:** best per-platform UX, but doubles the build surface — untenable solo pre-revenue.
- **Expo vs bare RN:** start with Expo for speed; eject if native modules (Razorpay/Meta) require it. Decide at scaffold time.

## Consequences
- Native-module integrations (payments, social OAuth, push) need care and device testing.
- Performance-sensitive screens (discovery feed, swipe UX) need profiling against the <2s/60fps targets.
- The component library is the contract with the design system; changes go through it, not ad-hoc styles.
