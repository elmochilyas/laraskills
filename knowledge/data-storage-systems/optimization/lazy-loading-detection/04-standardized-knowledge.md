# 4-25 Lazy Loading Detection

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-25 |
| Knowledge Unit Title | Lazy Loading Detection |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 4.26 Query log analysis | 4.27 Profiling tools |
| Last Updated | 2026-06-02 |

## Overview

N+1 queries caused by lazy loading are the #1 performance issue in Laravel applications. In production, lazy loading can silently degrade response times. Detection requires query logging, middleware, or Laravel's built-in N+1 detection. Prevention requires strict discipline: always eager load, never rely on lazy loading in production contexts.

---

## Core Concepts

- **N+1 symptom**: Request loads 50 posts, then executes 50+1 queries (1 for posts, 50 for comments). Each lazy load fires a separate query.
- **Laravel strict mode**: `Model::preventLazyLoading(true)` in `AppServiceProvider::boot()`. Throws exception when lazy loading occurs.
- **Query counter**: Log total query count per request. Any request exceeding N queries per item is suspicious.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Enable strict mode in development**: `Model::preventLazyLoading(! $this->app->isProduction())`. Catches N+1 in CI/testing.
- **Query log middleware**: Middleware that logs query count for requests over a threshold.
- **Telescope/Debugbar**: Built-in N+1 detection. Use in staging/development.


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
| 1 | Disabling lazy loading prevention in production**: Without it, N+1 goes undetected. Use query log monitoring instead. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Relying on `$with` on the model**: `protected $with = ['comments']` always eager loads, even when not needed. Prefer `->with()` per query. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

