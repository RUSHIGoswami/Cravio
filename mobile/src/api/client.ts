import createClient from 'openapi-fetch';
import type { paths } from './openapi';

/** Generated from /docs/openapi.yaml — never hand-maintain request/response types here. */
export const apiClient = createClient<paths>({ baseUrl: 'http://localhost:8000' });

export async function getHealth() {
  const { data, error } = await apiClient.GET('/health', {});
  if (error) throw error;
  return data;
}
