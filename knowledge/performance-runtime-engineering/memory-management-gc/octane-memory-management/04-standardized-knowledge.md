# Octane Memory Management — State Leak Prevention, Sandbox Patterns, Service Provider Auditing, WeakReference

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Octane Memory Management — State Leak Prevention, Sandbox Patterns, Service Provider Auditing, WeakReference |
| Difficulty | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Laravel Octane's persistent worker architecture fundamentally changes PHP memory management. In PHP-FPM, every request gets a fresh process — memory is automatically cleaned up at the end of each request. In Octane, workers persist across hundreds or thousands of requests, and memory accumulates. State leaks — where data from one request persists into the next — are the most common source of bugs and memory growth in Octane applications. Preventing state leaks requires auditing all service providers, replacing static properties with container bindings, using the sandbox pattern for request-scoped services, and leveraging WeakReference for cache-like patterns.

## Core Concepts

- **State leak**: Data from Request A persists in the worker and affects Request B. Caused by static properties, singleton misuse, or per-request listeners registered on shared event dispatchers.
- **Sandbox pattern**: Octane creates a "sandboxed" application instance per request. Framework-level services (config, events, logging) are shared across requests. Application-level services are cloned fresh.
- **Octane::booted()**: Callback that runs once per worker during boot. Used for one-time initialization that should not repeat on every request.
- **Service provider auditing**: Reviewing each service provider to ensure it doesn't register per-request state, bind request-scoped data as singletons, or register listeners that accumulate.
- **WeakReference (PHP 7.4+)**: A reference that does not prevent garbage collection. Used for caches or object mappings where the referenced object should be freed when no longer needed.
- **`$app->forgetInstance()` / `$app->forgetScopedInstances()`**: Methods to clear singleton instances from the container. Called at request boundaries to reset request-scoped singletons.
- **max_requests**: Configuration that recycles workers after N requests. Safety net for undetected memory leaks. Typical values: 500–2000.

## When To Use

- You are deploying Laravel Octane, Swoole, or FrankenPHP in production.
- You are migrating from PHP-FPM to Octane and need to audit your application.
- You have observed worker RSS growing over time (memory leak).
- You need to ensure data isolation between requests in persistent workers.
- You are designing new services or packages for Octane compatibility.

## When NOT To Use

- You use PHP-FPM exclusively — memory resets per request. No state leak concerns.
- You are just testing Octane locally — state leaks are less visible with low request counts.
- Your application uses only basic Laravel features (default service providers) — most common leaks are in custom code.
- You haven't deployed Octane yet — focus on getting it running first, then audit for leaks.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Replace static properties with container bindings | Static properties persist across requests in the same worker. Use `app()->instance()` or `$app->singleton()` for services, and `scoped()` for request-scoped state. |
| Use `Octane::booted()` for one-time worker initialization | Code in service provider `boot()` runs per-request in Octane. `Octane::booted()` runs once per worker — safe for listener registration, cache warmup, connection setup. |
| Audit all service providers before deployment | The most common source of state leaks is a service provider that registers listeners or binds request-scoped data incorrectly. |
| Use `scoped()` bindings for request-scoped services | Scoped bindings create a new instance on each request while maintaining singleton semantics within a request. |
| Call `$app->forgetScopedInstances()` after each request | Explicitly clears scoped bindings so they are freshly resolved on the next request. Octane does this automatically for framework-scoped instances. |
| Use `WeakReference` for cache-like object pools | Weak references don't prevent the referenced object from being freed. Ideal for caches where objects should be collectable when memory is needed. |
| Monitor worker RSS and set `max_requests` based on observations | No audit catches every leak. Monitor RSS growth and set `max_requests` to recycle workers before memory exceeds safe limits. |
| Test with `octane:watch` during development | `octane:watch` detects static property modifications at runtime, catching leaks before production. |

## Architecture Guidelines

- **Sandbox lifecycle**: Worker starts → Octane::booted() runs → wait for request → clone application → create sandbox → handle request → reset sandbox → forget scoped instances → wait for next request.
- **What's shared across requests**: Config (config/, .env), events (EventServiceProvider registrations), logging (Log channels), routing (routes/web.php, api.php), middleware registrations.
- **What's fresh per request**: Application instance clone, request-scoped singletons (database connections, auth, session), facades with request-scoped backing.
- **Service provider categories**: 1) Providers that register shared services (safe — boot once, persist), 2) Providers that register request-scoped services (need `scoped()` binding), 3) Providers that register event listeners (need idempotency — use `Octane::booted()`).
- **Static property audit**: Search for `public static $`, `protected static $`, `private static $` across all application and package code. Mark each for Octane safety review.
- **Package compatibility**: Not all Laravel packages are Octane-compatible. Maintain a compatibility matrix. Use `Octane::booted()` to wrap package initialization when needed.

## Performance Considerations

- Sandbox cloning overhead: 0.5–2ms per request. Negligible compared to the 10–40ms bootstrap it replaces.
- `$app->forgetScopedInstances()` cost: ~0.1–1ms depending on number of scoped bindings.
- WeakReference resolution: ~0.1µs — hash table lookup. Negligible.
- Static property audit cost: manual effort, not runtime. Use automated tools (PHPStan, Larastan) to reduce audit time.
- max_requests = 500: 0.2% of requests pay the bootstrap cost (result of worker recycling). Acceptable safety net.

