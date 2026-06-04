# 4-28 Endpoint Query Governance

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-28 |
| Knowledge Unit Title | Endpoint Query Governance |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 4.13 N+1 detection and elimination | 4.27 Profiling tools | 4.30 Production optimization workflow | 9.10 Lock wait timeout configuration |
| Last Updated | 2026-06-02 |

## Overview

Endpoint query governance sets hard limits on database resource usage per HTTP request. Common policies: max N queries per request, max total query time, max rows examined, and disallowed query patterns. Without governance, a single runaway endpoint can exhaust database connection pools, starve other requests, and trigger cascading failures. Laravel provides middleware-level hooks for enforcement, and tools like Telescope, Pulse, and custom event listeners enable measurement.

---

## Core Concepts

- **Query budget**: Predefined allowance of database operations per request — typically measured in query count, total duration, or rows examined.
- **Hard limit vs soft limit**: Hard limits throw exceptions and abort the request. Soft limits log warnings and surface in monitoring.
- **N+1 amplification risk**: A single Eloquent relationship access triggers hidden queries. Endpoint governance makes these visible by tracking per-request query volume.
- **Connection pool pressure**: Each query consumes a connection from the pool. Long-running queries or high query counts hold connections longer, reducing available concurrency.
- **Governance tiers**: Strict limits for read-heavy API endpoints, moderate limits for admin dashboards, relaxed limits for reporting endpoints with explicit opt-in.
- ```
- Typical Governance Budgets:
- Public API:          max 10 queries, max 200ms total
- Web frontend:        max 30 queries, max 500ms total
- Admin dashboard:     max 100 queries, max 5s total
- Reporting endpoint:  max 500 queries, max 30s total (requires opt-in header)
- ```


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Per-endpoint governance via middleware parameters**: Encode limits as middleware parameters. Different endpoint categories get different budgets.
- ```php
- // Strict: API endpoints
- Route::middleware('query-governance:10,200')->group(fn() => /* API routes */);
- // Relaxed: admin
- Route::middleware('query-governance:100,5000')->prefix('admin')->group(fn() => /* Admin routes */);
- ```
- **Telescope-based soft governance without deployment**: Use Telescope's watcher to alert when endpoint query thresholds are breached in non-production environments.
- ```php
- // In AppServiceProvider
- DB::listen(function (QueryExecuted $query) {
- if (app()->environment('local', 'staging')) {
- $count = request()?->attributes->get('_query_count', 0) + 1;
- request()?->attributes->set('_query_count', $count);
- if ($count > 50) {
- Log::warning('High query count detected', [
- 'url' => request()?->fullUrl(),
- 'count' => $count,
- ]);
- }
- }
- });
- ```
- **Row-examined governance via database proxy**: ProxySQL can rewrite queries to add `MAX_EXECUTION_TIME` hint or log queries exceeding row-examined thresholds. This catches governance violations at the database layer, not just the application layer.
- ```sql
- -- MySQL: Set per-query execution time limit
- SET SESSION MAX_EXECUTION_TIME = 1000; -- 1 second
- -- PostgreSQL: statement_timeout per session
- SET statement_timeout = '1s';
- -- Laravel: pass timeout hint to specific queries
- DB::statement('SET LOCAL statement_timeout = \'1s\''); -- PostgreSQL
- ```


## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | Middleware-level governance | Need per-endpoint limits, early abort on breach | Query budgets vary per user role (use service-layer) |
- | DB proxy governance | Need database-layer enforcement regardless of app | Overhead of proxy setup not justified |
- | Observer/metrics only | Monitoring phase, no enforcement yet | Production without enforcement |
- | Service-layer governance | Complex per-user or per-tenant budgets | Simple per-endpoint caps suffice |


## Performance Considerations

- - `DB::listen()` callback overhead is negligible (~1-5 microseconds per query) for most applications. At 500+ queries per request, the cumulative overhead is ~2-5ms — acceptable for governance.
- - Use `MAX_EXECUTION_TIME` (MySQL 5.7+) or `statement_timeout` (PostgreSQL) as a last-resort database safety net. These kill the query at the database level if application governance fails.
- - Connection pool monitoring (`SHOW PROCESSLIST`, `pg_stat_activity`) reveals idle-in-transaction queries or queries that exceed their governance allocation.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Setting limits too tight**: A hard limit of 5 queries per request will break any page with eager loading of 3+ relationships and their counts. Start with generous limits and tighten iteratively. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | No governance on queue jobs**: Queue jobs often query more aggressively than HTTP endpoints because "it's async." A single faulty job can consume the entire connection pool. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Governance only in the app layer**: A developer can disable the middleware or bypass governance. Pair application-layer governance with database-layer `MAX_EXECUTION_TIME` for defense in depth. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | Forgetting Octane**: In Octane, `DB::listen()` callbacks persist across requests if registered in a service provider's `boot()` method. Reset governance counters in the request lifecycle to avoid cross-request leakage. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 5 | ```php | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 6 | // Octane-safe governance: reset counters on request start | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 7 | public function handle(Request $request, Closure $next): mixed | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 8 | { | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 9 | $this->queryCount = 0; | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 10 | $this->totalDuration = 0; | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 11 | // ... rest of governance | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 12 | } | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 13 | ``` | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 14 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Connection pool exhaustion from slow queries**: 10 concurrent requests each taking 10 seconds (even if within governance) exhaust a pool of 100 connections. Governance must consider concurrency × duration, not just per-request limits.
- - **Governance middleware exception masking**: If the governance middleware throws after the response has started sending (e.g., late query in a view composer), Laravel will fail to send the error response. Use early-abort patterns before response generation.
- - **False positives from background queries**: Octane's tick functions, queue heartbeats, or session garbage collection queries inflate query counts. Filter tracked queries by excluding framework-internal queries.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Query Optimization Profiling
- **Closely Related**: Other KUs within Query Optimization Profiling
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

