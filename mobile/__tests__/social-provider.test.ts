/**
 * socialProvider — vendor OAuth boundary (Meta / YouTube), mirrors authProvider.
 * Per build conventions the stub is deterministic so the onboarding flow is
 * fully exercisable without a live SDK. Live wiring swaps this module only.
 */
import { authorizeSocial } from '../src/services/socialProvider';

describe('socialProvider (stub)', () => {
  it('returns a deterministic non-empty oauth code for instagram', async () => {
    await expect(authorizeSocial('instagram')).resolves.toBe('stub-oauth-instagram');
  });

  it('returns a deterministic non-empty oauth code for youtube', async () => {
    await expect(authorizeSocial('youtube')).resolves.toBe('stub-oauth-youtube');
  });
});
