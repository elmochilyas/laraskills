# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.28 Endpoint-level query governance (max queries per request, max query time)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

## Executive Summary

Endpoint query governance sets hard limits on database resource usage per HTTP request. Common policies: max N queries per request, max total query time, max rows examined, and disallowed query patterns. Without governance, a single runaway endpoint can exhaust database connection pools, starve other requests, and trigger cascading failures. Laravel provides middleware-level hooks for enforcement, and tools like Telescope, Pulse, and custom event listeners enable measurement.

---

## Core Concepts

- **Query budget**: Predefined allowance of database operations per request — typically measured in query count, total duration, or rows examined.
- **Hard limit vs soft limit**: Hard limits throw exceptions and abort the request. Soft limits log warnings and surface in monitoring.
- **N+1 amplification risk**: A single Eloquent relationship access triggers hidden queries. Endpoint governance makes these visible by tracking per-request query volume.
- **Connection pool pressure**: Each query consumes a connection from the pool. Long-running queries or high query counts hold connections longer, reducing available concurrency.
- **Governance tiers**: Strict limits for read-heavy API endpoints, moderate limits for admin dashboards, relaxed limits for reporting endpoints with explicit opt-in.

```
Typical Governance Budgets:
  - Public API:          max 10 queries, max 200ms total
  - Web frontend:        max 30 queries, max 500ms total
  - Admin dashboard:     max 100 queries, max 5s total
  - Reporting endpoint:  max 500 queries, max 30s total (requires opt-in header)
```

---

## Mental Models

Query governance is like a restaurant kitchen's order queue. Each request is a table's order. If one table orders 50 dishes (N+1 queries), the kitchen is blocked and every other table waits. The head chef (governance middleware) caps each table's order count, prioritizes smaller orders, and flags tables that abuse the system. Without this, a single large order causes every other table to experience "slow service."

---

## Internal Mechanics

Laravel's `DB::listen()` event fires for every query executed. A governance middleware can hook into this event, increment a per-request counter, accumulate total duration, and check against thresholds.

```php
// Governance middleware skeleton
class QueryGovernanceMiddleware
{
    protected int $queryCount = 0;
    protected float $totalDuration = 0;

    public function handle(Request $request, Closure $next, int $maxQueries = 30, int $maxTimeMs = 500): mixed
    {
        DB::listen(fn(QueryExecuted $query) => $this->trackQuery($query, $maxQueries, $maxTimeMs));
        return $next($request);
    }

    protected function trackQuery(QueryExecuted $query, int $maxQueries, int $maxTimeMs): void
    {
        $this->queryCount++;
        $this->totalDuration += $query->time;

        throw_if($this->queryCount > $maxQueries,
            QueryLimitExceededException::forQueries($maxQueries, $this->queryCount));

        throw_if($this->totalDuration > $maxTimeMs,
            QueryLimitExceededException::forDuration($maxTimeMs, $this->totalDuration));
    }
}

// Register in Kernel.php
protected $routeMiddleware = [
    'query-governance' => QueryGovernanceMiddleware::class,
];

// Apply with configurable limits
Route::middleware('query-governance:20,200')->group(function () {
    Route::get('/posts', [PostController::class, 'index']);
});
```

---

## Patterns

**Per-endpoint governance via middleware parameters**: Encode limits as middleware parameters. Different endpoint categories get different budgets.

```php
// Strict: API endpoints
Route::middleware('query-governance:10,200')->group(fn() => /* API routes */);

// Relaxed: admin
Route::middleware('query-governance:100,5000')->prefix('admin')->group(fn() => /* Admin routes */);
```

**Telescope-based soft governance without deployment**: Use Telescope's watcher to alert when endpoint query thresholds are breached in non-production environments.

```php
// In AppServiceProvider
DB::listen(function (QueryExecuted $query) {
    if (app()->environment('local', 'staging')) {
        $count = request()?->attributes->get('_query_count', 0) + 1;
        request()?->attributes->set('_query_count', $count);

        if ($count > 50) {
            Log::warning('High query count detected', [
                'url' => request()?->fullUrl(),
                'count' => $count,
            ]);
        }
    }
});
```

**Row-examined governance via database proxy**: ProxySQL can rewrite queries to add `MAX_EXECUTION_TIME` hint or log queries exceeding row-examined thresholds. This catches governance violations at the database layer, not just the application layer.

```sql
-- MySQL: Set per-query execution time limit
SET SESSION MAX_EXECUTION_TIME = 1000; -- 1 second

-- PostgreSQL: statement_timeout per session
SET statement_timeout = '1s';

-- Laravel: pass timeout hint to specific queries
DB::statement('SET LOCAL statement_timeout = \'1s\''); -- PostgreSQL
```

