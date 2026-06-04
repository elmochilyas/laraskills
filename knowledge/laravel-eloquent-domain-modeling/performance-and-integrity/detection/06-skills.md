# Skill: Detect N+1 Query Problems with Automated Tooling

## Purpose
Identify excessive query patterns (N+1) through tooling, automated test assertions, and production monitoring before they degrade application performance.

## When To Use
- Every development environment — enable Debugbar or Telescope from project start
- CI/CD pipeline — automated test assertions that fail if query count exceeds baseline
- Code review — manual inspection for missing `with()` calls
- Production monitoring — sampling-based query counting to detect regressions

## When NOT To Use
- Production environments with Debugbar (never deploy to production)
- High-throughput request paths with Telescope full query logging (use sampling)
- Simple CRUD pages with single-model endpoints (query count is predictably low)

## Prerequisites
- Lazy loading and eager loading fundamentals
- Query monitoring tools: Debugbar, Telescope, or custom middleware

## Inputs
- Application routes/endpoints to monitor
- Query count thresholds per route
- Test suite with seeded data

## Workflow
1. Install Debugbar (dev) and/or Telescope (staging) from project start
2. Register a query count middleware in the local stack with route-specific thresholds
3. Add `assertQueryCountLessThan()` assertions to smoke tests for critical endpoints
4. Use deterministic seed data (not random factories) for query count tests
5. Configure Telescope with sampling in production to capture only slow requests
6. Combine automated tests with production monitoring (request duration alerts)

## Validation Checklist
- [ ] Development environment has Debugbar or Telescope installed
- [ ] Critical endpoints have query count test assertions
- [ ] CI/CD pipeline includes query count smoke tests
- [ ] Production monitoring includes request duration alerts
- [ ] Debugbar is explicitly disabled in production via `.env` or service provider
- [ ] Route-specific thresholds configured (not a single global cap)
- [ ] Seed data is deterministic for query count tests

## Common Failures
- Assuming low count means no N+1 — missing slow queries (unindexed scans)
- Relying only on Debugbar — missing regressions on rebuilt pages
- Testing against dynamic data — flaky query count assertions
- Ignoring serialization N+1 — `$post->toArray()` triggers lazy loads of unloaded relations
- Single global query cap — false positives on complex pages, false negatives on simple ones

## Decision Points
- Debugbar vs Telescope: Debugbar for instant visual feedback in development; Telescope for persisted queries with stack traces in staging
- Global cap vs per-route thresholds: always use per-route thresholds to match each endpoint's expected query budget

## Performance Considerations
- Query log collection uses memory proportional to query count
- Telescope's query deductor runs O(n²) — concerns on requests with thousands of queries
- `assertQueryCountLessThan` adds negligible overhead (counts via event listener)
- APM-based detection catches regressions without explicit query counting overhead

## Security Considerations
- Debugbar exposes database queries, schema, environment config — never enable in production
- Telescope in production should use `Telescope::filter()` to avoid logging sensitive query data
- Ensure query logs do not contain PII or credentials

## Related Rules
- Enable N+1 Detection in Development (performance-and-integrity/detection)
- Set Route-Specific Query Count Thresholds (performance-and-integrity/detection)
- Use Deterministic Seed Data for Query Count Tests (performance-and-integrity/detection)
- Never Deploy Debugbar to Production (performance-and-integrity/detection)
- Combine Automated Tests with Production Monitoring (performance-and-integrity/detection)

## Related Skills
- Prevent N+1 with Eager Loading Strategies
- Enforce Lazy Loading Violations with Strict Mode
- Implement Query Count Middleware

## Success Criteria
- N+1 violations caught during development, before reaching production
- Query count assertions are reliable (non-flaky) in CI
- Production monitoring detects regressions from data growth
- Debugbar is absent from production deployments
