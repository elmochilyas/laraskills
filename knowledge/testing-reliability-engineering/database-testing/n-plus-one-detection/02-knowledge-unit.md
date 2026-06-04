# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Database Testing
Knowledge Unit: N+1 Query Detection
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
N+1 query problems occur when code executes one query to fetch parent records and an additional query for each parent's child relationship—resulting in exponential query growth. Laravel provides `expectsDatabaseQueryCount()` and `expectsDatabaseQueryCount()` for asserting exact query counts, and `Query Sentinel` (community package) for real-time detection. N+1 detection in tests is the most effective way to prevent performance regressions before they reach production.

# Core Concepts
- **N+1 query pattern**: 1 query for parent records + N queries for N children = N+1 total queries. With 100 parents, that's 101 queries instead of 2 (with eager loading).
- **`expectsDatabaseQueryCount($count)`**: Asserts the code block executes exactly N database queries. Fails if count doesn't match. Available via `$this->expectsDatabaseQueryCount()` in feature tests.
- **Lazy loading detection**: Eloquent's lazy loading throws `LazyLoadingViolationException` when configured (set `Model::preventLazyLoading()` in `AppServiceProvider`).
- **Eager loading**: `with('relation')` pre-loads relationships in 2 queries (parent + child). N+1 only happens with lazy loading.
- **Query count in profiling**: `--profile` shows per-test query count. High query counts with small datasets indicate potential N+1.
- **`DB::enableQueryLog()` + `DB::getQueryLog()`**: Lower-level query logging for custom count assertions.

# Mental Models
- **N+1 as linear scaling trap**: Queries grow linearly with dataset size. 10 records = 11 queries (manageable). 10,000 records = 10,001 queries (catastrophic).
- **Query count as performance budget**: Each test has a maximum acceptable query count. `expectsDatabaseQueryCount` enforces this budget.
- **Lazy loading as convenience with cost**: Eloquent's `$post->author` is convenient but lazy-loads one query per access. Always eager-load in production code paths.
- **Prevention layer stack**: App service provider `preventLazyLoading()` ? caught in development ? CI `expectsDatabaseQueryCount()` ? production.

# Internal Mechanics
- **`expectsDatabaseQueryCount()`**: Registers a listener for `Illuminate\Database\Events\QueryExecuted`. Counts each query. Compares against expected count after test completes.
- **Count includes all queries**: SELECT, INSERT, UPDATE, DELETE, ALTER, CREATE. Everything counts. Use raw assertions for specific query type filtering.
- **`preventLazyLoading()`**: Sets a global flag on Eloquent. When a lazy-loaded relationship is accessed, throws `LazyLoadingViolationException` instead of querying.
- **Query log overhead**: `DB::enableQueryLog()` stores all queries in memory. Use only for debugging; not for production.
- **Eager loading vs lazy loading**: `with('posts')` executes `SELECT * FROM posts WHERE user_id IN (...)` (1 query). `$user->posts` lazy-loads one query per user.

# Patterns
- **Pattern: Query count budget per endpoint**
  - Purpose: Assert that an endpoint executes a fixed number of queries, regardless of dataset size
  - Benefits: Prevents N+1 regressions; documents expected query count
  - Tradeoffs: Query count changes with code changes; budget needs updating
  - Implementation: `$this->expectsDatabaseQueryCount(5); $this->get('/posts')->assertOk()`

- **Pattern: Lazy loading violation enforcement**
  - Purpose: Prevent any lazy loading in code paths
  - Benefits: Zero tolerance for N+1; caught at runtime
  - Tradeoffs: Requires comprehensive test coverage to catch all code paths
  - Implementation: `Model::preventLazyLoading(!$this->app->isProduction())` in `AppServiceProvider`

- **Pattern: Relationship count + eager loading test**
  - Purpose: Verify all accessed relationships are eager-loaded
  - Benefits: Explicit relationship requirements documented in tests
  - Tradeoffs: Test is coupled to specific relationship usage
  - Implementation: Create N parent records with M children each. Assert query count is < N + small constant (indicating eager loading)

- **Pattern: N+1 detection via query log analysis**
  - Purpose: Analyze query log for repeated identical queries
  - Benefits: Catches N+1 dynamically even in complex code paths
  - Tradeoffs: More complex test setup
  - Implementation: Enable query log, run code, group queries by SQL body, flag queries with identical structure executed N+ times

