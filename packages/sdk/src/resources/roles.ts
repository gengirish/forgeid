import type { HttpClient } from '../http.js';
import type { CreateRoleInput, Role } from '../types.js';

export class RolesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Lists roles for the organization (`GET /v1/roles`).
   */
  async list(): Promise<Role[]> {
    const data = await this.http.get<{ roles: Role[] }>('/v1/roles');
    return data.roles;
  }

  /**
   * Creates a custom role (`POST /v1/roles`).
   */
  async create(params: CreateRoleInput): Promise<Role> {
    const data = await this.http.post<{ role: Role }>('/v1/roles', { body: params });
    return data.role;
  }
}
