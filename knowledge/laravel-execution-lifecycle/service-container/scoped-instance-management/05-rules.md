# Scoped Instance Management — Rules

## Audit All singleton() Bindings Before Octane Deployment
---
## Category
Security
---
## Rule
Review every `singleton()` binding as part of the Octane deployment checklist — convert any holding mutable request state to `scoped()`.
---
## Reason
`singleton()` instances persist across all requests in an Octane worker. A singleton holding per-request data (auth user, tenant context, locale) silently leaks that data to subsequent requests on the same worker. This is the #1 source of production bugs in Octane deployments.
---
## Bad Example
```php
$this->app->singleton(CurrentUser::class, function ($app) {
    return new CurrentUser($app->make(Auth::class)->user());
});
// Under Octane: User A's identity returned for User B's request
```
---
## Good Example
```php
$this->app->scoped(CurrentUser::class, function ($app) {
    return new CurrentUser($app->make(Auth::class)->user());
});
// Fresh per request — automatically flushed at scope boundary
```
---
## Exceptions
FPM-only deployments (though `scoped()` is still recommended for future Octane migration).
---
## Consequences Of Violation
Security: cross-user data leakage (GDPR/PII exposure). Financial: potential regulatory penalties. Reputation: users see other users' private data.

---

## Never Cache Scoped Instances in Singletons
---
## Category
Reliability
---
## Rule
Do not store a reference to a scoped instance in a singleton's property or collection.
---
## Reason
A singleton persists for the process lifetime. If it holds a reference to a scoped instance, that reference becomes stale after `flushScoped()` clears the scoped cache — the singleton continues to hold the old object while the container provides fresh instances to new consumers.
---
## Bad Example
```php
$this->app->singleton(TenantAwareService::class, function ($app) {
    return new TenantAwareService(
        $app->make(TenantContext::class) // Scoped — resolved once, held forever
    );
});
// After flushScoped: $service->context holds stale TenantContext
```
---
## Good Example
```php
$this->app->singleton(TenantAwareService::class, function ($app) {
    return new TenantAwareService(
        $app->make(TenantContextFactory::class) // Factory instead of direct dependency
    );
});

class TenantAwareService {
    public function __construct(
        protected TenantContextFactory $contextFactory
    ) {}

    public function getContext(): TenantContext {
        return $this->contextFactory->make(); // Fresh scoped instance per call
    }
}
```
---
## Exceptions
Immutable value objects that capture scoped state at construction and never change (e.g., a snapshot of the current user at request start).
---
## Consequences Of Violation
Reliability: stale scoped state silently served. Debugging: hard-to-reproduce bugs where different code paths see different versions of scoped data.

---

## Ensure flushScoped() Is Called at Scope Boundaries in Queue Workers
---
## Category
Reliability
---
## Rule
Call `$app->flushScoped()` at the start or end of each job in queue workers to prevent state leakage between jobs.
---
## Reason
Unlike Octane, which automatically calls `flushScoped()` after each request, queue workers (Horizon, queue:work) do not automatically flush scoped instances between jobs. Without explicit flushing, a job's scoped state leaks into the next job processed by the same worker.
---
## Bad Example
```php
// Queue worker — no scope flush between jobs
class ProcessReportJob implements ShouldQueue {
    public function handle(): void {
        $tenant = app(TenantContext::class); // Scoped
        // ... job logic ...
    }
}
// Job 1 sets tenant to "Acme"; Job 2 gets "Acme" instead of its own tenant
```
---
## Good Example
```php
// Base job or middleware:
class FlushScopedInstances {
    public function handle(object $job, Closure $next): void {
        $next($job);
        app()->flushScoped();
    }
}

// Or at job start:
class ProcessReportJob implements ShouldQueue {
    public function handle(): void {
        app()->flushScoped(); // Clear any residual state
        $tenant = app(TenantContext::class); // Fresh scoped instance
    }
}
```
---
## Exceptions
Jobs that explicitly need to maintain state across job boundaries (documented and intentional).
---
## Consequences Of Violation
Security: cross-job data leakage in queue workers. Reliability: non-deterministic job behavior based on which job ran previously on the same worker.

