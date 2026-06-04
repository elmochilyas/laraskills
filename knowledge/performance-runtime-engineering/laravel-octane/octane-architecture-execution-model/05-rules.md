## Audit all service providers before deploying Octane
---
Category: Maintainability
---
Review every service provider's register() and boot() methods before deploying Octane. Ensure no request-scoped data is bound as singletons.
---
Reason: Octane boots providers once per worker, not once per request. Providers that bind request-scoped data (user, request, session) as singletons cause data leakage between requests. A singleton from request #1 persists for request #2.
---
Bad Example:
```php
// Singleton for request-scoped data — LEAKS in Octane
$this->app->singleton(UserService::class, function () {
    return new UserService(auth()->user()); // User from request #1
});
```

Good Example:
```php
// Scoped binding — fresh per request
$this->app->scoped(UserService::class, function () {
    return new UserService(auth()->user());
});
```
---
Exceptions: Services that are genuinely stateless and identical across all requests (config, logging, events).
---
Consequences Of Violation: User A sees User B's data, privilege escalation, data leakage.

## Never use static properties for request-scoped data in Octane
---
Category: Architecture
---
Eliminate static properties that hold request-scoped data before migrating to Octane. Use container bindings or method parameters instead.
---
Reason: Static properties survive across requests in the same Octane worker. Data from request #1 is visible in request #2. This is the #1 source of Octane state leaks and the hardest to debug.
---
Bad Example:
```php
class UserService {
    public static ?User $currentUser = null; // Persists across requests!
}
```

Good Example:
```php
class UserService {
    public ?User $currentUser = null; // Instance property, reset per request
}
```
---
Exceptions: Intentionally shared read-only state (configuration, feature flags) with no mutation across requests.
---
Consequences Of Violation: Cross-request data contamination, extremely difficult debugging, production data leaks.

## Set max_requests to 500-1000 for Octane workers
---
Category: Configuration
---
Configure max_requests between 500 and 1000 for Octane workers to balance memory safety with performance.
---
Reason: Workers accumulate memory fragmentation and state leaks over time. Recycling every 500-1000 requests prevents memory exhaustion while keeping the bootstrap cost amortized (0.1-0.2% overhead). Lower values negate Octane's advantage.
---
Bad Example:
```php
'max_requests' => 100 // Too low — pays bootstrap cost too frequently
```

Good Example:
```php
'max_requests' => 1000 // Optimal — safe memory with minimal overhead
```
---
Exceptions: Memory-leak-prone applications where monitoring shows >10% RSS growth per 100 requests.
---
Consequences Of Violation: Either excessive recycling negating Octane benefit, or OOM from accumulated memory.

## Use Octane::booted() for per-worker initialization, not provider boot()
---
Category: Architecture
---
Use Octane::booted() callbacks for one-time per-worker setup. Do not rely on service provider boot() for initialization that should run once.
---
Reason: In Octane, service provider boot() methods run on every request (in the sandbox clone), not once per worker. Logic that should run once (initializing services, opening connections) placed in boot() executes repeatedly and may cause duplicate registrations.
---
Bad Example:
```php
// boot() runs per-request in Octane — listener registered N times
public function boot() {
    Event::listen(OrderPlaced::class, SendNotification::class);
}
```

Good Example:
```php
// Runs once per worker
Octane::booted(function () {
    Event::listen(OrderPlaced::class, SendNotification::class);
});
```
---
Exceptions: Boot logic that IS idempotent and designed to run per-request (middleware registration, route model binding).
---
Consequences Of Violation: Duplicate event listeners, memory growth, multiplied side effects.
