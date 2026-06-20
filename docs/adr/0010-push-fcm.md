# ADR-0010: Firebase Cloud Messaging for push notifications

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Founder
- **Phase:** Phase 0 (decision) / Phase 1 (live)

## Context
Push notifications for campaign alerts, application status, and payment events are P0 for engagement. We already use Firebase Auth (ADR-0004).

## Decision
Use Firebase Cloud Messaging (FCM) for push on iOS and Android. The backend sends via the FCM Admin SDK; device tokens are stored per user and refreshed on the client.

## Rationale
- FCM is free and covers both platforms with one integration.
- Reuses the existing Firebase relationship and SDKs already in the app.
- Backend-driven sends fit our event model (campaign/application/payment events).

## Alternatives considered
- **OneSignal:** richer campaign UI, but an extra vendor where FCM already suffices.
- **APNs directly:** needed under the hood for iOS, but FCM abstracts it — no reason to manage both.

## Consequences
- Device-token lifecycle management (store, refresh, prune stale) is required.
- Notification triggers are wired to domain events; keep send logic behind a `NotificationService`.
- Respect user notification preferences and quiet hours from the start.
