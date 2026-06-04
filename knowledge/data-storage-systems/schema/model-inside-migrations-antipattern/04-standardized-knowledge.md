# 1-23 Model Inside Migrations Antipattern

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-23 |
| Knowledge Unit Title | Model Inside Migrations Antipattern |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 1.24 Schema and data migration separation | 1.19 Data backfill strategies |
| Last Updated | 2026-06-02 |

## Overview

Using Eloquent models inside migrations is an anti-pattern because models evolve independently of the schema. A migration running `User::where('status', 'active')->update(...)` references the `User` model as it exists today — but the migration was written for the schema as it existed at a past point. Model changes (renamed columns, new scopes, removed attributes) can break old migrations when run on a fresh database or during rollback.

---

## Core Concepts

- **Schema-model mismatch**: Models change (columns renamed, scopes added, casts changed) after the migration was written. When the migration runs on a fresh database, it uses the current model's state, which may not match the migration's expectations.
- **CI and fresh installs**: `migrate:fresh` in CI re-runs all migrations. If any migration uses a model that references a column that was added by a later migration, it fails.
- **Rollback failures**: A model's `boot()` method may register global scopes that reference columns that no longer exist after rollback.
- **Alternative**: Use `DB::table()` or raw SQL for data transformations in migrations.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use DB::table for data access in migrations**: `DB::table('users')->where('status', 'active')->update(...)` is safe because it references the raw table, not the model.
- **Use raw SQL for complex transformations**: `DB::statement('UPDATE users SET ...')` when the operation requires database-specific syntax.


## Architecture Guidelines

- | Method | When | When Not |
- |--------|------|----------|
- | DB::table() | Any data access in migrations | Maintaining Eloquent relationship magic |
- | Raw SQL | Database-specific transformations | Cross-database compatibility needed |
- | Eloquent model | NEVER in migrations | — |


## Performance Considerations

- DB::table() is slightly faster than Eloquent queries (no hydration overhead), but the difference is negligible in migration context.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Using a model that has global scopes**: The model's `boot()` registers a `tenant_id` global scope. The migration doesn't set tenant context. The query filters by `tenant_id IS NULL` and affects no rows. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Using a model with accessors**: `User::first()->full_name` in a migration references an accessor that concatenates `first_name` and `last_name`. If `first_name` was renamed to `given_name` in a later migration, the migration fails. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Class not found**: Model class is moved to a different namespace in a later refactor. The migration references the old namespace. Fatal error.
- - **Trait removed**: Model's `SoftDeletes` trait is removed in a later version. The migration calls `User::withTrashed()` which no longer exists.
- - **Column missing**: The migration uses `User::where('type', 'admin')` but the `type` column was renamed to `role` in a later migration. On fresh install, the query fails because `type` column doesn't exist yet.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Schema Design & Migration Engineering
- **Closely Related**: Other KUs within Schema Design & Migration Engineering
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

