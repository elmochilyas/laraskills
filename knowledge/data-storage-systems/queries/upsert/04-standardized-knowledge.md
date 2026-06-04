# 2-21 Upsert

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-21 |
| Knowledge Unit Title | Upsert |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 2.22 insertOrIgnore | 2.26 updateOrCreate, firstOrCreate |
| Last Updated | 2026-06-02 |

## Overview

`upsert` inserts rows that don't exist and updates rows that do, in a single atomic operation. It uses unique indexes or primary keys to determine whether a row exists. Essential for idempotent imports, sync operations, and batch data ingestion.

---

## Core Concepts

- **upsert(array_values, unique_columns, update_columns)**: Insert new rows or update existing ones.
- **Atomic**: Single database transaction. No race condition between check and insert.
- **Unique key requirement**: The unique columns must have a unique index or primary key for conflict detection.
- **Batch upsert**: Multiple rows in one operation. `upsert([['email' => 'a@b.com', 'name' => 'A'], [...]], 'email', 'name')`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Idempotent imports**: Upsert ensures that running an import job multiple times produces the same result (no duplicate rows, latest data wins).
- **Sync from external API**: Upsert third-party data by their external ID as the unique key.
- **Bulk update-or-create**: Instead of `firstOrCreate` in a loop (N+1 queries), use `upsert` in a single query.


## Architecture Guidelines

- Decision: Eloquent ORM vs Query Builder vs Raw SQL. Use Eloquent for standard CRUD. Use Query Builder for complex queries. Use Raw SQL for database-specific optimizations.

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
| 1 | Missing unique index**: upsert silently falls back to INSERT on PostgreSQL (no error, no update). On MySQL, it requires a unique/primary key. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not including all unique columns**: upsert identifies conflicts by ALL specified unique columns. Missing a column may cause unexpected insert or update. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Model events not fired**: upsert does NOT fire model events (`saving`, `saved`, `creating`, `created`, `updating`, `updated`). Use `DB::table` upsert for event-less operations. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

