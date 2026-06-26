import { apiClient } from '../api/client';
import { storeToken, getToken } from './secureStorage';
import type { components } from '../api/openapi';

export type LoginResponse = components['schemas']['LoginResponse'];
export type SetRoleResponse = components['schemas']['SetRoleResponse'];
export type MeResponse = components['schemas']['MeResponse'];
export type Role = components['schemas']['Role'];

export async function login(firebaseToken: string): Promise<LoginResponse> {
  const { data, error, response } = await apiClient.POST('/auth/login', {
    body: { firebase_token: firebaseToken },
  });
  if (error || !data) throw new Error(`Login failed: ${response.status}`);
  await storeToken(data.access_token);
  return data;
}

export async function setRole(role: 'influencer' | 'brand', token: string): Promise<SetRoleResponse> {
  const { data, error, response } = await apiClient.POST('/auth/role', {
    headers: { Authorization: `Bearer ${token}` },
    body: { role },
  });
  if (error || !data) throw new Error(`setRole failed: ${response.status}`);
  return data;
}

export async function getMe(token: string): Promise<MeResponse> {
  const { data, error, response } = await apiClient.GET('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error || !data) throw new Error(`getMe failed: ${response.status}`);
  return data;
}

export const getStoredToken = getToken;
