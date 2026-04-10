import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ForgeIdApiClient } from "../api-client.js";
import { catchToToolResult, fail, okText } from "./helpers.js";

export function registerIamGetContext(server: McpServer, api: ForgeIdApiClient): void {
  server.tool(
    "iam_get_context_block",
    "Returns a structured text block suitable for injecting into your system prompt. Contains your identity, permissions, and constraints.",
    async () => {
      try {
        if (!api.getToken().trim()) {
          return fail("No agent token configured. Set FORGEID_AGENT_TOKEN.");
        }
        const block = await api.getContextBlock();
        return okText(block);
      } catch (e) {
        return catchToToolResult(e);
      }
    },
  );
}
