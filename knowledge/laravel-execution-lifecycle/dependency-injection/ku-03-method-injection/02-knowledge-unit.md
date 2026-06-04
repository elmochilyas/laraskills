# Method Injection

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Method injection resolves and injects dependencies at the method-call level rather than at construction time. Implemented via `Container::call()` and the `BoundMethod` class, it resolves type-hinted parameters on any callable — controller actions, event handlers, service provider `boot()` methods, and closures. This allows fine-grained dependency provision only in the methods that need them, keeping constructors lean.

## Core Concepts

### Container::call()
The entry point — accepts any callable and resolves its type-hinted parameters from the container.

### BoundMethod
Contains the core logic for resolving method parameters. Handles closures, `Class@method` strings, and array callables.

### Call-Site Resolution
Dependencies are resolved at invocation time, not at class instantiation.

### Explicit Parameter Overrides
An associative array of parameter values takes precedence over container resolution — enables mixing user-provided args with resolved deps.

### No Constructor Pollution
Only the methods that need a dependency receive it — the constructor stays lean with only shared dependencies.

## Mental Models

### The Tool Belt
Constructor injection is like a tool belt you wear at all times — all tools are always available. Method injection is like grabbing a specific tool from the workshop when you need it. If you only need a screwdriver once, don't wear it on your belt all day.

### The Guest Speaker
A conference has a keynote speaker (constructor — provides the main content). But during Q&A, a domain expert in the audience (method injection) is called upon to answer specific questions. The expert isn't on stage the whole time — just when needed.

### The Specialized Consultant
Your company has a general counsel (constructor — always available). But for a specific tax issue, you call a tax specialist (method injection). The specialist is brought in only for that one issue and then leaves.

## Internal Mechanics

### Container::call() Flow
```php
// Container::call()
// 1. Accept callable: [$object, 'method'], 'Class@method', Closure
// 2. If 'Class@method': resolve class from container → make(Class)
// 3. Get method parameters via Reflection
// 4. Resolve type-hinted parameters from container
// 5. Override with explicitly provided $parameters
// 6. Invoke callable with resolved parameters

public function call($callable, array $parameters = [], $defaultMethod = null)
{
    // BoundMethod::call() handles the reflection resolution
    return BoundMethod::call($this, $callable, $parameters, $defaultMethod);
}
```

### BoundMethod Resolution
```php
// BoundMethod::call() — handles Closures, methods, and strings
protected static function callBoundMethod($container, $callback, array $parameters)
{
    if (is_string($callback) && str_contains($callback, '@')) {
        // 'UserController@show' — split at @
        [$class, $method] = explode('@', $callback);
        // Resolve class and call method with injection
        return $container->make($class)->$method(...);
    }
    
    if (is_array($callback)) {
        // [$object, 'method'] — call directly
        return $callback[0]->{$callback[1]}(...);
    }
    
    // Closure — invoke with dependency injection
    return $container->make(Closure::class)->call($callback, $parameters);
}
```

### Parameter Resolution Strategy
```php
// For each method parameter:
// 1. If key exists in $parameters array → use provided value
// 2. If type-hinted class → $container->make($class)
// 3. If default value available → use default
// 4. Otherwise → throw BindingResolutionException
```

## Patterns

### Action-Specific Injection Pattern
Inject dependencies only in the controller methods that need them. Shared dependencies go in the constructor.

### Service Provider Boot Injection Pattern
Use method injection in `boot()` to access framework services without constructor injection:
```php
public function boot(Router $router, Dispatcher $events)
{
    $router->middleware('web')->group(base_path('routes/web.php'));
}
```

### Closure Resolution Pattern
Use `Container::call()` to invoke closures with resolved dependencies — useful for tests and ad-hoc resolution.

## Architectural Decisions

### Why method injection for controller actions?
Controller actions often need only request-specific dependencies (the `Request` object) plus route parameters. Constructor injection for these would bloat every controller.

### Why not method injection everywhere?
Method injection adds Reflection overhead on every call. For methods called in hot paths (middleware `handle()`, tight loops), the overhead compounds. Constructor injection pays Reflection cost once.

### Why BoundMethod exists as a separate class?
Separation of concerns — `Container::call()` delegates to `BoundMethod::call()` for the actual reflection and resolution logic. This keeps the Container class focused on binding management.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Lean constructors — only shared deps | Reflection overhead on every method call | Hot paths should use constructor injection |
| Fine-grained dependency scope | Method signature changes break injection | Parameter name stability matters |
| Controller actions stay clean | Cannot be cached — each call re-reflects | No caching of parameter metadata |
| Service provider boot() is clean | Overuse leads to scattered dependencies | Shared deps should still be constructor-injected |

## Performance Considerations

- **Reflection overhead:** `Container::call()` uses Reflection on every invocation — no built-in caching of parameter metadata.
- **Controller action injection:** Adds ~10-50µs per request for Reflection.
- **BoundMethod intermediate objects:** Each call creates intermediate Reflection objects.
- **High-throughput optimization:** Move method-injected services to constructor injection for hot paths.

## Production Considerations

- **Use for action-specific dependencies:** If only one method needs a service, inject it there.
- **Combine with constructor injection:** Constructor for shared deps, method injection for action-specific deps.
- **Prefer constructor injection for middleware:** Middleware `handle()` is called on every request — Reflection cost multiplies.
- **Avoid in hot paths:** Tight loops with method injection should be refactored to use constructor injection.
- **Document parameter dependencies:** Method injection is less visible than constructor injection — document what each method expects.

## Common Mistakes

- **Assuming all parameters are resolved:** Scalar parameters not provided — `BindingResolutionException`.
- **Parameter name collision:** Renamed parameter breaks value override from `$parameters` array.
- **Method injection in middleware:** Adding type-hints to `handle()` — signature is fixed, use constructor injection.
- **Over-reliance in queued listeners:** Listener `handle()` uses method injection — dependencies may not be resolvable on queue worker.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Primitive not resolved | `BindingResolutionException` on method call | Scalar parameter without override | Provide in $parameters array |
| Listener dependency missing | Null or wrong service on queue | Method injection in queued listener | Use constructor for serializable deps |
| Parameter name mismatch | Provided override ignored | Parameter renamed without updating call site | Keep names stable |
| Reflection overhead at scale | High CPU on hot controllers | Over-reliance on method injection | Move to constructor injection |

## Ecosystem Usage

- **Laravel Framework:** Controller dispatch uses `Container::call()` for action methods. Service provider `boot()` uses method injection.
- **Laravel Horizon:** Queue handlers use method injection in `handle()` for non-serializable services.
- **Laravel Telescope:** Watcher registration uses method injection in service provider `boot()`.
- **Laravel Nova:** Resource actions use method injection for tools and authorization services.

## Related Knowledge Units

### Prerequisites
- [Constructor Injection (ku-02)](../ku-02-constructor-injection/02-knowledge-unit.md) — the companion pattern for class-level injection.
- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md) — how `Container::call()` works.

### Related Topics
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md) — underpins the resolution logic in BoundMethod.
- [Interface Binding (ku-08)](../ku-08-interface-binding/02-knowledge-unit.md) — how type-hinted interfaces in methods are resolved.

## Research Notes
- `BoundMethod::call()` is at `Illuminate\Container\BoundMethod`.
- It handles `ReflectionFunctionAbstract` (covers both `ReflectionMethod` and `ReflectionFunction`).
- The `parseCallable()` method splits `Class@method` strings — does NOT validate the class exists until call time.
- `Container::call()` is used by `ControllerDispatcher`, `Bus::dispatch()`, and `Application::boot()`.
