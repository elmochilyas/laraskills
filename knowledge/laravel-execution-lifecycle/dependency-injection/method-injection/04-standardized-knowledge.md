# Method Injection

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Method Injection |
| Difficulty | Intermediate |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Method injection is Laravel's mechanism for resolving and injecting dependencies into method parameters at runtime. Unlike constructor injection (which resolves at object construction), method injection resolves dependencies when a specific method is called. It is primarily used for controller actions, event handlers, queued job methods, and service provider `boot()` methods. The container's `call()` method is the engine that powers method injection, using the `BoundMethod` class to reflectively inspect method parameters and resolve them.

## Core Concepts
- **Container::call()**: The method that resolves dependencies for any callable — controllers, closures, invokable classes.
- **BoundMethod class**: `Illuminate\Container\BoundMethod` handles the Reflection-based parameter resolution for callables.
- **Controller action injection**: Controller methods receive type-hinted dependencies (Request, services) without explicit wiring.
- **Event listener injection**: Listener's `handle()` or `__invoke()` methods receive the event instance and type-hinted services.
- **Job handler injection**: Job's `handle()` method receives dependencies resolved from the container.
- **Service provider boot() injection**: Provider `boot()` methods can type-hint dependencies that are resolved automatically.
- **Mixed injection**: A method can receive both auto-resolved dependencies and runtime parameters (e.g., Route model binding).

## When To Use
- Controller actions that need services only for a single method — avoids constructor bloat.
- Event listeners that need specific services without constructor injection.
- Job handlers where dependencies are specific to the handle method.
- Service provider boot() methods that need access to specific services.

## When NOT To Use
- For most class dependencies — constructor injection is preferred for services needed across multiple methods.
- When the same dependency is needed in multiple methods — inject in constructor instead.
- For dependencies that change per-invocation context — use explicit method parameters.

## Best Practices (WHY)
- **Prefer constructor injection for shared dependencies**: If a dependency is used in multiple methods, inject it in the constructor. *Why: Constructor injection avoids repeating type-hints and makes all dependencies visible at a glance.*
- **Use method injection for controller-specific services**: Route model binding results, form requests, and action-specific services. *Why: Controller actions are the primary use case — each action may need different services.*
- **Order parameters: resolved first, runtime second**: Put container-resolved parameters before route parameters. *Why: The container resolves type-hinted parameters; route bindings are matched positionally.*
- **Be explicit about injected types**: Clear type-hints enable static analysis and document the method's dependencies. *Why: Vague `$param` without type-hint cannot be resolved by the container.*

## Architecture Guidelines
- `Container::call()` is used by the framework to invoke controller actions, event listeners, and job handlers.
- The method resolves parameters by inspecting `ReflectionFunctionAbstract::getParameters()`.
- Type-hinted classes are resolved from the container; primitives and non-class types are skipped.
- Route model bindings are resolved BEFORE method injection — they are passed positionally.
- Method injection can be combined with constructor injection — both work together.

## Performance
- Reflection-based method injection adds ~0.01-0.03ms per method call.
- The container does not cache Reflection data per-request — each `call()` invocation inspects parameters.
- Pre-resolved constructor dependencies reduce the need for method injection.
- In Octane, method injection cost is per-request but negligible (microseconds).

## Security
- Method injection resolves services from the container — ensure injected services are properly scoped (use `scoped()` for request-aware services under Octane).
- Controller action injection runs after middleware — auth and authorization have already executed.
- Avoid injecting sensitive services into public methods that could be called from untrusted contexts.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Using method injection for shared dependencies | Same dependency in 5 methods, each with type-hint | Repeated type-hints; harder to refactor | Inject once in constructor |
| Wrong parameter ordering | Route params before container-resolved params | Route binding value passed to container — resolution fails | Put container params first, route params last |
| Not type-hinting injected parameters | `function handle($event, $service)` | $service not resolved — receives null or wrong value | Always type-hint container-resolved params |
| Method injection in non-framework methods | Calling arbitrary methods with `app()->call()` | Works but unconventional — prefer constructor injection | Use `app()->call()` only for framework-supported patterns |

## Anti-Patterns
- **Constructor + method injection for same dependency**: Injecting the same service in both constructor and methods — creates confusion about which instance is used.
- **Excessive method injection**: A controller action with 6+ injected parameters — consider grouping related services into a single injected object.
- **Hidden dependencies**: Mixing resolved and non-resolved parameters without clear distinction.

## Examples
```php
// Controller action with method injection
class OrderController
{
    public function store(
        CreateOrderRequest $request,         // container-resolved
        OrderService $orderService,           // container-resolved
        OrderCreated $event                   // still gets this from somewhere
    ) {
        return $orderService->process($request->validated());
    }
}

// Event listener with method injection
class SendOrderConfirmation
{
    public function handle(OrderPlaced $event, MailService $mail)
    {
        $mail->sendOrderConfirmation($event->order);
    }
}
```

## Related Topics
- **Prerequisites:** Container::call() — the core method injection engine.
- **Closely Related:** Constructor Injection — the alternative injection path for per-class dependencies.
- **Advanced:** BoundMethod Internals — how Reflection and resolution work for method parameters.
- **Cross-Domain:** Controller Resolution, Event Listener Architecture.

## AI Agent Notes
- `Container::call()` is defined in `Illuminate\Container\Container`. It delegates to `BoundMethod::call()`.
- The resolution order for method parameters: explicit bindings → type-hinted classes → primitives → defaults.
- Route model bindings are resolved before `call()`, so they are passed as positional arguments.
- Method injection does NOT support contextual binding — use constructor injection for contextual resolution.

## Verification
- [ ] Controller action parameters are ordered: container-resolved first, route params last
- [ ] Shared dependencies are in constructors, not repeated across methods
- [ ] All injected method parameters have explicit type-hints
- [ ] Event listener methods use method injection for the event and additional services
- [ ] No method has more than 3-4 injected parameters (indicates need for refactoring)
