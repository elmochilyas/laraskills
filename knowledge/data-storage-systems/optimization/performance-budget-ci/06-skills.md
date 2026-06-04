# Skill: Enforce Performance Budget in CI

## Purpose
Prevent query count and duration regressions before deployment by asserting query budgets in PHPUnit tests.

## When To Use
- When setting up CI pipeline for the first time
- When performance regressions have reached production
- When establishing performance guardrails

## When NOT To Use
- As a replacement for monitoring (CI catches regressions before deploy, monitoring catches after)

## Prerequisites
- PHPUnit configured for the Laravel application
- Understanding of `DB::enableQueryLog()`

## Inputs
- Test suite for endpoint/feature tests

## Workflow
1. Enable `Model::preventLazyLoading()` in tests (catches N+1)
2. Add query count assertions to endpoint tests:
   ```php
   DB::enableQueryLog();
   $response = $this->get('/posts');
   $this->assertLessThan(10, count(DB::getQueryLog()));
   ```
3. Add duration assertions for slow endpoints
4. Store baseline query counts in JSON for CI comparison
5. Tag performance tests with `@group performance` for optional CI runs

## Validation Checklist
- [ ] `Model::preventLazyLoading()` enabled in test environment
- [ ] Query count assertions on critical endpoints
- [ ] Baseline comparison mechanism in CI
- [ ] Performance tests tagged and runnable in CI

## Common Failures
- No query count assertions — new relationship silently adds 50+ queries
- False negatives from SQLite vs MySQL/PostgreSQL differences (run performance tests against production-alike DB)
- Brittle assertions that break with minor, acceptable changes

## Decision Points
- Critical endpoints: strict query count assertions
- Admin endpoints: relaxed assertions or baseline comparison with warning
- Report endpoints: exclude from strict assertions (naturally query-heavy)

## Performance
- `DB::enableQueryLog()`: negligible memory overhead (~1-2KB per query logged)
- Assertion overhead: runtime cost of PHPUnit assertion <1ms

## Security
- Test assertions don't affect production data
- CI logs may expose query patterns — restrict access to CI artifacts

## Related Rules
- 4-30-1: Always EXPLAIN Before Optimizing
- 4-30-4: Review And Apply Core Concepts

## Related Skills
- Detect Lazy Loading in Production
- Govern Endpoint Query Budgets

## Success Criteria
- Query count assertions prevent N+1 regressions from reaching production
- Baseline comparison detects performance changes in CI
- Developers get fast feedback on query performance impact
