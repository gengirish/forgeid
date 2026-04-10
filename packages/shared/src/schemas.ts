import { z } from 'zod';

export const IssueTokenSchema = z.object({
  grant_type: z.string().min(1),
  parent_token: z.string().min(1),
  capabilities: z.array(z.string().min(1)),
  max_lifetime_minutes: z.number().int().positive().optional(),
  purpose: z.string().max(2048).optional(),
  model: z.string().max(256).optional(),
  max_tool_calls: z.number().int().nonnegative().optional(),
});

export const VerifyTokenSchema = z.object({
  token: z.string().min(1),
});

export const RevokeTokenSchema = z
  .object({
    token: z.string().min(1).optional(),
    jti: z.string().min(1).optional(),
    reason: z.string().max(1024).optional(),
  })
  .refine((data) => data.token !== undefined || data.jti !== undefined, {
    message: 'Either token or jti is required',
    path: ['token'],
  });

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(256),
  scopes: z.array(z.string().min(1)).min(1),
});

export const CreateAgentSchema = z.object({
  parent_token: z.string().min(1),
  capabilities: z.array(z.string().min(1)),
  max_lifetime_minutes: z.number().int().positive().optional(),
  purpose: z.string().max(2048).optional(),
  model: z.string().max(256).optional(),
  max_tool_calls: z.number().int().nonnegative().optional(),
  allow_spawn: z.boolean().optional(),
});

export const CheckPermissionSchema = z.object({
  action: z.string().min(1).max(512),
  resource: z.string().max(2048).optional(),
});

export const CreateRoleSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(2048).optional(),
  permissions: z.array(z.string().min(1)),
});

export const CreateWebhookSchema = z.object({
  url: z.string().url().max(2048),
  events: z.array(z.string().min(1)).min(1),
});

export const QueryAuditSchema = z.object({
  event_type: z.string().min(1).optional(),
  actor_id: z.string().min(1).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  cursor: z.string().min(1).optional(),
});

export const UpdateOrgSchema = z.object({
  name: z.string().min(1).max(256).optional(),
});

export type IssueTokenInput = z.infer<typeof IssueTokenSchema>;
export type VerifyTokenInput = z.infer<typeof VerifyTokenSchema>;
export type RevokeTokenInput = z.infer<typeof RevokeTokenSchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type CheckPermissionInput = z.infer<typeof CheckPermissionSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;
export type QueryAuditInput = z.infer<typeof QueryAuditSchema>;
export type UpdateOrgInput = z.infer<typeof UpdateOrgSchema>;
