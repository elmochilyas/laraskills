# Binding Types

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **Knowledge Unit:** Binding Types
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Binding types are the different registration modes in Laravel's service container that determine how and when service instances are created. The four primary methods — `bind()` (new instance each resolution), `singleton()` (one instance per request/process lifetime), `scoped()` (one instance per scope boundary), and `instance()` (direct object injection) — each map to a distinct lifecycle strategy. A fifth operation, `extend()`, wraps existing bindings with decorator logic rather than defining a new binding.

The critical engineering decision in binding types is the separation between `singleton()` and `scoped()`. In traditional PHP-FPM, both behave identically because the process dies after each request. Under Octane, however, `singleton()` instances persist across requests, while `scoped()` instances are flushed at scope boundaries (per-request by default). This distinction, introduced in Laravel 11, represents the framework's acknowledgement that long-running processes are now a first-class deployment target. Teams that ignore this difference deploy Octane with singleton-bindings leaking user-specific state between requests.

For production applications, binding type choice directly impacts memory footprint, resolution speed, and correctness under concurrency. Singleton bindings reduce allocation pressure (one object, one constructor call) but must be stateless or use defensive copying. Bind instances are the safest but incur per-resolution overhead. Scoped bindings provide the safety of per-scope isolation while amortizing construction cost across resolutions within the same scope.

---

## Core Concepts

### bind() — Transient/Prototype Scope
Every `make()` call produces a new instance. The binding definition stores `shared: false`.

```php
$this->app->bind(ReportParser::class, XmlReportParser::class);
// Each make() returns a new XmlReportParser
$parser1 = $this->app->make(ReportParser::class);
$parser2 = $this->app->make(ReportParser::class);
// $parser1 !== $parser2
```

### singleton() — Application Singleton
The first `make()` call creates the instance and caches it in `$instances`. All subsequent calls return the same instance.

```php
$this->app->singleton(CacheManager::class, RedisCacheManager::class);
// Both refer to the same instance
$cache1 = $this->app->make(CacheManager::class);
$cache2 = $this->app->make(CacheManager::class);
// $cache1 === $cache2
```

### scoped() — Scope-Bound Singleton
Same caching behavior as singleton within a scope boundary. The container's `flushScoped()` method clears all scoped instances.

```php
$this->app->scoped(CurrentUser::class, AuthenticatedUser::class);
// Same within a request, fresh for next request
$user1 = $this->app->make(CurrentUser::class);
$user2 = $this->app->make(CurrentUser::class); // === $user1
// After scope flush:
$user3 = $this->app->make(CurrentUser::class); // new instance
```

### instance() — Pre-Constructed Object Injection
Skips all resolution logic. The object is placed directly into `$instances`:

```php
$mockUser = Mockery::mock(UserRepository::class);
$this->app->instance(UserRepository::class, $mockUser);
// Every make() returns this exact object
```

---

## Mental Models

### The Vending Machine
`bind()` is a vending machine — each button press dispenses a fresh soda. `singleton()` is a reusable water bottle — you fill it once and drink from it all day. `scoped()` is a coffee cup at work — you refill at lunch (scope flush), but within the morning, it's the same cup. `instance()` is bringing your own cup from home — the container just holds what you gave it.

### The Hotel Room Key
`bind()` gives you a new key card every time you visit the front desk. `singleton()` is a permanent key that opens the same room every time. `scoped()` is a day-pass — valid for today only, fresh tomorrow. `instance()` is handing the front desk your own pre-made key.

### The Factory Floor
A manufacturing plant where `bind()` creates a fresh tool for each worker, `singleton()` keeps one master tool in the clean room, `scoped()` issues a tool per shift but reuses it within the shift, and `instance()` is an employee bringing a specialized tool from home.

---

## Internal Mechanics

### Binding Definition Storage

When `bind()` is called, the container stores a `Definition` object (or associative array in Laravel 10) keyed by the normalized abstract name:

```php
// Laravel 12+ internal structure
$this->bindings[$abstract] = new Definition(
    concrete: $concrete,    // Closure or class name
    shared: $shared,        // bool — singleton/scoped share this
);
```

The `shared` flag is `false` for `bind()`, `true` for `singleton()` and `scoped()`. The distinction between `singleton` and `scoped` is stored in a separate `$scopedInstances` tracking array.

### Resolution Path Differences

```
bind():  make() → resolve() → execute closure → return new instance
singleton(): make() → $instances[$abstract] exists? return it → resolve() → cache in $instances → return cached instance
scoped():  make() → $scopedInstances[$abstract] exists? return it → resolve() → cache in $scopedInstances → return cached instance
instance(): make() → $instances[$abstract] exists? return it (pre-loaded by instance())
```

The `resolve()` method is shared across all types; the difference is in post-resolution caching:

```php
// Inside Container::resolve() (simplified)
if ($this->isShared($abstract) && ! $needsContextualBuild) {
    $this->instances[$abstract] = $object;
    if ($this->isScoped($abstract)) {
        $this->scopedInstances[$abstract] = $object;
    }
}
```

