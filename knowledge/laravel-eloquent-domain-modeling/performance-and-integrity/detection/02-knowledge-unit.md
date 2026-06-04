# Detection — N+1 Query Detection

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** Detection
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

N+1 query problems are the most common performance defect in Eloquent applications. Detection is the practice of identifying these excessive query patterns through tooling, manual inspection, and automated guardrails. Without systematic detection, N+1 issues silently degrade application performance as data grows, eventually causing page load times to spike from milliseconds to seconds.

---

## Core Concepts

- **N+1 pattern:** One query fetches N parent rows, then N queries fetch child rows for each parent. Total queries = N + 1 instead of 2.
- **Root cause:** Lazy-loading a relationship on a hydrated model inside a loop or serialization context triggers a query per iteration.
- **Detection vectors:** Query log analysis, middleware-based counting, IDE tooling, static analysis, automated tests.
- **False positives:** Deliberate lazy loading (e.g., conditional relation access) is not an N+1 defect. Tools must distinguish intentional patterns from accidental ones.

---

## Mental Models

### The Toll Booth Metaphor
Every lazy-loaded relationship access is a toll booth — one query, one fee. Driving through 100 booths costs 100 times more than buying a pass (eager loading) upfront. Detection tools count the tolls.

### Query Count Budget
Think of each page/view as having a fixed query budget (e.g., 5 queries for a list page). Any request exceeding the budget triggers investigation. This budget mindset shifts detection from reactive ("why is this slow?") to proactive ("did we exceed our limit?").

---

## Internal Mechanics

### Laravel Debugbar
- Listens to `DB::listen()` events and aggregates all queries per request.
- Displays query count, duplicate queries, and execution time in the debug toolbar.
- N+1 detection heuristic: identical queries differing only in `WHERE id = ?` parameter values.

### Laravel Telescope
- Persists query logs to the database with full stack traces.
- `Deductor` watches for repeated queries with identical SQL but different bindings.
- Provides a dedicated "Queries" screen with filtering and sorting by count.

### Manual Detection via `DB::enableQueryLog()`
```php
DB::enableQueryLog();
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name;
}
dd(DB::getQueryLog()); // Inspect for repeated SELECT * FROM authors WHERE id = ?
```

---

## Patterns

- **Middleware query counter:** Register a middleware that counts queries per request and logs warnings above a threshold.
- **Automated test assertion:** `assertQueryCountLessThan(5)` using `Illuminate\Testing\TestResponse` or custom test macros.
- **CI/CD pipeline check:** Run a smoke test suite with query counting enabled; fail build if query count exceeds baseline.
- **Observability integration:** Send query count metrics to Datadog, New Relic, or OpenTelemetry as custom spans.

---

## Architectural Decisions

- **Development-only vs. production detection:** Debugbar runs in dev only. Telescope can run in production with sampling. Always-on query counting in production adds overhead — use sampling or agent-based monitoring.
- **Threshold warnings vs. hard blocks:** Middleware warnings allow gradual improvement. Test assertions block regressions. Use both at different lifecycle stages.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Early detection prevents performance debt | Tooling overhead in development | Enable only in non-production environments |
| Automated tests enforce query discipline | Flaky tests if DB state varies | Use fixed seed data for query count tests |
| Stack traces pinpoint offending code | Log noise in high-traffic apps | Aggregate and alert on trends, not individual events |
| Debugbar gives instant feedback | Adds ~50ms per request even when idle | Disable Debugbar in production entirely |

---

## Performance Considerations

- Query log collection uses memory proportional to query count. For large requests (1000+ queries), `DB::getQueryLog()` can consume tens of MB. Use sampling in production.
- Telescope's query deductor runs an O(n²) comparison — on requests with thousands of queries, the deductor itself becomes a performance concern.
- The `assertQueryCountLessThan` test pattern adds negligible overhead (counts queries via an event listener) and is safe for CI.

---

## Production Considerations

- Never run Debugbar in production — it exposes query details, schema, and environment configuration.
- Use Telescope with `Telescope::filter()` to sample only slow requests or requests with elevated query counts.
- Implement a production-safe query warning via middleware that logs `warning` level when count exceeds threshold, without exposing details in responses.
- Set up APM (Application Performance Monitoring) to alert on request duration increasing — this catches N+1 regressions even without explicit query counting.

---

## Common Mistakes

- **Assuming low query count means no N+1:** A single query can still be a performance problem (unindexed full table scan). Query count is one dimension; query cost is another.
- **Relying only on Debugbar visually:** Developers scroll past the query list on familiar pages. Automated thresholds are more reliable than manual inspection.
- **Testing query count against dynamic data:** Tests with random fixtures produce flaky query counts (e.g., a post with no comments may trigger different loading paths). Seed deterministic data.
- **Ignoring eager loading in serialization:** `$post->toArray()` triggers lazy loading for loaded relationships only. Unloaded relationships cause N+1 silently in API responses.

---

## Failure Modes

- **Query log memory exhaustion:** On requests with 10k+ queries (e.g., badly written export), collecting the full query log can exhaust PHP memory before the request finishes.
- **False confidence from middleware limits:** A middleware that warns at 50 queries won't catch a slow 10-query page if each query scans a million rows.
- **Debugbar conflict with APIs:** Debugbar injects HTML into responses. For JSON APIs, use Telescope or manual query counting instead.

---

## Ecosystem Usage

- **Laravel Debugbar (barryvdh/laravel-debugbar):** De facto standard for local N+1 detection. Highlights duplicate queries with a warning icon.
- **Laravel Telescope:** First-party debugging companion. Query deductor is purpose-built for N+1 detection.
- **Laravel Nova:** Uses eager loading extensively — N+1 detection via Debugbar during development ensures Nova resources perform well.

---

## Related Knowledge Units

### Prerequisites
- Lazy loading fundamentals
- Eager loading (`with()`, `load()`)
- Model relationship definitions

### Related Topics
- `prevention-strategies` (how to fix detected N+1 issues)
- `lazy-loading-violations` (strict mode enforcement)
- `select-constraints` (reducing query payload)

### Advanced Follow-up Topics
- Custom query monitoring solutions
- Distributed tracing for N+1 across microservices

---

## Research Notes

### Source Analysis
`Illuminate\Database\DatabaseManager::listen()` registers query event listeners. `Barryvdh\Debugbar\DataCollector\QueryCollector` collects and classifies queries. Laravel Telescope's `Illuminate\Database\Events\QueryExecuted` listener in `App\Providers\TelescopeServiceProvider`.

### Key Insight
The most effective detection strategy combines automated test assertions (pre-deployment) with observability monitoring (post-deployment). Neither alone catches all N+1 regressions.

### Version-Specific Notes
- Laravel 8+: `Model::preventLazyLoading()` introduced — throws an exception on any lazy-loaded relationship.
- Laravel 10+: `Model::shouldBeStrict()` convenience method bundles lazy loading prevention with other strictness features.
- Laravel 11+: Continued refinement of Telescope's query deductor for better duplicate detection.
