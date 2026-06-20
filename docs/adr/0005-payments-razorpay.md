# ADR-0005: Razorpay (Route) for payments and escrow

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Founder
- **Phase:** Phase 0 (decision) / Phase 1 (direct payout) / Phase 2 (escrow)

## Context
We are India-first and need UPI, bank transfer, and card payments, with payouts to influencers and an escrow model (hold brand funds until content is approved). PCI-DSS must be satisfied without storing raw card data. Phase 1 ships *direct* payout; Phase 2 adds escrow.

## Decision
Razorpay as the payment gateway, using Razorpay Route for escrow/split flows. Phase 1: direct payout via Razorpay Payouts. Phase 2: funds held and released via Route. No raw card data touches our systems.

## Rationale
- Native UPI + Indian banking coverage, which global gateways handle poorly.
- Route provides the escrow/marketplace-split primitive our trust layer depends on.
- Hosted checkout/tokenization keeps us out of PCI-DSS card-storage scope.

## Alternatives considered
- **Stripe:** excellent DX but weaker India/UPI and marketplace-payout fit.
- **Cashfree/PayU:** comparable India coverage; Razorpay chosen for Route maturity and docs. Keep as fallback.

## Consequences
- Razorpay Route onboarding typically requires a registered legal entity (Private Limited) — flagged as a founder Open Question; not a code blocker because the integration is stubbed (ADR-0008 pattern).
- Webhook handling for payment/payout/refund events must be idempotent and signature-verified.
- Reconciliation and dispute/refund flows must be designed against escrow state from the start.
