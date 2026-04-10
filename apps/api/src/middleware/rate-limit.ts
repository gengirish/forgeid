import { createMiddleware } from "hono/factory";
import { createHash } from "node:crypto";
import { API_KEY_PREFIX, RateLimitError } from "@forgeid/shared";
import type { ForgeIdEnv } from "../types.js";

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

function clientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return c.req.header("cf-connecting-ip") ?? "unknown";
}

function getWindowMs(): number {
  const w = Number(process.env.FORGEID_RATE_LIMIT_WINDOW_SEC ?? 60);
  return Number.isFinite(w) && w > 0 ? w * 1000 : 60_000;
}

function getMax(): number {
  const m = Number(process.env.FORGEID_RATE_LIMIT_MAX ?? 100);
  return Number.isFinite(m) && m > 0 ? m : 100;
}

function touch(key: string, windowMs: number, max: number): { retryAfterSec: number } | null {
  const now = Date.now();
  let b = store.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    store.set(key, b);
  }
  b.count += 1;
  if (b.count > max) {
    return { retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  return null;
}

export const rateLimiter = createMiddleware<ForgeIdEnv>(async (c, next) => {
  const windowMs = getWindowMs();
  const max = getMax();
  const ip = clientIp(c);
  const auth = c.req.header("Authorization")?.trim();
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";

  const ipKey = `ip:${ip}`;
  const hitIp = touch(ipKey, windowMs, max);
  if (hitIp) {
    c.header("Retry-After", String(hitIp.retryAfterSec));
    throw new RateLimitError("Too many requests from this IP");
  }

  if (bearer.length > 0) {
    const bearerKey =
      bearer.startsWith(API_KEY_PREFIX) || bearer.startsWith("eyJ")
        ? `bearer:${hashToken(bearer)}`
        : `bearer_raw:${hashToken(bearer)}`;
    const hitBearer = touch(bearerKey, windowMs, max);
    if (hitBearer) {
      c.header("Retry-After", String(hitBearer.retryAfterSec));
      throw new RateLimitError("Too many requests for this credential");
    }
  }

  await next();
});