---

## Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| Middleware-level governance | Need per-endpoint limits, early abort on breach | Query budgets vary per user role (use service-layer) |
| DB proxy governance | Need database-layer enforcement regardless of app | Overhead of proxy setup not justified |
| Observer/metrics only | Monitoring phase, no enforcement yet | Production without enforcement |
| Service-layer governance | Complex per-user or per-tenant budgets | Simple per-endpoint caps suffice |

---

## Tradeoffs

| Benefit | Cost |
|---------|------|
| Prevents runaway queries from exhausting pool | Overhead of tracking per-request query metrics (~0.01ms per query) |
| Makes N+1 violations visible immediately | Hard limit may break legitimate complex endpoints |
| Enforces query budgets systematically | Requires tuning per endpoint — too tight causes false positives |
| Database-layer timeout catches all violations | Statement timeout kills the query but doesn't abort the request gracefully |

---

## Performance Considerations

- `DB::listen()` callback overhead is negligible (~1-5 microseconds per query) for most applications. At 500+ queries per request, the cumulative overhead is ~2-5ms — acceptable for governance.
- Use `MAX_EXECUTION_TIME` (MySQL 5.7+) or `statement_timeout` (PostgreSQL) as a last-resort database safety net. These kill the query at the database level if application governance fails.
- Connection pool monitoring (`SHOW PROCESSLIST`, `pg_stat_activity`) reveals idle-in-transaction queries or queries that exceed their governance allocation.

---

## Production Considerations

- **Gradual enforcement rollout**: Phase 1: log-only mode (collect baseline). Phase 2: soft warnings per endpoint. Phase 3: hard limits for well-understood endpoints.
- **Bypass mechanism**: Allow internal-health-check endpoints or authenticated admin users to bypass governance for legitimate bulk operations.
- **Queue job governance**: Apply similar limits to queue jobs. A misbehaving job that issues 10k queries can stall the queue worker longer than an HTTP request.
- **Governance observability**: Expose query count, total duration, and governance status as Prometheus metrics or in structured logs for alerting.

---

## Common Mistakes

**Setting limits too tight**: A hard limit of 5 queries per request will break any page with eager loading of 3+ relationships and their counts. Start with generous limits and tighten iteratively.

**No governance on queue jobs**: Queue jobs often query more aggressively than HTTP endpoints because "it's async." A single faulty job can consume the entire connection pool.

**Governance only in the app layer**: A developer can disable the middleware or bypass governance. Pair application-layer governance with database-layer `MAX_EXECUTION_TIME` for defense in depth.

**Forgetting Octane**: In Octane, `DB::listen()` callbacks persist across requests if registered in a service provider's `boot()` method. Reset governance counters in the request lifecycle to avoid cross-request leakage.

```php
// Octane-safe governance: reset counters on request start
public function handle(Request $request, Closure $next): mixed
{
    $this->queryCount = 0;
    $this->totalDuration = 0;
    // ... rest of governance
}
```

---

## Failure Modes

- **Connection pool exhaustion from slow queries**: 10 concurrent requests each taking 10 seconds (even if within governance) exhaust a pool of 100 connections. Governance must consider concurrency × duration, not just per-request limits.
- **Governance middleware exception masking**: If the governance middleware throws after the response has started sending (e.g., late query in a view composer), Laravel will fail to send the error response. Use early-abort patterns before response generation.
- **False positives from background queries**: Octane's tick functions, queue heartbeats, or session garbage collection queries inflate query counts. Filter tracked queries by excluding framework-internal queries.

---

## Ecosystem Usage

Laravel Pulse monitors query counts and slow queries per endpoint out of the box. Telescope provides detailed per-request query timing. Debugbar shows query count in the browser toolbar during development. Third-party APM tools (Scout APM, New Relic, Datadog) provide production query governance dashboards with alerting.

---

## Related Knowledge Units

4.13 N+1 detection and elimination | 4.27 Profiling tools | 4.30 Production optimization workflow | 9.10 Lock wait timeout configuration

---

## Research Notes

The concept of query governance is under-documented in the Laravel ecosystem compared to the Ruby on Rails world (where `bullet` gem and `rack-mini-profiler` have long enforced query budgets). Laravel community packages like `query-buddy` and `laravel-query-monitor` began filling this gap in 2024-2026. Database-native governance via ProxySQL query rules and RDS Performance Insights is the enterprise standard for defense-in-depth.
