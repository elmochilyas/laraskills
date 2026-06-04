# 4-8 Where Date Sargability Breakage

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-8 |
| Knowledge Unit Title | Where Date Sargability Breakage |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 3.28 Sargability rule | 4.7 Sargable vs non-sargable |
| Last Updated | 2026-06-02 |

## Overview

Laravel's `whereDate`, `whereMonth`, `whereYear`, `whereDay`, and `whereTime` methods wrap columns in functions, breaking index usage. `Post::whereDate('created_at', today())` generates `WHERE DATE(created_at) = ?`. Fix by using half-open range comparisons: `whereBetween('created_at', [$start, $end])`.

---

## Core Concepts

- **Generated SQL**: `whereDate('col', $d)` → `DATE(col) = ?`. `whereMonth('col', 1)` → `MONTH(col) = 1`.
- **Index bypass**: The function wrap prevents B-Tree index usage on `col`.
- **Fix**: `where('created_at', '>=', $date->startOfDay())->where('created_at', '<', $date->startOfNextDay())`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Carbon range**: `$start = $date->startOfDay(); $end = (clone $date)->addDay()->startOfDay(); whereBetween('created_at', [$start, $end])`.
- **Microsecond-safety**: `startOfNextDay()` instead of `endOfDay()` to catch rows with microsecond timestamps right at midnight.


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
| 1 | whereDate inside a scope**: A local scope that calls `whereDate` silently breaks index on every invocation. Always use range queries in scopes. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Using whereDate for JOIN conditions**: `join('posts', fn($j) => $j->whereDate(...))` — double index bypass on the joined table. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

