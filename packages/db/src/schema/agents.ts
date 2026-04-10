import { pgTable, text, timestamp, integer, index, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

export const agents = pgTable(
  'agents',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    parentUserId: text('parent_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    parentAgentId: text('parent_agent_id'),
    purpose: text('purpose'),
    model: text('model'),
    capabilities: text('capabilities').array().notNull().default(sql`ARRAY[]::text[]`),
    maxToolCalls: integer('max_tool_calls').notNull(),
    toolCallsUsed: integer('tool_calls_used').notNull().default(0),
    maxLifetimeMinutes: integer('max_lifetime_minutes').notNull(),
    status: text('status').notNull(),
    terminatedAt: timestamp('terminated_at', { mode: 'date' }),
    expiresAt: timestamp('expires_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    foreignKey({
      columns: [t.parentAgentId],
      foreignColumns: [t.id],
      name: 'agents_parent_agent_id_agents_id_fk',
    }).onDelete('set null'),
    index('agents_org_id_idx').on(t.orgId),
    index('agents_parent_user_id_idx').on(t.parentUserId),
    index('agents_parent_agent_id_idx').on(t.parentAgentId),
    index('agents_status_idx').on(t.status),
  ],
);
