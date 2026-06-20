# ADR-0004: Firebase Auth for authentication

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Founder
- **Phase:** Phase 0

## Context
Onboarding (P0) needs Google, Apple, and mobile-OTP sign-in across iOS and Android, fast, with minimal security surface for a solo founder to own. We separately need verified social metrics (Meta/YouTube) — that is identity *verification*, not authentication, and is handled elsewhere (ADR-0008).

## Decision
Firebase Auth for social login and OTP. OTP delivery via Twilio/MSG91. The backend verifies Firebase ID tokens and issues/maps to internal user records and roles (Influencer/Brand).

## Rationale
- Off-the-shelf Google/Apple/phone-OTP across both platforms saves weeks of work and avoids owning credential storage.
- Mature React Native SDKs reduce mobile integration risk.
- ID-token verification keeps our backend stateless for auth while we map to internal roles.

## Alternatives considered
- **Roll our own (Authlib + OTP):** maximum control, but a large security/maintenance burden for a solo founder pre-revenue.
- **Auth0/Clerk/Supabase Auth:** capable, but Firebase pairs naturally with FCM (ADR-0010) and is cost-effective at our stage.

## Consequences
- Vendor dependency on Firebase; mitigate by keeping our user model authoritative and Firebase as the identity provider only.
- Must verify Firebase ID tokens server-side on every authenticated request (or via short-lived internal session).
- KYC/PAN (P1) and social verification (Meta/YouTube) are explicitly *separate* from auth.
