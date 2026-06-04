# Standardized Knowledge: State Management and Leak Prevention

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | State Management and Leak Prevention — Static Property Avoidance, Singleton Scoping |
| Difficulty | Intermediate |
| Lifecycle | Implement, Debug, Migrate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

In Octane's persistent-worker model, **static properties and singletons survive across requests**. A static property set in request #1 persists for request #2, #3, etc. This causes state leaks — data from one request appearing in another. Prevention requires: never use static properties for request-scoped data, use `scoped()` bindings for per-request services, and implement `resetState()` / `resetOnStart` patterns for services that must be fresh per request.

## Core Concepts

- **Static property leak**: `public static $user = null;` — if Request A sets it, Request B inherits it. Debugging is extremely difficult because behavior depends on request ordering.
- **Singleton scoping**: Bindings registered as `singleton()` persist. Bindings registered as `scoped()` reset per request. Always use `scoped()` for session, auth, request, and database-bound services.
- **Octane's reset API**: `Octane::resetState()` clears scoped instances at request end. Services implementing `ResetServiceProvider` or using `$resetOnStart` property automatically reset.
- **Connection pooling**: Database/Redis connections are typically singleton (persistent). In Octane, connection pooling requires explicit configuration — persistent connections must not leak transaction state.

## When To Use

- Migrating a Laravel application from FPM to Octane
- Debugging cross-request data contamination in Octane
- Auditing codebase for Octane-unsafe static property usage
- Setting up Octane for a new Laravel application

## When NOT To Use

- For PHP-FPM applications (static properties reset per request — safe by default)
- Without running actual Octane tests (static property audit catches only static, not all leak types)
- As a one-time activity (state leaks can be introduced by any code change — make auditing part of CI)

## Best Practices

- **Static property audit**: Search codebase for `static` properties. Each must be justified as intentionally shared state or eliminated. `grep -r "static \$\|public static\b" app/` — expect zero results for request-scoped data.
- **Use scoped() for per-request services**: Auth, session, database, request — anything that varies per request must use `$this->app->scoped()`.
- **Implement resetState() for stateful singletons**: If a singleton must hold request-scoped state, implement a `resetState()` method called by Octane's on each request end.
- **Monitor RSS growth**: Track per-worker RSS. Increase >10% per hour indicates a state leak. Use `php artisan octane:watch` during development.
- **Test with ordered requests**: Send requests as User A, User B, User A. If User B's data appears in User A's second request, you have a state leak.

## Architecture Guidelines

- **Sandbox pattern**: Octane creates a sandbox by cloning the application instance per request. Request-specific services are fresh per request. Config, events, and logging singletons are shared.
- **Reset mechanism**: Octane intercepts `$app->terminate()` and replaces it with sandbox reset logic. Services with `$resetOnStart` property are automatically re-initialized.
- **Static property tracking**: Octane can detect static property modifications via a callback registered in `zend_execute_data`. Enable in development for early leak detection.

## Performance Considerations

- Octane delivers 2.5-20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains
- Each worker uses 30-80MB RSS; total memory = workers × per-worker memory
- Each worker maintains persistent DB/Redis connections; total = workers × connections-per-worker
- Under Octane, database queries become primary bottleneck (bootstrap is eliminated)
- OpCache preloading further reduces cold-start latency by 2-5ms per worker

## Security Considerations

- State leaks are a security vulnerability: user A can see user B's data, orders, or personal information
- Static caches in packages may retain sensitive data across requests
- Auth state leaking between requests bypasses authentication entirely

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using static properties for caching | Convenience | Data leaks between requests | Use scoped() or request-scoped cache |
| Not testing third-party packages | Trust | Undetected state leaks | Test every package under Octane |
| Singleton for database connection | FPM habit | Transaction state leaks | Use scoped() + connection reset |
| No state leak monitoring | No observability | Leaks detected only by user reports | Monitor RSS and run leak tests |
| Forgetting resetState() in custom services | Incomplete migration | Gradual memory growth | Implement ResetServiceProvider interface |

## Anti-Patterns

- **Guessing about state leaks**: "This property is probably safe" is the root cause of Octane production incidents. Audit everything.
- **Fixing leaks with pm.max_requests = 100**: Low max_requests masks leaks by recycling workers frequently but wastes CPU on constant restarts.
- **Blindly replacing static with singleton**: A singleton is still persistent across requests. Use scoped() for per-request data.

## Examples

```php
<?php
// BAD: Static property leaks between requests
class UserService
{
    public static ?User $currentUser = null; // LEAKS!
}

// GOOD: Scoped binding in Octane
// In service provider:
$this->app->scoped(UserService::class, function () {
    return new UserService();
});

// GOOD: Reset state in singleton
class StatefulService
{
    private array $requestData = [];
    
    public function resetState(): void
    {
        $this->requestData = [];
    }
}

// Register in provider:
$this->app->singleton(StatefulService::class);
StatefulService::setResetCallback(fn ($service) => $service->resetState());
```

## Related Topics

- Service Provider Optimization
- Connection Pooling Strategies
- Static Property Audit Methodology
- FPM to Octane Migration

## AI Agent Notes

- Static properties persist across requests in Octane — this is the #1 source of state leaks.
- Use scoped() for per-request services, singleton() only for stateless services.
- Octane's reset API clears scoped instances at request end.
- Monitor RSS growth — >10% per hour = state leak.
- Test with ordered requests (A, B, A) to detect cross-request contamination.
- Run static property audit: `grep -r "static \$" app/`.
- Third-party packages are the most common source of unexpected state leaks.

## Verification

- [ ] Static property audit completed across entire codebase
- [ ] All request-scoped services use scoped() bindings
- [ ] resetState() implemented for stateful singletons
- [ ] Octane ordered-request test passed (A, B, A — no contamination)
- [ ] RSS monitoring configured with alert for >10% per hour growth
- [ ] Third-party package compatibility tested under Octane
- [ ] Octane::watch enabled in development for leak detection
