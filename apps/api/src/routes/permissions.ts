import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { CreateRoleSchema, ID_PREFIXES } from "@forgeid/shared";
import type { ForgeIdEnv } from "../types.js";
import { zodValidatorJson } from "../lib/zod.js";
import { apiKeyOrTokenAuth } from "../middleware/auth.js";
import { recordAuditEvent } from "../services/audit-service.js";
import { checkPermission } from "../services/permission-service.js";
import { generateId } from "../services/crypto.js";
import { roles } from "@forgeid/db";

const CheckPermissionBody = z.object({
  principal_type: z.enum(["user", "agent"]).optional(),
  principal_id: z.string().min(1).optional(),
  action: z.string().min(1).max(512),
  resource: z.string().max(2048).optional(),
});

export const permissionsRouter = new Hono<ForgeIdEnv>()
  .use("*", apiKeyOrTokenAuth)
  .post("/v1/permissions/check", zodValidatorJson(CheckPermissionBody), async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const body = c.req.valid("json");
    const claims = c.get("tokenClaims");

    const principalType = body.principal_type
      ?? (claims?.identity_type === "agent" ? "agent" : "user");
    const principalId = body.principal_id
      ?? c.get("userId")
      ?? (claims?.sub as string | undefined)
      ?? "";

    if (principalType === "agent" && claims?.capabilities) {
      const caps = claims.capabilities as string[];
      const allowed = caps.includes(body.action) || caps.includes("*");
      const result = {
        allowed,
        reason: allowed
          ? `capability '${body.action}' granted via delegation`
          : `capability '${body.action}' not in agent scope [${caps.join(", ")}]`,
      };
      return c.json({ data: result });
    }

    const result = await checkPermission(db, {
      orgId,
      principalType: principalType as "user" | "agent",
      principalId,
      action: body.action,
      resource: body.resource,
    });
    return c.json({ data: result });
  })
  .get("/v1/roles", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const rows = await db.select().from(roles).where(eq(roles.orgId, orgId));
    return c.json({
      data: {
        roles: rows.map((r) => ({
          id: r.id,
          org_id: r.orgId,
          name: r.name,
          description: r.description,
          permissions: r.permissions,
          is_system: r.isSystem,
          created_at: r.createdAt.toISOString(),
        })),
      },
    });
  })
  .post("/v1/roles", zodValidatorJson(CreateRoleSchema), async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const body = c.req.valid("json");
    const id = generateId(ID_PREFIXES.role);
    const [row] = await db
      .insert(roles)
      .values({
        id,
        orgId,
        name: body.name,
        description: body.description ?? null,
        permissions: body.permissions,
        isSystem: false,
      })
      .returning();

    const actorId = c.get("apiKeyId") ?? c.get("userId") ?? "system";
    const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);

    await recordAuditEvent(db, {
      id: generateId(ID_PREFIXES.event),
      orgId,
      eventType: "role.created",
      actorType,
      actorId,
      targetType: "role",
      targetId: id,
      metadata: { name: body.name, permissions: body.permissions },
    });

    return c.json({
      data: {
        role: {
          id: row!.id,
          org_id: row!.orgId,
          name: row!.name,
          description: row!.description,
          permissions: row!.permissions,
          is_system: row!.isSystem,
          created_at: row!.createdAt.toISOString(),
        },
      },
    });
  });
