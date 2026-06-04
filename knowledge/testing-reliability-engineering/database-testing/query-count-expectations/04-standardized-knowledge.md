# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Database Testing |
| Knowledge Unit | Database Query Count Expectations |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Database testing lifecycle, Feature test HTTP helpers, Eloquent relationships |
| Related KUs | N+1 query detection, Query Sentinel, Test suite profiling |
| Source | domain-analysis.md K059 |

# Overview

Database query count expectations (`expectsDatabaseQueryCount()`) assert that specific code paths execute exactly N database queries. They serve as performance contracts, preventing query count regressions (N+1, missing eager loads, redundant queries). While N+1 detection catches the most egregious issue, query count expectations cover all query inflation — including duplicate fetches, unoptimized loops, and missing caching. Every feature test that touches the database should have a query count expectation.

# Core Concepts

- **`$this->expectsDatabaseQueryCount($count)`**: Asserts exactly N database queries across all connections during the test.
- **Count scope**: Counts all queries (SELECT, INSERT, UPDATE, DELETE) across all database connections.
- **Exact match requirement**: Count must match exactly. One extra or missing query fails the assertion.
- **Assertion timing**: Must be called before the act phase. Evaluated at test teardown.
- **Zero-query expectations**: `expectsDatabaseQueryCount(0)` for endpoints that should not touch the database.

# When To Use

- In every feature test that touches the database
- When establishing performance baselines for endpoints
- Before and after performance optimizations to verify improvement
- For validating cache layers (zero-query tests)
- In critical code paths (payments, auth, core business logic)

# When NOT To Use

- For non-deterministic query counts (reporting dashboards, conditional queries)
- As a replacement for query performance profiling (fast count ≠ fast queries)
- Without understanding the baseline (auth, session, middleware queries)
- For tests that don't touch the database

# Best Practices (WHY)

- **Call before the act phase**: `expectsDatabaseQueryCount()` must be called before any queries execute. Place it right after `$this->actingAs()` and before the HTTP request.
- **Account for middleware queries**: Auth, session, CSRF, and other middleware execute queries. Establish a baseline by running an empty authenticated request and counting.
- **Use in every database-touching feature test**: It's the most valuable performance assertion. A fixed budget prevents accidental query inflation from new event listeners, observers, or middleware.
- **Document the expected count**: Add a comment explaining what contributes to the count: `// 1 auth + 1 post query + 1 comment eager load = 3`.
- **Update budgets deliberately**: When adding features that increase query counts, update the budget in the same PR. Review budget changes during code review.
- **Combine with zero-query tests**: For cached endpoints, assert `expectsDatabaseQueryCount(0)` to verify the cache layer is working. Pre-populate cache before the test.

# Architecture Guidelines

- **Exact count vs range**: Use exact count for deterministic endpoints. Use range for endpoints with variable query patterns.
- **Placement**: Call immediately before the act phase. Never after queries have already executed.
- **CI enforcement**: Make query count assertion failures blocking in CI. Budget increases require deliberate review.
- **Budget documentation**: Document expected query count near the test or in endpoint PHPDoc: `@query-count 5`.

# Performance Considerations

- Expectation overhead: <0.1ms per test. Negligible.
- Query listing in failure output: Only triggers on failure. No impact on passing tests.
- Migration queries: NOT counted in per-test expectations (run once per process).
- Connection-specific counting: No additional overhead.

# Security Considerations

- Query count expectations don't have direct security implications.
- Zero-query expectations for cached endpoints can help verify that auth/session checks are also cached, preventing information disclosure.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Placing expectation after the act phase | Calling after performing the action | Expectation registered too late; queries already executed | Call expectsDatabaseQueryCount() before any queries execute |
| Not accounting for middleware queries | Forgetting auth, session, CSRF queries | Count is always higher than expected | Establish baseline with empty authenticated request |
| Using query count as proxy for performance | Misunderstanding "fewer = faster" | Some queries are fast (PK lookup), some are slow (full scan) | Combine count with query time profiling |
| Not updating budgets after feature changes | Adding features without updating expectations | Test fails; developer may remove assertion instead of updating budget | Review and update budgets during code review |
| Setting zero-query on non-cached endpoints | Expecting 0 queries on database-touching endpoint | Test always fails | Only use zero-query for cached endpoints |

# Anti-Patterns

- **Removing query count assertions instead of fixing regressions**: When a budget test fails, the developer removes the assertion rather than investigating the extra query. Instead, investigate and fix the regression or update the budget deliberately.
- **No query expectations on critical endpoints**: Payment, auth, and core business logic endpoints without query count assertions. These are the most important endpoints to protect.
- **Copy-pasting query counts across tests**: Using the same expected count for different endpoints. Each endpoint has different query patterns. Compute per-endpoint.
- **Ignoring query count in parallel test runs**: Parallel execution may add connection management queries. Account for these in parallel-specific budgets.

# Examples

```php
public function test_posts_index_has_predictable_query_count()
{
    Post::factory()->count(10)->create();

    // Budget: 1 auth + 1 post list + 1 eager-loaded author = 3
    $this->expectsDatabaseQueryCount(3);

    $this->actingAs(User::factory()->create())
        ->get('/posts')
        ->assertOk();
}

public function test_cached_endpoint_hits_zero_queries()
{
    // Pre-populate cache
    $this->get('/posts')->assertOk();

    // Cache hit: 0 queries
    $this->expectsDatabaseQueryCount(0);
    $this->get('/posts')->assertOk();
}
```

# Related Topics

- **Prerequisites**: Database testing lifecycle, Feature test HTTP helpers, Eloquent relationships
- **Related**: N+1 query detection, Query Sentinel, Test suite profiling
- **Advanced**: Per-connection query count expectations, Custom query assertion macros, Query plan analysis

# AI Agent Notes

- When writing a new feature test, always include `expectsDatabaseQueryCount()`. Start with a generous estimate and tighten it after observing the actual count.
- If a test fails because of a query count mismatch, run the test with a breakpoint on `QueryExecuted` to see every query. This makes it easy to identify unexpected queries.
- For cached endpoints, test both the cold (N queries) and warm (0 queries) cache paths. This validates that the cache is actually serving responses.

# Verification

- [ ] expectsDatabaseQueryCount() is called before the act phase in all database tests
- [ ] Query budgets are documented with explanations
- [ ] Zero-query tests exist for cached endpoints
- [ ] Budgets are updated when features change query patterns
- [ ] CI enforces query count expectations as blocking gate
- [ ] Middleware query baseline is understood and accounted for
- [ ] Query count is combined with query time profiling for full performance picture
