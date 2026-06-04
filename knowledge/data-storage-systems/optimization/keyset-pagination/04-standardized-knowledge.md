# 4-18 Keyset Pagination

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-18 |
| Knowledge Unit Title | Keyset Pagination |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 4.16 Offset pagination | 4.17 Cursor pagination |
| Last Updated | 2026-06-02 |

## Overview

Keyset pagination (also called "seek pagination") is similar to cursor pagination but uses composite keys to paginate through sorted result sets with non-unique sort columns. It requires a stable sort order and a tiebreaker column (typically the primary key).

---

## Core Concepts

- **Multi-column cursor**: `WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20` — supports sorting by non-unique columns.
- **Tiebreaker**: The second column (usually PK) ensures stability when multiple rows share the same sort value.
- **No OFFSET**: Like cursor pagination, performance is constant per page.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Sort by created_at with id tiebreaker**: `WHERE (created_at, id) < ($lastCreatedAt, $lastId) ORDER BY created_at DESC, id DESC LIMIT 20`.
- **Sort by category + created_at**: `WHERE (category_id, created_at, id) > ($cat, $date, $id) ORDER BY category_id, created_at, id LIMIT 20`.


## Architecture Guidelines

- Query cache for read-heavy low-write workloads. Materialized views for complex aggregations. Read replicas for reporting offload.

## Performance Considerations

- EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table queries affects performance.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | No tiebreaker column**: Sorting by `created_at` alone — if 10 rows have the same timestamp, pagination misses or duplicates rows. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Missing indexes cause full table scans on large tables. Implicit type conversion prevents index usage. OR conditions break composite index leftmost prefix rules. LIKE leading wildcards prevent index usage.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Query Optimization Profiling
- **Closely Related**: Other KUs within Query Optimization Profiling
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

