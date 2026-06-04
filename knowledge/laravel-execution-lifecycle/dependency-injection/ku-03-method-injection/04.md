# ku-03: Method Injection

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **KU:** ku-03-method-injection
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Method injection resolves and injects dependencies at the method-call level rather than at construction time. Implemented via `Container::call()` and the `BoundMethod` class, it resolves type-hinted parameters on any callable — controller actions, event handlers, service provider `boot()` methods, and closures. This allows fine-grained dependency provision only in the methods that need them.

## Core Concepts
- **Container::call()**: The entry point — accepts any callable and resolves its type-hinted parameters.
- **BoundMethod**: Contains the core logic for resolving method parameters. Handles closures, `Class@method` strings, and array callables.
- **Call-site resolution**: Dependencies are resolved at invocation time, not at class instantiation.
- **Explicit parameter overrides**: An associative array of parameter values takes precedence over container resolution — enables mixing user-provided args with resolved deps.
- **No constructor pollution**: Only the methods that need a dependency receive it — the constructor stays lean.

## When To Use
- Controller action methods that need request-specific services or route parameters.
- Event listener `handle()` methods — the event object plus additional services.
- Service provider `boot()` methods — access framework services without constructor injection.
- Route closures — `Route::get('/', fn(UserRepository $users) => ...)` for rapid prototyping.
- Commands — `handle()` method injection for command-specific services.

## When NOT To Use
- When the same dependency is used across multiple methods — use constructor injection instead.
- In middleware `handle()` methods — the signature is fixed (`$request, $next`), use constructor injection.
- In hot paths where Reflection overhead on every call is costly — pre-resolve in constructor.
- For dependencies that must be serializable (queued jobs) — use constructor injection for serializable payload.

## Best Practices (WHY)
- **Use for action-specific dependencies**: If only one method needs a service, inject it there rather than bloating the constructor.
- **Combine with constructor injection**: Constructor for shared deps, method injection for action-specific deps.
- **Explicit parameter naming**: The `$parameters` array matches by parameter name — rename a parameter and you break the override.
- **Prefer constructor injection for middleware**: Middleware `handle()` is called on every request; Reflection cost multiplies.

## Architecture Guidelines
- Controller actions: Method injection for `Request`, route parameters, and action-specific services.
- Listeners: Method injection for the event and any additional services needed by that handler.
- Service providers: `boot(Router $router, Dispatcher $events)` — clean way to access framework services.
- Console commands: `handle()` method injection for services — the command class itself stays lean.
- Route closures: Convenient but avoid in production — explicit controller classes are more testable.

## Performance
- `Container::call()` uses Reflection on every invocation — no built-in caching of parameter metadata.
- Controller action injection adds ~10-50µs per request for Reflection.
- `BoundMethod` is not optimized for hot paths — each call creates intermediate Reflection objects.
- For high-throughput endpoints, move method-injected services to constructor injection.

## Security
- Method injection resolves type-hinted classes from the container — ensure those services have proper access controls.
- The `$parameters` override array can pass user input — validate before passing to `call()`.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Assuming all parameters are resolved | Scalar parameters not provided | Not understanding type-hint requirement | BindingResolutionException for primitive params | Provide scalar values in $parameters array |
| Parameter name collision | Renamed parameter breaks override | Not updating the call site | User-provided value not passed | Keep parameter names consistent |
| Method injection in middleware | Adding type-hints to handle() | Not knowing the signature is fixed | Type error or unexpected behavior | Use constructor injection for middleware |
| Over-reliance in queued listeners | Listener handle() uses method injection | Convenience | Dependency not available on queue worker | Ensure deps are re-resolvable on worker |
| Method injection everywhere | Same dep repeated across many methods | Avoiding constructor injection | Repetitive signatures, harder to refactor | Use constructor injection for shared deps |

## Anti-Patterns
- **Blind method injection**: Every method injects the same service — should be constructor injection.
- **Method injection in Eloquent models**: Models use method injection — they're not resolved by the container.
- **Overriding resolved params with user input**: The `$parameters` array should not override type-hinted container services with untrusted user data.

## Examples
```php
// Controller action injection
public function show(Request $request, UserRepository $users, string $id)
{
    return $users->findOrFail($id);
}

// Listener method injection
public function handle(OrderPlaced $event, Mailer $mailer)
{
    $mailer->to($event->user->email)->send(new OrderConfirmation($event->order));
}

// Service provider boot injection
public function boot(Router $router, Dispatcher $events)
{
    $router->middleware('web')->group(base_path('routes/web.php'));
}
```

## Related Topics
- Constructor Injection (ku-02) — the companion pattern for class-level injection
- Automatic Injection (ku-04) — underpins the resolution logic in BoundMethod
- DI Container Basics (ku-01) — how Container::call() works
- Interface Binding (ku-08) — how type-hinted interfaces in methods are resolved

## AI Agent Notes
- `BoundMethod::call()` is at `Illuminate\Container\BoundMethod`.
- It handles `ReflectionFunctionAbstract` (covers both `ReflectionMethod` and `ReflectionFunction`).
- The `parseCallable()` method splits `Class@method` strings — does NOT validate the class exists until call time.
- `Container::call()` is used by `ControllerDispatcher`, `Bus::dispatch()`, and `Application::boot()`.

## Verification
- [ ] Method injection is used for action-specific, not shared, dependencies
- [ ] No method injection in middleware `handle()` methods
- [ ] Queued listeners use constructor injection for serializable payload, method injection for services
- [ ] Controller actions use method injection for `Request` and route parameters
- [ ] Parameter names are stable and documented
