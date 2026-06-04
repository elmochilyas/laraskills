# 4-11 Or Where Composite Index

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-11 |
| Knowledge Unit Title | Or Where Composite Index |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.14 Unions | 4.24 Join optimization |
| Last Updated | 2026-06-02 |

## Overview

`orWhere` on a composite index can cause a full table scan because the OR condition references a different part of the index. MySQL often decides a full scan is cheaper than merging two index scans. Group OR conditions explicitly or use UNION instead.

---

## Core Concepts

- **Problem**: `WHERE user_id = ? OR status = 'urgent'` — the composite index on `(user_id, status)` covers the first condition but not the second without `user_id`. MySQL scans the table.
- **Fix 1 — Group ORs**: `where(fn($q) => $q->where('user_id', X)->orWhere('status', 'urgent'))` — tells MySQL the OR scope is limited.
- **Fix 2 — UNION**: Two separate queries, each using its own index. UNION merges results.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Always group orWhere**: Use closure-based grouping to clarify OR scope. Prevents unexpected full table scans.
- **UNION for high-selectivity OR**: When each branch of the OR is highly selective, UNION is faster than a single OR query.


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
| 1 | Unintentional OR scope**: `where('a', 1)->orWhere('b', 2)` — the OR applies to the ENTIRE WHERE clause. Often the developer intended `where('a', 1)` AND `(x OR y)` but wrote `(where a) OR (b)`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