---

## Use Selective Flush for Mid-Request Scope Changes
---
## Category
Performance
---
## Rule
Use `$app->flushScoped([...abstracts])` with specific abstract names when changing scope mid-request rather than flushing all scoped instances.
---
## Reason
`flushScoped()` with no arguments clears all scoped instances — O(N) where N is the number of scoped bindings. Selective flush clears only the specified abstracts, preserving other scoped services (e.g., request cache) and avoiding unnecessary re-resolution.
---
## Bad Example
```php
// Mid-request tenant switch — flushes ALL scoped instances
public function switchTenant(string $tenantId): void {
    app()->flushScoped(); // Also clears RequestCache, LocaleContext, etc.
    app()->scoped(TenantContext::class, fn() => new TenantContext($tenantId));
}
```
---
## Good Example
```php
// Selective flush — clears only tenant-related scoped instances
public function switchTenant(string $tenantId): void {
    app()->flushScoped([
        TenantContext::class,
        TenantDatabaseConfig::class,
    ]);
    // RequestCache, LocaleContext remain intact

    app()->scoped(TenantContext::class, fn() => new TenantContext($tenantId));
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Performance: unnecessary re-resolution of all scoped services. Reliability: inadvertent clearing of scoped instances that should persist mid-request.

---

## Do Not Use scoped() for Truly Stateless Services
---
## Category
Performance
---
## Rule
Use `singleton()` for stateless, immutable services — reserve `scoped()` for services that hold per-request mutable state.
---
## Reason
`scoped()` services must be re-resolved on every request (even if from cache) and contribute to the O(N) flush cost. Stateless services (routers, loggers, config readers) have no request-specific data and benefit from true process-lifetime caching via `singleton()`.
---
## Bad Example
```php
// Stateless service mis-classified as scoped
$this->app->scoped(UrlGenerator::class, function ($app) {
    return new UrlGenerator($app->make(Router::class));
});
// Re-resolved per request — unnecessary overhead for a stateless service
```
---
## Good Example
```php
$this->app->singleton(UrlGenerator::class, function ($app) {
    return new UrlGenerator($app->make(Router::class));
});
// Resolved once per worker — same instance serves all requests
```
---
## Exceptions
Services that depend on another scoped service and must be re-resolved per scope to receive the fresh dependency.
---
## Consequences Of Violation
Performance: unnecessary per-request resolution overhead and flush cost for services that could be permanently cached.

---

## Verify scoped() Behavior Is Different from singleton() in Your Environment
---
## Category
Testing
---
## Rule
Write an environment-specific test that verifies scoped instances are flushed at scope boundaries and singletons are not.
---
## Reason
`scoped()` and `singleton()` behave identically in FPM (single-request processes) — the difference only manifests in long-running processes (Octane, queue workers). Without a test that verifies the flush behavior, the distinction is invisible until the application is deployed under Octane.
---
## Bad Example
```php
// FPM-only testing — scoped/singleton difference never validated
// Both behave identically, masking latent bugs
```
---
## Good Example
```php
class ScopedInstanceTest extends TestCase {
    public function test_scoped_flush_behavior(): void {
        $this->app->scoped(TestScopedService::class);
        $this->app->singleton(TestSingletonService::class);

        $first = $this->app->make(TestScopedService::class);
        $this->app->flushScoped();
        $second = $this->app->make(TestScopedService::class);

        $this->assertNotSame($first, $second,
            'Scoped instances must be different after flush'
        );

        $firstS = $this->app->make(TestSingletonService::class);
        $this->app->flushScoped();
        $secondS = $this->app->make(TestSingletonService::class);

        $this->assertSame($firstS, $secondS,
            'Singleton instances must be same after flush'
        );
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: scoped/singleton confusion undetected until Octane deployment reveals data leaks.
