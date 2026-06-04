# Binding Extending

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **Knowledge Unit:** Binding Extending
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Binding extending is Laravel's implementation of the Decorator pattern within the service container, enabled through the `Container::extend()` method. After a binding is registered, `extend()` wraps the resolved instance with additional behavior by passing it through an extender closure before returning it to the caller. This enables modification of service behavior without altering the original binding registration — a form of open-ended interception that aligns with the Open/Closed Principle.

The critical engineering decision in extending is that extenders are stored as a stack of closures and applied in order after the concrete instance is built but before resolution callbacks fire. This ordering means extenders modify the service *before* it is cached as a singleton and *before* `resolving()` callbacks see it. The consequence is that extenders have full authority to replace or wrap the instance before any consumer receives it, making `extend()` the most powerful interception point in the container — and also the most dangerous, as an extender that returns the wrong type can corrupt every consumer of that binding.

For production applications, binding extending is the mechanism behind cross-cutting concerns at the container level: adding logging to all cache stores, wrapping API clients with retry logic, or injecting monitoring tags into database connections. The pattern is used extensively by packages to modify framework behavior without requiring changes to the framework source.

---

## Core Concepts

### Extender Registration
Extenders are registered with `extend()` and receive the resolved instance plus the container:

```php
$this->app->extend(CacheManager::class, function ($cache, $app) {
    $cache->addDriver('custom', new CustomDriver);
    return $cache;
});
```

### Extender Stack
Multiple extenders can be registered for the same abstract. They execute in registration order:

```php
$this->app->extend(Mailer::class, function ($mailer) {
    return tap($mailer)->addTransport('log', new LogTransport);
});

$this->app->extend(Mailer::class, function ($mailer) {
    return new LoggingMailer($mailer); // Decorator wrap
});
```

### Instance Replacement
An extender can replace the instance entirely:

```php
$this->app->extend(PaymentGateway::class, function ($gateway, $app) {
    return new RetryGatewayDecorator($gateway, 3);
});
```

### Extending Unbound Abstracts
`extend()` throws an exception if the abstract has no existing binding. An extender cannot create a binding — it can only modify an existing one:

```php
// Throws: BindingResolutionException — cannot extend non-existent binding
$this->app->extend('nonexistent', fn() => ...);
```

---

## Mental Models

### The Gift Wrapping Station
An assembly line where each package (resolved instance) passes through wrapping stations (extenders). Station 1 adds gift wrap, Station 2 adds a bow, Station 3 attaches a card. Each station modifies the package and sends it to the next station. The final result incorporates all decorations, but the original package is still inside.

### The Pipeline Filter
Like Unix pipeline filters — each filter transforms the data stream and passes it forward. `cat file | grep pattern | sort | uniq` — each command is an extender transforming the output. The original file content is still there, but wrapped by successive transformations.

### The Software Update Queue
An app store where each update (extender) modifies an installed app. Update 1 adds security patches, Update 2 adds new features, Update 3 changes the UI. The app after all updates is the same core app, but enhanced by each update in sequence.

---

## Internal Mechanics

### Storage Structure
Extenders are stored in a `$extenders` array keyed by abstract name:

```php
$this->extenders = [
    'Illuminate\Contracts\Mail\Mailer' => [
        0 => function ($mailer, $app) { ... },
        1 => function ($mailer, $app) { ... },
    ],
];
```

### extend() Method
```php
public function extend($abstract, Closure $closure)
{
    $abstract = $this->normalize($abstract);

    if (! isset($this->bindings[$abstract])) {
        throw new BindingResolutionException(
            "Cannot extend [{$abstract}] — it has no binding."
        );
    }

    $this->extenders[$abstract][] = $closure;

    // If already resolved, re-resolve with new extender
    if ($this->resolved($abstract)) {
        $this->rebound($abstract);
    }
}
```

### Application of Extenders During Resolution
Within `resolve()`, after the concrete instance is built but before caching:

```php
protected function resolve($abstract, $parameters = [], $raiseEvents = true)
{
    // ... alias resolution, instances check, contextual check ...
    // Build the concrete instance
    $object = $concrete instanceof Closure
        ? $concrete($this, $parameters)
        : $this->build($concrete, $parameters);

    // Apply extenders in order
    if (isset($this->extenders[$abstract])) {
        foreach ($this->extenders[$abstract] as $extender) {
            $object = $extender($object, $this);
        }
    }

    // Cache if shared
    if ($this->isShared($abstract)) {
        $this->instances[$abstract] = $object;
    }

    // Fire resolution callbacks
    if ($raiseEvents) {
        $this->fireResolutionCallbacks($abstract, $object);
    }

    return $object;
}
```

