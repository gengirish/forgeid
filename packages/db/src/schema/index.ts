export { organizations } from './organizations';
export { users } from './users';
export { sessions } from './sessions';
export { apiKeys } from './api-keys';
export { agents } from './agents';
export { tokens } from './tokens';
export { roles } from './roles';
export { roleAssignments } from './role-assignments';
export { auditEvents } from './audit-events';
export { webhookEndpoints } from './webhook-endpoints';
export { webhookDeliveries } from './webhook-deliveries';
export { signingKeys } from './signing-keys';

import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';
import { sessions } from './sessions';
import { apiKeys } from './api-keys';
import { agents } from './agents';
import { tokens } from './tokens';
import { roles } from './roles';
import { roleAssignments } from './role-assignments';
import { auditEvents } from './audit-events';
import { webhookEndpoints } from './webhook-endpoints';
import { webhookDeliveries } from './webhook-deliveries';

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  apiKeys: many(apiKeys),
  agents: many(agents),
  tokens: many(tokens),
  roles: many(roles),
  roleAssignments: many(roleAssignments),
  auditEvents: many(auditEvents),
  webhookEndpoints: many(webhookEndpoints),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
  sessions: many(sessions),
  agentsAsParent: many(agents),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.orgId],
    references: [organizations.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [agents.orgId],
    references: [organizations.id],
  }),
  parentUser: one(users, {
    fields: [agents.parentUserId],
    references: [users.id],
  }),
  parentAgent: one(agents, {
    fields: [agents.parentAgentId],
    references: [agents.id],
    relationName: 'agentHierarchy',
  }),
  subAgents: many(agents, { relationName: 'agentHierarchy' }),
}));

export const tokensRelations = relations(tokens, ({ one }) => ({
  organization: one(organizations, {
    fields: [tokens.orgId],
    references: [organizations.id],
  }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.orgId],
    references: [organizations.id],
  }),
  assignments: many(roleAssignments),
}));

export const roleAssignmentsRelations = relations(roleAssignments, ({ one }) => ({
  organization: one(organizations, {
    fields: [roleAssignments.orgId],
    references: [organizations.id],
  }),
  role: one(roles, {
    fields: [roleAssignments.roleId],
    references: [roles.id],
  }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [auditEvents.orgId],
    references: [organizations.id],
  }),
  webhookDeliveries: many(webhookDeliveries),
}));

export const webhookEndpointsRelations = relations(webhookEndpoints, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [webhookEndpoints.orgId],
    references: [organizations.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhookEndpoint: one(webhookEndpoints, {
    fields: [webhookDeliveries.webhookEndpointId],
    references: [webhookEndpoints.id],
  }),
  auditEvent: one(auditEvents, {
    fields: [webhookDeliveries.eventId],
    references: [auditEvents.id],
  }),
}));
