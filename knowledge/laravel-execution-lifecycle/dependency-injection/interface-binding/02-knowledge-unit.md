# Interface Binding

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Interface binding is the mechanism by which the container maps an interface (or abstract class) to a concrete implementation. It is the explicit counterpart to auto-resolution — interfaces require explicit registration via `$container->bind(Interface::class, Concrete::class)`. This enables programming to interfaces, swappable implementations, and clean separation of concerns. It is the foundation of testable, maintainable Laravel applications.

## Core Concepts

### Abstract-to-Concrete Mapping
`bind()` tells the container "when Interface is requested, instantiate Concrete."

### Resolution Flow
`Container::make(Interface::class)` → looks up binding → resolves concrete → returns instance.

### Singleton Variant
`singleton()` caches the resolved instance — same instance for every `make()` call.

### Closure Binding
`bind(Interface::class, function ($app) { ... })` — custom resolution logic.

### Contextual Binding
Different concretes for different consumers of the same interface.

### Alias Binding
`$app->alias(Interface::class, 'alias.name')` — resolve by string alias.

### Binding Chain
An interface can be bound to another abstract, which is itself bound to a concrete.

## Mental Models

### The Contractor
You're building a house and need a "plumber" (interface). Instead of hiring "Bob the Plumber" directly (concrete class), you contact a contracting agency (container). You've told the agency: "When someone asks for a plumber, send Bob." If you change agencies, you just update the contract — all the construction workers (consumers) still just ask for a "plumber."

### The TV Remote
The remote control is an interface — it defines buttons (methods) without specifying the internals. The TV brand (concrete implementation) makes the remote work. You can swap the TV (implementation) without learning a new remote — the interface stays the same. Interface binding tells the factory which brand to install.

### The Power Outlet
A power outlet is an interface (110V, two prongs). Any appliance (concrete) that matches this interface works. Interface binding is the building code that says "all outlets in this room (consumer) must use this specific breaker (concrete)."

## Internal Mechanics

### Binding Storage
```php
// Container::$bindings
$this->bindings = [
    'App\Contracts\UserRepository' => [
        'concrete' => 'App\Repositories\EloquentUserRepository',
        'shared' => false, // false = bind(), true = singleton()
    ],
    'App\Contracts\CacheInterface' => [
        'concrete' => Closure, // Closure-based binding
        'shared' => true,      // singleton
    ],
];
```

### Resolution Flow
```php
// Container::make(UserRepositoryInterface::class)
// 1. Check $instances → return if already resolved (singleton)
// 2. Check $aliases → resolve 'user.repo' to UserRepositoryInterface
// 3. Check $contextual[Consumer][abstract] → contextual override?
// 4. Check $bindings[abstract] → found: get concrete
//    a. If shared and already resolved → return cached
//    b. If Closure → execute Closure
//    c. If class string → make(concrete) recursively
// 5. Not found in bindings → try auto-resolution
```

### Binding Registration
```php
// bind() — new instance each time
$this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);

// singleton() — same instance every time
$this->app->singleton(CacheInterface::class, RedisCache::class);

// Closure binding — custom resolution logic
$this->app->bind(PaymentInterface::class, function ($app) {
    return $app['config']->get('payment.provider') === 'stripe'
        ? new StripePayment($app['config']['payment.stripe.key'])
        : new PayPalPayment($app['config']['payment.paypal.key']);
});
```

### bound() and resolved() Methods
```php
// Check if binding exists
$app->bound(UserRepositoryInterface::class); // true/false

// Check if already resolved
$app->resolved(UserRepositoryInterface::class); // true/false
```

## Patterns

### Interface-Only Contracts Pattern
Define interfaces in `app/Contracts/` for all major architectural boundaries. Register bindings in dedicated service providers.

### Singleton for Stateless Services Pattern
Use `singleton()` for services that have no per-request state — database adapters, cache managers, loggers.

### Closure for Conditional Resolution Pattern
Use Closure bindings when the implementation depends on configuration or runtime conditions (but not per-request data).

## Architectural Decisions

