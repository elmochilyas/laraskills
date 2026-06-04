# Rules: Migration Publishing & Discovery

## Metadata
- **Source KU:** migration-publishing-discovery
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- MIG-RULE-001: **Automatic loading for mandatory schema** — Always provide `loadMigrationsFrom()` so migrations run without manual publishing. Make publishable for customization as secondary option.
- MIG-RULE-002: **Always implement down()** — Every migration must have both `up()` and `down()`. Rollback support is essential.
- MIG-RULE-003: **Package-prefixed table/index names** — Use the package name as prefix for table names and index names to prevent collisions.
- MIG-RULE-004: **Schema versioning** — Schema additions (nullable columns) can be PATCH. Schema removals require MAJOR. Follow SemVer for schema changes.

## Architecture Rules
- MIG-RULE-005: **Mandatory vs optional** — Mandatory migrations auto-load. Optional migrations (feature-specific) publish only when needed.
- MIG-RULE-006: **Deterministic timestamping** — Use Spatie's named migration approach for stable timestamps that don't change on re-publish.
- MIG-RULE-007: **Index naming** — Use package prefix in index names: `package_name_column_name_index`.

## Implementation Rules
- MIG-RULE-008: **Test in CI** — Test migrations with fresh SQLite in-memory database. Verify tables created with correct columns and indexes.
- MIG-RULE-009: **Chunked data migrations** — Data migrations (moving data between tables) should be chunked and wrapped in transactions.

## Anti-Pattern Rules
- MIG-RULE-010: **Avoid only publishable, no auto-loading** — Creates setup friction and is error-prone.
- MIG-RULE-011: **Avoid modifying published migrations** — Changing source migration that's already been published confuses consumers.
- MIG-RULE-012: **Avoid no down() method** — Prevents clean rollbacks and testing workflows.
- MIG-RULE-013: **Avoid foreign keys across packages** — Creates tight coupling and migration ordering issues.
