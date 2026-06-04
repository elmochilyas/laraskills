# Scoped Bindings for Octane

## Rule Name
Default to scoped for any service interacting with per-request data.
---
## Category
Architecture | Design
---
## Rule
Always bind auth guards, session managers, current-team resolvers, locale managers, and any service that stores per-request context as `scoped()` rather than `singleton()`.
---
## Reason
Scoped bindings provide automatic per-request isolation with zero code changes to the service itself. The same instance is shared within a request (singleton performance), but a fresh instance is created for each new request.
---
## Bad Example
```php
// Singleton with mutable state — leaks between requests
$this->app->singleton(CurrentTeam::class);
```
---
## Good Example
```php
// Scoped — fresh per request, shared within request
$this->app->scoped(CurrentTeam::class);
```
---
## Exceptions
Truly stateless services (config readers, HTTP clients, connection pools) are correctly singletons.
---
## Consequences Of Violation
Cross-request data leaks; per-request state from User A pollutes User B's response.

---

## Rule Name
Prefer class-name registration over closures for scoped bindings.
---
## Category
Performance
---
## Rule
Prefer `$app->scoped(Contract::class, Concrete::class)` over `$app->scoped(Contract::class, fn($app) => new Concrete(...))`.
---
## Reason
Class-name registration defers instantiation until first use and allows opcode optimizers to inline the binding. Closures capture scope, cannot be cached as easily, and prevent optimization.
---
## Bad Example
```php
$this->app->scoped(TenantRepository::class, function ($app) {
    return new TenantRepository($app->make(Connection::class));
});
```
---
## Good Example
```php
$this->app->scoped(TenantRepository::class); // Auto-resolved
// Or with explicit contract:
$this->app->scoped(TenantRepositoryInterface::class, TenantRepository::class);
```
---
## Exceptions
When the binding requires runtime configuration from environment or request data that cannot be resolved via auto-wiring.
---
## Consequences Of Violation
Slightly slower sandbox creation; missed opcode optimization; unnecessary closure allocations.

---

## Rule Name
Register scoped bindings inside `OctaneSandbox` providers.
---
## Category
Architecture
---
## Rule
Always register request-scoped bindings in service providers that implement the `OctaneSandbox` contract, not just in the master container's `register()` method.
---
## Reason
Bindings registered in the master container's `register()` run once per worker. Without sandbox-aware re-registration, scoped lifecycle never activates — the binding behaves as a singleton, leaking state.
---
## Bad Example
```php
// Registered in master container only — scoped never activates
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(CurrentTenant::class);
    }
}
```
---
## Good Example
```php
class TenantServiceProvider extends ServiceProvider implements OctaneSandbox
{
    public function register(): void
    {
        // Master container setup (runs once)
    }

    public function boot(): void
    {
        // Runs in each sandbox — scoped lifecycle activates
        $this->app->scoped(CurrentTenant::class);
    }
}
```
---
## Exceptions
When the scoped binding depends solely on the master container's state and has no per-request dependencies.
---
## Consequences Of Violation
Scoped binding is silently a singleton; cross-request leaks persist despite using `scoped()`; hours of debugging the wrong registration.

---

## Rule Name
Test scoped isolation with identity assertions.
---
## Category
Testing
---
## Rule
Always write explicit test assertions that `app(Service::class) !== app(Service::class)` across two simulated requests in the same PHP process.
---
## Reason
Visual inspection cannot verify scoped isolation. Explicit assertions catch regressions when container behavior changes or providers are refactored.
---
## Bad Example
```php
// Implicit testing — assumes scoped works
public function test_service_resolves(): void
{
    $service = app(CurrentTenant::class);
    $this->assertInstanceOf(CurrentTenant::class, $service);
}
```
---
## Good Example
```php
public function test_scoped_isolation(): void
{
    $first = app(CurrentTenant::class);
    app()->forgetScopedInstances();
    $second = app(CurrentTenant::class);

    $this->assertNotSame($first, $second); // Different across "requests"
    $this->assertSame($first, app(CurrentTenant::class)); // Same within a "request"
}
```
---
## Exceptions
No common exceptions — identity testing is always valid.
---
## Consequences Of Violation
Scoped regressions go undetected; cross-request leaks silently return after refactoring.

---

## Rule Name
Never use `scoped()` for global infrastructure services.
---
## Category
Performance | Architecture
---
## Rule
Do not convert database connections, event dispatchers, cache repositories, or similar global infrastructure services from `singleton()` to `scoped()`.
---
## Reason
Scoped bindings for infrastructure services add unnecessary overhead (instantiation + sandbox registration per request) and break shared state that these services depend on — connection pools are lost on every flush, causing connection storms.
---
## Bad Example
```php
// Unnecessary — connection pool is destroyed on every request
$this->app->scoped(DatabaseConnection::class);
```
---
## Good Example
```php
// Singleton connection pool — maintains persistent connections
$this->app->singleton(DatabaseConnection::class);
// Scoped wrapper if per-request transaction isolation is needed:
$this->app->scoped(RequestTransaction::class, function ($app) {
    return new RequestTransaction($app->make(DatabaseConnection::class));
});
```
---
## Exceptions
When the infrastructure service explicitly holds per-request state that must not leak.
---
## Consequences Of Violation
Connection storms as pools are rebuilt per request; increased latency from repeated connection negotiation; broken global state coordination.

---

## Rule Name
Use coroutine-ID maps, not scoped, for per-coroutine state in Swoole.
---
## Category
Architecture | Reliability
---
## Rule
Never use `scoped()` bindings for per-coroutine state in Swoole. Use coroutine-ID-based maps (e.g., `Swoole\Coroutine::getuid()`) for coroutine-specific data.
---
## Reason
`scoped()` is per-request (sandbox), not per-coroutine. Within a single request, multiple coroutines share the same scoped instances, causing cross-coroutine state leaks.
---
## Bad Example
```php
// Wrong — scoped is per-request, not per-coroutine
$this->app->scoped(CoroutineState::class);
// Coroutines within the same request share the same instance
```
---
## Good Example
```php
class CoroutineState
{
    private static array $state = [];

    public static function get(string $key): mixed
    {
        $cid = \Swoole\Coroutine::getuid();
        return self::$state[$cid][$key] ?? null;
    }

    public static function set(string $key, mixed $value): void
    {
        $cid = \Swoole\Coroutine::getuid();
        self::$state[$cid][$key] = $value;
    }

    public static function cleanup(): void
    {
        $cid = \Swoole\Coroutine::getuid();
        unset(self::$state[$cid]);
    }
}
```
---
## Exceptions
Non-Swoole runtimes (RoadRunner, FrankenPHP) where coroutines are not used — scoped is per-request which is sufficient.
---
## Consequences Of Violation
Coroutine A's data leaks to Coroutine B within the same request; data races and corruption.
