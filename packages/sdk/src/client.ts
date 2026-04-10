import { HttpClient } from './http.js';
import { AgentsResource } from './resources/agents.js';
import { ApiKeysResource } from './resources/api-keys.js';
import { AuditResource } from './resources/audit.js';
import { OrgResource } from './resources/org.js';
import { PermissionsResource } from './resources/permissions.js';
import { RolesResource } from './resources/roles.js';
import { TokensResource } from './resources/tokens.js';
import { WebhooksResource } from './resources/webhooks.js';

const DEFAULT_BASE_URL = 'https://api.forgeid.ai';
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Configuration for the ForgeID SDK client (Stripe-style: pass an API key).
 */
export interface ForgeIDConfig {
  /** Secret API key (`sk_live_…`). */
  apiKey: string;
  /**
   * Base URL for the ForgeID HTTP API.
   * @default https://api.forgeid.ai
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;
  /**
   * Optional bearer access token (JWT). Required for {@link AgentsResource.create}, which does not accept API keys.
   */
  accessToken?: string;
}

/**
 * Root client for ForgeID. Access resource groups as `forgeid.tokens`, `forgeid.agents`, etc.
 *
 * @example
 * ```ts
 * const forgeid = new ForgeID({ apiKey: process.env.FORGEID_API_KEY! });
 * const org = await forgeid.org.get();
 * ```
 */
export class ForgeID {
  readonly tokens: TokensResource;
  readonly agents: AgentsResource;
  readonly apiKeys: ApiKeysResource;
  readonly permissions: PermissionsResource;
  readonly roles: RolesResource;
  readonly audit: AuditResource;
  readonly webhooks: WebhooksResource;
  readonly org: OrgResource;

  constructor(config: ForgeIDConfig) {
    if (!config?.apiKey?.trim()) {
      throw new Error('ForgeIDConfig.apiKey is required');
    }

    const http = new HttpClient({
      apiKey: config.apiKey.trim(),
      accessToken: config.accessToken?.trim() || undefined,
      baseUrl: config.baseUrl?.trim() || DEFAULT_BASE_URL,
      timeoutMs: config.timeout ?? DEFAULT_TIMEOUT_MS,
    });

    this.tokens = new TokensResource(http);
    this.agents = new AgentsResource(http);
    this.apiKeys = new ApiKeysResource(http);
    this.permissions = new PermissionsResource(http);
    this.roles = new RolesResource(http);
    this.audit = new AuditResource(http);
    this.webhooks = new WebhooksResource(http);
    this.org = new OrgResource(http);
  }
}