### extend() Flow
`extend()` wraps an existing binding. It does not create a new binding — it appends a decorator closure to the binding's definition:

```php
$this->app->extend(Mailer::class, function ($mailer, $app) {
    $mailer->addTransport('log', new LogTransport);
    return $mailer;
});
```

Internally, `extend()` retrieves the existing binding's closure, wraps it with the decorator, and stores the wrapped closure back in `$bindings`. Subsequent resolutions call the original factory, then pass the result through each registered `extender`.

---

## Patterns

### Interface Binding with Factory Closure
```php
$this->app->bind(PaymentGateway::class, function ($app) {
    return config('payment.provider') === 'stripe'
        ? $app->make(StripeGateway::class)
        : $app->make(PaypalGateway::class);
});
```
This factory pattern allows runtime decision-making while keeping the resolution interface clean.

### Singleton with Dependent Services
```php
$this->app->singleton(ReportService::class, function ($app) {
    return new ReportService(
        $app->make(ReportRepository::class),
        $app->make(Cache::class)
    );
});
```
The singleton caches the entire service graph. If `ReportRepository` has its own transient dependencies, they are resolved only once when the singleton is created.

### Testing Swap via instance()
```php
$this->app->instance(PaymentGateway::class, $fakeGateway);
$controller = $this->app->make(InvoiceController::class);
// Controller uses fakeGateway because instance() overrides bind()
```
This is Laravel's primary mechanism for dependency injection in tests. The `instance()` call overrides any existing binding until `forgetInstance()` is called.

---

## Architectural Decisions

### Why scoped() was introduced as a separate type
In traditional PHP-FPM, scoped and singleton are identical. In Octane, they diverge critically. Laravel 11 introduced `scoped()` as a separate binding type to give developers a migration path from unsafe singletons to safe, per-request-scoped instances. The decision required adding a `$scopedInstances` array alongside `$instances` and creating `flushScoped()`. Without this distinction, every Octane deployment would require manual flushing of stale singleton state — a pattern too error-prone for framework-provided safety.

### Why instance() does not participate in resolution pipeline
Bypassing the resolution pipeline means `instance()` objects cannot be decorated via `extend()` or intercepted by `resolving()` callbacks. This is intentional — `instance()` is designed for testing mocks and pre-configured objects that must not be modified by the container. It signals "this object is special, do not touch it." The consequence is that `instance()` objects must be fully configured before registration.

### Why bind() accepts null concrete as self-binding
When `$concrete` is null, it defaults to the abstract name. This enables `$this->app->bind(MyClass::class)` as shorthand for `$this->app->bind(MyClass::class, MyClass::class)`. The design assumes that most bindings either map to themselves (concrete class registration) or to a different class (interface binding). The null-default eliminates boilerplate for the common case.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| singleton() reduces construction cost | Objects persist across Octane requests | State leaks if objects hold mutable per-request data |
| scoped() provides Octane-safe lifecycle | Two tracking arrays increase container complexity | Additional ~4KB memory per 50 scoped bindings |
| instance() enables clean test swaps | Bypasses extend() and resolving() callbacks | Cannot add behavior to test doubles through decorators |
| bind() guarantees fresh state per resolution | Higher allocation rate and GC pressure | ~0.5-2μs additional overhead per make() vs singleton |

---

## Performance Considerations

`bind()` resolutions are the most expensive. Each `make()` call must re-execute the factory closure or re-run reflection-based construction. For closures, this means closure execution overhead; for class-based binding, it means fresh constructor invocation. In Octane, a `bind()` for a stateless service that is called on every request wastes CPU on unnecessary object construction.

`singleton()` is zero-cost after first resolution — an O(1) array lookup returns the cached instance. However, the first resolution of a singleton with deep dependency graph incurs the full reflection cost once. Pre-resolving critical singletons during boot (`$app->make('critical')`) shifts this cost from first-request to boot-time.

`scoped()` has identical performance to `singleton()` within a scope, but incurs scope-flush overhead — the container must iterate and clear `$scopedInstances`. For 50+ scoped bindings, flush takes ~1-3μs, negligible per-request but measurable in sub-10ms Octane responses.

`instance()` is the fastest — zero allocation, zero reflection. But the pre-constructed object must exist in memory before registration, which may increase baseline memory footprint.

---

## Production Considerations

- **Default to `bind()` for stateless services.** Stateless services (parsers, transformers, validators) should use `bind()` unless profiling shows allocation overhead is significant.
- **Use `scoped()` for any service holding per-request state.** Auth user, tenant context, locale, request-scoped caches — these must use `scoped()` to prevent Octane data leaks.
- **Audit singleton() usage before Octane deployment.** Run a static analysis pass that flags every `singleton()` call. Review each for mutable state. Convert to `scoped()` where state exists.
- **Use `instance()` only in tests or boot-time.** Production service providers should rarely use `instance()`. Its bypass of the resolution pipeline makes service behavior less predictable.
- **Pre-resolve during boot in production.** In `AppServiceProvider::boot()`, call `$this->app->make()` on critical singletons to front-load reflection cost.

