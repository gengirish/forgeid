---
name: harden-webhook-endpoint
description: Hardens external webhook endpoints using signature validation, idempotency keys, replay protection, and dead-letter handling. Use when adding or modifying webhook integrations.
---

# Harden Webhook Endpoint

## Required controls
1. Verify provider signature before parsing body.
2. Enforce idempotency key dedupe with TTL.
3. Reject stale timestamps and replayed events.
4. Add retry/backoff and dead-letter routing.
5. Emit metadata-only audit event for each webhook action.
