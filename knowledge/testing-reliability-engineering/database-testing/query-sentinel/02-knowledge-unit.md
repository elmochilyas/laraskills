# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Database Testing
Knowledge Unit: Query Sentinel
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Laravel Query Sentinel is a community package that provides real-time monitoring and alerting for problematic database queries in development and CI environments. It detects N+1 queries, slow queries, duplicate queries, full table scans, and missing indexes before they reach production. Query Sentinel acts as an automated gate in CI, blocking PRs that introduce query performance regressions.

# Core Concepts
- **N+1 detection**: Automatically identifies repeated identical queries inside loops, flagging lazy-loaded relationships.
- **Slow query threshold**: Configurable time threshold (default 100ms). Queries exceeding the threshold are logged and can fail CI.
- **Duplicate query detection**: Identifies identical queries executed multiple times within a request, suggesting missing caching or eager loading.
- **Full table scan detection**: Flags `SELECT` queries without `WHERE` clause or without index usage (requires database explain plan support).
- **Missing index detection**: Identifies queries that would benefit from additional indexes (based on `WHERE` and `JOIN` columns).
- **CI integration**: As a `QuerySentinel` middleware or service provider that can halt test execution on threshold violation.
- **Configuration**: Configure via config file: thresholds, detection types, excluded query patterns, alert channels.

# Mental Models
- **Sentinel as automated code reviewer**: Query Sentinel reviews every query executed during tests and reports violations like a human reviewer would.
- **Detection layers**: N+1 detection ? duplicate query detection ? slow query detection ? full table scan detection. Each layer catches a different performance issue.
- **CI gate as quality enforcement**: Query Sentinel in CI prevents PRs with query regressions from merging. Developers fix issues before code reaches production.
- **Warning vs blocking**: Configure Sentinel to warn in development (informational) and block in CI (enforcement).

# Internal Mechanics
- **Query interception**: Listens to `Illuminate\Database\Events\QueryExecuted` event. Each query is captured with its SQL, bindings, execution time, and stack trace.
- **N+1 detection algorithm**: Groups queries by their SQL fingerprint (normalized SQL without bindings). If the same fingerprint appears N+ times within a short window, flags as N+1.
- **Slow query threshold**: Compares `QueryExecuted->time` against configured threshold. Flags if exceeded.
- **Duplicate query detection**: Same SQL within same request scope (transaction or request lifecycle). Cached by normalized SQL.
- **Full table scan detection**: Requires database EXPLAIN support. Executes `EXPLAIN` on SELECT queries and checks `type` column for `ALL` (full table scan).
- **Stack trace capture**: Captures `debug_backtrace()` with each flagged query. Helps developers locate the source of the problematic query.

# Patterns
- **Pattern: CI gate configuration**
  - Purpose: Block PRs with query regressions
  - Benefits: Automated performance review; no human oversight needed for common issues
  - Tradeoffs: False positives may block legitimate PRs
  - Implementation: Configure `query-sentinel.php` with strict thresholds in CI environment

- **Pattern: Development-only warnings**
  - Purpose: Alert developers during local development without blocking
  - Benefits: Immediate feedback; low friction
  - Tradeoffs: May be ignored if too noisy
  - Implementation: Configure alert channel as `log` in local, `throw` in CI

- **Pattern: Baseline exclusion**
  - Purpose: Exclude known/safe query patterns from detection
  - Benefits: Reduces noise; focuses on actionable violations
  - Tradeoffs: May hide real issues if exclusion is too broad
  - Implementation: Add query patterns to `excluded` config with wildcard support

- **Pattern: Metric collection and trending**
  - Purpose: Track query performance metrics across builds
  - Benefits: Trend analysis; identify gradual degradation
  - Tradeoffs: Requires storage and visualization infrastructure
  - Implementation: Output Sentinel metrics to CI artifacts; parse for trend data

# Architectural Decisions
- **Query Sentinel vs `expectsDatabaseQueryCount()`**: `expectsDatabaseQueryCount()` is static (assert a number). Sentinel is dynamic (detect patterns). Use both.
- **Warning vs exception mode**: Exception mode fails tests immediately on detection. Warning mode logs and continues. Use warning for development, exception for CI.
- **Exclusion list maintenance**: Too many exclusions reduce effectiveness. Review exclusions quarterly.
- **Database explain plan support**: EXPLAIN requires additional permissions. Use only in CI where database user has EXPLAIN privilege.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Automated N+1 detection catches regressions | Stack trace capture is expensive (memory + time) | Enable stack trace only in CI, not all environments |
| Missing index detection prevents slow queries | EXPLAIN queries add overhead to tests | Disable EXPLAIN detection in fast-paced dev tests |
| Duplicate query detection identifies caching opportunities | Some duplicates are intentional (batch operations) | Configure exclusion patterns for known duplicates |
| CI gate enforces query standards | False positives can block urgent PRs | Provide exclusion mechanism for verified exceptions |

