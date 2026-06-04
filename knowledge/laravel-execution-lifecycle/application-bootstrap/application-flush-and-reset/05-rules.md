# Application Flush and Reset — Rules

## Rule Name
Always use `reset()` not `flush()` for request-boundary cleanup in long-running processes.
---
## Category
Reliability
---
## Rule
Prefer `$app->reset()` over `$app->flush()` when resetting container state between requests in Octane, RoadRunner, or FrankenPHP.
---
## Reason
`reset()` calls `flush()` and then re-registers base bindings, core aliases, clears the `hasBeenBootstrapped` guard, and resets the provider registry. `flush()` alone leaves the container without aliases and with the bootstrapped guard set to `true`, preventing re-bootstrap and breaking all facade resolution.
---
## Bad Example
```php
// Between Octane requests:
$app->flush();
// Aliases are cleared — facades now throw BindingResolutionException
// hasBeenBootstrapped is still true — cannot re-bootstrap
```
---
## Good Example
```php
// Between Octane requests:
$app->reset();
// Aliases re-registered, hasBeenBootstrapped = false, loadedProviders = []
```
---
## Exceptions
Use `flush()` alone only when you need fine-grained control and will manually re-register the necessary bindings and aliases (e.g., running a single Artisan command inside an Octane worker).
---
## Consequences Of Violation
All facade calls fail after `flush()` with `BindingResolutionException`. The application cannot process subsequent requests without a full worker restart.

---

## Rule Name
Never call `flush()` or `reset()` during a request lifecycle.
---
## Category
Reliability
---
## Rule
Do not invoke `flush()` or `reset()` from middleware, controllers, service providers, or any code that executes during request handling.
---
## Reason
These methods destroy container state mid-request. All bindings, resolved instances, and service providers are cleared, causing immediate and catastrophic failure for any subsequent code that resolves from the container.
---
## Bad Example
```php
class ResetMiddleware
{
    public function handle($request, Closure $next)
    {
        app()->flush(); // Destroys ALL container state mid-pipeline
        return $next($request); // Next middleware will fail
    }
}
```
---
## Good Example
```php
// Use Octane lifecycle hooks instead:
class ResetListener
{
    public function handle(RequestTerminated $event)
    {
        // Octane calls reset() automatically after sending the response
    }
}
```
---
## Exceptions
No common exceptions. `flush()` and `reset()` are exclusively for inter-request boundaries in long-running processes.
---
## Consequences Of Violation
Immediate `BindingResolutionException` for any service resolved after the call. Unpredictable state corruption: partial container state may survive, leading to data cross-contamination and silent logic errors.

---

## Rule Name
Test every custom binding for flush survival when writing Octane-compatible code.
---
## Category
Testing
---
## Rule
After registering any custom binding, verify its survival behavior by calling `$app->flush()` and asserting the binding is either cleared (for request-scoped) or preserved (for application-scoped).
---
## Reason
`flush()` clears all user-registered bindings, resolved instances, aliases, and callbacks. Only the three base bindings (`'app'`, `Container`, `Psr\Container\ContainerInterface`) survive by design. Code that assumes a binding persists through `flush()` will silently break in Octane.
---
## Bad Example
```php
// Service provider:
$this->app->singleton(CartService::class, fn () => new CartService);
// No flush-survival test written.
// In Octane, CartService is cleared between requests — surprise for developers.
```
---
## Good Example
```php
// Flush-survival test:
public function test_binding_survives_flush()
{
    $app = $this->app;
    $app->singleton(CartService::class);
    $app->flush();
    
    $this->assertFalse($app->bound(CartService::class));
    // Correct — request-scoped binding is cleared.
}
```
---
## Exceptions
Bindings registered inside a bootstrapper (e.g., `LoadConfiguration` binds `'config'`) are framework-managed and do not require user tests.
---
## Consequences Of Violation
After `flush()`, `$app->make(YourBinding)` throws `BindingResolutionException` or returns a stale instance. In Octane, this manifests as intermittent failures after the first request.

---

## Rule Name
Never rely on `flush()` to clear static properties on service providers or user classes.
---
## Category
Reliability
---
## Rule
Store request-scoped data in scoped container bindings, not in PHP static properties, when running in long-running processes.
---
## Reason
`flush()` clears container bindings, instances, and callbacks — it does not touch static properties on user classes. Static state from one request silently leaks to the next request in Octane, causing data cross-contamination and memory growth.
---
## Bad Example
```php
class UserContext
{
    public static ?User $current = null;
}

// In controller:
UserContext::$current = $request->user();
// After flush() + reset(), UserContext::$current still holds the previous request's user
```
---
## Good Example
```php
// Use scoped binding:
$app->scoped(UserContext::class, fn () => new UserContext);

// In controller:
$context = app(UserContext::class);
$context->current = $request->user();
// flush() clears scopedInstances — next request gets a fresh UserContext
```
---
## Exceptions
Compile-time constants and class-level configuration (enum cases, service mapping arrays) are safe in static properties because they do not vary per request.
---
## Consequences Of Violation
One request's authenticated user, session data, or request metadata is visible to the next request. Security-critical data leaks are the #1 Octane production incident cause.

---

## Rule Name
Use `scoped()` instead of `singleton()` for bindings that must be fresh per request.
---
## Category
Architecture
---
## Rule
Register request-scoped services with `$app->scoped()` rather than `$app->singleton()` when the binding must not persist across requests in long-running processes.
---
## Reason
`singleton()` bindings survive until `flush()` clears them, but they are re-resolved on first access after `flush()`. In Octane, the typical reset cycle clears all singletons anyway — but using `scoped()` makes the intent explicit and automatically clears on `flush()`.
---
## Bad Example
```php
// Intent: fresh per request
$app->singleton(CartService::class, fn () => new CartService);
// Works in FPM, but in Octane the lifecycle is unclear
```
---
## Good Example
```php
$app->scoped(CartService::class, fn () => new CartService);
// Auto-cleared by flush(), explicitly request-scoped
```
---
## Exceptions
Services that maintain cross-request state (e.g., connection pools, rate limiters) should use `singleton()`.
---
## Consequences Of Violation
In Octane, singletons that hold request-scoped state (DB query results, authenticated user) leak across requests. Debugging is difficult because the leak only manifests after the second request in a worker.
