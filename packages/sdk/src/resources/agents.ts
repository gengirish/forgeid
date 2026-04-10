import { ForgeIDSDKError } from '../errors.js';
import type { HttpClient } from '../http.js';
import type { Agent, CreateAgentInput, DelegationChainEntry } from '../types.js';

/** Request body for `POST /v1/agents` (spawn delegated agent with bearer token). */
type SpawnAgentBody = {
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

export class AgentsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Spawns a delegated agent using the caller's access token (`POST /v1/agents`).
   * Requires `ForgeIDConfig.accessToken` (JWT); API keys are not accepted for this route.
   */
  async create(params: CreateAgentInput): Promise<Agent> {
    const extended = params as CreateAgentInput & { delegation_chain?: SpawnAgentBody['delegation_chain'] };
    const body: SpawnAgentBody = {
      capabilities: params.capabilities,
      max_tool_calls: params.max_tool_calls ?? 0,
      max_lifetime_minutes: params.max_lifetime_minutes ?? 60,
      purpose: params.purpose,
      model: params.model,
      allow_spawn: params.allow_spawn,
      delegation_chain: extended.delegation_chain,
    };

    const data = await this.http.post<{
      agent_id: string;
      access_token: string;
      expires_in: number;
      delegation_chain: unknown;
    }>('/v1/agents', { body, auth: 'access_token' });

    const wrapped = await this.http.get<{ agent: Agent }>(`/v1/agents/${data.agent_id}`);
    return wrapped.agent;
  }

  /**
   * Lists agents for the authenticated organization (`GET /v1/agents`).
   */
  async list(): Promise<Agent[]> {
    const data = await this.http.get<{ agents: Agent[] }>('/v1/agents');
    return data.agents;
  }

  /**
   * Retrieves a single agent by id (`GET /v1/agents/:id`).
   */
  async get(id: string): Promise<Agent> {
    const data = await this.http.get<{ agent: Agent }>(`/v1/agents/${id}`);
    return data.agent;
  }

  /**
   * Terminates an agent (`DELETE /v1/agents/:id`).
   */
  async terminate(id: string): Promise<void> {
    await this.http.delete<{ terminated: boolean; agent_id: string }>(`/v1/agents/${id}`);
  }

  /**
   * Returns the delegation chain recorded for an agent (`GET /v1/agents/:id/chain`).
   */
  async getChain(id: string): Promise<DelegationChainEntry[]> {
    const data = await this.http.get<{ agent_id: string; delegation_chain: unknown }>(
      `/v1/agents/${id}/chain`,
    );
    if (!Array.isArray(data.delegation_chain)) {
      throw new ForgeIDSDKError(
        'invalid_response',
        'Expected delegation_chain array from API',
        500,
        'https://forgeid.ai/docs/errors/invalid_response',
      );
    }
    return data.delegation_chain as DelegationChainEntry[];
  }
}
