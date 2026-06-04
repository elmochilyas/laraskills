# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Database Testing |
| Knowledge Unit | Query Sentinel |
| Difficulty | Advanced |
| Maturity | Emerging |
| Priority | P3 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Eloquent ORM, Database query optimization, N+1 detection |
| Related KUs | N+1 query detection, Query count expectations, Slow query identification |
| Source | domain-analysis.md K057 |

# Overview

Laravel Query Sentinel is a community package that provides real-time monitoring and alerting for problematic database queries in development and CI environments. It detects N+1 queries, slow queries, duplicate queries, full table scans, and missing indexes before they reach production. Query Sentinel acts as an automated gate in CI, blocking PRs that introduce query performance regressions.

# Core Concepts

- **N+1 detection**: Automatically identifies repeated identical queries inside loops.
- **Slow query threshold**: Configurable time threshold (default 100ms).
- **Duplicate query detection**: Identifies identical queries executed multiple times within a request.
- **Full table scan detection**: Flags SELECT queries without WHERE clause or index usage.
- **Missing index detection**: Identifies queries that would benefit from additional indexes.
- **CI integration**: Middleware or service provider that halts test execution on threshold violation.

# When To Use

- In CI as an automated performance regression gate
- During development for immediate N+1 feedback
- When onboarding new team members (catches common query mistakes)
- For performance-critical applications with strict query budgets

# When NOT To Use

- In production (overhead is unacceptable for stack trace capture and EXPLAIN)
- Without proper exclusion tuning (too many false positives cause alert fatigue)
- As a replacement for `expectsDatabaseQueryCount()` (both should be used together)
- When the database user lacks EXPLAIN permission

# Best Practices (WHY)

- **Start with N+1 detection only**: Enable N+1 detection first. Add slow query and duplicate detection after establishing a baseline. Full table scan and missing index detection add EXPLAIN overhead.
- **Use warning mode in development, exception mode in CI**: Developers see warnings without disruption. CI blocks regressions. This balances developer experience with quality enforcement.
- **Maintain an exclusion list**: Internal Laravel queries (migrations, sessions, config cache) should be excluded. Review exclusions quarterly to ensure they're still valid.
- **Combine with `expectsDatabaseQueryCount()`**: Sentinel catches patterns (N+1, duplicates, slow queries). `expectsDatabaseQueryCount()` enforces exact budgets. They're complementary.
- **Disable in production**: Sentinel's event interception, stack trace capture, and EXPLAIN execution have unacceptable overhead for production environments.

# Architecture Guidelines

- **Query Sentinel vs `expectsDatabaseQueryCount()`**: Use both for comprehensive coverage. Sentinel for pattern detection, query count assertions for budget enforcement.
- **Warning vs exception mode**: Warning mode logs and continues. Exception mode fails tests immediately. Use warning for development, exception for CI.
- **Exclusion list maintenance**: Too many exclusions reduce effectiveness. Review quarterly. Keep narrow and specific.
- **Database explain plan support**: EXPLAIN requires additional permissions. Configure in CI database user setup only.

# Performance Considerations

- Query interception overhead: <0.1ms per query (event dispatch).
- Stack trace capture: 1-5ms per flagged query. Enable only in CI.
- EXPLAIN query execution: Adds 1-10ms per SELECT query. Use only in dedicated performance test suite.
- Memory for query log: Grows linearly with query count and stack trace depth.
- Disable in production: Sentinel is designed for development and testing only.

# Security Considerations

- Query Sentinel captures query SQL and bindings. These may contain sensitive data if tests use production-like data.
- Stack traces can reveal application structure. Restrict access to CI artifacts containing Sentinel output.
- EXPLAIN queries require database read access. Ensure CI database user has minimum necessary permissions.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Enabling all detection types without tuning | Default configuration detects everything | Too many false positives; team ignores Sentinel | Start with N+1 detection only; add others after baseline established |
| Using Sentinel without exclusion list | Every query pattern flagged | Migration, session, and internal queries trigger violations | Exclude Laravel's internal query patterns |
| Adding too many exclusions | Avoiding false positives | Real issues pass through undetected | Review exclusions quarterly; keep narrow and specific |
| Not using Sentinel in CI | Only enabled in development | Developers may not notice warnings; regressions merge | Strict mode (exception) in CI; lenient mode (log) in development |
| Enabling in production | "We want to monitor all queries" | Unacceptable overhead; performance degradation | Sentinel is for dev/test only. Use Laravel Telescope for production monitoring |

# Anti-Patterns

- **Sentinel as production monitoring tool**: Running Sentinel in production. Instead, use Telescope or dedicated APM for production query monitoring.
- **Default configuration without tuning**: Using all detection types at default thresholds. Instead, tune thresholds to match your application's query patterns.
- **Empty exclusion list**: Never excluding any query patterns. Instead, exclude known-safe patterns (migrations, sessions, internal framework queries).
- **Sentinel as only performance tool**: Relying solely on Sentinel. Instead, combine with query count expectations, profiling, and database monitoring.

# Examples

```php
// config/query-sentinel.php
return [
    'enabled' => env('QUERY_SENTINEL_ENABLED', false),
    
    'detection' => [
        'n_plus_one' => true,
        'slow_query' => true,
        'duplicate_query' => true,
        'full_table_scan' => env('APP_ENV') === 'testing',
        'missing_index' => env('APP_ENV') === 'testing',
    ],
    
    'thresholds' => [
        'slow_query_ms' => 100,
        'duplicate_threshold' => 3, // Same query >3 times = duplicate
        'n_plus_one_min_occurrences' => 5,
    ],
    
    'excluded_patterns' => [
        'migrations_*',
        'sessions_*',
        'cache_*',
        'select 1',
    ],
    
    'mode' => env('QUERY_SENTINEL_MODE', 'log'), // 'log' or 'exception'
];
```

# Related Topics

- **Prerequisites**: Eloquent ORM, Database query optimization, N+1 detection
- **Related**: N+1 query detection, Query count expectations, Slow query identification
- **Advanced**: Database indexing strategy, Query plan analysis, Performance regression CI gates

# AI Agent Notes

- Query Sentinel is a community package, not part of Laravel core. Check `composer.json` to see if it's already installed or if an alternative is in use.
- When setting up Sentinel, start in `log` mode with N+1 detection only. Review the logs after the first test suite run to build the exclusion list. Then enable exception mode in CI.
- Sentinel works best when combined with explicit `expectsDatabaseQueryCount()` assertions. Sentinel catches unexpected patterns; assertions enforce known budgets.

# Verification

- [ ] Query Sentinel is installed and configured
- [ ] N+1 detection is enabled in CI
- [ ] Exclusion list covers internal Laravel queries
- [ ] Sentinel runs in warning mode in development, exception mode in CI
- [ ] Sentinel is disabled in production
- [ ] Exclusions are reviewed quarterly
- [ ] Sentinel complements (doesn't replace) expectsDatabaseQueryCount() assertions
