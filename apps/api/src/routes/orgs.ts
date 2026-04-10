import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { organizations, users } from "@forgeid/db";
import { UpdateOrgSchema, ERROR_CODES, ID_PREFIXES } from "@forgeid/shared";
import type { ForgeIdEnv } from "../types.js";
import { zodValidatorJson } from "../lib/zod.js";
import { apiKeyOrTokenAuth } from "../middleware/auth.js";
import { recordAuditEvent } from "../services/audit-service.js";
import { generateId } from "../services/crypto.js";

export const orgsRouter = new Hono<ForgeIdEnv>()
  .use("*", apiKeyOrTokenAuth)
  .get("/v1/orgs/me", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (!org) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "Organization not found",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
          },
        },
        404,
      );
    }
    return c.json({
      data: {
        org: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
          created_at: org.createdAt.toISOString(),
          updated_at: org.updatedAt.toISOString(),
        },
      },
    });
  })
  .patch("/v1/orgs/me", zodValidatorJson(UpdateOrgSchema), async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const body = c.req.valid("json");
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (!org) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "Organization not found",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
          },
        },
        404,
      );
    }
    const [updated] = await db
      .update(organizations)
      .set({
        ...(body.name ? { name: body.name } : {}),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning();

    const actorId = c.get("apiKeyId") ?? c.get("userId") ?? "system";
    const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);

    await recordAuditEvent(db, {
      id: generateId(ID_PREFIXES.event),
      orgId,
      eventType: "org.updated",
      actorType,
      actorId,
      targetType: "organization",
      targetId: orgId,
      metadata: { patch: body },
    });

    return c.json({
      data: {
        org: {
          id: updated!.id,
          name: updated!.name,
          slug: updated!.slug,
          plan: updated!.plan,
          created_at: updated!.createdAt.toISOString(),
          updated_at: updated!.updatedAt.toISOString(),
        },
      },
    });
  })
  .get("/v1/orgs/me/members", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const rows = await db.select().from(users).where(eq(users.orgId, orgId));
    return c.json({
      data: {
        members: rows.map((u) => ({
          user_id: u.id,
          org_id: u.orgId,
          email: u.email,
          name: u.name,
          role: u.role,
          email_verified: u.emailVerified,
          created_at: u.createdAt.toISOString(),
        })),
      },
    });
  });
