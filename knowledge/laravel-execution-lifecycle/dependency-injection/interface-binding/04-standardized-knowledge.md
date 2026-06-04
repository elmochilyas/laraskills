# ku-08: Interface Binding

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **KU:** ku-08-interface-binding
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Interface binding is the mechanism by which the container maps an interface (or abstract class) to a concrete implementation. It is the explicit counterpart to auto-resolution — interfaces require explicit registration via `$container->bind(Interface::class, Concrete::class)`. This enables programming to interfaces, swappable implementations, and clean separation of concerns.

## Core Concepts
- **Abstract-to-concrete mapping**: `bind()` tells the container "when Interface is requested, instantiate Concrete".
- **Resolution flow**: `Container::make(Interface::class)` → looks up binding → resolves concrete → returns instance.
- **Singleton variant**: `singleton()` caches the resolved instance — same instance for every `make()` call.
- **Closure binding**: `bind(Interface::class, function ($app) { ... })` — custom resolution logic.
- **Contextual binding**: Different concretes for different consumers of the same interface.
- **Alias binding**: `$app->alias(Interface::class, 'alias.name')` — resolve by string alias.
- **Binding chain**: An interface can be bound to another abstract, which is itself bound to a concrete.

## When To Use
- When programming to interfaces (recommended for service and repository abstractions).
- When implementations need to be swappable (different environments, testing, feature flags).
- When using the strategy pattern — bind different implementations as needed.
- When third-party packages provide interfaces that need concrete bindings.
- When you need to control the lifecycle (singleton vs new instance per resolution).

## When NOT To Use
- When the interface has only one implementation and no foreseeable need to change — auto-resolution may be simpler.
- When the binding decision depends on runtime request data — use factory pattern or middleware.
- For concrete-to-concrete bindings — `bind(Service::class, Service::class)` is redundant; auto-resolution handles it.

## Best Practices (WHY)
- **Bind interfaces in dedicated providers**: Create `PaymentServiceProvider` for payment-related bindings.
- **Use singleton for stateless services**: `singleton(LoggerInterface::class, MonologLogger::class)` — one instance shared.
- **Use `bind()` for stateful services**: Each consumer gets a fresh instance.
- **Document interface contracts**: What does each method do? What are the expectations for implementors?
- **Register bindings in boot() or register()?**: Bindings in `register()`; boot-time resolution checks in `boot()`.

## Architecture Guidelines
- Interface bindings should be registered as early as possible — in the provider's `register()` method.
- The `Illuminate\Contracts` directory defines all framework interfaces — reference these for Laravel services.
- Custom application interfaces belong in `app/Contracts/`.
- Bindings are stored in `Container::$bindings[Interface::class] = ['concrete' => ..., 'shared' => bool]`.
- Contextual bindings (`when()->needs()->give()`) override global interface bindings for specific consumers.

## Performance
- Binding lookup is O(1) — `$this->bindings[Interface::class]` is a plain array lookup.
- Closure bindings execute the Closure on every resolution (unless singleton) — keep Closures fast.
- Singleton interface bindings resolve once — subsequent `make()` calls return the cached instance.
- Contextual binding lookup adds O(n) on the number of contextual bindings for that consumer.

## Security
- Interface bindings control which concrete is used — ensure bindings are not overridden by untrusted code.
- Binding to a malicious concrete could expose sensitive data — review third-party package bindings.
- For auth/guard interfaces, ensure the bound concrete implements proper access controls.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Forgetting to bind | Interface type-hint without registration | Not adding to provider | TargetInterfaceNotInstantiableException | Always register interface bindings |
| Binding to non-instantiable class | `bind(Interface::class, AbstractClass::class)` | Using abstract class as concrete | BindingResolutionException | Use a concrete class |
| Binding concrete to concrete | `bind(Service::class, Service::class)` | Unnecessary registration | No benefit — auto-resolution works | Remove redundant binding |
| Singleton with mutable state | Singleton stores per-request data | Not understanding shared lifecycle | State leaks between requests | Ensure singletons are stateless |
| Binding in wrong provider | Binding scattered across unrelated providers | Not organizing by concern | Hard to find and maintain | Group bindings by feature/domain |

## Anti-Patterns
- **Interface explosion**: Creating interfaces for every class "just in case" — only abstract when you need polymorphism.
- **Binding in route files**: Interface bindings in `routes/web.php` — they should be in service providers.
- **Binding to self**: `bind(Service::class, Service::class)` — redundant with auto-resolution.
- **No interface at all**: Type-hinting concrete classes everywhere — harder to test and swap.

## Examples
```php
// In service provider's register()
$this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
$this->app->singleton(CacheInterface::class, RedisCache::class);

// Closure binding with custom logic
$this->app->bind(PaymentInterface::class, function ($app) {
    return $app['config']->get('payment.provider') === 'stripe'
        ? new StripePayment($app['config']['payment.stripe.key'])
        : new PayPalPayment($app['config']['payment.paypal.key']);
});
```

## Related Topics
- DI Container Basics (ku-01) — how bindings are stored and resolved
- Automatic Injection (ku-04) — the fallback when no interface binding exists
- Contextual Binding (ku-05) — consumer-specific interface binding overrides
- Tagged Bindings (ku-06) — grouping multiple interface implementations

## AI Agent Notes
- Bindings are stored in `Container::$bindings[Abstract]['concrete']` and `Container::$bindings[Abstract]['shared']`.
- `Container::resolve()` processes the binding: checks contextual, checks global binding, then builds.
- The `isInstantiable()` check in `build()` catches interfaces without bindings.
- To check if an interface has a binding: `$app->bound(Interface::class)`.
- Use `$app->resolved(Interface::class)` to check if it's been resolved already.

## Verification
- [ ] All interface type-hints have corresponding bindings in service providers
- [ ] Bindings are organized by domain/feature in dedicated providers
- [ ] Singleton bindings are used for stateless services only
- [ ] No `bind(Concrete::class, Concrete::class)` redundancies
- [ ] Closure bindings are kept in provider `register()` methods
- [ ] Interface→concrete validation: bound concrete implements the interface
