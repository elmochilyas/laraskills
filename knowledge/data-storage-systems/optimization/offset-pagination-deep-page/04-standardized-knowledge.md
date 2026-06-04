# 4-16 Offset Pagination Deep Page

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-16 |
| Knowledge Unit Title | Offset Pagination Deep Page |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 4.17 Cursor pagination | 4.18 Keyset pagination | 4.19 chunk method tradeoffs |
| Last Updated | 2026-06-02 |

## Overview

`LIMIT 20 OFFSET 100000` reads 100,020 rows from the table, then discards the first 100,000. As offset increases, pagination gets progressively slower. The database scans all discarded rows on every page. Deep offset pagination is the most common pagination performance issue in Laravel.

---

## Core Concepts

- **OFFSET cost**: Each OFFSET skips N rows by reading them. Page 5000 of 20 items reads 100,000 rows.
- **Cursor pagination fix**: `WHERE created_at < ? ORDER BY created_at DESC LIMIT 20` — no offset, always reads 20 rows.
- **Keyset pagination**: Like cursor but using a stable sort key.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Replace offset with cursor for large datasets**: Use `where('created_at', '<', $lastCreatedAt)->orderBy('created_at', 'desc')->limit(20)`.
- **Keep offset for small datasets**: If total rows < 10K, offset is acceptable. The performance penalty is negligible.
- **Use paginate() for admin panels**: Admin panels typically have small result sets. Offset pagination is simpler to implement.


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
| 1 | Using offset for API cursor pagination**: Mobile apps scrolling through thousands of items with offset. Each new page degrades. Use cursor pagination. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Forgetting to ORDER BY**: Offset pagination without ORDER BY returns unpredictable results and may have inconsistent pagination. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

