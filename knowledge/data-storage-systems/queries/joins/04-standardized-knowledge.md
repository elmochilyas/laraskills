# 2-13 Joins

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-13 |
| Knowledge Unit Title | Joins |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.10 Query builder methods | 4.24 Join optimization | 2.2 Relationship types |
| Last Updated | 2026-06-02 |

## Overview

Query builder joins combine rows from multiple tables based on related columns. Join type selection (inner, left, right, cross) determines which rows are included in the result. `joinSub` allows joining to a subquery. Join performance depends on index availability on the joined columns.

---

## Core Concepts

- **join()**: INNER JOIN — includes rows where the join condition matches in both tables.
- **leftJoin()**: LEFT JOIN — includes all rows from the left table, NULLs for non-matching right rows.
- **rightJoin()**: RIGHT JOIN — opposite of LEFT JOIN.
- **crossJoin()**: CROSS JOIN — Cartesian product of both tables.
- **joinSub()**: Join to a subquery result. Useful for pre-filtered joins.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Index join columns**: The column used in the ON clause must be indexed. For `join('orders', 'orders.user_id', 'users.id')`, `orders.user_id` must be indexed.
- **Reads vs writes separation**: For reporting (read-only), LEFT JOIN is acceptable. For transactional queries, prefer INNER JOIN to avoid unexpected NULLs.
- **joinSub for complex filtering**: Pre-filter a large table before joining to reduce the joined dataset size.


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
| 1 | Missing index on join column**: A join on an unindexed column causes a full table scan on the joined table for every row. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | joinSub without alias**: `joinSub($query, 'alias', 'alias.id', '=', 'table.col')` — forgetting the alias causes ambiguous column errors. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

