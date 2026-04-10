import { pgTable, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

export const tokens = pgTable(
  'tokens',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    subjectType: text('subject_type').notNull(),
    subjectId: text('subject_id').notNull(),
    tokenType: text('token_type').notNull(),
    jti: text('jti').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    revokedAt: timestamp('revoked_at', { mode: 'date' }),
    revokedReason: text('revoked_reason'),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex('tokens_jti_uidx').on(t.jti),
    index('tokens_org_id_subject_idx').on(t.orgId, t.subjectType, t.subjectId),
    index('tokens_org_id_expires_at_idx').on(t.orgId, t.expiresAt),
  ],
);
