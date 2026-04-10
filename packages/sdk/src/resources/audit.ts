import type { HttpClient } from '../http.js';
import type { AuditEvent, QueryAuditInput } from '../types.js';

export class AuditResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Queries audit events (`GET /v1/audit`).
   */
  async list(params?: QueryAuditInput): Promise<AuditEvent[]> {
    const data = await this.http.get<{ events: AuditEvent[] }>('/v1/audit', {
      query: params as Record<string, string | number | boolean | undefined | null>,
    });
    return data.events;
  }
}
