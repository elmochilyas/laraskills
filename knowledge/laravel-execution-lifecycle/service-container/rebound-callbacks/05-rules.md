# Rebound Callbacks — Rules

## Use rebinding() Instead of Manual forgetInstance() + rebound()
---
## Category
Framework Usage
---
## Rule
Use `$app->rebinding($abstract, $callback)` for binding change notifications — never manually call `forgetInstance()` and `rebound()`.
---
## Reason
`rebinding()` handles the immediate-callback contract correctly: if the binding is already resolved, the callback fires immediately to initialize the consumer. Manual `forgetInstance() + rebound()` sequences miss this immediate callback, leaving the consumer out of sync until the next re-registration.
---
## Bad Example
```php
// Manual — misses immediate callback
$this->app->forgetInstance(Kernel::class);
$this->app->singleton(Kernel::class, HttpKernel::class);
$this->app->rebound(Kernel::class);
// No callback fired if Kernel was already resolved
```
---
## Good Example
```php
$this->app->rebinding(Kernel::class, function ($app, $kernel) {
    $kernel->syncMiddlewareToRouter();
});
// If Kernel is already resolved, callback fires immediately
// If not, callback fires when bind()/singleton() triggers rebound
```
---
## Exceptions
Test teardown where specific cleanup is needed and `rebinding()` would over-notify.
---
## Consequences Of Violation
Reliability: missed callback execution when binding is already resolved. Consumer remains unsynchronized with the new binding.

---

## Make Rebound Callbacks Idempotent
---
## Category
Reliability
---
## Rule
Ensure that every rebound callback produces the same result whether called once or multiple times.
---
## Reason
If a binding is rebound multiple times (e.g., during test setup with multiple mock overrides), rebound callbacks fire each time without deduplication. A non-idempotent callback (one that appends configuration, increments counters, or registers duplicate listeners) accumulates side effects.
---
## Bad Example
```php
$this->app->rebinding(PaymentGateway::class, function ($app, $gateway) {
    // Non-idempotent: appends a new listener each time
    $gateway->addListener(new PaymentLogger());
});
// After 3 rebounds: 3 PaymentLogger instances registered
```
---
## Good Example
```php
$this->app->rebinding(PaymentGateway::class, function ($app, $gateway) {
    // Idempotent: replaces listener configuration
    $gateway->setListeners([new PaymentLogger()]);
});
// After 3 rebounds: 1 PaymentLogger instance (set, not appended)
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: duplicate event handlers, accumulated configuration, memory leaks from duplicate registrations.

---

## Do Not Use rebinding() for Per-Resolution Configuration
---
## Category
Framework Usage
---
## Rule
Use `resolving()` callbacks for per-resolution configuration and `rebinding()` only for reacting to binding re-registrations.
---
## Reason
`rebinding()` fires only when a binding is re-registered after it has been resolved — not on every `make()` call. Using `rebinding()` for configuration that should apply on every resolution either executes the configuration only once (if binding is never rebound) or not at all (if binding is never initially resolved).
---
## Bad Example
```php
// Wrong: fires only on re-registration, not per-resolution
$this->app->rebinding(Repository::class, function ($app, $repo) {
    $repo->setCacheTtl(config('repositories.cache_ttl'));
});
// If Repository is never rebound, TTL is never set
```
---
## Good Example
```php
// Correct: fires on every resolution
$this->app->resolving(Repository::class, function ($repo, $app) {
    $repo->setCacheTtl(config('repositories.cache_ttl'));
});
```
---
## Exceptions
When the callback explicitly needs to react to binding definition changes (e.g., replacing the connection factory when the database config is re-registered).
---
## Consequences Of Violation
Reliability: configuration callbacks never fire because bindings are rarely rebound after initial registration.

---

## Avoid Rebinding in Octane Production Code
---
## Category
Scalability
---
## Rule
Do not call `bind()` or `singleton()` on already-resolved abstracts within Octane request lifecycle — rebind during one-time boot only.
---
## Reason
In Octane's long-running workers, service providers register bindings once during the one-time boot. Rebinding mid-lifecycle triggers `rebound()` which re-resolves the entire dependency graph, introducing non-deterministic resolution overhead and potentially resetting services that hold request-scoped state.
---
## Bad Example
```php
// Octane middleware — rebinding on every request
public function handle(Request $request, Closure $next): Response {
    $this->app->singleton(CurrentTenant::class, fn() => new CurrentTenant($request));
    $this->app->rebound(CurrentTenant::class); // Triggers re-resolution every request
    return $next($request);
}
```
---
## Good Example
```php
// Use scoped binding instead — automatically flushed per request
$this->app->scoped(CurrentTenant::class, function ($app) {
    return new CurrentTenant($app->make(Request::class));
});
// No rebinding needed — scope flush handles per-request freshness
```
---
## Exceptions
Framework-level hot-reload mechanisms (e.g., `syncMiddlewareToRouter()`) that are explicitly designed for rebinding.
---
## Consequences Of Violation
Performance: full dependency graph re-resolution on every request. Reliability: non-deterministic behavior from mid-lifecycle binding changes.

---

## Verify resolved() Status When Rebounds Do Not Fire
---
## Category
Maintainability
---
## Rule
Check `$app->resolved($abstract)` when debugging a rebound callback that does not execute.
---
## Reason
Rebound callbacks fire only if the abstract has been previously resolved. If a binding is registered and then re-registered before any consumer calls `make()`, the resolved guard prevents rebound from triggering — the callback is stored but never fires because the guard considers the binding "not yet active."
---
## Bad Example
```php
// Rebound callback expected to fire on every bind()
$this->app->rebinding(CacheManager::class, fn($app, $cache) => $cache->clear());

$this->app->singleton(CacheManager::class, RedisCache::class);
// Re-register before any make() call:
$this->app->singleton(CacheManager::class, FileCache::class);
// Rebound did NOT fire — CacheManager was never resolved
```
---
## Good Example
```php
$this->app->rebinding(CacheManager::class, fn($app, $cache) => $cache->clear());

$this->app->singleton(CacheManager::class, RedisCache::class);
$this->app->make(CacheManager::class); // Resolve once — sets resolved flag

$this->app->singleton(CacheManager::class, FileCache::class);
// Rebound fires now — CacheManager is resolved
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: missing callback execution due to misunderstood resolved guard. Debugging: time wasted searching for non-existent bugs in callback registration.

---

## Prefer resolving() Over rebinding() for Application-Level Initialization
---
## Category
Code Organization
---
## Rule
Use `resolving()` callbacks for initializing services at resolution time and `rebinding()` only for framework-level reactivity to binding changes.
---
## Reason
`rebinding()` is a niche feature primarily used by Laravel's internals (middleware hot-reload, kernel synchronization). Application code rarely needs to react to binding re-registrations. `resolving()` fires on every `make()` call and is the appropriate hook for service initialization, configuration, and decoration.
---
## Bad Example
```php
// Over-engineered — rebinding for simple initialization
$this->app->rebinding(ReportBuilder::class, function ($app, $builder) {
    $builder->setLogger($app->make(Logger::class));
});
// Only runs if ReportBuilder is rebound, not on first resolution
```
---
## Good Example
```php
$this->app->resolving(ReportBuilder::class, function ($builder, $app) {
    $builder->setLogger($app->make(Logger::class));
});
// Runs on every resolution — correct for initialization
```
---
## Exceptions
Code that explicitly needs to detect when a binding definition changes (e.g., clearing a cached configuration when the config service is rebound).
---
## Consequences Of Violation
Maintainability: confusion about when callbacks execute. Reliability: initialization code that runs at unexpected times or not at all.
