import { apiClient } from '../api/client';
import type { components } from '../api/openapi';

export type BrandProfileResponse = components['schemas']['BrandProfileResponse'];
export type CampaignBuilderAccess = components['schemas']['CampaignBuilderAccessResponse'];

export interface BrandProfileFields {
  company_name: string;
  industry: string;
  website: string;
  gst: string | null;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Read the caller's brand profile. Returns null when none exists yet (404). */
export async function getBrandProfile(token: string): Promise<BrandProfileResponse | null> {
  const { data, error, response } = await apiClient.GET('/brand/profile', {
    headers: authHeader(token),
  });
  if (response.status === 404) return null;
  if (error || !data) throw new Error(`getBrandProfile failed: ${response.status}`);
  return data;
}

/** Create or update company name/industry/website/optional GST. */
export async function saveBrandProfile(
  token: string,
  fields: BrandProfileFields,
): Promise<BrandProfileResponse> {
  const { data, error, response } = await apiClient.PUT('/brand/profile', {
    headers: authHeader(token),
    body: {
      company_name: fields.company_name,
      industry: fields.industry,
      website: fields.website,
      gst: fields.gst,
    },
  });
  if (error || !data) throw new Error(`saveBrandProfile failed: ${response.status}`);
  return data;
}

/** Server-enforced brand gate — throws if the caller is not a brand (403). */
export async function getCampaignBuilderAccess(token: string): Promise<CampaignBuilderAccess> {
  const { data, error, response } = await apiClient.GET('/brand/campaign-builder', {
    headers: authHeader(token),
  });
  if (error || !data) throw new Error(`getCampaignBuilderAccess failed: ${response.status}`);
  return data;
}