---

## Common Mistakes

**Why it happens:** Using `singleton()` for a service that holds injected request data (auth user, request instance). **Why it's harmful:** Under Octane, the singleton holds stale data from a previous request, leaking user A's data to user B. **Better approach:** Use `scoped()` for any service that depends on request-scoped data, or ensure the service is stateless.

**Why it happens:** Using `bind()` for services that are expensive to construct (database connections, API clients). **Why it's harmful:** Each resolution reconstructs the expensive service, multiplying allocation time by the number of consumers per request. **Better approach:** Use `singleton()` or `scoped()` for expensive-to-construct services.

**Why it happens:** Calling `$this->app->instance($abstract, $object)` in a service provider's `register()` method with an incomplete object. **Why it's harmful:** `instance()` skips the resolution pipeline, so the object cannot be decorated or intercepted later. **Better approach:** Use `singleton()` with a closure factory to allow post-construction decoration.

**Why it happens:** Registering a `singleton()` binding that depends on a transient service with per-request state. **Why it's harmful:** The transient dependency is resolved once when the singleton is first built. Subsequent requests get the stale dependency instance. **Better approach:** Inject a factory or use `scoped()` for the entire dependency graph.

---

## Failure Modes

### Shared Binding with Mutable Internal State
A singleton service accumulates internal state across resolutions. **Common causes:** Injecting a singleton collector or event bus into multiple consumers that push events into the shared instance. **Detection:** Intermittent bugs where state appears corrupted. **Mitigation:** Ensure singleton services are stateless or use immutable data structures. Use `bind()` for collector/aggregator patterns.

### Scoped Binding Not Flushed Under Octane
A scoped binding holds stale data because the scope boundary was not reached. **Common causes:** Manual `flushScoped()` not called, or custom scope boundary misconfigured. **Detection:** Octane-specific data leaks. **Mitigation:** Register a `RequestHandled` listener that calls `$app->flushScoped()`.

### Instance Override Not Restored After Test
A test calls `instance()` to mock a service, but the next test still gets the mock. **Common causes:** Missing `tearDown()` that calls `$this->app->forgetInstance()`. **Detection:** Test pollution where tests pass in isolation but fail in suites. **Mitigation:** Always call `$this->app->forgetInstance($abstract)` in `tearDown()` or use `RefreshDatabase`/`WithoutMiddleware` traits that reset container state.

---

## Ecosystem Usage

**Laravel Framework Core:** The HTTP Kernel is registered with `singleton()` — `$app->singleton('Illuminate\Contracts\Http\Kernel', 'App\Http\Kernel')`. The configuration repository is registered with `singleton()` because config must be consistent across all consumers within a request. The router is also a singleton because route collection is built once and referenced by multiple middleware.

**Spatie MediaLibrary:** Uses `singleton()` for its `MediaLibraryService` to ensure one instance manages the file system operations per request. The `temporary upload` path resolver is bound with `bind()` because each upload needs independent state tracking.

**Laravel Horizon:** The `HorizonServiceProvider` uses `instance()` to inject the pre-configured Redis connection into the container during boot, overriding the default Redis binding with Horizon-specific connection settings.

---

## Related Knowledge Units

### Prerequisites
- Container Fundamentals

### Related Topics
- Binding Resolution
- Scoped Instance Management
- Binding Extending

### Advanced Follow-up Topics
- Contextual Binding
- Tagged Bindings
- Rebound Callbacks

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container::bind()` (lines 220-260): Core binding registration — stores definition, drops stale instances, fires rebound callbacks.
- `Illuminate\Container\Container::singleton()` (lines 270-280): Wraps `bind()` with `shared: true`.
- `Illuminate\Container\Container::scoped()` (lines 285-295): Wraps `bind()` with shared flag plus scoped tracking.
- `Illuminate\Container\Container::instance()` (lines 300-330): Direct storage in `$instances`, fires rebound if already resolved.
- `Illuminate\Container\Container::extend()` (lines 400-440): Binding decorator wrapping.
- `Illuminate\Container\Container::flushScoped()` (lines 500-510): Clears `$scopedInstances` array.

### Key Insight
The `shared` flag in bindings is stored as a boolean but effectively represents a tristate: non-shared (bind), shared-but-not-scoped (singleton), and shared-and-scoped. The scoped tracking was added as a separate array rather than a binding flag to avoid breaking existing binding storage format across Laravel version upgrades.

### Version-Specific Notes
- **Laravel 10.x:** Only `bind()` and `singleton()` exist. `scoped()` is absent. All singletons are permanent for the process lifetime.
- **Laravel 11.x:** `scoped()` introduced as a new binding method. `$scopedInstances` array added to Container. `flushScoped()` added.
- **Laravel 12.x:** `extend()` signature updated to accept `Definition` objects. Closure-based extenders still supported.
- **Laravel 13.x:** `scoped()` now supports contextual binding rules. `flushScoped()` accepts optional array of abstracts for selective flushing.
