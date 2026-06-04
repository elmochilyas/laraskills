# Scoped Bindings for Octane

## Metadata
- **ID:** ku-04-octane-reset-scopes
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Overview
Scoped bindings (`$app->scoped()`) are Octane's designated mechanism for safe stateful service resolution. Unlike singletons, a scoped binding returns the **same instance within a single request** but a **fresh instance for each new request**. This provides the performance benefit of shared instances within a request (no repeated construction) while eliminating cross-request state leakage. Scoped bindings are the canonical answer to "how do I bind a service that needs per-request state?"

## Core Concepts
- **`scoped()` vs `singleton()`**: Both return the same instance on repeated `make()` calls within a single request. The difference: scoped instances are discarded when the Octane sandbox is flushed at request end. Singleton instances persist for the worker lifetime.
- **Sandbox Flush Mechanism**: On `RequestTerminated`, Octane calls `$sandbox->flush()`. This iterates all scoped bindings and calls `unset()` on their entries in the container's `$instances` array. The next `make()` creates a fresh object.
- **Scope Hierarchy**: Scoped bindings are per-sandbox. If you manually create a child container, scoped semantics do not propagate.
- **`OctaneSandbox` Contract**: Service providers implementing `OctaneSandbox` (interface with `boot()` method) are re-registered in the sandbox. This allows providers to register scoped bindings on each sandbox creation.

## When To Use
- **Auth guards**: Different authenticated users per request.
- **Session state**: Session data should be isolated per request.
- **Current team/tenant/locale**: Request-scoped context that changes per request.
- **Any service holding mutable per-request data**: If a service stores state that differs between requests, use `scoped()`.
- **Migration from singleton**: When auditing reveals a singleton that holds request-specific state.

## When NOT To Use
- **Truly stateless services**: HTTP clients, config readers, loggers — singletons are correct and faster.
- **Global infrastructure**: Database connections, event dispatchers, cache repositories — should remain singletons.
- **Value objects**: Immutable data objects with no container dependencies — create directly with `new`.
- **Per-coroutine state (Swoole)**: Scoped is per-request, not per-coroutine. Use coroutine IDs for per-coroutine state.

## Best Practices (WHY)
- **Default to scoped for any service that interacts with per-request data**: Auth, session, locale, current tenant — register as `scoped()`. *Why: Scoped provides automatic per-request isolation with zero code changes to the service itself.*
- **Prefer `scoped(Contract::class, Concrete::class)` over closures**: Class name registration defers instantiation until first use, reducing sandbox creation overhead. *Why: Closures capture scope and cannot be cached as easily by opcode optimizers.*
- **Register scoped bindings in `OctaneSandbox` providers**: The sandbox re-registers these providers per-request. *Why: Bindings registered in the master container's `register()` won't activate scoped lifecycle in the sandbox.*
- **Test scoped behavior explicitly**: Assert `app(Service::class) !== app(Service::class)` across two separate simulated requests in the same PHP process. *Why: Visual inspection cannot verify scoped isolation — explicit assertions catch regressions.*

## Architecture Guidelines
- **Scoped uses same registry as singleton**: No new data structure; leverages existing container `$instances` array.
- **Flush happens on sandbox destruction**: Scoped lifecycle matches sandbox lifecycle exactly.
- **`OctaneSandbox` is opt-in**: Avoids forcing re-registration of providers that don't need it.
- **Scoped !== per-test isolation**: PHPUnit does not use Octane's sandbox; scoped behaves like singleton in tests.

## Performance
- **Each scoped binding**: ~0.5-2ms overhead per request for instantiation + sandbox registration.
- **10 scoped bindings**: ~5-20ms added to request time.
- **Prefer class-name registration**: Closures (callbacks) are less optimizable than class strings.
- **Expensive bindings**: If a scoped binding creates 50 dependent objects, consider singleton + state-reset pattern instead.

