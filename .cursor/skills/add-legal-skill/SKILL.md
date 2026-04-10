---
name: add-legal-skill
description: Adds a new premium legal skill package with manifest validation, entitlement checks, policy requirements, and audit metadata hooks. Use when the user requests a new legal skill or skill-package changes.
---

# Add Legal Skill

## Workflow
1. Define skill id, version, and deterministic output envelope.
2. Add manifest and schema validation entries.
3. Wire entitlement checks before execution.
4. Add policy requirements and approval gates.
5. Emit metadata-only audit event.
6. Add unit and integration tests.

## Guardrails
- Never include raw legal content in cloud-facing payloads.
- Ensure every execution path validates entitlement first.
