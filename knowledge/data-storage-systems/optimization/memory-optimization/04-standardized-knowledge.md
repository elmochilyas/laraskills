# 4-20 Memory Optimization

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-20 |
| Knowledge Unit Title | Memory Optimization |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 2.18 Model serialization | 2.23 chunk/cursor | 4.15 SQL-side aggregation |
| Last Updated | 2026-06-02 |

## Overview

Hydrating large Eloquent collections consumes PHP memory proportional to the number of rows and columns loaded. Each hydrated model increases memory by ~1-2KB. Loading 100,000 models uses 100-200MB for just the collection. Mitigation: use `cursor()`, narrow columns, use query builder for reporting.

---

## Core Concepts

- **Memory per model**: ~1-2KB for a standard Eloquent model with relationships.
- **Hydration overhead**: Eloquent creates objects with metadata (original, changes, casts, relationships).
- **Query builder**: Results are plain arrays/stdClass, consuming ~10x less memory.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use query builder for reporting**: `DB::table('orders')->select('status', DB::raw('COUNT(*)'))->groupBy('status')->get()` — no Eloquent overhead.
- **Narrow columns**: `->select('id', 'name')` — don't load large text fields that aren't displayed.
- **cursor() for memory-safe streaming**: Process one row at a time, never loading all into memory.


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
| 1 | Reporting through Eloquent**: `Order::all()->groupBy('status')->map->count()` — hydrates all orders, then groups/counts in PHP. Use query builder aggregation. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Loading full models for API responses**: `User::all()` returns 50K users for an admin dropdown. Use `User::pluck('name', 'id')`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

