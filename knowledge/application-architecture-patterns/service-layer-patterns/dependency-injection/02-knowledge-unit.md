# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Dependency injection for services and actions
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Dependency injection (DI) is the mechanism that supplies services and actions with their dependencies. In Laravel, the service container automatically resolves constructor dependencies, making DI transparent and powerful. The key patterns for service layer DI are: constructor injection for required dependencies (preferred), method injection for variability (less common), and explicit binding in service providers for interface-implementation mapping.

---

# Core Concepts

**Constructor injection:** Dependencies are declared as constructor parameters. Laravel's container resolves them automatically:
```php
class UserService {
    public function __construct(
        private UserRepository $users,
        private WelcomeMailer $mailer,
        private EventDispatcher $events,
    ) {}
}
```

**Method injection:** Dependencies are injected into specific methods. Less common for services, useful for controllers:
```php
class UserController {
    public function store(StoreUserRequest $request, UserService $service): UserResource {
        // $service resolved automatically
    }
}
```

**Interface binding:** Services depend on interfaces; the container resolves implementations:
```php
// ServiceProvider
$this->app->bind(UserRepository::class, EloquentUserRepository::class);
$this->app->bind(Mailer::class, SendGridMailer::class);
```

---

# Mental Models

**The "Parts Arriving" model:** DI is like receiving parts from the container. The service says "I need X, Y, and Z to work." The container provides them. The service doesn't construct its own parts.

**The "Constructor is a Contract" model:** The constructor signature IS the dependency contract. It documents what the class needs. More dependencies = more responsibilities (a signal to split).

**The "No Hidden Dependencies" model:** With DI, all dependencies are visible in the constructor. Facades hide dependencies; DI makes them explicit.

---

# Internal Mechanics

Laravel's container resolves constructor dependencies recursively:
1. Check if the class has explicit bindings (closures, singletons)
2. If not, attempt to instantiate the class via Reflection
3. Resolve each constructor parameter (recursively)
4. Handle `ContextualBinding` for class-specific implementations:
```php
$this->app->when(UserService::class)
    ->needs(Mailer::class)
    ->give(SendGridMailer::class);
```

---

# Patterns

**Interface dependency pattern:** Depend on interfaces, not concrete classes:
```php
// Service depends on interface
class UserService {
    public function __construct(
        private UserRepository $users,  // Interface
    ) {}
}
// Bound to concrete in service provider
```

**Factory pattern for dynamic dependencies:** When a dependency depends on runtime data:
```php
class InvoiceService {
    public function __construct(
        private InvoiceRepository $invoices,
        private InvoiceFactory $factory,  // Creates domain objects
    ) {}
}
```

---

# Architectural Decisions

**Use constructor injection for:** All required, stable dependencies. The default choice for services and actions.

**Use method injection for:** Dependencies that vary per method call. Rare in services—more common in controllers and event listeners.

**Use contextual binding when:** Different services need different implementations of the same interface:
```php
$this->app->when(OrderService::class)
    ->needs(Logger::class)
    ->give(OrderLogger::class);
```

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Dependencies are explicit | Constructor can become large | 8+ dependencies = split the class |
| Testable via mocking | Framework magic (auto-resolution) can confuse | Must understand container |
| Flexible implementation swapping | Binding setup overhead | Each interface needs a container binding |
| Lazy resolution (only created when needed) | Circular references cause errors | Hard-to-debug container errors |

---

# Performance Considerations

Container resolution uses Reflection for unresolvable parameters. This is cached after first resolution. With Laravel's `optimize` command, container resolution is fast.

---

# Production Considerations

Audit constructor dependencies. If a class has 5+ dependencies, it's likely doing too much. Consider splitting.

---

# Common Mistakes

**Facade usage in injected services:** Using `\Cache::get()` inside a service instead of injecting the cache interface. Facades hide dependencies.

**Constructor work:** Performing logic in the constructor (connecting to services, loading data). Constructors should only assign parameters.

**Too many interfaces:** Creating a separate interface for every service, even when only one implementation exists. Add interfaces only when variation is needed.

---

# Failure Modes

**Circular dependency:** Service A depends on Service B which depends on Service A. The container throws a `CircularDependencyException`.

**Resolution failure from missing binding:** A class depending on an interface without a container binding. Results in a `BindingResolutionException`.

---

# Ecosystem Usage

Laravel's service container is the core DI mechanism. All packages (Horizon, Telescope, Pulse, Spatie packages) use constructor injection. The container's auto-resolution is one of Laravel's defining features.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| Laravel Service Container | SLP-12 Service binding strategies | SLP-13 Interface contracts |
| SLP-01 Service classes | SLP-02 Action classes | SLP-19 Octane service state |

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
