# 1-1 Laravel Migration File Structure

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-1 |
| Knowledge Unit Title | Laravel Migration File Structure |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 1.7 Migration batch tracking and the migrations table | 1.8 Migration squashing | 1.20 Migration immutability | 1.9 Migration isolation |
| Last Updated | 2026-06-02 |

## Overview

Laravel migrations are version-controlled schema definitions that allow teams to define, share, and roll back database changes. Each migration is a PHP class with `up()` and `down()` methods that describe forward and reverse schema operations. The migration file's timestamp prefix determines execution order. Since Laravel 9, anonymous classes eliminate class name collisions. Migrations enable reproducible database schemas across environments and are foundational to deployment safety.

---

## Core Concepts

- **Migration as version control for schemas**: Each file represents one atomic schema change (or group of related changes). The `migrations` table tracks which files have been executed and in which batch.
- **up() applies, down() reverses**: `up()` implements the forward change (create table, add column). `down()` is the exact inverse (drop table, remove column). Rollback iterates batches in reverse order.
- **Anonymous classes**: Since Laravel 9, `return new class extends Migration` prevents class name collisions in large teams.
- **shouldRun method**: Conditional execution — returns false to skip a migration. Useful for feature-gated schema changes or environment-specific migrations.
- **$connection property**: Explicitly set the database connection for multi-connection setups.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Single-responsibility migrations**: Each migration should do one thing (add a column, create a table, add an index). Avoid combining unrelated schema changes in one file.
- **Idempotent down()**: `down()` must completely reverse `up()`. If `up()` adds a column with an index, `down()` must drop both. Failure to do so causes errors on rollback.
- **Conditional migrations with shouldRun**: Use for migrations that should only apply in specific environments or when a feature flag is active.


## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | Anonymous class | New Laravel 9+ projects | Legacy projects with named classes |
- | $connection override | Multi-DB setups | Single-connection apps |
- | shouldRun | Feature-gated schemas | Core schema changes always needed |
- | --step | When rollback granularity matters | Normal CI/CD where batch rollback is acceptable |


## Performance Considerations

- - Each migration runs in its own transaction (where supported). DDL operations on large tables may exceed transaction timeout.
- - Schema dump (`schema:dump`) bypasses hundreds of small migration files for fresh installs, reducing initial migration time from minutes to seconds.
- - The `migrations` table itself is tiny and incurs negligible overhead.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Editing deployed migrations**: The `migrations` table has the filename recorded. Re-editing the class doesn't re-run it — the change silently never happens. Always create a new migration. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Incomplete down()**: `up()` adds `->unique()` but `down()` only calls `dropColumn()` without `dropIndex()` first. This fails on rollback because the index still exists. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Class name collisions in older Laravel**: Two developers create migrations with the same class name on the same day. Since Laravel 9, anonymous classes solve this. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Rollback fails because migration file is missing**: The entry in `migrations` table references a file that no longer exists. `down()` cannot be called. Recovery requires manual `DELETE FROM migrations WHERE migration = ?` or creating a replacement migration.
- - **DDL transaction failure**: Some DDL operations implicitly commit the transaction (MySQL), making the migration non-atomic. Partial migration state can result.
- - **shouldRun misconfiguration**: If `shouldRun` returns false in a production environment where the schema change is actually needed, the migration silently skips and the schema never updates.


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

