# 2-1 Model Definition Conventions

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-1 |
| Knowledge Unit Title | Model Definition Conventions |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 2.10 Query builder methods | 2.17 Casts | 2.18 Model serialization |
| Last Updated | 2026-06-02 |

## Overview

Eloquent model conventions define how a PHP class maps to a database table. The convention-over-configuration approach infers table names, primary keys, timestamps, and connection from class naming. Understanding these conventions and when to override them is foundational to Eloquent usage.

---

## Core Concepts

- **Table name**: Snake case plural of class name (`User` -> `users`, `PageCategory` -> `page_categories`). Override via `protected $table = 'custom_table'`.
- **Primary key**: `id` column, integer, auto-incrementing. Override via `protected $primaryKey = 'uuid'` and `public $incrementing = false`.
- **Timestamps**: Eloquent expects `created_at` and `updated_at` columns. Disable via `public $timestamps = false`.
- **Connection**: Uses default database connection. Override via `protected $connection = 'pgsql'`.
- **Key type**: `protected $keyType = 'string'` for UUID/ULID primary keys.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Always define $table explicitly in multi-tenant apps**: When models exist in different databases depending on tenant, explicit `$table` prevents ambiguity.
- **Use UUID/ULID for public-facing models**: Set `$incrementing = false` and `$keyType = 'string'` for models with UUID primary keys.
- **Per-model connection**: In multi-database setups, set `$connection` per model rather than relying on the default.


## Architecture Guidelines

- | Convention | Override When |
- |------------|--------------|
- | Snake case plural table | Legacy table names, multi-tenant prefix |
- | Auto-incrementing integer PK | UUID, ULID, composite keys |
- | Timestamps auto-managed | Non-entity tables (pivot, logs, aggregates) |
- | Default connection | Multi-database, per-tenant databases |


## Performance Considerations

- Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subquery selects in addSelect avoid N+1 count queries. lazy() and cursor() use generators to reduce memory for large result sets.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Forgetting to disable incrementing for UUIDs**: `Model::create()` tries to insert with `id = 0` because Eloquent expects an auto-incrementing integer. Error or silent wrong insertion. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Timestamps on non-entity tables**: Pivot tables, log tables, and aggregate tables don't need `created_at`/`updated_at`. Disable timestamps to avoid unnecessary columns. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- N+1 query problems occur when relationships are lazy-loaded in loops. Mass assignment vulnerabilities arise when fillable/guarded are misconfigured. Serialization failures happen when models with relationships are queued without proper eager loading. Memory exhaustion occurs with chunking without chunkById.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Eloquent Orm Query Builder
- **Closely Related**: Other KUs within Eloquent Orm Query Builder
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

