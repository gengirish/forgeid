---
name: doc-sync
description: >-
  Keep project documentation in sync with code. Auto-generates API reference,
  architecture overview, data models, deployment guide, and environment docs
  from the live codebase. Use when code changes (new routes, models, schemas,
  config, dependencies, infra) or when the user asks to update, regenerate,
  or sync documentation.
---

# Doc Sync — Living Documentation

## When to Trigger

Run the doc generator whenever:
- A FastAPI route, model, schema, or service is added/changed/removed
- `pyproject.toml`, `package.json`, or Docker/infra files change
- New environment variables are introduced in `config.py` or `.env.example`
- The user says "sync docs", "update docs", or "regenerate docs"

## Quick Start

```bash
cd TrustGate
python .cursor/skills/doc-sync/scripts/generate_docs.py
```

This scans the codebase and writes/overwrites files under `docs/`:

```
docs/
├── API_REFERENCE.md       # All REST endpoints with request/response schemas
├── ARCHITECTURE.md        # System overview, directory map, data flow
├── DATA_MODELS.md         # ORM models + Pydantic schemas side-by-side
├── DEPLOYMENT.md          # Fly.io, Vercel, Neon DB, Redis, Docker setup
├── ENVIRONMENT.md         # Every env var with type, default, and purpose
└── DEVELOPMENT.md         # Local setup, testing, linting, scripts
```

## How It Works

The generator script (`scripts/generate_docs.py`) uses AST parsing and file
inspection — no running server required. It:

1. Parses `backend/app/api/*.py` for FastAPI router decorators to extract
   endpoints, methods, path params, query params, and response models.
2. Parses `backend/app/models/*.py` for SQLAlchemy mapped columns to build
   the data model reference.
3. Parses `backend/app/schemas/*.py` for Pydantic fields.
4. Reads `backend/app/config.py` to extract all `Settings` fields and defaults.
5. Reads `pyproject.toml`, `package.json`, `docker-compose.yml`, `fly.toml`,
   `vercel.json`, and CI/CD workflows for infra docs.
6. Inspects `frontend/src/` for pages and components.
7. Reads `scripts/*.py` for operational tooling docs.

## Rules

- **Never hand-edit** files in `docs/` — they are overwritten on each run.
  To add persistent notes, put them in `docs/NOTES.md` (not generated).
- Keep `README.md` as the concise entry point; it links into `docs/`.
- After regenerating, review the diff before committing to catch regressions.

## Extending

To add a new doc section:
1. Add a `generate_<section>()` function in `generate_docs.py`.
2. Call it from `main()` and write to `docs/<SECTION>.md`.
3. Update the file list above and in `README.md`.
