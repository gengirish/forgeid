import { pgTable, text, timestamp, boolean, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

export const roles = pgTable(
  'roles',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    permissions: text('permissions').array().notNull().default(sql`ARRAY[]::text[]`),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex('roles_org_id_name_uidx').on(t.orgId, t.name),
    index('roles_org_id_idx').on(t.orgId),
  ],
);
