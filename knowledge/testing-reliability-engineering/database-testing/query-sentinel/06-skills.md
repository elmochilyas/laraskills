# Skill: Configure Query Sentinel for Automated Query Pattern Detection

## Purpose
Install and configure Query Sentinel to automatically detect N+1 queries, slow queries, duplicate queries, and full table scans in development and CI environments.

## When To Use
- Setting up automated performance regression gates in CI
- During development for immediate N+1 feedback
- When onboarding new team members (catches common query mistakes)
- For performance-critical applications with strict query budgets

## When NOT To Use
- In production (overhead is unacceptable)
- Without proper exclusion tuning (false positives cause alert fatigue)
- As a replacement for `expectsDatabaseQueryCount()` (use both together)
- When the database user lacks EXPLAIN permission

## Prerequisites
- Query Sentinel package installed (community package, check `composer.json`)
- Eloquent ORM with relationships configured
- `expectsDatabaseQueryCount()` already in use for budget enforcement

## Inputs
- Application query patterns requiring exclusion (migrations, sessions, cache)
- CI environment configuration for exception mode
- Detection type preferences (N+1, slow query, duplicate, full scan)

## Workflow
1. Publish Query Sentinel config with `php artisan vendor:publish --tag=query-sentinel-config`
2. Start with N+1 detection only — add slow query and duplicate detection after establishing a clean baseline
3. Configure warning mode (`log`) in development, exception mode in CI: `QUERY_SENTINEL_MODE=exception` in CI environment
4. Build exclusion list: run the test suite, review warnings, exclude known-safe internal Laravel queries (migrations, sessions, cache)
5. Review exclusion list quarterly — remove entries no longer needed, keep entries narrow and specific
6. Combine Sentinel with `expectsDatabaseQueryCount()` — Sentinel catches unexpected patterns (N+1), assertions enforce known budgets (inflation)
7. Ensure Sentinel is disabled in production: `QUERY_SENTINEL_ENABLED=false`
8. Add full table scan and missing index detection only in a dedicated performance test suite (adds EXPLAIN overhead)

## Validation Checklist
- [ ] Query Sentinel installed and configured
- [ ] N+1 detection enabled in CI
- [ ] Exclusion list covers internal Laravel queries
- [ ] Sentinel in warning mode in development, exception mode in CI
- [ ] Sentinel disabled in production
- [ ] Exclusions reviewed quarterly
- [ ] Sentinel complements `expectsDatabaseQueryCount()` (doesn't replace it)

## Common Failures
- Enabling all detection types at once — false positives overwhelm the team
- Empty exclusion list — every internal Laravel query flagged as violation
- Too many exclusions — real issues pass through undetected
- Not using in CI — regressions merge without detection
- Running in production — severe performance degradation

## Decision Points
- Start with N+1 detection only vs enable all types — always start incrementally
- Warning mode in development vs exception mode — warning for feedback, exception for enforcement
- Combine with `expectsDatabaseQueryCount()` vs use alone — always use both

## Performance Considerations
- Query interception overhead: <0.1ms per query
- Stack trace capture: 1-5ms per flagged query — enable only in CI
- EXPLAIN query execution: 1-10ms per SELECT — use only in dedicated test suite
- Sentinel is designed for development/testing only — never enable in production

## Security Considerations
- Sentinel captures query SQL and bindings — may contain sensitive data with production-like test data
- Stack traces can reveal application structure — restrict CI artifact access
- EXPLAIN queries require database read access — ensure CI user has appropriate permissions

## Related Rules (from 05-rules.md)
- Rule 1: Start with N+1 detection only, add other types after establishing a baseline
- Rule 2: Use warning mode in development, exception mode in CI
- Rule 3: Maintain and review the exclusion list quarterly
- Rule 4: Combine Sentinel with `expectsDatabaseQueryCount()` for comprehensive coverage
- Rule 5: Disable Query Sentinel in production

## Success Criteria
- N+1 queries are automatically detected in CI and block PRs
- False positives are minimal due to tuned exclusion list
- Development workflow is not disrupted (warnings, not exceptions)
- Query patterns are covered by both Sentinel (patterns) and budget assertions (counts)
