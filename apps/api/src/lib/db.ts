import { createDb, type Database } from "@forgeid/db";
import { InternalError } from "@forgeid/shared";

let cached: Database | null = null;

export function getDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url || url.length === 0) {
    throw new InternalError("DATABASE_URL is not configured");
  }
  cached ??= createDb(url);
  return cached;
}
