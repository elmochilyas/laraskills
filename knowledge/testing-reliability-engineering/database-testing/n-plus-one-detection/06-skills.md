# Skill: Detect and Prevent N+1 Query Problems

## Purpose
Prevent N+1 query performance regressions by enabling lazy loading prevention, testing with realistic data volumes, enforcing query count budgets, and eager-loading serialized relationships.

## When To Use
- Every endpoint that loads Eloquent relationships
- Setting up query performance budgets for database endpoints
- Before deploying code that adds new relationships
- In CI as a performance regression gate

## When NOT To Use
- Endpoints with intentionally variable query counts (reporting, dashboards)
- Without establishing a baseline query count
- For trivial endpoints that don't touch the database

## Prerequisites
- `Model::preventLazyLoading()` configured in `AppServiceProvider`
- Understanding of Eloquent eager loading (`with()`, `load()`)
- `expectsDatabaseQueryCount()` available

## Inputs
- Eloquent models with relationships
- API endpoint that loads relationships
- Serialization resources (API Resources, JSON responses)

## Workflow
1. Enable `Model::preventLazyLoading(!$this->app->isProduction())` in `AppServiceProvider::boot()` — catches all lazy loading at runtime
2. For every endpoint loading relationships, test with realistic data volumes: create 10+ parent records, each with 3-5 children
3. Add `$this->expectsDatabaseQueryCount($count)` to every database-touching feature test — call it before the HTTP request
4. When test data includes relationships, assert the query count stays constant regardless of data volume (proving eager loading works)
5. Eager-load all relationships before serialization: `User::with('posts')->get()` not `User::all()` — serialization triggers lazy loading
6. If a third-party package triggers lazy loading violations, fix or wrap the package — do not disable `preventLazyLoading()` globally
7. Fix existing lazy loading violations: add `with('relation')` to queries and `$with` to models

## Validation Checklist
- [ ] `Model::preventLazyLoading()` enabled in non-production environments
- [ ] Feature tests for DB endpoints include `expectsDatabaseQueryCount()`
- [ ] Tests create realistic data volumes (10+ records) for relationship tests
- [ ] Query count stays constant regardless of data volume (eager loading verified)
- [ ] Serialized responses (API resources) don't trigger lazy loading
- [ ] N+1 not tolerated in admin routes either
- [ ] Third-party lazy loading fixed, safety net not disabled

## Common Failures
- Only testing with 1-2 parent records — N+1 not visible with small datasets
- Not resetting query count between setup and act phase
- Disabling `preventLazyLoading()` because a third-party package triggers it
- Not eagerly loading serialized relationships — API responses trigger N+1
- Confusing query count with query performance (few queries ≠ fast queries)

## Decision Points
- `preventLazyLoading()` during development (immediate feedback) vs `expectsDatabaseQueryCount()` in CI (enforces budgets)
- Exact count for deterministic endpoints vs range for variable query patterns
- Fix third-party lazy loading vs disable the safety net — always fix, never disable

## Performance Considerations
- `expectsDatabaseQueryCount()` overhead: <0.5ms per test
- `preventLazyLoading()` violation check: negligible overhead
- Creating large datasets without eager loading increases test time quadratically
- Lazy loading prevention has zero cost in production (disabled there)

## Security Considerations
- N+1 doesn't have direct security implications but excessive queries contribute to DoS vulnerability
- Endpoints susceptible to N+1 can be abused to overload the database

## Related Rules (from 05-rules.md)
- Rule 1: Enable `Model::preventLazyLoading()` in non-production environments
- Rule 2: Test with realistic data volumes (10+ records) to surface N+1
- Rule 3: Use `expectsDatabaseQueryCount()` on every database-touching endpoint
- Rule 4: Eager-load all serialized relationships
- Rule 5: Fix lazy-loading packages, don't disable the safety net

## Success Criteria
- `preventLazyLoading()` is active in dev/test environments
- All database endpoints have query count budgets
- Query count stays flat regardless of data volume (eager loading confirmed)
- Serialized responses don't trigger lazy loading
- No N+1 bugs reach production
