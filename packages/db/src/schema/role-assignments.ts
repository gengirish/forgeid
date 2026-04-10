import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { roles } from './roles';

export const roleAssignments = pgTable(
  'role_assignments',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    principalType: text('principal_type').notNull(),
    principalId: text('principal_id').notNull(),
    assignedBy: text('assigned_by'),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index('role_assignments_org_principal_idx').on(
      t.orgId,
      t.principalType,
      t.principalId,
    ),
    index('role_assignments_role_id_idx').on(t.roleId),
  ],
);
