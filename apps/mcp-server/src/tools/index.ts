import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ForgeIdApiClient } from "../api-client.js";
import { registerIamAuditLog } from "./iam-audit-log.js";
import { registerIamCheckPermission } from "./iam-check-permission.js";
import { registerIamGetContext } from "./iam-get-context.js";
import { registerIamRevokeSelf } from "./iam-revoke-self.js";
import { registerIamSpawnAgent } from "./iam-spawn-agent.js";
import { registerIamWhoami } from "./iam-whoami.js";

export function registerTools(server: McpServer, apiClient: ForgeIdApiClient): void {
  registerIamWhoami(server, apiClient);
  registerIamCheckPermission(server, apiClient);
  registerIamSpawnAgent(server, apiClient);
  registerIamGetContext(server, apiClient);
  registerIamRevokeSelf(server, apiClient);
  registerIamAuditLog(server, apiClient);
}