### extender() on Already-Resolved Bindings
If `extend()` is called after the binding was already resolved, the container re-resolves the binding by triggering the rebound mechanism:

```php
// extend() calls rebound() which calls resolve() again
// The new resolution picks up the extender
// The cached singleton is replaced with the extended version
```

---

## Patterns

### Logging Decorator
```php
$this->app->extend(OrderProcessor::class, function ($processor, $app) {
    return new LoggingOrderProcessor(
        $processor,
        $app->make(LoggerInterface::class)
    );
});
```

### Cache-Aside Wrapping
```php
$this->app->extend(ExpensiveCalculator::class, function ($calculator, $app) {
    return new CachedCalculator(
        $calculator,
        $app->make(Cache::class),
        ttl: 3600
    );
});
```

### Monitoring/Tracing Injection
```php
$this->app->extend(HttpClient::class, function ($client, $app) {
    return $client->withMiddleware(
        new TraceMiddleware($app->make(Tracer::class))
    );
});
```

### Environment-Specific Extending
```php
if (config('app.debug')) {
    $this->app->extend(DatabaseManager::class, function ($db) {
        return $db->enableQueryLog();
    });
}
```

---

## Architectural Decisions

### Why extenders are applied after build but before caching
Applying extenders before caching ensures that the cached singleton is the fully-extended instance, not the raw instance. If extenders were applied after resolution (on each `make()` call), decorator wrapping would create nested wrapper layers on every resolution — a memory leak. By applying before caching, the decorator is applied once and the extended instance is cached, preventing wrapper stacking.

### Why extenders are stored as array stack instead of a single closure
The array stack design allows multiple independent packages to extend the same binding without conflicts. Package A adds logging, Package B adds caching — both extend the same `CacheManager` through separate extender registrations. A single closure would require merge logic in a shared location. The stack also enables deterministic ordering: later extenders wrap earlier ones.

### Why extend() requires an existing binding
Extenders modify resolved instances — they cannot create instances from nothing. Requiring a pre-existing binding enforces that extenders are decoration, not primary registration. This prevents confusion between `bind()` (create) and `extend()` (decorate). The tradeoff is that extenders must be registered in the correct order — after the binding they extend.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Enables cross-cutting decoration without modifying registration | Extenders run on every re-resolution | Repeated extend() on already-resolved singletons triggers re-resolution |
| Multiple extenders can stack independently | Extender ordering is registration-order, not priority-based | Late-registering packages wrap earlier ones — unintended nesting order |
| Works with any binding type (bind, singleton, scoped) | Cannot extend unbound (auto-resolved) classes | Must register a binding before extending, even for concrete classes |
| Extenders have access to the container | Extenders can introduce hidden dependencies | An extender using `$app->make()` inside the closure isn't visible in the class constructor |

---

## Performance Considerations

Extender closures are stored but not executed until resolution. The overhead of an extender is the cost of the closure execution plus the decorated method calls. For a Logger decorator that adds microseconds per method call, the aggregate cost depends on call frequency.

Each extender registration adds an array entry (~48 bytes) and a closure object (~80 bytes). With 50 extenders, the total memory is ~6.4KB — negligible. However, the closure captures variables, so extenders that capture large arrays or objects increase memory per registration.

The extender application loop during resolution is O(N) where N is the number of extenders for that abstract. In practice, N is rarely above 5 (framework level), but a binding with 20+ extenders would add measurable resolution overhead (~2-10μs).

---

## Production Considerations

- **Prefer extenders over binding replacement.** Instead of re-binding an existing abstract to add behavior, use `extend()`. This preserves the original binding and allows other packages to also extend it.
- **Register extenders in the correct order.** Later extenders wrap earlier ones. If Package B's extender should run inside Package A's extender, register A first, then B.
- **Avoid stateful extenders.** An extender closure that captures mutable state (e.g., a request-scoped object) can behave differently on each resolution, leading to non-deterministic decoration.
- **Log extender registration.** In complex applications, log which packages extend which abstracts. This helps debug decoration ordering issues.

---

## Common Mistakes

**Why it happens:** Calling `extend()` before the binding is registered. **Why it's harmful:** `extend()` throws `BindingResolutionException` because no binding exists to extend. **Better approach:** Ensure extenders are registered in service providers that run after the binding's provider. Use deferred provider ordering or `boot()` phase attachment.

