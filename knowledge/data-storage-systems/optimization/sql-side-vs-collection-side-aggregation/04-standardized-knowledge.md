# 4-15 Sql Side Vs Collection Side Aggregation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-15 |
| Knowledge Unit Title | Sql Side Vs Collection Side Aggregation |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.7 Relationship counting | 2.8 Subquery selects |
| Last Updated | 2026-06-02 |

## Overview

SQL-side aggregation (using `withCount`, `withSum`, `DB::raw(SUM(...))`) is always more efficient than loading full collections into PHP and aggregating in memory. The rule: if you only need a count, sum, avg, min, max, or boolean — use SQL.

---

## Core Concepts

- **SQL aggregation**: `Post::withCount('comments')` — one query, one integer per parent row.
- **Collection aggregation**: `Post::with('comments')->get()->each(fn($p) => $p->comments->count())` — loads ALL comments into memory, then counts in PHP.
- **Memory waste**: Loading 10,000 comments to count 5 per post is memory-inefficient.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Always use withCount for counts**: Never `$post->comments->count()`. Use `$post->comments_count` (from `withCount`).
- **DB::raw for complex aggregation**: `->selectRaw('COUNT(*) as total, SUM(amount) as revenue')` in the query builder.
- **Mass assignment aggregation**: `User::select('plan_id')->selectRaw('COUNT(*) as count')->groupBy('plan_id')->get()`.


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
| 1 | Collection count in a loop**: `foreach ($posts as $post) { $count = $post->comments->count(); }` — loads all comments for every post. Use `withCount('comments')` once. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Loading relationships just for aggregation**: Loading full related models when only the aggregated value is needed. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

