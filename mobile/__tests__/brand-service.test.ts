/**
 * brandService — A5 data layer.
 * Wraps the generated client for the /brand endpoints A5 shipped:
 *  - getBrandProfile (resume state; null on 404)
 *  - saveBrandProfile (company/industry/website/optional gst)
 *  - getCampaignBuilderAccess (server-enforced brand gate)
 * Mocks apiClient to avoid openapi-fetch/fetch timing issues (mirrors auth-service.test).
 */
jest.mock('../src/api/client', () => ({
  apiClient: { GET: jest.fn(), PUT: jest.fn() },
}));

import { apiClient } from '../src/api/client';
import { getBrandProfile, saveBrandProfile, getCampaignBuilderAccess } from '../src/services/brandService';

type Method = 'GET' | 'PUT';

function resolve(method: Method, data: unknown) {
  (apiClient[method] as jest.Mock).mockResolvedValueOnce({ data, error: null, response: { status: 200 } });
}
function reject(method: Method, status: number) {
  (apiClient[method] as jest.Mock).mockResolvedValueOnce({ data: null, error: { detail: 'err' }, response: { status } });
}

const PROFILE = {
  user_id: 'u1',
  company_name: 'Acme',
  industry: 'Tech',
  website: 'https://acme.example.in',
  gst: null,
};

describe('brandService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getBrandProfile', () => {
    it('GETs /brand/profile with a bearer header', async () => {
      resolve('GET', PROFILE);
      await getBrandProfile('jwt-1');
      expect(apiClient.GET).toHaveBeenCalledWith('/brand/profile', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-1' }),
      }));
    });

    it('returns null when no profile exists yet (404)', async () => {
      reject('GET', 404);
      await expect(getBrandProfile('jwt-1')).resolves.toBeNull();
    });

    it('throws on non-404 errors (e.g. 403)', async () => {
      reject('GET', 403);
      await expect(getBrandProfile('jwt-1')).rejects.toThrow();
    });
  });

  describe('saveBrandProfile', () => {
    it('PUTs company/industry/website/gst with a bearer header', async () => {
      resolve('PUT', { ...PROFILE, gst: '22AAAAA0000A1Z5' });
      await saveBrandProfile('jwt-1', {
        company_name: 'Acme',
        industry: 'Tech',
        website: 'https://acme.example.in',
        gst: '22AAAAA0000A1Z5',
      });
      expect(apiClient.PUT).toHaveBeenCalledWith('/brand/profile', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-1' }),
        body: {
          company_name: 'Acme',
          industry: 'Tech',
          website: 'https://acme.example.in',
          gst: '22AAAAA0000A1Z5',
        },
      }));
    });

    it('throws when the server rejects the update (422)', async () => {
      reject('PUT', 422);
      await expect(
        saveBrandProfile('jwt-1', { company_name: 'x', industry: 'y', website: 'bad', gst: null }),
      ).rejects.toThrow();
    });
  });

  describe('getCampaignBuilderAccess', () => {
    it('GETs /brand/campaign-builder and returns the gate payload', async () => {
      resolve('GET', { can_create_campaign: true, profile_complete: false });
      const access = await getCampaignBuilderAccess('jwt-1');
      expect(apiClient.GET).toHaveBeenCalledWith('/brand/campaign-builder', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-1' }),
      }));
      expect(access.can_create_campaign).toBe(true);
    });

    it('throws when the gate denies access (403 — not a brand)', async () => {
      reject('GET', 403);
      await expect(getCampaignBuilderAccess('jwt-1')).rejects.toThrow();
    });
  });
});