# Performance Considerations
- Query interception overhead: <0.1ms per query (event dispatch only).
- Stack trace capture: 1-5ms per flagged query (debug_backtrace is expensive). Enable only in CI.
- EXPLAIN query execution: Adds 1-10ms per SELECT query when enabled. Use only in dedicated performance test suite.
- Memory for query log: Each query stores SQL, bindings, time, and stack trace. Memory grows linearly with query count.
- Disable in production: Query Sentinel is designed for development and testing only. Never enable in production.

# Production Considerations
- **Disable in production**: Sentinel's interception, stack trace capture, and EXPLAIN execution have unacceptable overhead for production.
- **CI integration cost**: Sentinel adds 5-20 seconds to CI test suite (depending on query count and EXPLAIN usage). Acceptable for the value.
- **Test environment setup**: Sentinel requires database user with EXPLAIN permission for full scan detection. Configure in CI database user setup.
- **Team adoption**: Sentinel works best when violations are actionable. Configure clear thresholds and provide documentation for fixing common violations.

# Common Mistakes
- **Mistake: Enabling all detection types without tuning**
  - Why: Default configuration detects everything
  - Why harmful: Too many false positives; team ignores Sentinel
  - Better: Start with N+1 detection only; add slow query detection after baseline established

- **Mistake: Using Sentinel without exclusion list**
  - Why: Every query pattern flagged
  - Why harmful: Migration queries, session queries, and other internal queries trigger violations
  - Better: Exclude Laravel's internal query patterns from detection

- **Mistake: Adding too many exclusions**
  - Why: Avoiding false positives by excluding everything
  - Why harmful: Real issues pass through undetected
  - Better: Review exclusions quarterly; keep them narrow and specific

- **Mistake: Not using Sentinel in CI**
  - Why: Only enabled in development
  - Why harmful: Developers may not notice warnings; regressions merge
  - Better: Strict mode (exception) in CI; lenient mode (log) in development

# Failure Modes
- **Stack trace overhead on large suites**: Capturing backtraces for every query in a 500+ query test suite can add significant time. Enable stack traces selectively.
- **EXPLAIN permission errors**: If database user lacks EXPLAIN privilege, Sentinel throws errors. Config in CI database setup.
- **Exclusion pattern conflicts**: Two overlapping exclusion patterns may unexpectedly exclude a violation. Test exclusion patterns.
- **False positive on query builders**: Sentinel may flag temporary tables, query builder internals, or pagination queries as duplicates. Tune detection thresholds.

# Ecosystem Usage
- **Laravel Query Sentinel (community)**: The `karimalihussein/laravel-query-sentinel` package is the primary implementation in the Laravel ecosystem. Configurable thresholds and detection types.
- **Laravel Debugbar**: Debugbar's query tab visualizes similar information (query count, duplicates, timing) but requires manual inspection.
- **Laravel Telescope**: Telescope's query watcher captures slow queries for post-hoc analysis. Sentinel is more focused on CI gating.

# Related Knowledge Units
- **Prerequisites**: Eloquent ORM, Database query optimization, N+1 detection
- **Related Topics**: N+1 query detection, Query count expectations, Slow query identification
- **Advanced Follow-up**: Database indexing strategy, Query plan analysis, Performance regression CI gates

# Research Notes
- Laravel's RefreshDatabase trait uses database transactions for test isolation, rolling back changes after each test — this is the fastest approach for MySQL/PostgreSQL
- SQLite in-memory database is a common testing strategy but has limitations: lacks full-text search, JSON functions differ, and some MySQL-specific features are unavailable
- Model factories with relationships require careful fterCreating() callback management to avoid N+1 factory creation during test setup
- ssertDatabaseHas() and ssertDatabaseMissing() are the primary assertion helpers; they query the database directly — ensure test database is properly configured
- Database testing performance: RefreshDatabase with SQLite in-memory runs ~50-100 tests/second; PostgreSQL via transactions runs ~30-60 tests/second
