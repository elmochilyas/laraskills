# Octane Lifecycle

## Metadata
- **ID:** ku-01-octane-lifecycle
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Overview
Laravel Octane supercharges application performance by booting the framework once and reusing it across hundreds of requests, eliminating the per-request bootstrap overhead inherent to traditional PHP-FPM. The core architectural insight is the **sandbox** — a per-request clone of the application container that isolates state while preserving memory-resident services. Octane supports three runtimes (Swoole, RoadRunner, FrankenPHP) each with distinct concurrency models, but exposes a unified interface through the `Octane` facade and lifecycle hooks.

## Core Concepts
- **One-Time Boot vs Per-Request Boot**: The application container is booted once during worker start. Services registered as `singleton()` survive across requests. A sandboxed clone is created for each request.
- **Octane Sandbox**: A lightweight clone of the container created per-request. Shares singleton instances with the master container but creates fresh instances for `scoped()` bindings. Discarded after request — any state mutations during the request are lost.
- **Workers**: Long-running PHP processes managed by the runtime. Each worker processes requests sequentially (Swoole can process concurrently with coroutines). Workers recycle after `max_requests` to mitigate memory leaks.
- **Runtime Adapters**: Swoole (event-driven, coroutine-capable), RoadRunner (goroutine-backed, HTTP/2), FrankenPHP (Caddy-based, Go worker pool). Each maps Octane's lifecycle onto the runtime's native concurrency model.

## When To Use
- **High-traffic applications**: Apps serving 100+ requests/second benefit from Octane's 10-50x throughput improvement over PHP-FPM.
- **I/O-bound applications**: Octane excels when requests spend time waiting on databases, external APIs, or file I/O.
- **Existing Laravel apps ready for audit**: Teams willing to audit service bindings for state safety before deploying.

## When NOT To Use
- **Simple low-traffic apps**: The operational complexity of Octane (worker management, state audits) outweighs benefits for low-traffic sites.
- **CPU-bound applications**: Octane's advantage is reduced bootstrap overhead; CPU-bound apps benefit less.
- **Teams unable to audit bindings**: Deploying Octane without binding audit risks silent data leaks between requests.
- **Coroutine-unsafe dependencies**: If using Swoole, all dependencies must be coroutine-safe.

## Best Practices (WHY)
- **Audit all singletons before Octane deployment**: Every `singleton()` with mutable state is a potential data leak. Convert request-aware singletons to `scoped()`. *Why: Silent data leaks are the #1 production Octane bug — unpredictable, hard to reproduce, and dangerous.*
- **Use `scoped()` for per-request state**: Auth, session, locale, and current-tenant services should be `scoped()`. *Why: Scoped bindings provide per-request freshness while maintaining in-request singleton performance.*
- **Set `max_requests` based on leak profile**: Default 500 is safe for most apps. Profile memory growth to tune. *Why: Too low wastes throughput on worker churn; too high risks OOM from accumulated memory.*
- **Test with sequential requests**: Octane bugs only manifest on the second, third, or thousandth request. Test in CI with sequences of ≥100 requests. *Why: Singletons and statics accumulate over time; a single-request test catches nothing.*

## Architecture Guidelines
- **Sandbox over clone-and-replace**: Minimal overhead per request; only re-registers sandbox-sensitive providers.
- **Singleton sharing across sandboxes**: Preserves benefits of long-lived connections, config caches, route collections.
- **`max_requests` recycling**: Safety valve against accumulated memory leaks without requiring perfect code.
- **Separate master/sandbox containers**: Clear ownership — master owns infrastructure, sandbox owns request-scoped state.
- **One-time boot**: Framework boots once per worker. All subsequent requests reuse the booted container.

## Performance
- **10-50x throughput improvement** over PHP-FPM by eliminating per-request bootstrap.
- **Sandbox creation takes ~2ms per request**. Re-registering sandbox providers adds ~0.5ms per provider.
- **Swoole coroutines**: Zero overhead on context switching (userland). RoadRunner process-per-core has ~1MB RSS baseline per worker.
- **Memory baseline**: Idle Octane worker typically 30-50MB (Laravel booted). Each request adds 1-5MB transient memory freed after sandbox destruction.
- **Maximum throughput** is bound by worker count × requests per second per worker.

