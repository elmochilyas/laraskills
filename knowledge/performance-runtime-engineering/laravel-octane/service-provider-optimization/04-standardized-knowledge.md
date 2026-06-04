# Standardized Knowledge: Service Provider Optimization

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Service Provider Optimization for Persistence — Singleton Scoping, Deferred Providers |
| Difficulty | Intermediate |
| Lifecycle | Configure, Migrate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

In Octane's memory-resident model, service provider `register()` and `boot()` methods run **once per worker start**, not per request. This means: 1) Singletons persist across requests (can be used for connection pooling), 2) Any provider registering stateful bindings must use the `$app->scoped()` or `$app->singleton()` pattern correctly, 3) Providers with side effects in `boot()` (event listeners, middleware registration) must not accumulate registrations over time.

## Core Concepts

- **Singleton persistence**: `$this->app->singleton(Service::class)` creates one instance shared across all requests within a worker. Ideal for services with no request-scoped state (logging, configuration, caching).
- **Scoped bindings**: `$this->app->scoped(Service::class)` creates one instance per request. Resets at each request boundary. Use for services that depend on request context (auth, session).
- **Deferred providers**: Providers that only register service container bindings can be deferred (not loaded until the bound service is requested). `$this->app->registerDeferredProvider(HeavyProvider::class)`.
- **Provider boot() optimization**: Move heavy operations from `boot()` to lazy initialization. Use memoization: `$this->app->singleton(Service::class, fn() => $this->initializeExpensiveService())`.

## When To Use

- Migrating a Laravel application from FPM to Octane
- Auditing service providers for Octane compatibility
- Optimizing worker memory usage by deferring non-essential providers
- Debugging memory leaks from provider-registered listeners

## When NOT To Use

- For PHP-FPM applications (providers run per-request anyway — less critical)
- Without understanding the difference between singleton and scoped bindings
- As a substitute for proper static property audit in application code

## Best Practices

- **State audit**: Review every service provider. If `register()` or `boot()` does a database query, API call, or file read, ensure it's cached or deferred. These run on every worker start, not per request.
- **Use scoped() for request-dependent services**: Auth, session, database connections — anything that varies per request must be scoped().
- **Defer heavy providers**: Providers that only register container bindings should be deferred. They're loaded only when the bound service is first requested.
- **Avoid side effects in boot()**: Event listeners registered in boot() persist across all requests. Don't capture request-scoped state in closures registered during boot().

## Architecture Guidelines

- **singleton vs scoped**: singleton() = one instance for all requests in a worker. scoped() = one instance per request, reset at request boundary. Choose based on whether the service holds request-scoped state.
- **Deferred provider pattern**: Move `register()` calls for expensive but rarely-used services to deferred providers. Saves worker startup time and memory.
- **Provider boot memoization**: Instead of initializing expensive services in boot(), register a singleton closure that lazy-initializes on first access: `$this->app->singleton(Service::class, fn() => new Service(...))`.

## Performance Considerations

- Octane delivers 2.5-20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains
- Each worker uses 30-80MB RSS; total memory = workers × per-worker memory
- Each worker maintains persistent DB/Redis connections; total = workers × connections-per-worker
- Under Octane, database queries become primary bottleneck (bootstrap is eliminated)
- OpCache preloading further reduces cold-start latency by 2-5ms per worker

## Security Considerations

- Singletons that cache user data can leak data between requests — always use scoped() for user-dependent services
- Provider boot() running once per worker start means configuration errors affect all subsequent requests

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Registering event listeners per-request in a provider | Copying FPM pattern | Listener registrations accumulate | Register at boot time only |
| Using singleton() for all bindings | Convenience | State leaks between requests | Use scoped() for request-dependent |
| Not deferring heavy providers | No optimization | Slow worker start, high memory | Defer providers that aren't always used |
| Heavy work in boot() without caching | Unawareness | Runs on every worker start | Memoize or defer expensive operations |

## Anti-Patterns

- **Registering the same listener multiple times in boot()**: Provider boot() runs once, but nested boot() calls (from other providers) may duplicate registrations. Use event listener deduplication.
- **Using singleton() for database connections**: Database connections are inherently request-scoped (transaction state). Use scoped() or ensure connection reset per request.
- **Loading all deferred providers eagerly**: The point of deferred providers is lazy loading. Don't trigger them in another provider's boot().

## Examples

```php
<?php
class OctaneSafeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Deferred: only loaded when UserService is requested
        $this->app->registerDeferredProvider(UserServiceProvider::class);
        
        // Singleton: one instance per worker (stateless)
        $this->app->singleton(LoggerService::class, function () {
            return new LoggerService();
        });
        
        // Scoped: one instance per request (stateful)
        $this->app->scoped(AuthService::class, function () {
            return new AuthService();
        });
    }
    
    public function boot(): void
    {
        // Safe: event listener registered once per worker
        Event::listen(UserRegistered::class, function ($event) {
            // Don't capture request-scoped variables here
            Log::info('User registered: ' . $event->user->id);
        });
    }
}
```

## Related Topics

- State Management and Leak Prevention
- Deferred Providers and Pre-Resolved Bindings
- Octane Service Container Lifecycle
- FPM to Octane Migration

## AI Agent Notes

- In Octane, provider register() and boot() run once per worker start, not per request.
- singleton(): one instance per worker (shared across requests). For stateless services.
- scoped(): one instance per request (reset at boundary). For stateful services.
- Deferred providers: not loaded until the bound service is requested.
- Avoid capturing request-scoped variables in closures registered during boot().
- Audit every provider: heavy work in boot() runs on every worker start.

## Verification

- [ ] All service providers audited for Octane compatibility
- [ ] singleton() vs scoped() used correctly for each binding
- [ ] Heavy providers deferred where appropriate
- [ ] No request-scoped state captured in boot()-registered closures
- [ ] Event listener deduplication confirmed (no duplicate registrations)
- [ ] Database connections use scoped() or implement per-request reset
- [ ] Provider boot() memoizes or defers expensive operations
