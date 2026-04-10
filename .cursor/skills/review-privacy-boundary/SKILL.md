---
name: review-privacy-boundary
description: Reviews cloud and on-prem changes for privacy boundary violations. Use when modifying persistence, telemetry, logs, APIs, or email ingestion paths.
---

# Review Privacy Boundary

## Checklist
- Verify cloud tables store metadata only.
- Verify logs redact payload/body content.
- Verify telemetry is aggregated and redacted.
- Verify no attachment/document bodies cross to cloud.
- Verify tests cover boundary assertions.
