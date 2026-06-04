---
## Rule Name

Replace Static Properties with Container Bindings

## Category

Architecture

## Rule

Never use static properties to store request-scoped data in Octane workers. Use container bindings with `scoped()` instead.

## Reason

Static properties persist across requests inside the same worker. Data written to a static property in Request A is visible in Request B — causing state leaks and linear memory growth. Container bindings are scoped to a single request.

## Bad Example

```php
class UserService {
    private static ?User $currentUser = null;  // Leaks across requests!
}
```

## Good Example

```php
// Service provider
$this->app->scoped(UserService::class, function () {
    return new UserService();
});
```

## Exceptions

Stateless configuration that is initialized once and never modified.

## Consequences Of Violation

Data leakage between users, linear memory growth, intermittent bugs that are hard to reproduce.

---

## Rule Name

Use Octane::booted for One-Time Initialization

## Category

Architecture

## Rule

Always register event listeners, scheduled tasks, and one-time setup inside `Octane::booted()` callbacks, not in service provider `boot()` methods.

## Reason

In Octane, service provider `boot()` runs on every request in the sandboxed application. Event listeners registered there accumulate across requests — the same listener is registered thousands of times. `Octane::booted()` runs once per worker.

## Bad Example

```php
public function boot(): void {
    Event::listen(OrderPlaced::class, SendNotification::class);
    // Registers every request — listeners accumulate
}
```

## Good Example

```php
public function boot(): void {
    Octane::booted(function () {
        Event::listen(OrderPlaced::class, SendNotification::class);
        // Registers once per worker
    });
}
```

## Exceptions

Service providers that only bind container entries (no listener registration).

## Consequences Of Violation

Duplicate event listeners executing the same handler N times per event, linear memory growth from accumulated listener objects.

---

## Rule Name

Use scoped Bindings for Request-Scoped Services

## Category

Architecture

## Rule

Bind services that hold request-specific state using `$this->app->scoped()` instead of `$this->app->singleton()`.

## Reason

Singleton bindings persist across requests in Octane workers. A singleton holding user data from Request A will return that same data in Request B. `scoped()` bindings create a fresh instance per request while maintaining singleton semantics within a request.

## Bad Example

```php
$this->app->singleton(CurrentUser::class, function () {
    return new CurrentUser();  // Same instance across requests
});
```

## Good Example

```php
$this->app->scoped(CurrentUser::class, function () {
    return new CurrentUser();  // Fresh instance per request
});
```

## Exceptions

Truly stateless services that hold no request-specific data (logging, caching, configuration).

## Consequences Of Violation

State leaks between requests, stale data serving, cross-user data exposure, security incidents.

---

## Rule Name

Test with octane:watch During Development

## Category

Reliability

## Rule

Always run `octane:watch` during development to detect static property modifications and state leaks before production deployment.

## Reason

`octane:watch` monitors static property changes at runtime, catching Octane-unsafe patterns that would cause production leaks. Most state leaks are introduced during development and caught by `octane:watch` before deployment.

## Bad Example

```bash
# Deployed without Octane testing — first production leak detected after OOM
```

## Good Example

```bash
# Development workflow
php artisan octane:watch --server=roadrunner
# Shows warnings when static properties are modified between requests
# Fix each warning before committing
```

## Exceptions

No common exceptions. Always test Octane-specific behavior before deployment.

## Consequences Of Violation

Production state leaks caught only after they cause data exposure or OOM.

---

## Rule Name

Audit All Service Providers Before Octane Deployment

## Category

Reliability

## Rule

Review every service provider for Octane compatibility before deploying: categorize as safe (uses `Octane::booted`), needs-review (binds singletons), or unsafe (static properties, per-request listeners).

## Reason

The most common Octane memory leaks originate from service providers written with FPM assumptions. A single provider that registers listeners per-request or uses static properties can cause state leaks across the entire application.

## Bad Example

```php
// Provider deploys without review — contains unsafe static cache
// Causes memory leak and data crossover in production
```

## Good Example

```php
// Provider audit checklist:
// [SAFE] AppServiceProvider — only scoped bindings
// [NEEDS REVIEW] PaymentServiceProvider — singleton with state
// [UNSAFE] LegacyProvider — static properties, must refactor
```

## Exceptions

No common exceptions. Every provider must be reviewed.

## Consequences Of Violation

Undetected state leaks in production, data crossover between users, emergency rollbacks.

---

## Rule Name

Set max_requests Based on Observed Memory Growth

## Category

Reliability

## Rule

Set `max_requests` based on soak test results — recycle workers before memory grows by more than 20% of baseline.

## Reason

Even with proper state management, some memory drift is inevitable due to Zend MM fragmentation and persistent allocator behavior. A safety net of 500–2000 requests (depending on observed growth rate) prevents OOM without wasting bootstrap benefits.

## Bad Example

```php
'max_requests' => 100,  // Too low — wastes Octane's bootstrap benefit
```

## Good Example

```php
// Soak test: RSS grows from 60MB to 70MB over 2000 requests (17%)
'max_requests' => 2000,  // Safe — recycles before >20% growth
```

## Exceptions

No common exceptions. Always calibrate based on observed data.

## Consequences Of Violation

Too low: excessive recycling wastes throughput. Too high: memory grows until OOM.

---

## Rule Name

Use WeakReference for In-Memory Caches

## Category

Architecture

## Rule

Use `WeakReference` for in-memory caches that should not prevent object garbage collection.

## Reason

Strong references from cache maps prevent cached objects from being freed even when no longer needed. `WeakReference` allows the GC to collect the object when memory is needed, providing automatic cache eviction without explicit LRU logic.

## Bad Example

```php
private array $cache = [];
public function get(string $key): ?object {
    return $this->cache[$key] ?? null;  // Strong ref — objects never freed
}
```

## Good Example

```php
private array $cache = [];
public function set(string $key, object $value): void {
    $this->cache[$key] = WeakReference::create($value);
}
public function get(string $key): ?object {
    $ref = $this->cache[$key] ?? null;
    $obj = $ref?->get();
    if ($obj === null) unset($this->cache[$key]);
    return $obj;
}
```

## Exceptions

Caches where cached objects must always be available (use strong references).

## Consequences Of Violation

Cached objects pinned in memory indefinitely, cache acting as a memory leak in Octane workers.
