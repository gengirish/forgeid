---
name: generate-audit-metadata
description: Generates tamper-evident audit metadata records with hash-link chaining and actor/action normalization. Use when implementing audit events, webhook traces, or admin actions.
---

# Generate Audit Metadata

## Standard fields
- `org_id`
- `actor_type`
- `actor_id`
- `action`
- `metadata` (non-content)
- `previous_hash`
- `event_hash`
- `created_at`

## Rules
- Include only metadata, never legal content.
- Normalize actor/action strings for queryability.
- Chain hashes for tamper evidence.
