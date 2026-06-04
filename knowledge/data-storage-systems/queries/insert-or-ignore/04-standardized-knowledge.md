# 2-22 Insert Or Ignore

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-22 |
| Knowledge Unit Title | Insert Or Ignore |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.21 upsert | 2.26 updateOrCreate, firstOrCreate |
| Last Updated | 2026-06-02 |

## Overview

`insertOrIgnore` inserts rows and silently ignores any rows that would cause duplicate key violations. Unlike `upsert`, it does NOT update existing rows — it simply skips them. Useful for batch inserts where some rows may already exist and should not be updated.

---

## Core Concepts

- **Silent skip**: Rows that violate unique constraints are not inserted. No error thrown, no update performed.
- **Batch operation**: Accepts an array of rows. `Model::insertOrIgnore([...])`.
- **No model events**: Like `upsert`, does not fire model lifecycle events.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Seed idempotent data**: Insert reference data without worrying about duplicates from previous runs.
- **Log deduplication**: Insert log entries by a unique hash. Skip if already recorded.


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
| 1 | - **Assuming insertOrIgnore succeeds for all rows**: insertOrIgnore silently skips duplicate rows without feedback. Developers often assume all rows were inserted, leading to data inconsistency. Always verify row counts or use upsert when feedback is needed. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | - **Mixing insertOrIgnore with model events**: Unlike create() or save(), insertOrIgnore does not fire Eloquent model events (retrieved, creating, created, etc.). Relying on event-driven logic with insertOrIgnore leads to silent failures in observers and event listeners. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | - **Batch size imbalance**: Very large batch inserts (>1000 rows) can exceed database parameter limits (max_allowed_packet, max_connections) or cause transaction log overflow. Split large inserts into manageable batches of 100-500 rows. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | - **Ignoring query shape**: The structure of SQL queries (which tables, joins, filters, and sort orders) determines index effectiveness. Maintaining consistent query shapes enables index reuse and query plan stability. Drastic query shape changes between deploys can cause performance regressions. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 5 | - **Not profiling before optimizing**: Premature query optimization based on assumptions rather than profiling data leads to wasted effort. Always use EXPLAIN, query logs, and profiling tools to identify actual bottlenecks before rewriting queries. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 6 | - **Missing index maintenance**: Over time, heavily written indexes fragment and lose performance. Schedule regular index rebuilds for tables with high write volume. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