## Security
- **Silent data leak**: User A's data appears in User B's response. Root cause: singleton service holding request-specific state (e.g., `Auth::user()` on a singleton guard instance).
- **OOM cascade**: Worker RSS grows monotonically until OS OOM killer terminates the process. Root cause: static arrays accumulated over thousands of requests.
- **Coroutine safety**: In Swoole, blocking I/O inside a coroutine without yielding blocks the entire worker — all coroutines stall.
- **Process isolation**: RoadRunner and FrankenPHP use separate PHP processes per worker, providing natural isolation. Swoole shares memory within a worker.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Treating Octane as "drop-in faster Laravel" | Not auditing service providers | Singleton state leaks in production | Full binding audit before deployment |
| Registering mutable repositories as singletons | Eloquent models with cached queries, API clients with token stores | Cross-request data contamination | Use scoped() or stateless design |
| Using global state expecting per-request isolation | Static properties, globals in code | State shared across all requests in same worker | Use scoped bindings or explicit reset |
| Not implementing OctaneSandbox | Providers registering request-scoped services without sandbox awareness | Sandbox skips re-registration | Implement OctaneSandbox contract |

## Anti-Patterns
- **Blind singleton-to-scoped conversion**: Converting every singleton to scoped "just to be safe." This adds unnecessary overhead and breaks services that truly need persistence (connection pools, config readers).
- **Ignoring static properties**: Focusing only on container bindings while static properties accumulate memory unbounded. Statics are not container-managed.
- **No max_requests**: Setting `max_requests` to 0 or null — no safety valve for memory leaks. Workers grow until OOM.
- **Sharing Octane workers with Horizon**: Running queue workers in the same process as Octane workers — state corruption and resource contention.

## Examples

```php
// config/octane.php
return [
    'server' => env('OCTANE_SERVER', 'swoole'),
    'max_requests' => env('OCTANE_MAX_REQUESTS', 500),
    'worker_count' => env('OCTANE_WORKER_COUNT', 'auto'),
];

// Safe binding: immutable config reader (singleton)
$this->app->singleton(ConfigReader::class);

// Request-aware binding: per-request state (scoped)
$this->app->scoped(CurrentTeam::class);

// Octane lifecycle hook for cleanup
Octane::tick('metrics', function () {
    Metrics::gauge('memory', memory_get_usage(true));
}, 60);

Event::listen(RequestTerminated::class, function ($event) {
    app(Cache::class)->clearRequestCache();
});
```

## Related Topics
- **Singleton State Leaks**: Deep dive on the primary failure mode in Octane.
- **Scoped Bindings for Octane**: The solution to singleton leaks.
- **Static Property Accumulation**: The second major leak vector.
- **Octane Lifecycle Hooks**: tick(), RequestTerminated, WorkerStarting.
- **Octane Configuration and Workers**: Worker tuning details.
- **Service Binding Audit**: Systematic audit methodology for Octane safety.

## AI Agent Notes
- Swoole v5.x introduced `HookFlags` for finer-grained coroutine hooking. Not all PHP functions are safe to hook.
- RoadRunner v3.x added gRPC and TCP support. The HTTP plugin remains the primary Octane transport.
- FrankenPHP merges Caddy's config with Octane's sandbox. `frankenphp.yml` replaces `octane.php` for some settings.
- Laravel 11+ ships Octane as a first-party choice. The sandbox abstraction is stable since Octane v2.x.
- Research gap: benchmark sandbox creation cost vs alternative strategies. Current sandbox is O(n) in number of bound services.

## Verification
- [ ] Understand the one-time boot vs per-request boot distinction
- [ ] Trace the Octane worker boot sequence: worker start → bootstrap → event loop → sandbox → request → flush
- [ ] Identify the three runtime adapters and their concurrency models
- [ ] Audit at least 5 service providers for singleton state safety
- [ ] Test with two sequential requests sending different auth users — verify no data leak
- [ ] Run `php artisan octane:status` and verify worker configuration
