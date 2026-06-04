# Octane Architecture and Execution Model — Persistent Application, Boot-Once Handle-Many

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Octane Architecture and Execution Model — Persistent Application, Boot-Once Handle-Many |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Laravel Octane boots the application **once** at worker start, then handles thousands of requests within the same process. This eliminates the 10–40ms framework bootstrap cost (service container construction, config loading, provider registration, route registration) that every PHP-FPM request pays. Octane operates as a **bridge** between Laravel and an underlying application server (RoadRunner, Swoole, FrankenPHP), abstracting the runtime selection via a unified API.

## Core Concepts

- **Boot sequence**: `artisan octane:start` → worker starts → bootstrap (kernel boot, providers register, routes load) → loop: wait for request → dispatch → response → cleanup.
- **Per-request dispatch**: Octane creates a fresh Laravel application instance per request using `Illuminate\Foundation\Application` cloned from the booted template. Service providers that boot once per worker retain state; per-request providers run fresh.
- **Sandbox pattern**: Octane uses a sandbox container. Application-level services are cloned per request; framework-level services (config, events, logging) are shared.
- **Driver abstraction**: `Octane\Octane::driver()` returns the active runtime driver. All runtime-specific code is behind this interface.

## When To Use

- You want to maximize throughput by eliminating the per-request framework bootstrap cost (10–40ms saved per request).
- Your application is I/O-bound and spends significant time waiting for database, Redis, or external API responses.
- You have a Laravel application and want to run it on RoadRunner, Swoole, or FrankenPHP.

## When NOT To Use

- Your application has packages with known Octane incompatibilities that cannot be resolved.
- Your application relies on per-request global state (static properties, superglobals) that would require extensive refactoring.
- You need per-request process isolation guaranteed (PHP-FPM provides this; Octane does not).
- Your team lacks the expertise to debug state leaks and memory issues in long-running processes.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use the sandbox pattern for request-scoped services | The sandbox clones framework services per request while sharing config/events/logging. This prevents state leaks while maintaining performance. |
| Audit all service providers before deploying Octane | Providers that bind request-scoped data as singletons cause cross-request contamination. |
| Replace static property usage with container bindings | Static properties persist across requests in the same worker, causing data leakage. |
| Set `max_requests` to recycle workers periodically | Recycling workers clears accumulated memory fragmentation and state leaks. A typical value is 500–1000 requests. |
| Use `Octane::booted()` for per-worker initialization | Ensures initialization logic runs exactly once per worker, not per request. |

## Architecture Guidelines

- **Boot once, handle many**: The worker boot sequence runs once: Application constructed → providers registered → providers booted → routes/facades registered → event loop begins. Each request then clones the booted application.
- **Sandbox isolation**: Octane intercepts `$app->terminate()` and replaces it with sandbox reset logic. Per-request services (DB connections, session, auth) are fresh each request while shared services (config, events, logging) persist.
- **State leak detection**: Octane tracks static property modifications via a callback registered in `zend_execute_data`. When `octane:watch` is enabled, it detects leaks at runtime.
- **Driver abstraction layer**: Octane provides a unified API regardless of the underlying runtime (RoadRunner, Swoole, FrankenPHP). Octane-specific code goes behind `Octane::driver()` checks.
- **Graceful reload**: `php artisan octane:reload` restarts workers one at a time without dropping in-flight requests. New workers boot with the latest code while old workers finish existing requests.

## Performance Considerations

- Benchmark ranges: 2.5–3.1× (mixed workloads) to 15–20× (API workloads) over PHP-FPM.
- The largest gain comes from API endpoints with <50ms response times.
- For endpoints with >500ms I/O wait, the relative gain is 20–40% (bootstrap was proportionally smaller).
- Per-request Application cloning overhead: 0.5–2ms — negligible compared to the 10–40ms bootstrap it replaces.
- OpCache preloading reduces cold-start latency by 2–5ms per worker.
- Octane throughput drops 40–60% when memory pressure triggers swap — ensure adequate RAM.

## Security Considerations

