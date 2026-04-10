import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ForgeIdApiClient } from "../api-client.js";
import { catchToToolResult, fail, okJson } from "./helpers.js";

export function registerIamWhoami(server: McpServer, api: ForgeIdApiClient): void {
  server.tool(
    "iam_whoami",
    "Returns the current agent's identity, capabilities, org, token expiry, and tool calls remaining. Call this first to understand your permission boundary.",
    async () => {
      try {
        if (!api.getToken().trim()) {
          return fail("No agent token configured. Set FORGEID_AGENT_TOKEN or pass a token when starting the MCP server.");
        }
        const data = await api.whoami();
        return okJson(data);
      } catch (e) {
        return catchToToolResult(e);
      }
    },
  );
}
