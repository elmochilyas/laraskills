# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Database Testing |
| Knowledge Unit | N+1 Query Detection |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Eloquent relationships, Database query basics, Feature test HTTP helpers |
| Related KUs | Query count expectations, Database assertions, Performance profiling |
| Source | domain-analysis.md K044 |

# Overview

N+1 query problems occur when code executes one query to fetch parent records and an additional query for each parent's child relationship — resulting in exponential query growth. Laravel provides `expectsDatabaseQueryCount()` for asserting exact query counts, and Query Sentinel (community package) for real-time detection. N+1 detection in tests is the most effective way to prevent performance regressions before they reach production.

# Core Concepts

- **N+1 query pattern**: 1 query for parent records + N queries for N children = N+1 total queries.
- **`expectsDatabaseQueryCount($count)`**: Asserts exactly N database queries execute during the test.
- **Lazy loading detection**: `Model::preventLazyLoading()` throws `LazyLoadingViolationException` when lazy loading is triggered.
- **Eager loading**: `with('relation')` pre-loads relationships in 2 queries (parent + child).
- **Query count profiling**: `--profile` shows per-test query count.

# When To Use

- For every endpoint that loads Eloquent relationships
- In feature tests for database-touching endpoints
- When setting up query performance budgets
- Before deploying code that adds new relationships
- In CI as a performance regression gate

# When NOT To Use

- For endpoints with intentionally variable query counts (reporting, dashboard analytics)
- As the only performance metric (combine with query time profiling)
- Without establishing a baseline (unknown counts can't be enforced)
- For trivial endpoints that don't touch the database

# Best Practices (WHY)

- **Enable `preventLazyLoading()` in non-production environments**: This catches N+1 at runtime before tests even run. Set `Model::preventLazyLoading(!$this->app->isProduction())` in `AppServiceProvider`.
- **Test with realistic data volumes**: N+1 is not visible with 1-2 parent records. Create 10-100 parent records with children to surface the problem. 2 parents + 2 children each = 5 queries (ok). 100 parents + 100 children = 201 queries (catastrophic).
- **Use `expectsDatabaseQueryCount()` on every database endpoint**: It's the most valuable performance assertion. A fixed budget prevents accidental query inflation from new listeners, events, or middleware.
- **Establish baseline, then enforce**: Run the endpoint once to learn the query count. Set that as the expected count. Review and update only when deliberately changing query patterns.
- **Combine with eager loading tests**: Create N records, assert query count is small constant (indicating eager loading), not N+1.

# Architecture Guidelines

- **`expectsDatabaseQueryCount()` vs `preventLazyLoading()`**: Use `preventLazyLoading()` during development for immediate feedback. Use `expectsDatabaseQueryCount()` in CI to enforce budgets.
- **Strict count vs approximate**: Use exact count for deterministic endpoints. Use range for variable query patterns.
- **Query Sentinel for CI**: The community package detects N+1 automatically without per-test configuration.
- **Eager loading by default**: Use `$with` property on models for always-loaded relationships. Use `with()` for per-query eager loading.

# Performance Considerations

- `expectsDatabaseQueryCount()` overhead: <0.5ms per test.
- Query log overhead: 1-2ms per test + memory. Not recommended for all tests.
- Lazy loading violation check: Negligible overhead.
- N+1 impact in tests: Creating large datasets without eager loading increases test time quadratically.

# Security Considerations

- N+1 doesn't have direct security implications, but excessive queries can contribute to DoS vulnerability.
- Endpoints susceptible to N+1 can be abused by attackers to overload the database.
- Query count enforcement in tests helps prevent performance-based security issues.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Only testing N+1 with small datasets | N+1 not visible with 1-2 parent records | Test passes but N+1 manifests with real data volumes | Test with realistic data volumes (10-100 parent records) |
| Not resetting query count between scenarios | expectsDatabaseQueryCount counts setup queries | Setup queries inflate the count | Account for setup queries in the budget |
| Disabling lazy loading prevention in production | Performance concern about the check | N+1 reaches production undetected | Check has negligible cost; always enable in dev + CI |
| Confusing query count with performance | Assuming few queries = fast | A few slow queries may be worse than many fast queries | Combine count assertions with query time profiling |
| Not eager loading serialized relationships | ->toArray() triggers lazy loading | API responses trigger N+1 on serialization | Ensure all serialized relationships are loaded |

# Anti-Patterns

- **N+1 detection only in production monitoring**: Discovering N+1 in production via slow query logs. Instead, catch in tests before deployment.
- **Ignoring N+1 in admin routes**: "Admin doesn't need optimization." Admin users also deserve performant pages, and admin N+1 can crash the database with large datasets.
- **Disabling lazy loading prevention because of third-party packages**: If a package lazy-loads, fix the package or wrap it. Don't disable the safety net entirely.
- **Testing only with empty relationships**: Creating parent records with zero children doesn't surface N+1. Always create children when testing relationship loading.

# Examples

```php
// Prevent lazy loading in AppServiceProvider
public function boot(): void
{
    Model::preventLazyLoading(!$this->app->isProduction());
}

// Query count budget test
public function test_posts_index_has_fixed_query_count()
{
    // Create realistic data volume
    $users = User::factory()
        ->has(Post::factory()->count(5))
        ->count(10)
        ->create();

    $this->expectsDatabaseQueryCount(4); // 1 auth + 1 posts + 1 users (eager) + 1 count
    $this->actingAs($users->first())
        ->get('/posts')
        ->assertOk();
}

// Eager loading verification
public function test_posts_load_relationships_without_n_plus_one()
{
    Post::factory()->count(10)
        ->has(Comments::factory()->count(3))
        ->create();

    $this->expectsDatabaseQueryCount(3); // auth + posts + comments (eager loaded)
    $this->get('/posts')->assertOk();
}
```

# Related Topics

- **Prerequisites**: Eloquent relationships, Database query basics, Feature test HTTP helpers
- **Related**: Query count expectations, Database assertions, Performance profiling
- **Advanced**: Query Sentinel configuration, Custom eager loading policies, Serialization loading optimization

# AI Agent Notes

- When starting work on a Laravel project, first check if `Model::preventLazyLoading()` is enabled in `AppServiceProvider`. If not, enable it in non-production environments. This single change catches most N+1 issues immediately.
- For existing projects, enabling `preventLazyLoading()` may break many tests. Fix eagerly: add `with('relation')` to queries and `$with` to models. The short-term pain is worth the long-term performance gain.
- When reviewing a PR that adds a new API endpoint or page, check that the test includes `expectsDatabaseQueryCount()`. Without it, query count regressions go undetected.

# Verification

- [ ] Model::preventLazyLoading() is enabled in non-production environments
- [ ] Feature tests for database endpoints include expectsDatabaseQueryCount()
- [ ] Tests create realistic data volumes (10+ records) for relationship tests
- [ ] Query budgets are documented and reviewed during code review
- [ ] Eager loading is verified by query count assertions (constant count regardless of data size)
- [ ] Serialized responses (API resources) don't trigger lazy loading
- [ ] N+1 is not tolerated in admin routes either
