import { and, eq } from "drizzle-orm";
import type { Database } from "@forgeid/db";
import { agents, roleAssignments, roles, users } from "@forgeid/db";
import type { PrincipalType } from "@forgeid/shared";
import { ID_PREFIXES } from "@forgeid/shared";
import { recordAuditEvent } from "./audit-service.js";
import { generateId } from "./crypto.js";

export type PermissionCheckInput = {
  orgId: string;
  principalType: PrincipalType;
  principalId: string;
  action: string;
  resource?: string;
};

export type PermissionCheckOutput = {
  allowed: boolean;
  reason: string;
  evaluated_at: string;
};

async function collectUserPermissions(
  db: Database,
  orgId: string,
  userId: string,
): Promise<string[]> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.orgId, orgId)))
    .limit(1);
  if (!user) return [];

  if (user.role === "owner") return ["*"];

  const directRole = await db
    .select()
    .from(roles)
    .where(and(eq(roles.orgId, orgId), eq(roles.name, user.role)))
    .limit(1);
  const fromName = directRole[0]?.permissions ?? [];

  const assignments = await db
    .select({ permissions: roles.permissions })
    .from(roleAssignments)
    .innerJoin(roles, eq(roleAssignments.roleId, roles.id))
    .where(
      and(
        eq(roleAssignments.orgId, orgId),
        eq(roleAssignments.principalType, "user"),
        eq(roleAssignments.principalId, userId),
      ),
    );

  const fromAssignments = assignments.flatMap((a) => a.permissions);
  return Array.from(new Set([...fromName, ...fromAssignments]));
}

function allowsAction(granted: string[], action: string): boolean {
  if (granted.includes("*")) return true;
  if (granted.includes(action)) return true;
  const [res, ...rest] = action.split(":");
  if (rest.length && granted.includes(`${res}:*`)) return true;
  return false;
}

export async function checkPermission(
  db: Database,
  input: PermissionCheckInput,
): Promise<PermissionCheckOutput> {
  const evaluated_at = new Date().toISOString();
  let allowed = false;
  let reason = "No matching permission";

  if (input.principalType === "agent") {
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, input.principalId), eq(agents.orgId, input.orgId)))
      .limit(1);
    if (!agent || agent.status !== "active") {
      reason = "Agent not found or not active";
    } else {
      allowed = allowsAction(agent.capabilities, input.action);
      reason = allowed ? "Capability granted" : "Capability not granted on agent";
    }
  } else {
    const perms = await collectUserPermissions(db, input.orgId, input.principalId);
    allowed = allowsAction(perms, input.action);
    reason = allowed ? "Role permission granted" : "Role permission missing";
  }

  await recordAuditEvent(db, {
    id: generateId(ID_PREFIXES.event),
    orgId: input.orgId,
    eventType: allowed ? "authz.check.allowed" : "authz.check.denied",
    actorType: "system",
    actorId: "forgeid_api",
    targetType: "permission",
    targetId: input.action,
    metadata: {
      principal_type: input.principalType,
      principal_id: input.principalId,
      resource: input.resource ?? null,
      allowed,
      reason,
    },
  });

  return { allowed, reason, evaluated_at };
}
