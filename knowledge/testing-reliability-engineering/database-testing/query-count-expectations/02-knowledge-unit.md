# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Database Testing
Knowledge Unit: Database Query Count Expectations
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Database query count expectations (`expectsDatabaseQueryCount()`) assert that specific code paths execute exactly N database queries. They serve as performance contracts, preventing query count regressions (N+1, missing eager loads, redundant queries). While N+1 detection catches the most egregious issue, query count expectations cover all query inflation—including duplicate fetches, unoptimized loops, and missing caching. Every feature test that touches the database should have a query count expectation.

# Core Concepts
- **`$this->expectsDatabaseQueryCount($count)`**: Asserts the test executes exactly N database queries across all connections.
- **Count scope**: Counts all queries (SELECT, INSERT, UPDATE, DELETE, etc.) across all database connections during the test.
- **Exact match requirement**: The count must match exactly. One extra or missing query fails the assertion.
- **Per-connection counting**: In multi-database setups, queries are counted per connection. Use separate expectations per connection.
- **Assertion timing**: Call `expectsDatabaseQueryCount()` before the act phase. The assertion is evaluated at the end of the test.
- **Zero-query expectations**: `expectsDatabaseQueryCount(0)` for endpoints that should not touch the database (cached responses, static content).

# Mental Models
- **Query count as performance budget**: Each endpoint has a query budget. Test enforces the budget. Budget increases require deliberate review.
- **Count all queries, not just SELECT**: INSERT/UPDATE/DELETE queries also count. A create endpoint should have exactly N queries (1 INSERT + 1 SELECT for refresh + 0 for auth check).
- **Baseline + delta**: Understand the baseline query count (auth check, session, middleware) and the delta (the queries your code adds).
- **Budget as living metric**: Query budgets change with features. Review and update budgets as part of code review.

# Internal Mechanics
- **Event listener**: Registers on `Illuminate\Database\Events\QueryExecuted`. Increments an internal counter. At test teardown, compares counter against expected value.
- **Counter resets**: The counter is reset between tests. Each test gets its own expectation scope.
- **Connection-aware counting**: Laravel's event dispatcher tags queries with their connection name. The counter aggregates all connections by default.
- **Failure message**: Shows expected vs actual count, plus a list of all queries (if available) for debugging.
- **Interaction with `RefreshDatabase`**: The migration queries (run once per process) are NOT counted within individual test expectations. Test expectations measure per-test query count.

# Patterns
- **Pattern: Baseline query budget**
  - Purpose: Establish known-good query count for each endpoint
  - Benefits: Catches any query increase as regression
  - Tradeoffs: Baseline changes with Laravel/framework upgrades
  - Implementation: Run endpoint, check count, write expected count in test. Review and update on upgrade.

- **Pattern: Zero-query cache hit test**
  - Purpose: Verify cached endpoints don't touch database
  - Benefits: Ensures cache layer is working
  - Tradeoffs: Cache must be populated before test
  - Implementation: Pre-populate cache ? `expectsDatabaseQueryCount(0)` ? hit endpoint ? assert cached response

- **Pattern: Create operation budget**
  - Purpose: Assert create operations have predictable query counts
  - Benefits: Prevents accidental attachment, event listener, or observer queries
  - Tradeoffs: Adding a new event listener or observer changes the count
  - Implementation: `expectsDatabaseQueryCount(3)` for a simple `User::create()` (1 INSERT + 1 SELECT refresh + 1 for auth?)

- **Pattern: Relationship loading budget**
  - Purpose: Assert eager loading is working (no N+1)
  - Benefits: Documents expected query count for relationship-heavy endpoints
  - Tradeoffs: Adding a new relationship to the endpoint increases count
  - Implementation: With 10 parent + 1 child relationship loading: `expectsDatabaseQueryCount(2)` (1 for parents + 1 for children)

