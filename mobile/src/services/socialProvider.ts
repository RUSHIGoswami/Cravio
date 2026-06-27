/**
 * Vendor social-OAuth boundary (Meta Business / YouTube Data) — mirrors authProvider.
 * Per ADR-0008 and the "integrations stubbed first" convention, no feature imports
 * the Meta/Google SDK directly. The stub returns a deterministic oauth code so the
 * onboarding flow is fully exercisable end-to-end against the stubbed
 * VerificationProvider on the API. Live wiring swaps THIS module only (behind the
 * per-provider config flag); callers are unchanged.
 */
import type { components } from '../api/openapi';

export type Platform = components['schemas']['Platform'];

export async function authorizeSocial(platform: Platform): Promise<string> {
  // TODO: replace with the real Meta/YouTube OAuth handshake returning an auth code.
  return `stub-oauth-${platform}`;
}
