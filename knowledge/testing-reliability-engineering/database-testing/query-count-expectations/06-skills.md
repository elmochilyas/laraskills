# Skill: Enforce Query Count Budgets with Expectations

## Purpose
Set and enforce exact database query count budgets on every feature test that touches the database, preventing silent query inflation and performance regressions.

## When To Use
- Every feature test that touches the database
- Establishing performance baselines for endpoints
- Before and after performance optimizations
- Validating cache layers (zero-query tests)
- Critical code paths (payments, auth, core business logic)

## When NOT To Use
- Non-deterministic query counts (reporting dashboards, conditional queries)
- As a replacement for query time profiling (few queries ≠ fast queries)
- Without understanding the middleware query baseline

## Prerequisites
- Database testing lifecycle configured (`RefreshDatabase`)
- Understanding of middleware query overhead (auth, session, CSRF)
- Migration queries excluded (run once per process)

## Inputs
- Endpoint routes and their expected query patterns
- Middleware query baseline (established via empty authenticated request)
- Knowledge of eager loading vs lazy loading

## Workflow
1. Establish middleware query baseline: run an empty authenticated request to count auth + session + CSRF queries
2. Place `$this->expectsDatabaseQueryCount($count)` immediately before the HTTP request (act phase), after all setup
3. Document the expected count with a comment explaining each query: `// 1 auth + 1 posts + 1 comments (eager) = 3`
4. For cached endpoints, write a zero-query test: pre-populate cache, assert `expectsDatabaseQueryCount(0)`, verify warm cache hits
5. During code review, treat budget increases as deliberate performance decisions — review and approve changes
6. If a test fails due to count mismatch, investigate the extra query — don't remove the assertion
7. Combine with N+1 detection for comprehensive coverage: budgets prevent gradual inflation, Sentinel catches new patterns

## Validation Checklist
- [ ] `expectsDatabaseQueryCount()` called before the act phase
- [ ] Query budgets documented with explanatory comments
- [ ] Zero-query tests exist for cached endpoints
- [ ] Budgets updated deliberately when features change query patterns
- [ ] CI enforces query count expectations as blocking gate
- [ ] Middleware query baseline understood and accounted for
- [ ] Query count combined with profiling for full performance picture

## Common Failures
- Placing expectation after the act phase — count is 0, test fails
- Not accounting for middleware queries (auth, session, CSRF)
- Removing assertion instead of investigating when count changes
- Copy-pasting same count across different endpoints
- Setting zero-query on non-cached endpoints — always fails

## Decision Points
- Exact count for deterministic endpoints vs range for variable query patterns
- Zero-query for cached endpoints (warm path) vs documented count for cold path
- Investigate count increases vs update budget — investigate first, update only if justified

## Performance Considerations
- Expectation overhead: <0.1ms per test — negligible
- Query listing in failure output: only triggers on failure, no impact on passing tests
- Migration queries NOT counted in per-test expectations (run once per process)
- Middleware queries are counted — budget must account for them

## Security Considerations
- Zero-query expectations for cached endpoints help verify auth checks are also cached
- Query count expectations don't have direct security implications

## Related Rules (from 05-rules.md)
- Rule 1: Call `expectsDatabaseQueryCount()` before the act phase
- Rule 2: Use in every feature test that touches the database
- Rule 3: Document the expected query count with a comment
- Rule 4: Use zero-query expectations for cached endpoints
- Rule 5: Review and update budgets deliberately during code review
- Rule 6: Establish middleware query baseline and account for it

## Success Criteria
- Every database-touching feature test has a query count budget
- Zero-query tests verify cache effectiveness
- Budget changes are deliberate decisions reviewed in code review
- Query count doesn't inflate silently across multiple PRs
