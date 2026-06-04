# Skill: Optimize Service Providers for Octane Persistent Execution

## Purpose
Audit and refactor Laravel service providers for Octane's persistent execution model — correctly applying singleton vs scoped bindings, deferring heavy providers, eliminating non-idempotent boot() side effects, and avoiding request-scoped variable capture in closures.

## When To Use
- During Octane migration (Phase 2-3 of FPM-to-Octane migration)
- When adding new service providers to an Octane-deployed application
- When investigating memory leaks or state contamination in Octane workers
- When optimizing Octane worker start time (slow boot sequence)
- When auditing third-party packages for Octane compatibility

## When NOT To Use
- For PHP-FPM applications (providers run per-request — patterns differ)
- For greenfield Octane applications built from scratch with Octane in mind from day one
- When the application has no service providers (rare — most apps have multiple)

## Prerequisites
- Laravel application with `laravel/octane` installed
- Complete list of all service providers from `config/app.php` and dynamically registered providers
- Understanding of Octane's boot-once handle-many execution model
- Understanding of Laravel's service container (singleton, scoped, deferred bindings)
- Access to application source code for all providers

## Inputs
- `config/app.php` provider list
- All provider source files in `app/Providers/` and any dynamically registered providers
- List of third-party packages and their service providers
- Current worker start time (from `octane:start` log output)
- Current worker RSS at idle

## Workflow

### 1. Catalog All Service Providers
- List all providers from `config/app.php` `'providers'` array
- Identify any providers registered dynamically (in `AppServiceProvider::register()` or via `PackageServiceProvider`)
- Identify deferred providers already configured
- Classify each provider by purpose: framework, first-party package, third-party package, custom application

### 2. Audit Each Provider's register() Method
- For each provider, read the `register()` method
- Classify each binding as singleton, scoped (`$this->app->scoped()`), or instance
- Flag any singleton binding that depends on request-scoped data (auth, user, session, request)
- Flag any singleton that creates a database connection, opens a file handle, or initiates a network connection
- Flag any provider that calls `$this->app->registerDeferredProvider()` or `$this->app->register()` for another provider
- Create an audit entry for each binding: binding name, type (singleton/scoped), statefulness, action required

### 3. Correct Singleton vs Scoped Bindings
- Replace singleton bindings for request-scoped services with `$this->app->scoped()`
- Keep singleton for truly stateless services: logging, configuration, caching clients, HTTP clients (without request state)
- For services that are mostly stateless but have some request-scoped dependencies: keep as singleton but inject request data at call time (not construction time)
- Document each change with rationale

### 4. Audit Each Provider's boot() Method
- For each provider, read the `boot()` method
- Flag any non-idempotent operations: `Event::listen()`, `Route::macro()`, `Blade::directive()`, `Validator::extend()`
- Flag expensive operations: database queries, API calls, file reads/writes, cache warmup
- Flag operations that capture request-scoped variables in closures
- Flag operations that register middleware or route model bindings

### 5. Refactor boot() Side Effects
- Move non-idempotent listener registrations to `Octane::booted()` callbacks:
```php
// Before: boot() method
Event::listen(OrderPlaced::class, SendNotification::class);

// After: Octane::booted() callback
Octane::booted(function () {
    Event::listen(OrderPlaced::class, SendNotification::class);
});
```
- Replace expensive operations with lazy initialization:
```php
// Before: expensive query in boot()
config()->set('app.settings', Setting::all());

// After: lazy singleton
$this->app->singleton('app.settings', fn() => Setting::all());
```
- Remove request-scoped variable capture from closures:
```php
// Before: captures boot-time user
$user = Auth::user();
Event::listen(RequestHandled::class, function () use ($user) { ... });

// After: resolves at event time
Event::listen(RequestHandled::class, function () {
    $user = Auth::user(); // Current request's user
    ...
});
```

### 6. Apply Deferred Provider Pattern
- Identify providers whose services are used in fewer than 50% of requests
- Implement `DeferrableProvider` interface on those providers
- Define `provides()` method returning the list of service container bindings this provider registers
- Verify the deferred provider does NOT register event listeners, middleware, or route model bindings (these require immediate registration)
- Test that deferred services resolve correctly on first access

### 7. Verify Event Listener Idempotency
- List all event listeners registered in boot() methods across all providers
- Verify each listener is registered only once per worker (no duplicate registrations)
- If listeners are registered in both boot() and Octane::booted(), deduplicate to Octane::booted() only
- Check third-party package providers for duplicate listener registrations

### 8. Test Provider Changes Under Octane
- Run `php artisan octane:start` and verify workers start without errors
- Run `php artisan octane:test` — should pass with zero warnings
- Test all endpoints that depend on provider-registered services
- Measure worker start time before and after provider optimization
- Verify RSS at idle — should be lower after deferring heavy providers
- Run concurrent request tests to verify no state leaks from binding changes

