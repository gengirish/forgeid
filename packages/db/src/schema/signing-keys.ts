import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const signingKeys = pgTable(
  'signing_keys',
  {
    id: text('id').primaryKey(),
    kid: text('kid').notNull(),
    algorithm: text('algorithm').notNull().default('RS256'),
    publicKeyPem: text('public_key_pem').notNull(),
    status: text('status').notNull(),
    rotatedAt: timestamp('rotated_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [uniqueIndex('signing_keys_kid_uidx').on(t.kid)],
);
