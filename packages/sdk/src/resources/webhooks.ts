import type { HttpClient } from '../http.js';
import type { CreateWebhookInput, WebhookDelivery, WebhookEndpoint } from '../types.js';

export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Registers a webhook endpoint (`POST /v1/webhooks`).
   */
  async create(params: CreateWebhookInput): Promise<{ id: string; secret: string }> {
    const data = await this.http.post<{ webhook: WebhookEndpoint & { secret: string } }>('/v1/webhooks', {
      body: params,
    });
    return { id: data.webhook.id, secret: data.webhook.secret };
  }

  /**
   * Lists webhook endpoints (`GET /v1/webhooks`).
   */
  async list(): Promise<WebhookEndpoint[]> {
    const data = await this.http.get<{ webhooks: WebhookEndpoint[] }>('/v1/webhooks');
    return data.webhooks;
  }

  /**
   * Deletes a webhook endpoint (`DELETE /v1/webhooks/:id`).
   */
  async delete(id: string): Promise<void> {
    await this.http.delete<{ deleted: boolean; id: string }>(`/v1/webhooks/${id}`);
  }

  /**
   * Lists recent delivery attempts for a webhook (`GET /v1/webhooks/:id/deliveries`).
   */
  async listDeliveries(id: string, limit?: number): Promise<WebhookDelivery[]> {
    const data = await this.http.get<{ deliveries: WebhookDelivery[] }>(
      `/v1/webhooks/${id}/deliveries`,
      { query: limit !== undefined ? { limit } : undefined },
    );
    return data.deliveries;
  }
}