## Security Considerations

- Data leakage between users: the most critical security concern. State leaks can cause User A to see User B's data. This is a data privacy issue with legal implications.
- Authentication state: If the auth singleton is not properly scoped, user authentication state leaks across requests. Always test multi-user scenarios.
- Session isolation: Octane uses Laravel's session drivers. Never use `$_SESSION` directly — it persists across requests in the worker.
- Third-party packages: A single Octane-unsafe package can introduce data integrity vulnerabilities across the entire application.
- Race conditions: Concurrent requests in Swoole with shared state can cause data corruption. Use mutexes or atomic operations for shared resources.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Using static properties on service providers | `protected static $cache = []` accumulates entries per request. | FPM habit — in FPM, statics reset per request. | Memory grows linearly with request count. Users see stale or cross-user data. | Use `$app->instance()` or injected service instances. |
| Registering event listeners in `register()` method | `Event::listen()` called in `register()` runs on every request in Octane. | Following standard Laravel provider patterns without Octane awareness. | Listeners accumulate — same listener registered thousands of times. | Move listener registration to `Octane::booted()`. |
| Binding request-scoped services as singletons | `$this->app->singleton(UserService::class)` where UserService holds user data. | Not understanding that singletons persist across requests in Octane. | User A's data visible to User B on the next request. | Use `scoped()` for services that hold request-specific state. |
| Not calling `$app->forgetInstance()` for temporary singletons | Singletons that should be reset per-request remain in the container. | Forgetting to clean up after request processing. | Services accumulate across requests, returning stale or incorrect data. | Use `forgetInstance()` or `forgetScopedInstances()` at request boundaries. |
| Assuming packages are Octane-compatible | Deploying packages without testing under Octane. | Not knowing that many packages use static caches, globals, or unsafe singleton patterns. | Intermittent bugs that are hard to reproduce. | Test every package under Octane. Maintain a compatibility matrix. |

## Anti-Patterns

- **Setting max_requests very low (100)**: Hides leaks but negates Octane's bootstrap elimination benefit. Every 100th request pays the full bootstrap cost. Fix the leak, don't hide it.
- **Global state management through facades**: `\Cache::put()`, `\Log::info()` — facades use static access, but their underlying instances are managed by the container. This is safe. The anti-pattern is storing state on the facade's static instance.
- **Conditional service provider registration**: `if (app()->environment('production')) { $this->app->register(...) }` — `app()` calls work during `register()` but may not behave as expected. Use `$this->app` instead.
- **Ignoring octane:watch warnings**: `octane:watch` detects static property modifications during development. Treat warnings as production-blocking bugs.

## Examples

```php
// Safe Octane service provider
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Scoped binding — fresh instance per request
        $this->app->scoped(CurrentUser::class, fn () => new CurrentUser());
    }

    public function boot(): void
    {
        // One-time listener registration
        Octane::booted(function () {
            Event::listen(OrderPlaced::class, SendOrderNotification::class);
        });
    }
}
```

```php
// WeakReference for in-memory cache
class MemoryCache
{
    private array $entries = [];

    public function set(string $key, object $value): void
    {
        $this->entries[$key] = WeakReference::create($value);
    }

    public function get(string $key): ?object
    {
        $ref = $this->entries[$key] ?? null;
        return $ref?->get(); // Returns null if the object was collected
    }
}
```

```php
// Static property audit pattern
class StateLeakDetector
{
    public function trackModifications(): void
    {
        Octane::watch(function (string $class, string $property) {
            Log::warning("State leak detected: {$class}::{$property} modified");
        });
    }
}
```

## Related Topics

- Service Provider Optimization for Persistence
- Worker Configuration by Driver
- Memory Leak Detection Patterns
- GC Threshold Tuning for Octane
- Connection Pooling Strategies

## AI Agent Notes

- Octane memory management is the single most important operational skill for running Laravel Octane in production. Get this wrong and you have data leaks and OOM crashes.
- The 80/20 rule: 80% of state leaks come from 20% of service providers — specifically, providers that register event listeners, bind request-scoped data as singletons, or use static properties.
- The most reliable leak detection method: run a soak test with `octane:watch` enabled. Simulate 10,000 requests across multiple users. If watch doesn't fire and RSS stays flat, you're safe.
- When in doubt, use `scoped()` over `singleton()`. Scoped bindings provide singleton semantics within a request while ensuring freshness across requests. The performance cost is negligible.

## Verification

- [ ] Configure `octane:watch` during development and fix all warnings.
- [ ] Audit all service providers: categorize each as safe/needs-review/unsafe.
- [ ] Replace all `static $` properties with container bindings or scoped services.
- [ ] Run a 24-hour soak test with 10K+ requests — verify RSS growth <10%.
- [ ] Test multi-user scenarios: log in as User A, then User B — verify no data crossover.
- [ ] Verify all third-party packages work correctly under Octane.
- [ ] Implement WeakReference-based caching for objects that may need collection.
- [ ] Set `max_requests` based on observed memory growth in soak test.
- [ ] Document the Octane memory management approach and audit findings.
