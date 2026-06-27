import { apiClient } from '../api/client';
import type { components } from '../api/openapi';

export type ProfileResponse = components['schemas']['ProfileResponse'];
export type SocialAccountOut = components['schemas']['SocialAccountOut'];
export type Platform = components['schemas']['Platform'];

export interface ProfileFields {
  niche: string | null;
  bio: string | null;
  categories: string[];
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Read the caller's influencer profile. Returns null when none exists yet (404). */
export async function getProfile(token: string): Promise<ProfileResponse | null> {
  const { data, error, response } = await apiClient.GET('/influencer/profile', {
    headers: authHeader(token),
  });
  if (response.status === 404) return null;
  if (error || !data) throw new Error(`getProfile failed: ${response.status}`);
  return data;
}

/** Create or update niche/bio/categories. */
export async function updateProfile(token: string, fields: ProfileFields): Promise<ProfileResponse> {
  const { data, error, response } = await apiClient.PUT('/influencer/profile', {
    headers: authHeader(token),
    body: { niche: fields.niche, bio: fields.bio, categories: fields.categories },
  });
  if (error || !data) throw new Error(`updateProfile failed: ${response.status}`);
  return data;
}

/**
 * Guarantee a profile row exists before the verification connect step (which 404s
 * without one). Returns the existing profile, or creates an empty one and returns it.
 */
export async function ensureProfile(token: string): Promise<ProfileResponse> {
  const existing = await getProfile(token);
  if (existing) return existing;
  return updateProfile(token, { niche: null, bio: null, categories: [] });
}

/** Connect a social account; the API fetches + stores verified metrics and returns the updated profile. */
export async function connectSocial(
  token: string,
  platform: Platform,
  oauthCode: string,
): Promise<ProfileResponse> {
  const { data, error, response } = await apiClient.POST('/influencer/profile/connect', {
    headers: authHeader(token),
    body: { platform, oauth_code: oauthCode },
  });
  if (error || !data) throw new Error(`connectSocial failed: ${response.status}`);
  return data;
}
