import { pgTable, text, timestamp, boolean, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    name: text('name'),
    role: text('role').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex('users_org_id_email_uidx').on(t.orgId, t.email),
    index('users_org_id_idx').on(t.orgId),
  ],
);