### Why bind interfaces, not concretions?
Binding interfaces enables swapping implementations without changing consumer code. A controller type-hinting `UserRepositoryInterface` can work with an Eloquent repository in production and a fake repository in tests.

### Why separate bind() and singleton()?
The lifecycle distinction is critical. `bind()` creates a fresh instance per resolution — appropriate for stateful services. `singleton()` shares one instance — appropriate for stateless services. Making this explicit prevents lifecycle bugs.

### Why not auto-resolve interfaces?
Interfaces are contracts without implementations. The container cannot guess which concrete class to use. Explicit binding is a design decision — the developer chooses the implementation.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Swappable implementations | Must register every interface | Forgetting = TargetInterfaceNotInstantiableException |
| Testable — mock via instance() | More provider code | Organized by domain/feature |
| Singleton lifecycle control | Singleton mutable state = data leaks | Use scoped() for request-aware state |
| Closure for custom logic | Closure not serializable | Cannot cache Closure-based bindings |

## Performance Considerations

- **Binding lookup:** O(1) — `$this->bindings[Interface::class]` is a plain array lookup.
- **Closure bindings:** Execute the Closure on every resolution (unless singleton) — keep Closures fast.
- **Singleton bindings:** Resolve once — subsequent `make()` calls return the cached instance.
- **Contextual binding overhead:** Adds O(n) on the number of contextual bindings for that consumer.

## Production Considerations

- **Bind interfaces in dedicated providers:** Create `PaymentServiceProvider` for payment-related bindings.
- **Use singleton for stateless services:** Database connections, cache managers, loggers.
- **Use bind() for stateful services:** Each consumer gets a fresh instance.
- **Register bindings in register(), not boot():** Ensures bindings exist before any resolution.
- **Document interface contracts:** What does each method do? What are the expectations for implementors?

## Common Mistakes

- **Forgetting to bind:** Interface type-hint without registration — `TargetInterfaceNotInstantiableException`.
- **Binding to non-instantiable class:** `bind(Interface::class, AbstractClass::class)` — `BindingResolutionException`.
- **Binding concrete to concrete:** `bind(Service::class, Service::class)` — redundant, auto-resolution handles it.
- **Singleton with mutable state:** Singleton stores per-request data — state leaks between requests.
- **Binding in wrong provider:** Scattered across unrelated providers — hard to find and maintain.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Interface not instantiable | `TargetInterfaceNotInstantiableException` | Interface not bound to concrete | Register binding in provider |
| Wrong implementation | Incorrect behavior | Binding registers wrong concrete | Verify bound concrete implements interface |
| Singleton state leak | Cross-request data contamination | Singleton with mutable state | Convert to scoped() or ensure stateless |
| Closure binding slow | Slow resolution | Heavy logic in Closure | Move to a factory class |

## Ecosystem Usage

- **Laravel Framework:** All contracts in `Illuminate\Contracts` have bindings in core service providers. `CacheInterface` → `CacheManager`, `Dispatcher` → `EventDispatcher`, etc.
- **Laravel Horizon:** Binds `HorizonContract` interfaces in its service provider. Uses singleton for stateless services.
- **Laravel Nova:** Binds authorization and tool interfaces. Uses singleton for configuration services.
- **Spatie packages:** Bind package interfaces in package service providers. Document which contracts application developers can implement.

## Related Knowledge Units

### Prerequisites
- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md) — how bindings are stored and resolved.

### Related Topics
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md) — the fallback when no interface binding exists.
- [Contextual Binding (ku-05)](../ku-05-contextual-binding/02-knowledge-unit.md) — consumer-specific interface binding overrides.
- [Tagged Bindings (ku-06)](../ku-06-tagged-bindings/02-knowledge-unit.md) — grouping multiple interface implementations.

## Research Notes
- Bindings are stored in `Container::$bindings[Abstract]['concrete']` and `Container::$bindings[Abstract]['shared']`.
- `Container::resolve()` processes the binding: checks contextual, checks global binding, then builds.
- The `isInstantiable()` check in `build()` catches interfaces without bindings.
- To check if an interface has a binding: `$app->bound(Interface::class)`.
- Use `$app->resolved(Interface::class)` to check if it's been resolved already.