## Security
- **Scoped binding escalation**: A scoped binding that depends on a leaking singleton still exposes the singleton's leak. Scoped masks the symptom for direct consumers but transitive dependencies remain.
- **Premature destruction**: Scoped binding's destructor runs during sandbox flush. If the app later resolves it again (in a tick), it gets a new instance with missing state.
- **Resource handle loss**: Database connection pools managed via scoped bindings lose handles on flush, causing connection storms. Prefer singleton pool + scoped connection wrapper.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using `scoped()` for truly global services | Database connections, event dispatchers | Unnecessary overhead; broken global state | Use `singleton()` for global infrastructure |
| Registering scoped in non-OctaneSandbox provider | Binding registered in master container only | Scoped lifecycle never activates | Implement `OctaneSandbox` or register per-request |
| Expecting per-coroutine isolation from scoped | Not understanding scoped = per-request | Stale data within coroutines | Use coroutine IDs for per-coroutine state |
| Manual `forgetInstance()` on singletons | Trying to simulate scoped behavior | Corrupts container instance tracking | Use `scoped()` instead |

## Anti-Patterns
- **Blind singleton-to-scoped mass conversion**: Converts connection pools and config readers to scoped — breaks application functionality and adds unnecessary overhead.
- **Scoped-as-IO-expensive-catch-all**: Registering every service as scoped because "it might have state." Increases memory churn and sandbox creation time.
- **Registering scoped in `register()` without sandbox awareness**: The binding is set but never flushed — effectively a singleton with extra steps.
- **Using scoped for per-coroutine state**: Scoped shares instances across coroutines within the same request. Use `Swoole\Coroutine::getuid()` for coroutine-specific state.

## Examples

```php
// Safe per-request state: scoped binding
$this->app->scoped(CurrentTenant::class, function ($app) {
    return new CurrentTenant();
});

// OctaneSandbox provider for per-request re-registration
class TenantServiceProvider extends ServiceProvider implements OctaneSandbox
{
    public function register(): void
    {
        // This runs once in master container
    }

    public function boot(): void
    {
        // This runs in every sandbox — register scoped bindings here
        $this->app->scoped(TenantRepository::class);
    }
}

// Scoped wrapper for legacy singleton
$this->app->scoped(RequestContext::class, function ($app) {
    return new RequestContext(
        $app->make(SingletonDbConnection::class),
        $app->make(SingletonConfigReader::class),
    );
});
```

## Related Topics
- **Singleton State Leaks**: The problem scoped bindings solve.
- **Octane Architecture Overview**: Sandbox mechanism that enables scoped.
- **Service Binding Audit**: Auditing tooling to identify scoped candidates.
- **Static Property Accumulation**: Static leaks that scoped bindings cannot fix.
- **Octane Lifecycle Hooks**: Flush lifecycle for scoped bindings.

## AI Agent Notes
- `$container->scoped()` was introduced in Laravel 8.3 (Octane release train). Prior to this, developers had to manually call `forgetInstance()` in request lifecycle hooks.
- Current implementation stores scoped bindings in a `$scopedInstances` array on the container. Flush iterates this array. Full scan is O(n) in number of scoped bindings.
- Research question: Does Redis-backed sessions need scoped bindings for the connection? Answer: No — the Redis connection is stateless (multiplexed). The session data itself is managed by the session handler, which is scoped.
- Potential optimization: Implement "lazy flush" that only clears scoped instances that were actually resolved. Current implementation clears all scoped bindings regardless of resolution state.

## Verification
- [ ] Understand the difference between `singleton()`, `scoped()`, and `bind()`
- [ ] Register a service as `scoped()` and verify per-request freshness
- [ ] Implement `OctaneSandbox` on a provider and verify re-registration in sandbox
- [ ] Test with two sequential requests: assert same instance within request, different instances across requests
- [ ] Profile sandbox creation time before and after adding scoped bindings
- [ ] Verify scoped bindings don't leak when a dependency is a mutable singleton
