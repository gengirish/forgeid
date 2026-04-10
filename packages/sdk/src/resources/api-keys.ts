import type { HttpClient } from '../http.js';
import type { ApiKeyInfo, CreateApiKeyInput } from '../types.js';

export class ApiKeysResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Creates a new API key (`POST /v1/api-keys`). The raw secret is only returned once.
   */
  async create(params: CreateApiKeyInput): Promise<{ id: string; raw_key: string; prefix: string }> {
    const data = await this.http.post<{
      id: string;
      org_id: string;
      name: string;
      key_prefix: string;
      scopes: string[];
      raw_key: string;
      created_at: string;
    }>('/v1/api-keys', { body: params });
    return { id: data.id, raw_key: data.raw_key, prefix: data.key_prefix };
  }

  /**
   * Lists API keys for the organization (`GET /v1/api-keys`).
   */
  async list(): Promise<ApiKeyInfo[]> {
    const data = await this.http.get<{ api_keys: ApiKeyInfo[] }>('/v1/api-keys');
    return data.api_keys;
  }

  /**
   * Revokes an API key by id (`DELETE /v1/api-keys/:id`).
   */
  async revoke(id: string): Promise<void> {
    await this.http.delete<{ revoked: boolean; id: string }>(`/v1/api-keys/${id}`);
  }
}
