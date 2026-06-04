# Interface Binding Resolution

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Interface Binding Resolution |
| Difficulty | Foundation |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Interface binding resolution is the mechanism by which Laravel's service container maps a type-hinted interface to a concrete implementation at runtime. When a class constructor or method type-hints an interface, the container checks its bindings for a concrete mapping, resolves it (including any recursive dependencies), and injects the concrete instance. This is the foundation of Laravel's dependency inversion — high-level code depends on abstractions (interfaces), not concretions.

## Core Concepts
- **Interface binding**: `$app->bind(UserRepositoryInterface::class, EloquentUserRepository::class)` — tells the container which concrete to use when the interface is type-hinted.
- **Resolution chain**: `make(Interface::class)` → check `$bindings` → resolve concrete → recursive dependency resolution → instance.
- **Auto-resolution fallback**: If an interface has no binding, the container throws `TargetInterfaceNotInstantiableException`.
- **Concrete auto-resolution**: If a concrete class is type-hinted (not an interface), the container resolves it without explicit binding.
- **Contextual binding**: `$app->when(Consumer::class)->needs(Interface::class)->give(Concrete::class)` — different consumers get different implementations.
- **Binding modifiers**: `singleton()`, `scoped()`, `instance()` all work with interface bindings.

## When To Use
- Whenever a class depends on an interface — controllers, services, repositories should depend on interfaces bound to concretes.
- When you need to swap implementations without changing consumer code (e.g., different payment gateways).
- In testing — bind interfaces to mocks or fakes via `$app->instance()`.

## When NOT To Use
- For classes with a single concrete implementation and no planned alternatives — direct concrete type-hinting is simpler.
- In controllers that directly call Eloquent — use repository interfaces or service classes instead.
- When the binding adds complexity without value — not every class needs an interface.

## Best Practices (WHY)
- **Bind interfaces, not concretions**: Always register interface-to-concrete bindings in service providers. *Why: Enables swapping implementations for testing, different environments, or future changes.*
- **Register bindings in service providers**: Never call `$app->bind()` outside of a provider's `register()`. *Why: Centralized wiring makes dependencies discoverable and maintainable.*
- **Use contextual binding for consumer-specific implementations**: When different consumers need different concretes for the same interface. *Why: Avoids conditional logic in consumers or factory classes.*
- **Bind to singleton for stateless services**: `$app->singleton(Interface::class, Concrete::class)` for services with no per-request state. *Why: Saves memory and resolution time.*

## Architecture Guidelines
- The container stores interface bindings in `$bindings` array as key-value pairs (abstract → concrete).
- When resolving, the container checks `$bindings` first, then falls through to auto-resolution.
- Interface bindings support all binding types: `bind()`, `singleton()`, `scoped()`, `instance()`.
- Contextual bindings take precedence over global bindings — they are checked first during resolution.
- Without an interface binding, `make()` on an interface throws `BindingResolutionException`.

## Performance
- Interface resolution with explicit binding is O(1) — array lookup.
- Interface resolution with auto-resolution fallback throws an exception — no resolution overhead.
- Singleton interface binding pays resolution cost once, returns cached instance on subsequent calls.
- Contextual binding adds minimal overhead (~0.001ms) for the `when()->needs()->give()` lookup.

## Security
- Interface bindings control which concrete implementation is used — ensure bindings don't expose internal services unexpectedly.
- In multi-tenant apps, use contextual binding to provide tenant-specific implementations of the same interface.
- Binding interfaces to untrusted concretes (e.g., user-provided class names) can lead to arbitrary code execution.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Forgetting to bind interface | Type-hinting interface without binding | TargetInterfaceNotInstantiableException | Always bind interfaces in service providers |
| Binding concrete to concrete | `bind(UserService::class, UserService::class)` | No benefit — auto-resolution handles it | Remove unnecessary binding or bind an interface |
| Not using contextual binding | Multiple consumers need different implementations | Factory pattern or conditional wiring | Use `when()->needs()->give()` |
| Binding in wrong provider | Binding in AppServiceProvider only | Other providers can't use the binding | Use dedicated provider or order correctly |

## Anti-Patterns
- **No interface binding**: Type-hinting concrete classes directly — tight coupling, hard to test.
- **Fat binding closures**: Registering complex factory logic in bind() that belongs in a dedicated factory class.
- **Binding management spread**: Binding interfaces across multiple files without centralization.
- **Self-binding**: `$app->bind(Interface::class, Interface::class)` — meaningless and may cause infinite recursion.

## Examples
```php
// In a service provider
public function register()
{
    // Simple interface-to-concrete binding
    $this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);

    // Singleton binding
    $this->app->singleton(CacheInterface::class, RedisCache::class);

    // Contextual binding — Admin controller gets different implementation
    $this->app->when(AdminController::class)
        ->needs(UserRepositoryInterface::class)
        ->give(AdminUserRepository::class);
}
```

## Related Topics
- **Prerequisites:** Container Fundamentals — how the $bindings array works.
- **Closely Related:** Auto-Resolution Strategy — how concrete classes resolve without bindings.
- **Advanced:** Contextual Binding — consumer-specific interface resolution.
- **Cross-Domain:** Service Provider Registration — where interface bindings are registered.

## AI Agent Notes
- The `$bindings` array on the Container stores `Illuminate\Container\Container\Definition` objects.
- When resolving an interface, the container calls `Container::resolve()` which calls `Container::resolveClass()`.
- `TargetInterfaceNotInstantiableException` is thrown when `make()` is called on an interface with no binding.
- To check if an interface has a binding: `$app->bound(UserRepositoryInterface::class)`.

## Verification
- [ ] All interface type-hints in constructors have corresponding bindings in service providers
- [ ] No concrete-to-concrete bindings exist (unnecessary)
- [ ] Contextual binding is used where different consumers need different implementations
- [ ] Interface bindings are registered in the correct service provider
- [ ] No `app()->make()` in business logic — use constructor injection with interface type-hints
