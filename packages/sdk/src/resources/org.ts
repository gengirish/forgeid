import type { HttpClient } from '../http.js';
import type { Organization, UpdateOrgInput, User } from '../types.js';

export class OrgResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Returns the current organization (`GET /v1/orgs/me`).
   */
  async get(): Promise<Organization> {
    const data = await this.http.get<{ org: Organization }>('/v1/orgs/me');
    return data.org;
  }

  /**
   * Updates the current organization (`PATCH /v1/orgs/me`).
   */
  async update(params: UpdateOrgInput): Promise<Organization> {
    const data = await this.http.patch<{ org: Organization }>('/v1/orgs/me', { body: params });
    return data.org;
  }

  /**
   * Lists members of the organization (`GET /v1/orgs/me/members`).
   */
  async listMembers(): Promise<User[]> {
    const data = await this.http.get<{ members: User[] }>('/v1/orgs/me/members');
    return data.members;
  }
}
