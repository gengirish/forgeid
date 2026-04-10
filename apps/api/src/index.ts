import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { nanoid } from "nanoid";
import {
  ERROR_CODES,
  ForgeIDError,
  InternalError,
  RateLimitError,
} from "@forgeid/shared";
import { getDb } from "./lib/db.js";
import { formatZodError, ZodError } from "./lib/zod.js";
import { rateLimiter } from "./middleware/rate-limit.js";
import { initSigningMaterial } from "./services/crypto.js";
import type { ForgeIdEnv } from "./types.js";
import { agentsRouter } from "./routes/agents.js";
import { apiKeysRouter } from "./routes/api-keys.js";
import { auditRouter } from "./routes/audit.js";
import { orgsRouter } from "./routes/orgs.js";
import { permissionsRouter } from "./routes/permissions.js";
import { tokensRouter } from "./routes/tokens.js";
import { webhooksRouter } from "./routes/webhooks.js";

const doc = (code: string) => `https://forgeid.ai/docs/errors/${code}`;

const app = new Hono<ForgeIdEnv>();

app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: formatZodError(err),
          doc_url: doc(ERROR_CODES.VALIDATION_ERROR),
        },
      },
      400,
    );
  }
  if (err instanceof RateLimitError) {
    return c.json(err.toJSON(), err.statusCode);
  }
  if (err instanceof ForgeIDError) {
    return c.json(err.toJSON(), err.statusCode);
  }
  console.error(`[${c.get("requestId") ?? "no-req-id"}]`, err);
  const internal = new InternalError();
  return c.json(internal.toJSON(), internal.statusCode);
});

app.use("*", async (c, next) => {
  const requestId = c.req.header("x-request-id")?.trim() || nanoid();
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);
  await next();
});

app.use("*", async (c, next) => {
  try {
    c.set("db", getDb());
  } catch {
    return c.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: "Database is not configured",
          doc_url: doc(ERROR_CODES.INTERNAL_ERROR),
        },
      },
      503,
    );
  }
  await next();
});

app.use(
  "*",
  cors({
    origin: process.env.FORGEID_CORS_ORIGIN?.split(",") ?? "*",
    allowHeaders: ["Authorization", "Content-Type", "X-Request-Id"],
    exposeHeaders: ["X-Request-Id", "Retry-After"],
  }),
);

app.use("*", rateLimiter);

app.get("/health", (c) => c.json({ data: { status: "ok" } }));

app.route("/", tokensRouter);
app.route("/", agentsRouter);
app.route("/", apiKeysRouter);
app.route("/", orgsRouter);
app.route("/", permissionsRouter);
app.route("/", auditRouter);
app.route("/", webhooksRouter);

const port = Number(process.env.PORT ?? 4000);

await initSigningMaterial();

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`ForgeID API running on port ${info.port}`);
  },
);
