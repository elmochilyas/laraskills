# Rules: Database Services

## Metadata
- **Source KU:** database-services
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- DB-RULE-001: **Match production engine** — Same DB engine and version in dev and prod prevents SQL compatibility issues.
- DB-RULE-002: **Use persistent volumes** — Named volumes (`sail-mysql`) preserve data across container restarts.
- DB-RULE-003: **Migration-first development** — Always create schema through migrations, not manual SQL.
- DB-RULE-004: **Use seed data** — `php artisan db:seed` for realistic dev data.
- DB-RULE-005: **SQLite for unit tests** — In-memory SQLite is 2-5x faster than MySQL/PostgreSQL tests.
- DB-RULE-006: **Dev/prod DB credentials** — Use `.env` per environment; never commit production creds.

## Decision Rules
- DB-RULE-007: **Use SQLite in-memory for testing** — Faster than containerized DB for unit tests.
- DB-RULE-008: **Use MySQL/PostgreSQL in Docker for dev** — Matches production engine.
- DB-RULE-009: **Integration tests should run against production-matching DB** — Not just SQLite.
