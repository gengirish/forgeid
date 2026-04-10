import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ForgeIdApiClient } from "./api-client.js";
import { registerTools } from "./tools/index.js";

const baseUrl = process.env.FORGEID_API_URL?.trim() || "http://localhost:4000";
const agentToken = process.env.FORGEID_AGENT_TOKEN?.trim() ?? "";

if (!agentToken) {
  console.error(
    "[forgeid-mcp] FORGEID_AGENT_TOKEN is not set. IAM tools will return errors until it is provided.",
  );
} else {
  console.error("[forgeid-mcp] Starting forgeid-iam MCP server (stdio). API:", baseUrl);
}

const apiClient = new ForgeIdApiClient({ baseUrl, agentToken });
const server = new McpServer({ name: "forgeid-iam", version: "0.1.0" });

registerTools(server, apiClient);

const transport = new StdioServerTransport();
await server.connect(transport);
