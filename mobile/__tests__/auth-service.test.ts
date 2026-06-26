/**
 * authService — criteria 1 (token capture after login) + criterion 3 (secure storage, bearer header).
 * Mocks apiClient and secureStorage to avoid openapi-fetch/fetch timing issues.
 */
jest.mock('../src/services/secureStorage', () => ({
  storeToken: jest.fn(async () => {}),
  getToken: jest.fn(async () => null),
  deleteToken: jest.fn(async () => {}),
}));

jest.mock('../src/api/client', () => ({
  apiClient: {
    POST: jest.fn(),
    GET: jest.fn(),
  },
}));

import { storeToken, getToken } from '../src/services/secureStorage';
import { apiClient } from '../src/api/client';
import { login, setRole, getMe, getStoredToken } from '../src/services/authService';

function resolvePost(data: unknown) {
  (apiClient.POST as jest.Mock).mockResolvedValueOnce({ data, error: null, response: { status: 200 } });
}

function resolveGet(data: unknown) {
  (apiClient.GET as jest.Mock).mockResolvedValueOnce({ data, error: null, response: { status: 200 } });
}

function rejectPost(status: number) {
  (apiClient.POST as jest.Mock).mockResolvedValueOnce({ data: null, error: { detail: 'err' }, response: { status } });
}

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('calls POST /auth/login with firebase_token', async () => {
      resolvePost({ access_token: 'jwt-abc', token_type: 'bearer', role: null, role_set: false });
      await login('stub-google-xyz');
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/login', expect.objectContaining({
        body: { firebase_token: 'stub-google-xyz' },
      }));
    });

    it('stores returned JWT in secure storage (criterion 3)', async () => {
      resolvePost({ access_token: 'jwt-abc', token_type: 'bearer', role: null, role_set: false });
      await login('stub-google-xyz');
      expect(storeToken).toHaveBeenCalledWith('jwt-abc');
    });

    it('returns LoginResponse payload', async () => {
      const payload = { access_token: 'jwt-abc', token_type: 'bearer', role: null, role_set: false };
      resolvePost(payload);
      const result = await login('stub-google-xyz');
      expect(result).toMatchObject(payload);
    });

    it('throws when server returns error (e.g. 401)', async () => {
      rejectPost(401);
      await expect(login('invalid.token')).rejects.toThrow();
    });
  });

  describe('setRole (criterion 3 — bearer header attached)', () => {
    it('calls POST /auth/role with Authorization: Bearer header', async () => {
      resolvePost({ role: 'influencer', role_set: true });
      await setRole('influencer', 'jwt-abc');
      expect(apiClient.POST).toHaveBeenCalledWith('/auth/role', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-abc' }),
        body: { role: 'influencer' },
      }));
    });
  });

  describe('getMe (criterion 3 — bearer header attached)', () => {
    it('calls GET /auth/me with Authorization: Bearer header', async () => {
      resolveGet({ firebase_uid: 'u1', email: 'a@b.com', role: 'influencer', role_set: true });
      await getMe('stored-jwt');
      expect(apiClient.GET).toHaveBeenCalledWith('/auth/me', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer stored-jwt' }),
      }));
    });
  });

  describe('getStoredToken', () => {
    it('reads token from secure storage', async () => {
      (getToken as jest.Mock).mockResolvedValueOnce('persisted-jwt');
      const token = await getStoredToken();
      expect(token).toBe('persisted-jwt');
    });
  });
});
