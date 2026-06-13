# 2-10 Query Builder Methods

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-10 |
| Knowledge Unit Title | Query Builder Methods |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | None |
| Last Updated | 2026-06-02 |

## Overview

Laravel's query builder provides a fluent interface for constructing SQL queries. The core methods — select, where, join, groupBy, having, orderBy, limit, offset — map directly to SQL clauses. Understanding their generated SQL and index requirements is essential.

---

## Core Concepts

- **select()**: Specifies columns. `select('id', 'name')` generates `SELECT id, name`. Default is `SELECT *`.
- **where()**: Adds WHERE conditions. Multiple `where()` calls are ANDed.
- **join()**: Adds JOIN clauses. Supports inner, left, right, cross joins.
- **groupBy() / having()**: For aggregation queries. GROUP BY columns must appear in SELECT if not aggregated.
- **orderBy()**: Adds ORDER BY. `orderBy('created_at', 'desc')`.
- **limit() / offset()**: Pagination. `limit(15)->offset(30)` generates `LIMIT 15 OFFSET 30`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Explicit select()**: Always specify columns instead of defaulting to `SELECT *`. Reduces data transfer and prevents over-fetching.
- **where with array**: `->where(['status' => 'active', 'plan' => 'premium'])` for multiple equality conditions.
- **Raw expressions**: Use `selectRaw()`, `whereRaw()`, `havingRaw()` when standard methods can't express the needed SQL.


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
| 1 | Default SELECT ***: Transfers all columns including large text fields. Specify only needed columns. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | LIMIT without ORDER BY**: Result order is unpredictable. Always specify ORDER BY for paginated queries. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | GROUP BY without aggregate**: MySQL ONLY_FULL_GROUP_BY mode rejects non-aggregated, non-grouped columns in SELECT. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