- State leaks between requests can expose User A's data to User B. This is the most critical security concern with Octane.
- Singleton misuse: Services registered as singletons that hold request-scoped data cause privilege escalation or data leakage. Always use `scoped()` for request-scoped services.
- Sandbox isolation is not guaranteed for statics: Static properties bypass the sandbox and persist across requests. Any code using `public static $var` can leak data.
- Session data must use Laravel's session drivers — do not rely on `$_SESSION` which persists across requests in the worker.
- Third-party packages that use global state can introduce data integrity vulnerabilities without any application code changes.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Assuming Octane is a drop-in replacement | Deploying Octane without auditing service providers and static properties. | Misunderstanding that Octane reuses workers across requests. | State leaks, data leakage between users, memory growth until OOM. | Audit all providers and static properties before Octane deployment. |
| Storing request data in singletons | A singleton service that holds user-specific data. | Developer thinking in FPM terms where each request has its own process. | User A sees User B's data on the next request in the same worker. | Use `scoped()` bindings for services that hold request-specific state. |
| Not using `Octane::booted()` for one-time setup | Registering listeners or performing setup in a service provider's `boot()` without idempotency. | `boot()` runs per-request in Octane, not once. | Listeners are registered multiple times, causing duplicate event handling and memory growth. | Use `Octane::booted()` callbacks for per-worker initialization. |
| Forgetting connection pool limits | Deploying Octane without recalculating database connection limits. | Each worker holds persistent connections — N workers × M connections can exhaust the DB pool. | Connection refused errors under load. | Calculate connection budget and configure DB max_connections accordingly. |

## Anti-Patterns

- **Treating Octane like a faster FPM**: Octane's execution model is fundamentally different. FPM-safe code (using statics, singletons, globals) is often Octane-unsafe. A mindset shift is required.
- **Setting `max_requests` too low**: If workers are recycled every 50 requests, the bootstrap cost is paid too frequently, negating Octane's benefit. Aim for 500–1000 requests per worker.
- **Using `$_SESSION`, `$_GET`, `$_POST` directly**: Superglobals persist across requests in the same worker. Always use Laravel's request and session facades.
- **Blindly trusting all packages**: Even well-known Laravel packages may have Octane-incompatible patterns (static caches, global state). Test every package.

## Examples

```
// Octane boot sequence visualization
// artisan octane:start
//   └─ Worker 1 starts
//       └─ Illuminate\Foundation\Application constructed
//       └─ Service providers registered
//       └─ Service providers booted
//       └─ Routes registered
//       └─ Facades registered
//       └─ Event loop: wait for request
//           ├─ Request 1 → clone app → handle → reset sandbox
//           ├─ Request 2 → clone app → handle → reset sandbox
//           └─ ... (thousands more)
```

```
// Detecting the current Octane driver in code
use Laravel\Octane\Octane;

if (Octane::driver() === 'swoole') {
    // Swoole-specific initialization
}

// Per-worker initialization (runs once per worker)
Octane::booted(function () {
    // This runs once per worker during boot
    // Safe for: initializing services, pre-warming caches, connecting external services
    Cache::forever('worker_booted_at', now()->toIso8601String());
});
```

## Related Topics

- Driver Selection Comparison — FrankenPHP, Swoole, RoadRunner
- Service Provider Optimization
- State Management and Leak Prevention
- Worker Configuration by Driver
- FPM-to-Octane Migration

## AI Agent Notes

- When explaining Octane to beginners, use the power plant model: FPM = start/stop generator per kilowatt; Octane = keep turbine spinning, handle variable load.
- The most common misconception is that Octane is a "drop-in replacement" — always emphasize the audit requirements.
- Octane's sandbox model research: per-request Application cloning overhead is 0.5–2ms, negligible compared to the 10–40ms bootstrap it replaces.
- State leak prevention tools: Larastan and PHPStan now include rules for Octane-unsafe static property usage. Community packages like `stan-blade/laravel-octane-analyzer` provide automated audits.
- Performance cliff: Octane throughput drops 40–60% when memory pressure triggers swap — proper worker count calculation is critical.

## Verification

- [ ] Run `php artisan octane:status` to verify workers are running and accepting requests.
- [ ] Test that `php artisan octane:reload` gracefully restarts workers without dropping in-flight requests.
- [ ] Run concurrent request tests (`ab -n 100 -c 10`) and verify no cross-request data contamination.
- [ ] Audit all service providers: ensure no request-scoped data is bound as singletons.
- [ ] Audit static properties: run `grep -rn "static \$" app/ --include="*.php"` and refactor as needed.
- [ ] Verify all third-party packages work correctly under Octane.
- [ ] Run `php artisan octane:watch` during development to detect state leaks.
- [ ] Measure worker memory (RSS) over a 24-hour soak test — alert if >10% growth per hour.
- [ ] Configure health check endpoint and load balancer integration.
- [ ] Document the Octane architecture decision and execution model for the team.
