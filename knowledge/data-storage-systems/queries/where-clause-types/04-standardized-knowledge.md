# 2-11 Where Clause Types

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-11 |
| Knowledge Unit Title | Where Clause Types |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 2.10 Query builder methods | 4.7 Sargable vs non-sargable query patterns | 4.8 whereDate sargability breakage |
| Last Updated | 2026-06-02 |

## Overview

Laravel's `where` method family generates different SQL expression patterns. Each type affects sargability (index usage) differently. `whereDate` and related date functions break sargability by wrapping columns in functions. Understanding which `where` types use indexes is essential for query performance.

---

## Core Concepts

- **where('col', 'val')**: Plain equality. Uses index. SQL: `WHERE col = ?`.
- **whereIn('col', [1,2,3])**: Multiple equality. Uses index. SQL: `WHERE col IN (?, ?, ?)`.
- **whereBetween('col', [$a, $b])**: Range. Uses index. SQL: `WHERE col BETWEEN ? AND ?`.
- **whereNull('col')**: IS NULL check. Uses B-tree index. SQL: `WHERE col IS NULL`.
- **whereDate('col', $date)**: Function wrap. BREAKS index. SQL: `WHERE DATE(col) = ?`.
- **whereColumn('a', 'b')**: Column comparison. Uses indexes on both columns. SQL: `WHERE a = b`.
- **whereExists(fn)**: EXISTS subquery.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Replace whereDate with range**: Instead of `whereDate('created_at', $date)`, use `whereBetween('created_at', [$date->startOfDay(), $date->endOfDay()])`. This is sargable.
- **Use whereIn for multiple values**: More efficient than multiple `orWhere` calls for the same column.
- **Use whereNull for optional filters**: `->when($request->status, fn($q, $v) => $q->where('status', $v), fn($q) => $q->whereNull('status'))`.


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
| 1 | whereDate on indexed column**: Creates a full table scan on a large table. Use range query instead. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | orWhere without grouping**: `where('a', 1)->orWhere('b', 2)` — the OR may not use the composite index on (a, b). Group with a closure. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

