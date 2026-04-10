import type { HttpClient } from '../http.js';
import type {
  CreateAgentInput,
  ForgeIDTokenClaims,
  IssueTokenInput,
  JsonWebKeySet,
  RevokeTokenInput,
  TokenResponse,
} from '../types.js';

/** Request body for `POST /v1/token` (agent delegation grant). */
type AgentDelegationTokenBody = {
  grant_type: 'agent_delegation';
  parent_token: string;
  capabilities: string[];
  max_tool_calls: number;
  max_lifetime_minutes: number;
  purpose?: string;
  model?: string;
  allow_spawn?: boolean;
  delegation_chain?: Array<{
    sub: string;
    sess?: string;
    auth_method?: string;
    spawned_at?: string;
  }>;
};

function toAgentDelegationBody(
  params: Pick<
    CreateAgentInput,
    | 'parent_token'
    | 'capabilities'
    | 'max_lifetime_minutes'
    | 'purpose'
    | 'model'
    | 'max_tool_calls'
    | 'allow_spawn'
  > & { delegation_chain?: AgentDelegationTokenBody['delegation_chain'] },
): AgentDelegationTokenBody {
  return {
    grant_type: 'agent_delegation',
    parent_token: params.parent_token,
    capabilities: params.capabilities,
    max_tool_calls: params.max_tool_calls ?? 0,
    max_lifetime_minutes: params.max_lifetime_minutes ?? 60,
    purpose: params.purpose,
    model: params.model,
    allow_spawn: params.allow_spawn,
    delegation_chain: params.delegation_chain,
  };
}

export class TokensResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Issues a delegated agent access token via `POST /v1/token` with `grant_type: agent_delegation`.
   * The `grant_type` field on {@link IssueTokenInput} is ignored; password and refresh-token grants are not handled here.
   */
  async issue(params: IssueTokenInput): Promise<TokenResponse> {
    const extended = params as IssueTokenInput & {
      allow_spawn?: boolean;
      delegation_chain?: AgentDelegationTokenBody['delegation_chain'];
    };
    const body = toAgentDelegationBody({
      parent_token: params.parent_token,
      capabilities: params.capabilities,
      max_lifetime_minutes: params.max_lifetime_minutes,
      purpose: params.purpose,
      model: params.model,
      max_tool_calls: params.max_tool_calls,
      allow_spawn: extended.allow_spawn,
      delegation_chain: extended.delegation_chain,
    });
    return this.http.post<TokenResponse>('/v1/token', { body, auth: 'none' });
  }

  /**
   * Convenience alias for issuing a token from a parent token and agent options (`POST /v1/token`).
   */
  async issueAgent(params: CreateAgentInput): Promise<TokenResponse> {
    const extended = params as CreateAgentInput & {
      delegation_chain?: AgentDelegationTokenBody['delegation_chain'];
    };
    const body = toAgentDelegationBody(extended);
    return this.http.post<TokenResponse>('/v1/token', { body, auth: 'none' });
  }

  /**
   * Verifies a JWT and returns ForgeID claims (`POST /v1/token/verify`).
   */
  async verify(token: string): Promise<ForgeIDTokenClaims> {
    const data = await this.http.post<{ claims: ForgeIDTokenClaims; active: boolean }>('/v1/token/verify', {
      body: { token },
      auth: 'none',
    });
    return data.claims;
  }

  /**
   * Revokes a token by raw token or JTI (`POST /v1/token/revoke`).
   */
  async revoke(params: RevokeTokenInput): Promise<void> {
    await this.http.post<{ revoked: boolean; jti: string }>('/v1/token/revoke', {
      body: params,
      auth: 'api_key',
    });
  }

  /**
   * Returns the JWKS used to verify ForgeID-issued JWTs (`GET /v1/token/jwks`).
   */
  async jwks(): Promise<JsonWebKeySet> {
    return this.http.get<JsonWebKeySet>('/v1/token/jwks', { auth: 'none' });
  }
}