# Architectural Decisions
- **Exact count vs range**: Use exact count for deterministic endpoints. Use approximate range for endpoints with variable query patterns (e.g., conditionally querying based on user role).
- **`expectsDatabaseQueryCount()` in every feature test**: Yes—every feature test that touches the database should assert query count. It's the most valuable performance assertion.
- **Budget documentation**: Document the expected query count near the test or in the endpoint PHPDoc: `@query-count 5`.
- **CI enforcement**: Make query count assertion failures blocking in CI. Query budget increases require review.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Catches any query count regression | Exact count is brittle—any change breaks test | Acceptable; budget changes should be explicit |
| Documents expected query count | Baseline changes with framework/package upgrades | Update budgets as part of upgrade process |
| Zero-query tests validate caching | Requires cache warmup; cold cache fails | Test both cold and warm cache paths |
| Simple API (one method) | No way to assert per-connection counts separately | Use separate tests for multi-database apps |

# Performance Considerations
- Expectation overhead: <0.1ms per test. Negligible.
- Query listing in failure output: Only triggers on failure. No performance impact on passing tests.
- Migration queries: NOT counted in per-test expectations. They are counted once per process.
- Connection-specific counting: No additional overhead. Laravel tags queries with connection name.

# Production Considerations
- **Upgrade impact**: Laravel version upgrades may change internal query counts (auth checks, session queries). Expect budget updates.
- **Package queries**: Third-party packages may add queries (e.g., audit logs, activity logs). Account for these in budgets.
- **Feature flag interaction**: Feature flags may add queries conditionally. Test both on and off states with appropriate budgets.
- **Default eager loading changes**: Adding `$with` property to a model increases query count for all endpoints using that model. Update budgets accordingly.

# Common Mistakes
- **Mistake: Placing expectation after the act phase**
  - Why: `expectsDatabaseQueryCount()` after performing the action
  - Why harmful: The expectation is registered too late; queries already executed
  - Better: Call `expectsDatabaseQueryCount()` before any queries execute (before act phase)

- **Mistake: Not accounting for middleware queries**
  - Why: Forgetting that auth, session, and CSRF middleware execute queries
  - Why harmful: Count is always higher than expected
  - Better: Establish baseline count by running an empty authenticated request

- **Mistake: Using query count as proxy for performance**
  - Why: Fewer queries = faster assumption
  - Why harmful: Some queries are fast (indexed PK lookup), some are slow (full scan). Count != performance.
  - Better: Combine count expectations with query time profiling

- **Mistake: Not updating budgets after feature changes**
  - Why: Adding a new feature but keeping old query count
  - Why harmful: Test fails; developer may remove the assertion instead of updating the budget
  - Better: Review and update query budgets during code review

# Failure Modes
- **False positive on Laravel version change**: Laravel changes auth query count, adds session query, or changes middleware query pattern. Expectation fails. Update budget.
- **False positive on environment difference**: Local vs CI database configuration may have different query patterns. Use same database configuration.
- **Query count with chunking**: `chunk()` / `lazy()` execute multiple queries intentionally. Use `each()` or adjust expectation.
- **Subquery count**: Subqueries in `SELECT` add to query count but are executed once. Manual counting may miss subqueries.

# Ecosystem Usage
- **Laravel core**: `expectsDatabaseQueryCount()` is used in Laravel's own Eloquent tests, particularly for relationship loading and eager loading tests.
- **Laravel Spark**: Subscription endpoint tests use query count expectations to prevent accidental query increases in billing-related code.
- **Laravel Nova**: Resource tool tests assert query counts for index, detail, and card loading.
- **Community practices**: Query count expectations are considered a best practice in the Laravel community for all database-touching feature tests.

# Related Knowledge Units
- **Prerequisites**: Database testing lifecycle, Feature test HTTP helpers, Eloquent relationships
- **Related Topics**: N+1 query detection, Query Sentinel, Test suite profiling
- **Advanced Follow-up**: Per-connection query count expectations, Custom query assertion macros, Query plan analysis

# Research Notes
- Laravel's RefreshDatabase trait uses database transactions for test isolation, rolling back changes after each test — this is the fastest approach for MySQL/PostgreSQL
- SQLite in-memory database is a common testing strategy but has limitations: lacks full-text search, JSON functions differ, and some MySQL-specific features are unavailable
- Model factories with relationships require careful fterCreating() callback management to avoid N+1 factory creation during test setup
- ssertDatabaseHas() and ssertDatabaseMissing() are the primary assertion helpers; they query the database directly — ensure test database is properly configured
- Database testing performance: RefreshDatabase with SQLite in-memory runs ~50-100 tests/second; PostgreSQL via transactions runs ~30-60 tests/second
