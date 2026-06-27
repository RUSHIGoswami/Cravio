/**
 * influencerService — A4 data layer.
 * Wraps the generated client for the /influencer/profile endpoints A3 shipped:
 *  - getProfile (resume state; null on 404)
 *  - ensureProfile (create-if-missing so /connect's 404 guard is satisfied)
 *  - updateProfile (niche/bio/categories)
 *  - connectSocial (verified metrics from stubbed VerificationProvider)
 * Mocks apiClient to avoid openapi-fetch/fetch timing issues (mirrors auth-service.test).
 */
jest.mock('../src/api/client', () => ({
  apiClient: { GET: jest.fn(), PUT: jest.fn(), POST: jest.fn() },
}));

import { apiClient } from '../src/api/client';
import { getProfile, ensureProfile, updateProfile, connectSocial } from '../src/services/influencerService';

type Method = 'GET' | 'PUT' | 'POST';

function resolve(method: Method, data: unknown) {
  (apiClient[method] as jest.Mock).mockResolvedValueOnce({ data, error: null, response: { status: 200 } });
}
function reject(method: Method, status: number) {
  (apiClient[method] as jest.Mock).mockResolvedValueOnce({ data: null, error: { detail: 'err' }, response: { status } });
}

const EMPTY = { user_id: 'u1', niche: null, bio: null, categories: [], verified: false, social_accounts: [] };
const VERIFIED = {
  user_id: 'u1',
  niche: null,
  bio: null,
  categories: [],
  verified: true,
  social_accounts: [
    { platform: 'instagram', followers: 12000, reach: 48000, engagement_rate: 4.2, connected_at: '2026-01-01T00:00:00Z' },
  ],
};

describe('influencerService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('GETs /influencer/profile with a bearer header', async () => {
      resolve('GET', EMPTY);
      await getProfile('jwt-1');
      expect(apiClient.GET).toHaveBeenCalledWith('/influencer/profile', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-1' }),
      }));
    });

    it('returns null when no profile exists yet (404)', async () => {
      reject('GET', 404);
      await expect(getProfile('jwt-1')).resolves.toBeNull();
    });

    it('throws on non-404 errors (e.g. 401)', async () => {
      reject('GET', 401);
      await expect(getProfile('jwt-1')).rejects.toThrow();
    });
  });

  describe('ensureProfile', () => {
    it('returns the existing profile without writing when one exists', async () => {
      resolve('GET', VERIFIED);
      const p = await ensureProfile('jwt-1');
      expect(p).toMatchObject({ verified: true });
      expect(apiClient.PUT).not.toHaveBeenCalled();
    });

    it('creates an empty profile via PUT when none exists (404)', async () => {
      reject('GET', 404);
      resolve('PUT', EMPTY);
      const p = await ensureProfile('jwt-1');
      expect(apiClient.PUT).toHaveBeenCalledWith('/influencer/profile', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-1' }),
        body: { niche: null, bio: null, categories: [] },
      }));
      expect(p).toMatchObject({ verified: false });
    });
  });

  describe('updateProfile', () => {
    it('PUTs niche/bio/categories with a bearer header', async () => {
      resolve('PUT', { ...EMPTY, niche: 'Fashion', categories: ['Fashion'] });
      await updateProfile('jwt-1', { niche: 'Fashion', bio: 'hi', categories: ['Fashion'] });
      expect(apiClient.PUT).toHaveBeenCalledWith('/influencer/profile', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-1' }),
        body: { niche: 'Fashion', bio: 'hi', categories: ['Fashion'] },
      }));
    });

    it('throws when the server rejects the update (422)', async () => {
      reject('PUT', 422);
      await expect(updateProfile('jwt-1', { niche: 'x', bio: null, categories: [] })).rejects.toThrow();
    });
  });

  describe('connectSocial', () => {
    it('POSTs /influencer/profile/connect with platform + oauth_code and returns verified metrics', async () => {
      resolve('POST', VERIFIED);
      const p = await connectSocial('jwt-1', 'instagram', 'stub-oauth-instagram');
      expect(apiClient.POST).toHaveBeenCalledWith('/influencer/profile/connect', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-1' }),
        body: { platform: 'instagram', oauth_code: 'stub-oauth-instagram' },
      }));
      expect(p.verified).toBe(true);
      expect(p.social_accounts[0].followers).toBe(12000);
    });

    it('throws when connect fails (404 — profile missing)', async () => {
      reject('POST', 404);
      await expect(connectSocial('jwt-1', 'youtube', 'code')).rejects.toThrow();
    });
  });
});
