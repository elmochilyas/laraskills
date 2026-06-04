# 4-30 Performance Budget Ci

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-30 |
| Knowledge Unit Title | Performance Budget Ci |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 4.25 Lazy loading detection | 4.26 Query log analysis |
| Last Updated | 2026-06-02 |

## Overview

Performance budgets in CI prevent query count and duration regressions before deployment. Enforce N+1 detection, total query count per request, and slow query thresholds. Use PHPUnit assertions, custom test macros, or GitHub Actions with performance benchmarks. Catch regressions before they reach production.

---

## Core Concepts

- **Query count assertion**: `Http::fake()` + `DB::enableQueryLog()` in tests. Assert that an endpoint fires exactly N queries.
- **Duration threshold**: `$response->getDuration()` or `Clockwork::getQueries()->sum('duration')` — fail tests exceeding max duration.
- **N+1 detection**: `Model::preventLazyLoading()` in tests. Every lazy load throws an exception, failing the test.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Test with DB::enableQueryLog**: `DB::enableQueryLog(); $response = $this->get('/posts'); $this->assertCount(5, DB::getQueryLog());`.
- **PHPUnit @group slow**: Tag performance tests with `@group performance`. Run in CI as optional workflow (not blocking PR merge).
- **Baseline comparison**: Store query count and duration baselines in JSON. CI compares against baselines and warns on regression.


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
| 1 | No query count assertions in tests**: Without them, a new relationship added to a view can silently add 50+ queries. Every endpoint test should assert query count. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | False negatives from connection differences**: SQLite in tests may execute different query patterns than MySQL/PostgreSQL. Run performance tests against the production-alike database. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

