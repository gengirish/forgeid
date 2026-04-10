import { and, desc, eq, gte, lte } from "drizzle-orm";
import type { Database } from "@forgeid/db";
import { auditEvents } from "@forgeid/db";

export type AuditRow = typeof auditEvents.$inferSelect;
type AuditInsert = typeof auditEvents.$inferInsert;

const subscribers = new Set<(row: AuditRow) => void>();

export function subscribeAuditStream(cb: (row: AuditRow) => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

function broadcast(row: AuditRow): void {
  for (const cb of subscribers) {
    try {
      cb(row);
    } catch {
      /* ignore subscriber errors */
    }
  }
}

export async function recordAuditEvent(
  db: Database,
  row: Omit<AuditInsert, "createdAt">,
): Promise<AuditRow> {
  const [inserted] = await db.insert(auditEvents).values(row).returning();
  if (inserted) broadcast(inserted);
  return inserted!;
}

export async function queryAuditEvents(
  db: Database,
  filters: {
    orgId: string;
    eventType?: string;
    actorId?: string;
    from?: string;
    to?: string;
    limit?: number;
  },
): Promise<AuditRow[]> {
  const limit = filters.limit ?? 100;
  const conditions = [eq(auditEvents.orgId, filters.orgId)];
  if (filters.eventType) conditions.push(eq(auditEvents.eventType, filters.eventType));
  if (filters.actorId) conditions.push(eq(auditEvents.actorId, filters.actorId));
  if (filters.from) conditions.push(gte(auditEvents.createdAt, new Date(filters.from)));
  if (filters.to) conditions.push(lte(auditEvents.createdAt, new Date(filters.to)));

  return db
    .select()
    .from(auditEvents)
    .where(and(...conditions))
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit);
}

export async function findLatestAgentSpawnMetadata(
  db: Database,
  orgId: string,
  agentId: string,
): Promise<Record<string, unknown> | null> {
  const [row] = await db
    .select()
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.orgId, orgId),
        eq(auditEvents.eventType, "token.agent.spawned"),
        eq(auditEvents.targetId, agentId),
      ),
    )
    .orderBy(desc(auditEvents.createdAt))
    .limit(1);
  if (!row) return null;
  return (row.metadata as Record<string, unknown>) ?? {};
}