**Why it happens:** Assuming extenders only run once for singletons. **Why it's harmful:** If an extender calls `make(SameAbstract::class)`, the container may attempt re-resolution while extending, creating infinite recursion or double-extending. **Better approach:** Avoid calling `make()` on the abstract being extended within the extender closure.

**Why it happens:** Returning the wrong type from an extender. **Why it's harmful:** The extender replaces the instance; returning a different type breaks type-hints on all consumers. **Better approach:** Always return the same type or a subtype of the original. Use PHPStan/Psalm annotations to enforce extender return types.

**Why it happens:** Using `extend()` to modify an instance method's behavior instead of decorating. **Why it's harmful:** Modifying the instance in-place (e.g., adding properties) instead of wrapping it makes the extended behavior non-composable with other extenders. **Better approach:** Always wrap the instance in a decorator class that implements the same interface.

---

## Failure Modes

### Extender Not Applied
The binding resolves without the extender's modifications. **Common causes:** Extender registered after the binding was already resolved (singleton cached before extender). **Detection:** Missing expected behavior on the resolved service. **Mitigation:** Extend in `boot()` if the binding is registered in `register()`; or call `$app->forgetInstance($abstract)` before extending to force re-resolution.

### Extender Stack Overflow
Multiple extenders wrapping each other create deeply nested decorator chains. **Common causes:** Each extender adds a new wrapper layer, and 10+ extenders create a call stack depth of 10+ method indirections. **Detection:** Stack traces become deep; memory usage per decorated instance grows. **Mitigation:** Keep extender count low; use middleware-style pipelines for cross-cutting concerns instead of decorator chain.

### Extender Re-Resolution Loop
An extender calls `make()` on the abstract being extended, triggering re-resolution. **Common causes:** The extender tries to resolve a fresh instance to compare against or modify. **Detection:** Maximum call stack depth exceeded or duplicate decoration. **Mitigation:** The extender receives the instance as a parameter — use it directly instead of calling `make()`.

---

## Ecosystem Usage

**Laravel Framework Core:** The `CacheServiceProvider` uses `extend()` to allow packages to add custom cache drivers. A package calls `$this->app->extend('cache', function ($manager) { return $manager->addDriver('riak', new RiakDriver); })` to register a new cache store without modifying the provider.

**Laravel Telescope:** Uses `extend()` to wrap the Laravel HTTP client for request/response recording. The Telescope service provider extends `HttpClient::class` with a decorator that records outgoing HTTP calls to the Telescope database.

**Spatie Laravel Ray:** Uses `extend()` on the `Logger` interface to inject Ray debugging calls into the logging pipeline. The extender wraps the log methods to send entries to the Ray debugger while preserving normal log output.

**Laravel Debugbar:** Extends the `View\Factory` binding to intercept view rendering. Its extender wraps the `make()` and `render()` methods, collecting view timing data for the debugbar display.

---

## Related Knowledge Units

### Prerequisites
- Container Fundamentals
- Binding Types

### Related Topics
- Resolution Callbacks
- Binding Resolution

### Advanced Follow-up Topics
- Contextual Binding
- Tagged Bindings

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container::extend()` (lines 400-440): Extender registration — validates binding exists, appends to `$extenders` array, triggers rebound if already resolved.
- `Illuminate\Container\Container::getExtenders()` (lines 450-470): Returns extenders array for a given abstract.
- `Illuminate\Container\Container::resolve()` (lines 600-700): Extender application loop within resolution.
- `Illuminate\Container\Container::rebound()` (lines 720-740): Re-resolution trigger when extend() is called on already-resolved binding.

### Key Insight
The extender application order (before caching, before resolution callbacks) is the single most important design aspect. If extenders applied after caching, the cached instance would be undecorated and each consumer would need to re-apply extenders. The current design ensures the final cached singleton is the fully-decorated instance, making extenders transparent to consumers.

### Version-Specific Notes
- **Laravel 10.x:** `extend()` accepted Closure only. Extenders applied during `resolve()` before caching.
- **Laravel 11.x:** No significant changes to extending.
- **Laravel 12.x:** `extend()` updated to work with `Definition` value objects. Extenders stored as array of closures on the Definition.
- **Laravel 13.x:** `extend()` can accept a class name (invokable) instead of a closure. Extenders can be tagged for selective application.