# Architectural Decisions
- **`expectsDatabaseQueryCount()` vs `preventLazyLoading()`**: Use `preventLazyLoading()` during development for immediate feedback. Use `expectsDatabaseQueryCount()` in CI to enforce query budgets.
- **Strict count vs approximate**: `expectsDatabaseQueryCount()` requires exact match. For varying datasets, use `assertCount()` range or disable count assertion for specific tests.
- **Query Sentinel for CI**: The Query Sentinel package provides N+1 detection as CI gate without per-test configuration.
- **Eager loading by default**: Use `$with` property on models for always-loaded relationships. Use `with()` for per-query eager loading. Use `load()` for post-hoc loading.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Exact query count prevents N+1 tightly | Count changes with every feature change | Budget updating is part of code review |
| Lazy loading prevention catches N+1 instantly | May break existing code with lazy loading | Requires migration effort; well worth it |
| Query Sentinel provides automatic detection | Additional dependency; false positives possible | Configure per-project sensitivity |
| Query log analysis is comprehensive | Slower tests; log memory usage | Use only in dedicated performance test suite |

# Performance Considerations
- `expectsDatabaseQueryCount()` overhead: <0.5ms per test (event listener registration + count).
- Query log overhead: 1-2ms per test + memory for stored queries. Not recommended for all tests.
- Lazy loading violation check: Negligible overhead. The exception is thrown before the query executes.
- N+1 impact in tests: If tests create large datasets (100+ records) without eager loading, test execution time increases quadratically.
- Profiling: Use `--profile` to identify tests with high query-to-record ratios.

# Production Considerations
- **Lazy loading in admin vs user-facing routes**: Admin routes may tolerate lazy loading for simplicity. User-facing routes must never N+1. Configure `preventLazyLoading` per-request based on URL pattern.
- **API resource loading**: `JsonResource` classes should eager-load all needed relationships. Test that API responses don't trigger N+1.
- **Serialization**: `->toArray()` or `->toJson()` on Eloquent models may trigger lazy loading. Ensure all serialized relationships are loaded.
- **Queue jobs**: Job handlers that access relationships must eager-load. Test job execution with `expectsDatabaseQueryCount()`.

# Common Mistakes
- **Mistake: Only testing N+1 with small datasets**
  - Why: N+1 is not visible with 1-2 parent records
  - Why harmful: Test passes but N+1 manifests with real data volumes
  - Better: Test with realistic data volumes (10-100 parent records)

- **Mistake: Not resetting query count between test scenarios**
  - Why: `expectsDatabaseQueryCount` counts all queries in the test, including setup
  - Why harmful: Setup queries inflate the count; test assertion may fail or be too lenient
  - Better: Use `$this->expectsDatabaseQueryCount(N)` before the act phase, accounting for setup

- **Mistake: Disabling lazy loading prevention in production**
  - Why: Performance concern about the check
  - Why harmful: N+1 reaches production undetected
  - Better: The check has negligible performance impact; always enable in development + CI

- **Mistake: Confusing query count with performance**
  - Why: Assuming few queries = fast
  - Why harmful: A few slow queries may be worse than many fast queries
  - Better: Combine query count assertions with query time profiling

# Failure Modes
- **False positive count changes**: Adding a new migration query, a new middleware logging query, or a new listener query changes the count. Budget must be updated.
- **`expectsDatabaseQueryCount` with varying data**: Tests that conditionally load relationships based on data may have varying query counts. Use approximate assertions.
- **Lazy loading violation in vendor code**: Third-party packages may lazy-load. `preventLazyLoading()` may break package functionality. Test with and without enforcement.
- **Query count with chunked operations**: `chunk()` / `lazy()` may execute many queries intentionally. Adjust budget or exclude from count assertion.

# Ecosystem Usage
- **Laravel core**: `expectsDatabaseQueryCount()` is used in Laravel's own Eloquent tests to prevent N+1 regressions.
- **Laravel Debugbar**: Debugbar's query counter visualizes N+1 in development. Tests should catch before Debugbar is needed.
- **Laravel Telescope**: Telescope's query watcher identifies N+1 patterns. Automated via Query Sentinel in CI.
- **Query Sentinel (community)**: The `laravel-query-sentinel` package detects N+1 in CI by analyzing query patterns.

# Related Knowledge Units
- **Prerequisites**: Eloquent relationships, Database query basics, Feature test HTTP helpers
- **Related Topics**: Query count expectations, Database assertions, Performance profiling
- **Advanced Follow-up**: Query Sentinel configuration, Custom eager loading policies, Serialization loading optimization

# Research Notes
- Laravel's RefreshDatabase trait uses database transactions for test isolation, rolling back changes after each test — this is the fastest approach for MySQL/PostgreSQL
- SQLite in-memory database is a common testing strategy but has limitations: lacks full-text search, JSON functions differ, and some MySQL-specific features are unavailable
- Model factories with relationships require careful fterCreating() callback management to avoid N+1 factory creation during test setup
- ssertDatabaseHas() and ssertDatabaseMissing() are the primary assertion helpers; they query the database directly — ensure test database is properly configured
- Database testing performance: RefreshDatabase with SQLite in-memory runs ~50-100 tests/second; PostgreSQL via transactions runs ~30-60 tests/second
