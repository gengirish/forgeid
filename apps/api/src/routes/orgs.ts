import { Hono } from "hono";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { organizations, users } from "@forgeid/db";
import { UpdateOrgSchema, ERROR_CODES, ID_PREFIXES } from "@forgeid/shared";
import type { ForgeIdEnv } from "../types.js";
import { zodValidatorJson } from "../lib/zod.js";
import { apiKeyOrTokenAuth } from "../middleware/auth.js";
import { recordAuditEvent } from "../services/audit-service.js";
import { generateId } from "../services/crypto.js";

const CreateOrgSchema = z.object({
  org_name: z.string().min(1).max(256),
  org_slug: z.string().min(1).max(128),
  owner_email: z.string().email(),
  owner_name: z.string().min(1).max(256),
  plan: z.string().min(1).max(64).optional(),
});

const InviteMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(256),
  role: z.string().min(1).max(128),
});

const ChangeMemberRoleSchema = z.object({
  role: z.string().min(1).max(128),
});

const orgsPublic = new Hono<ForgeIdEnv>()
  .post("/v1/orgs", zodValidatorJson(CreateOrgSchema), async (c) => {
    const db = c.get("db");
    const body = c.req.valid("json");
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, body.org_slug))
      .limit(1);
    if (existing) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Organization slug is already taken",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.VALIDATION_ERROR}`,
          },
        },
        409,
      );
    }
    const orgId = generateId(ID_PREFIXES.org);
    const userId = generateId(ID_PREFIXES.user);
    const plan = body.plan ?? "free";

    await db.insert(organizations).values({
      id: orgId,
      name: body.org_name,
      slug: body.org_slug,
      plan,
    });
    await db.insert(users).values({
      id: userId,
      orgId,
      email: body.owner_email,
      name: body.owner_name,
      role: "owner",
    });

    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    const [owner] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return c.json(
      {
        data: {
          org: {
            id: org!.id,
            name: org!.name,
            slug: org!.slug,
            plan: org!.plan,
            created_at: org!.createdAt.toISOString(),
            updated_at: org!.updatedAt.toISOString(),
          },
          user: {
            id: owner!.id,
            org_id: owner!.orgId,
            email: owner!.email,
            name: owner!.name,
            role: owner!.role,
            email_verified: owner!.emailVerified,
            created_at: owner!.createdAt.toISOString(),
          },
        },
      },
      201,
    );
  });

export { orgsPublic };

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
  })
  .post("/v1/orgs/me/members", zodValidatorJson(InviteMemberSchema), async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const body = c.req.valid("json");
    const [dup] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.orgId, orgId), eq(users.email, body.email)))
      .limit(1);
    if (dup) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "A user with this email already exists in the organization",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.VALIDATION_ERROR}`,
          },
        },
        409,
      );
    }
    const newUserId = generateId(ID_PREFIXES.user);
    const [created] = await db
      .insert(users)
      .values({
        id: newUserId,
        orgId,
        email: body.email,
        name: body.name,
        role: body.role,
      })
      .returning();

    const actorId = c.get("apiKeyId") ?? c.get("userId") ?? "system";
    const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);
    await recordAuditEvent(db, {
      id: generateId(ID_PREFIXES.event),
      orgId,
      eventType: "org.member.invited",
      actorType,
      actorId,
      targetType: "user",
      targetId: newUserId,
      metadata: { email: body.email, name: body.name, role: body.role },
    });

    return c.json(
      {
        data: {
          member: {
            user_id: created!.id,
            org_id: created!.orgId,
            email: created!.email,
            name: created!.name,
            role: created!.role,
            email_verified: created!.emailVerified,
            created_at: created!.createdAt.toISOString(),
          },
        },
      },
      201,
    );
  })
  .delete("/v1/orgs/me/members/:userId", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const userId = c.req.param("userId");
    const [target] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.orgId, orgId)))
      .limit(1);
    if (!target) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "Member not found",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
          },
        },
        404,
      );
    }
    if (target.role === "owner") {
      const owners = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.orgId, orgId), eq(users.role, "owner")));
      if (owners.length <= 1) {
        return c.json(
          {
            error: {
              code: ERROR_CODES.PERMISSION_DENIED,
              message: "Cannot remove the only owner of the organization",
              doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.PERMISSION_DENIED}`,
            },
          },
          403,
        );
      }
    }
    await db.delete(users).where(and(eq(users.id, userId), eq(users.orgId, orgId)));

    const actorId = c.get("apiKeyId") ?? c.get("userId") ?? "system";
    const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);
    await recordAuditEvent(db, {
      id: generateId(ID_PREFIXES.event),
      orgId,
      eventType: "org.member.removed",
      actorType,
      actorId,
      targetType: "user",
      targetId: userId,
      metadata: { email: target.email },
    });

    return c.json({ data: { ok: true } });
  })
  .post("/v1/orgs/me/members/:userId/role", zodValidatorJson(ChangeMemberRoleSchema), async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const userId = c.req.param("userId");
    const body = c.req.valid("json");
    const [target] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.orgId, orgId)))
      .limit(1);
    if (!target) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "Member not found",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
          },
        },
        404,
      );
    }
    if (target.role === "owner" && body.role !== "owner") {
      const owners = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.orgId, orgId), eq(users.role, "owner")));
      if (owners.length <= 1) {
        return c.json(
          {
            error: {
              code: ERROR_CODES.PERMISSION_DENIED,
              message: "Cannot change role of the only owner",
              doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.PERMISSION_DENIED}`,
            },
          },
          403,
        );
      }
    }
    const [updated] = await db
      .update(users)
      .set({ role: body.role, updatedAt: new Date() })
      .where(and(eq(users.id, userId), eq(users.orgId, orgId)))
      .returning();

    const actorId = c.get("apiKeyId") ?? c.get("userId") ?? "system";
    const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);
    await recordAuditEvent(db, {
      id: generateId(ID_PREFIXES.event),
      orgId,
      eventType: "user.updated",
      actorType,
      actorId,
      targetType: "user",
      targetId: userId,
      metadata: { previous_role: target.role, role: body.role },
    });

    return c.json({
      data: {
        member: {
          user_id: updated!.id,
          org_id: updated!.orgId,
          email: updated!.email,
          name: updated!.name,
          role: updated!.role,
          email_verified: updated!.emailVerified,
          created_at: updated!.createdAt.toISOString(),
        },
      },
    });
  });
