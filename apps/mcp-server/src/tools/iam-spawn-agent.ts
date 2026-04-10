import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ForgeIdApiClient } from "../api-client.js";
import { catchToToolResult, fail, okJson } from "./helpers.js";

const inputSchema = {
  capabilities: z.array(z.string().min(1)).min(1).describe("Capabilities for the sub-agent (must be a subset of yours)"),
  max_lifetime_minutes: z.number().int().positive().describe("Maximum token lifetime in minutes"),
  purpose: z.string().min(1).max(2048).describe("Short description of why the sub-agent exists"),
  model: z.string().max(256).optional().describe("Optional model identifier"),
  max_tool_calls: z.number().int().nonnegative().optional().describe("Optional max tool calls (defaults from your token)"),
};

export function registerIamSpawnAgent(server: McpServer, api: ForgeIdApiClient): void {
  server.tool(
    "iam_spawn_agent_token",
    "Spawn a sub-agent with a subset of your capabilities. The sub-agent's capabilities cannot exceed your own.",
    inputSchema,
    async (args) => {
      try {
        if (!api.getToken().trim()) {
          return fail("No agent token configured. Set FORGEID_AGENT_TOKEN.");
        }
        const data = await api.spawnAgent({
          capabilities: args.capabilities,
          max_lifetime_minutes: args.max_lifetime_minutes,
          purpose: args.purpose,
          model: args.model,
          max_tool_calls: args.max_tool_calls,
        });
        return okJson(data);
      } catch (e) {
        return catchToToolResult(e);
      }
    },
  );
}
