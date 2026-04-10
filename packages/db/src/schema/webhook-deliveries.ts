import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { webhookEndpoints } from './webhook-endpoints';
import { auditEvents } from './audit-events';

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: text('id').primaryKey(),
    webhookEndpointId: text('webhook_endpoint_id')
      .notNull()
      .references(() => webhookEndpoints.id, { onDelete: 'cascade' }),
    eventId: text('event_id')
      .notNull()
      .references(() => auditEvents.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    attempts: integer('attempts').notNull().default(0),
    lastAttemptAt: timestamp('last_attempt_at', { mode: 'date' }),
    nextRetryAt: timestamp('next_retry_at', { mode: 'date' }),
    responseStatus: integer('response_status'),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index('webhook_deliveries_endpoint_id_idx').on(t.webhookEndpointId),
    index('webhook_deliveries_event_id_idx').on(t.eventId),
    index('webhook_deliveries_status_next_retry_idx').on(t.status, t.nextRetryAt),
  ],
);
