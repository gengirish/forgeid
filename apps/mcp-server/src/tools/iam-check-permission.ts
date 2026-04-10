import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ForgeIdApiClient } from "../api-client.js";
import { catchToToolResult, fail, okJson } from "./helpers.js";

const inputSchema = {
  action: z.string().min(1).describe("Action to check, e.g. crm:write"),
  resource: z.string().optional().describe("Optional resource identifier"),
};

export function registerIamCheckPermission(server: McpServer, api: ForgeIdApiClient): void {
  server.tool(
    "iam_check_permission",
    "Check if you are allowed to perform a specific action on a resource. Always call this before performing any write operation.",
    inputSchema,
    async (args) => {
      try {
        if (!api.getToken().trim()) {
          return fail("No agent token configured. Set FORGEID_AGENT_TOKEN.");
        }
        const result = await api.checkPermission(args.action, args.resource);
        return okJson(result);
      } catch (e) {
        return catchToToolResult(e);
      }
    },
  );
}
