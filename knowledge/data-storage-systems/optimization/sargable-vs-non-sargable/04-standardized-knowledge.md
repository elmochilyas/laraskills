# 4-7 Sargable Vs Non Sargable

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-7 |
| Knowledge Unit Title | Sargable Vs Non Sargable |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 3.28 Sargability rule | 4.8 whereDate sargability | 4.9 LIKE leading wildcard | 4.10 Function wraps |
| Last Updated | 2026-06-02 |

## Overview

Sargable conditions allow index usage. Non-sargable conditions force full table scans. The rule: the indexed column must appear alone (no function wrapping) on one side of the comparison operator. Non-sargable patterns are the leading cause of unexpected full table scans in Laravel applications.

---

## Core Concepts

- **Sargable**: `WHERE col = ?`, `WHERE col > ?`, `WHERE col IN (?)`, `WHERE col LIKE 'prefix%'`.
- **Non-sargable**: `WHERE LOWER(col) = ?`, `WHERE DATE(col) = ?`, `WHERE CAST(col AS CHAR) = ?`, `WHERE col LIKE '%suffix'`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Replace function wrap with range**: `WHERE YEAR(created_at) = 2026` → `WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'`.
- **Use case-insensitive collation**: `WHERE LOWER(email) = 'test@test.com'` → set column collation to case-insensitive, use `WHERE email = 'test@test.com'`.


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
| 1 | whereDate/whereMonth/whereYear**: Eloquent's date helper methods wrap columns in functions. Always use range queries. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | OrderBy with function**: `orderByRaw('LOWER(name)')` — causes filesort. Use functional index or case-insensitive collation. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

