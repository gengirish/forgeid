import type { HttpClient } from '../http.js';
import type { CheckPermissionInput, PermissionCheckResult } from '../types.js';

export class PermissionsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Evaluates whether a principal may perform an action (`POST /v1/permissions/check`).
   */
  async check(params: CheckPermissionInput): Promise<PermissionCheckResult> {
    return this.http.post<PermissionCheckResult>('/v1/permissions/check', { body: params });
  }
}