## Validation Checklist
- [ ] All service providers cataloged and audited
- [ ] Singleton bindings with request-scoped state converted to scoped()
- [ ] All stateless services remain singleton (appropriate optimization)
- [ ] boot() side effects moved to Octane::booted() where non-idempotent
- [ ] Expensive boot() operations replaced with lazy initialization
- [ ] No request-scoped variables captured in boot()-registered closures
- [ ] Deferred providers applied (DeferrableProvider interface, provides() method)
- [ ] Non-deferred deferred providers that needed event listeners fixed
- [ ] No duplicate event listener registrations
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] Worker start time measured and improved from optimization
- [ ] RSS at idle lower after deferring heavy providers
- [ ] All endpoints tested and working correctly

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Data leak from singleton | User A's data visible in User B's request | Singleton binding for request-scoped service | Replace with scoped() binding |
| Duplicate event handlers | Event fires N times for one trigger | Listener registered in boot() without deduplication | Move to Octane::booted() or deduplicate |
| Slow worker start | octane:start takes >5 seconds | Heavy bootstrap operations in provider boot() | Move to lazy initialization or defer |
| Deferred provider service returns null | Service not available when needed | provides() method missing binding alias | Add all bound service names to provides() array |
| Third-party provider register twice | Package registers listeners in both service provider and package boot | Package designed for FPM lifecycle | Wrap with Octane compatibility layer or replace package |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Singleton vs scoped | Singleton for stateless services (config, logger, cache client). Scoped for any service whose state changes per request (auth, session, DB) |
| boot() vs Octane::booted() | boot() for idempotent per-request setup (middleware registration, route model binding). Octane::booted() for one-time worker initialization (event listeners, timers) |
| Defer vs not defer | Defer if services used in <50% of requests AND provider has no boot() side effects. Do not defer if provider registers listeners or middleware |
| Lazy init vs eager init | Lazy init for operations that can be deferred to first request (cache warmup, configuration loading). Eager init for operations needed before any request (route registration) |
| Fix vendor package vs replace | Fix with PR if actively maintained; replace if abandoned or fix increases complexity too much |

## Performance Considerations
- Each deferred provider skipped saves its entire boot() cost on worker start
- Lazy initialization moves cost from worker start to first request — amortized over max_requests
- Converting singleton to scoped adds per-request resolution cost (negligible, ~0.01ms)
- Worker start time reduction directly reduces deployment and recycling latency
- Heavy boot() operations (database queries, API calls) on worker start impact the first request after deployment or recycling

## Security Considerations
- Singleton misuse with request-scoped data causes data leakage between users — the most critical Octane security issue
- Captured request-scoped variables in boot() closures leak data from the boot() request to all subsequent requests
- Deferred providers that are not loaded until a service is requested may hide configuration errors until runtime
- Third-party package providers must be audited for security-Critical bindings (auth, encryption, authorization)
- Event listeners registered in providers persist for the lifetime of the worker — ensure they don't leak sensitive data

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Use scoped() for all request-dependent service bindings in Octane | `05-rules.md:1` | Step 3: singleton-to-scoped conversion |
| Never perform expensive operations in boot() without caching | `05-rules.md:32` | Step 5: lazy initialization |
| Defer expensive service providers that are not needed on every request | `05-rules.md:63` | Step 6: deferred provider pattern |
| Avoid capturing request-scoped variables in boot()-registered closures | `05-rules.md:99` | Step 5.3: remove variable capture |
| Audit all service providers before deploying Octane | `octane-architecture-execution-model/05-rules.md:1` | Steps 1-2: catalog and audit |

## Related Skills

| Skill | Relation |
|-------|----------|
| Audit and Adapt Application for Octane's Persistent Execution Model | This skill is the detailed implementation of Phase 2-3 of that migration |
| Perform FPM-to-Octane Migration | Provider optimization is a key phase of the full migration |
| Manage and Prevent Octane State Leaks | Provider binding errors are a primary source of state leaks |
| Configure Deferred Providers and Resolved Bindings | Detailed extension of Step 6 |
| Install and Configure Octane for a Laravel Project | Prerequisite — Octane must be installed for provider testing |

## Success Criteria
- All service providers use correct singleton/scoped/deferred patterns for Octane
- Zero singleton bindings hold request-scoped state
- All boot() side effects are idempotent or moved to Octane::booted()
- All expensive boot() operations use lazy initialization
- Deferred providers correctly reduce worker start time and RSS
- No duplicate event listener registrations
- `php artisan octane:test` passes with zero warnings
- Worker RSS at idle is measurably lower after optimization
