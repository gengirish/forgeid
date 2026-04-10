import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ForgeIdApiClient } from "../api-client.js";
import { catchToToolResult, fail, okJson } from "./helpers.js";

const inputSchema = {
  reason: z.string().max(1024).optional().describe("Optional reason recorded on the audit trail"),
};

export function registerIamRevokeSelf(server: McpServer, api: ForgeIdApiClient): void {
  server.tool(
    "iam_revoke_self",
    "Revoke your own token. Call this when your task is complete. After calling this, you will no longer be able to make any authenticated requests.",
    inputSchema,
    async (args) => {
      try {
        if (!api.getToken().trim()) {
          return fail("No agent token configured. Set FORGEID_AGENT_TOKEN.");
        }
        await api.revokeSelf(args.reason);
        return okJson({
          revoked: true,
          message: "Token revoked. No further authenticated actions are possible.",
        });
      } catch (e) {
        return catchToToolResult(e);
      }
    },
  );
}
