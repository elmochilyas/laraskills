# Detection

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Detection |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

N+1 query problems are the most common performance defect in Eloquent applications. Detection identifies excessive query patterns through tooling, manual inspection, and automated guardrails. Without systematic detection, N+1 issues silently degrade application performance as data grows, causing page load times to spike from milliseconds to seconds.

## Core Concepts

- **N+1 pattern**: One query fetches N parent rows, then N queries fetch child rows. Total queries = N + 1 instead of 2.
- **Root cause**: Lazy-loading a relationship on a hydrated model inside a loop or serialization context triggers a query per iteration.
- **Detection vectors**: Query log analysis (Debugbar, Telescope), middleware-based counting, IDE tooling, static analysis, automated tests.
- **False positives**: Deliberate lazy loading (conditional relation access) is not an N+1 defect. Tools must distinguish intentional patterns from accidental ones.

## When To Use

- Every development environment — enable Debugbar or Telescope from project start
- CI/CD pipeline — automated test assertions that fail if query count exceeds a baseline
- Code review — manual inspection of view/API endpoints for missing `with()` calls
- Production monitoring — sampling-based query counting to detect regressions post-deployment

## When NOT To Use

- Production environments with Debugbar (never deploy Debugbar to production — it exposes schema and config)
- High-throughput request paths with Telescope full query logging (use sampling instead)
- Simple CRUD pages with single-model endpoints (query count is predictably low)

## Best Practices

- **Combine automated tests with production monitoring**: Test assertions catch regressions before deployment. Production monitoring catches regressions caused by data growth or new code paths. Neither alone is sufficient — a test may not cover the exact query path that data-volume-triggered N+1 exploits.
- **Set query count thresholds per route**: A dashboard page may legitimately use 20 queries; a simple show page should use 2–3. Set route-specific thresholds in middleware or tests, not a global cap. This prevents both false positives (high legit count) and false negatives (low but still excessive for the task).
- **Use Debugbar during development, Telescope in staging**: Debugbar provides instant visual feedback. Telescope persists queries with stack traces for deeper analysis. Run both in different environments to get complementary views of query behavior.
- **Seed deterministic data for query count tests**: Tests with random fixtures produce flaky query counts (a post with 0 comments triggers different eager loading than one with 10). Use fixed, predictable seed data to ensure query count assertions are reliable.

## Architecture Guidelines

- Register a query count middleware in the `local` stack that logs warnings above threshold
- Add `assertQueryCountLessThan()` assertions to smoke tests for critical endpoints
- Configure Telescope with sampling in production to capture only slow/anomalous requests
- Include query count in observability metrics (Datadog, New Relic, OpenTelemetry)

## Performance Considerations

- Query log collection uses memory proportional to query count — for 1k+ query requests, `DB::getQueryLog()` can consume tens of MB
- Telescope's query deductor runs O(n²) comparison — on requests with thousands of queries, the deductor itself becomes a performance concern
- `assertQueryCountLessThan` adds negligible overhead (counts via an event listener) and is safe for CI
- APM-based detection (alerting on request duration) catches N+1 regressions without explicit query counting overhead

## Security Considerations

- Debugbar exposes database queries, schema, environment config — never enable in production
- Telescope in production should use `Telescope::filter()` to avoid logging sensitive query data
- Ensure query logs do not contain PII or credentials (e.g., password reset tokens in query bindings)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming low count means no N+1 | Fixating on query count | Missing slow queries (unindexed scans) | Monitor both count and query duration |
| Relying only on Debugbar | Visual inspection habit | Missing regressions on rebuilt pages | Add automated test assertions |
| Testing against dynamic data | Random factory data in tests | Flaky query count assertions | Seed deterministic data per test |
| Ignoring serialization N+1 | Only testing in-memory access | `$post->toArray()` triggers lazy loads of unloaded relations | Test API response query counts too |

## Anti-Patterns

- **Query log blindness**: Running without any detection tooling, relying on user complaints to discover N+1 issues. By the time users notice slowness, the problem is already in production.
- **Global query cap without route context**: Enforcing a single `MAX_QUERIES=10` limit across all routes. Legitimate complex pages hit the cap, encouraging developers to disable the middleware instead of tuning queries.
- **Debugbar in production**: Deploying the debug toolbar to production. Exposes full application internals to anyone who opens the toolbar.

## Examples

```php
// Middleware query counter
class QueryCountMiddleware
{
    public function handle($request, Closure $next)
    {
        DB::enableQueryLog();
        $response = $next($request);
        $count = count(DB::getQueryLog());
        if ($count > 50) {
            Log::warning("High query count on {$request->path()}: {$count}");
        }
        return $response;
    }
}

// Automated test assertion
public function test_post_index_has_no_n_plus_one()
{
    Post::factory(10)->hasComments(3)->create();
    $response = $this->get('/posts');
    $response->assertOk();
    // Assumes a custom test macro
    $this->assertQueryCountLessThan(5);
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Lazy loading fundamentals |
| Prerequisite | Eager loading (with(), load()) |
| Closely Related | prevention-strategies |
| Closely Related | lazy-loading-violations |
| Closely Related | select-constraints |

## AI Agent Notes

- Generate Debugbar/Telescope setup instructions as standard development dependencies
- Add `assertQueryCountLessThan` when generating tests for list/show endpoints
- Never generate Debugbar configuration that would deploy to production
- Include query monitoring middleware when scaffolding API or web applications

## Verification

- [ ] Development environment has Debugbar or Telescope installed
- [ ] Critical endpoints have query count test assertions
- [ ] CI/CD pipeline includes query count smoke tests
- [ ] Production monitoring includes request duration alerts (catches N+1 regressions)
- [ ] Debugbar is explicitly disabled in production via `.env` or service provider
