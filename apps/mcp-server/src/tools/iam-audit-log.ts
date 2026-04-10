import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ForgeIdApiClient } from "../api-client.js";
import { catchToToolResult, fail, okJson } from "./helpers.js";

const inputSchema = {
  event_type: z.string().min(1).optional().describe("Filter by audit event type"),
  limit: z.number().int().min(1).max(100).optional().describe("Max events to return (default 20, max 100)"),
};

export function registerIamAuditLog(server: McpServer, api: ForgeIdApiClient): void {
  server.tool(
    "iam_audit_log",
    "Query recent audit events for your organization. Useful for checking what actions have been performed.",
    inputSchema,
    async (args) => {
      try {
        if (!api.getToken().trim()) {
          return fail("No agent token configured. Set FORGEID_AGENT_TOKEN.");
        }
        const events = await api.listAuditEvents({
          event_type: args.event_type,
          limit: args.limit ?? 20,
        });
        return okJson(events);
      } catch (e) {
        return catchToToolResult(e);
      }
    },
  );
}
