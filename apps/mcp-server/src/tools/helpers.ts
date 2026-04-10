import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ForgeIdApiError } from "../api-client.js";

export function okJson(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export function okText(text: string): CallToolResult {
  return { content: [{ type: "text", text }] };
}

export function fail(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }, null, 2) }],
    isError: true,
  };
}

export function catchToToolResult(e: unknown): CallToolResult {
  if (e instanceof ForgeIdApiError) {
    return fail(e.message);
  }
  if (e instanceof Error) {
    return fail(e.message);
  }
  return fail("An unexpected error occurred.");
}
