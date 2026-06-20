# /mobile — Cravio app

React Native app, single codebase for iOS (14+) and Android (8+). Consumes the committed OpenAPI contract.

## Stack
- React Native (start with Expo; eject if native modules require it — decide at scaffold, see ADR-0012)
- TypeScript
- API client generated from `/docs/openapi.yaml` (do not hand-write request types)
- Firebase Auth + FCM SDKs, Razorpay SDK, Meta OAuth
- Component library implementing the design system (tokens imported from Claude Design via design-sync)

## Conventions
- **Generated API types.** Regenerate the client from `/docs/openapi.yaml` when the contract changes; never hand-maintain endpoint types.
- **Design system is the styling contract.** Use components from the shared library; no ad-hoc inline styles that bypass tokens.
- **Performance targets.** Discovery feed and swipe UX must hold 60fps and <2s load on 4G — profile these screens.
- **Secrets by name only.** No keys in the bundle; use build-time env + secure storage.
- **Tests.** Component tests for screens; integration tests for onboarding and application flows against the API stub.

## Suggested layout
```
mobile/
  src/
    api/               # generated client + thin wrappers
    components/        # design-system component library
    screens/           # onboarding, discovery, campaign, application, profile (My Influence)
    navigation/
    services/          # auth, push, payments wrappers
    theme/             # design tokens (synced from Claude Design)
  app.json / app.config.ts
  tests/
```

## P0 scope (this package)
Role selection + sign-up (Google/Apple/OTP), influencer onboarding (Meta/YouTube connect → verified metrics), brand onboarding, discovery (search + filters), campaign 5-step builder (brand), campaign feed + apply (influencer), application tracker, My Influence portfolio, push notifications, direct-payout UX. See `/docs/P0-task-cards.md`.
