import type { Database, apiKeys } from "@forgeid/db";
import type { ForgeIDTokenClaims } from "@forgeid/shared";

export type ApiKeyRow = typeof apiKeys.$inferSelect;

export type ForgeIdVariables = {
  requestId: string;
  db: Database;
  orgId?: string;
  orgSlug?: string;
  apiKeyId?: string;
  apiKey?: ApiKeyRow;
  apiKeyScopes?: string[];
  tokenClaims?: ForgeIDTokenClaims;
  userId?: string;
};

export type ForgeIdEnv = {
  Bindings: Record<string, never>;
  Variables: ForgeIdVariables;
};
