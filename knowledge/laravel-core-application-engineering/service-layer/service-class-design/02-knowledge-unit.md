# Service Class Design

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service Class Design
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

A service class is a multi-method class that groups related business operations organized by entity or domain capability. Unlike single-action controllers (HTTP-aware, single method) or action classes (single-purpose, reusable), service classes provide cohesive method groupings for related operations — `UserService` with methods for register, update, suspend, and deactivate. The framework does not define a service layer; it is a pure architectural convention.

The engineering significance of service class design lies in the boundary it creates between HTTP handling and business logic. Services are the first layer where business rules are applied without HTTP coupling. A well-designed service is stateless, transport-agnostic, injected with its dependencies via constructor promotion, and testable without booting the framework. A poorly designed service becomes a dumping ground — the "fat service" anti-pattern that simply relocates bloat from controllers.

Service design involves three core decisions: how to organize methods (entity-oriented vs capability-oriented), how to manage dependencies (constructor injection strategy), and how to evolve the service as complexity grows. There is no framework enforcement for any of these — they are architectural decisions that must be made deliberately. The cost of getting them wrong is a service layer that adds ceremony without clarity.

---

## Core Concepts

### Entity-Oriented vs Capability-Oriented Design

**Entity-oriented (noun-based):** Services named after and organized around domain entities: `UserService`, `OrderService`, `InvoiceService`, `ProductService`. This is the dominant pattern in the Laravel ecosystem.

- Benefit: Navigation by domain — developers know exactly where to find user-related logic.
- Risk: Unbounded growth — a `UserService` that starts with `register()` and `update()` can accumulate `suspend()`, `deactivate()`, `changePassword()`, `verifyEmail()`, `impersonate()`, `exportUsers()` over time.
- When to use: CRUD-heavy domains where most operations center around a single aggregate.

**Capability-oriented (verb/feature-based):** Services organized around business processes: `AuthenticationService`, `NotificationService`, `ExportService`, `CheckoutService`, `OnboardingService`.

- Benefit: Cohesive by design — every method in `CheckoutService` relates to checkout.
- Cost: Harder to locate — a developer looking for "user-related" logic may need to check `UserService`, `AuthenticationService`, `ProfileService`, and `OnboardingService`.
- When to use: Cross-cutting capabilities that span multiple entities.

### Constructor Injection and Dependency Strategy

Service dependencies are injected via constructor property promotion (PHP 8+). The typical injectable dependencies are:

| Dependency Type | Example | Guidance |
|----------------|---------|----------|
| Repositories | `UserRepository` | Always inject — never instantiate inside services |
| Other services | `NotificationService` | Acceptable for cross-service orchestration |
| External gateways | `PaymentGatewayInterface` | Always inject via interface |
| Loggers | `LoggerInterface` | Optional — add for observability |
| Configuration | Scalar config values | Inject via contextual binding or config helper |

What must NOT be injected into services:
- **Request/Response objects** — services must be transport-agnostic
- **Session state** — services must not carry request-specific state
- **Authenticated user** — pass as a method parameter instead

### Statelessness Requirement

Services must be stateless. No mutable properties that hold per-request state. The container may resolve a service as a singleton (for performance), and any internal state set during one request leaks to the next. State eliminates testability — a stateless service is trivially testable (construct, call method, assert result), while a stateful service requires careful per-test state reset.

### Service Evolution Stages

Services follow a predictable growth trajectory in production codebases:

**Stage 1 — Thin CRUD Aggregator:** The service simply forwards calls to models or repositories. `create()` calls `Model::create()`, `update()` calls `Model::update()`. If the service only forwards calls without adding business logic, it may not be worth having as a separate class.

**Stage 2 — Business Logic Centralization:** The service starts applying business rules — preparing payloads, managing transactions, centralizing write validation. This is where the service earns its existence.

**Stage 3 — Multi-Service Orchestrator:** The service coordinates multiple sub-services or actions in a workflow. `createProject()` calls `ActivityService::log()`, `NotificationService::notify()`, and `InventoryService::reserve()` in sequence.

**Stage 4 — Event-Driven Split:** At high complexity, the service splits into commands (action classes for writes), queries (query classes for reads), and an application coordinator that orchestrates them.

---

## Mental Models

### Service as Traffic Management
A service is not a brain — it is a traffic management system. It receives a request (via method call), validates preconditions, dispatches work to the appropriate handlers (other services, actions, repositories), and returns a result. The business logic belongs in the handlers, not in the traffic manager.

### The Natural Growth Trap
Every fat service starts innocent. A `UserService` with three methods (`register`, `update`, `findByEmail`) is clean and focused. But each new feature adds one more method. At 15 methods, the service has become a dumping ground. The growth is invisible because each individual addition seems reasonable. The trap is that no single decision creates the bloat — only the accumulated pattern.

### Constructor Signature as Responsibility Document
The constructor signature of a service documents its domain scope. A `UserService` with 2 dependencies (`UserRepository`, `PasswordHasher`) is focused. A `UserService` with 8 dependencies (`UserRepository`, `PasswordHasher`, `EmailService`, `PaymentGateway`, `ActivityLogger`, `CacheManager`, `FileStorage`, `QueueManager`) has absorbed too many unrelated concerns. The constructor is the first place to check for service bloat.

---

## Internal Mechanics

### Container Resolution of Services

Services are resolved by the service container at the point of injection. The container reads the constructor's type hints, recursively resolves each dependency, and constructs the service:

```php
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private NotificationService $notifier,
    ) {}
}

// Container::make(OrderService::class):
// 1. Reads constructor: needs OrderRepository, NotificationService
// 2. Resolves OrderRepository (concrete class, auto-resolved)
// 3. Resolves NotificationService (concrete class, auto-resolved)
// 4. Calls new OrderService($orderRepo, $notifier)
```

No explicit binding is needed for concrete classes. The container's auto-resolution handles them automatically. Binding is only required when injecting interfaces.

### Bind Lifetime Decisions

| Binding Method | Behavior | Service Type |
|---------------|----------|--------------|
| `$this->app->bind()` | New instance on every resolution | Services that hold per-request context (rare) |
| `$this->app->singleton()` | Same instance for entire process lifetime | Stateless services — most common, safe when service has no mutable state |
| `$this->app->scoped()` | Same instance per request/job, flushed between | Services needing per-request state (tenant context, request cache) |

Stateless services are safe as singletons. The performance benefit of singleton binding (~0.01ms per resolution saved) is negligible for most applications. The architectural benefit — forcing statelessness — is the real value.

### No Framework Enforcement of Service Patterns

The framework has zero concept of "service." Any class in any namespace can be a service. There is no `Service` base class, no `ServiceContract`, no autodiscovery for services. Everything about the service layer — naming, directory structure, method organization — is convention, not framework enforcement. This freedom is both the pattern's strength (adaptable to any architecture) and its risk (no guardrails against bloat).

---

## Patterns

### Entity-Oriented Service with Repository Injection

```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
    ) {}

    public function register(array $data): User
    {
        return $this->users->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $this->hasher->hash($data['password']),
        ]);
    }

    public function update(User $user, array $data): User
    {
        if (isset($data['email'])) {
            $user->markEmailAsUnverified();
        }
        return $this->users->update($user, $data);
    }

    public function suspend(User $user): void
    {
        $this->users->update($user, ['suspended_at' => now()]);
    }
}
```

Cohesive — all methods operate on User. Dependencies are focused (repository + hasher).

### Capability-Oriented Service

```php
class CheckoutService
{
    public function __construct(
        private InventoryService $inventory,
        private PaymentService $payment,
        private OrderService $orders,
        private NotificationService $notifier,
    ) {}

    public function checkout(Cart $cart, User $user): Order
    {
        $this->inventory->reserve($cart->items());
        $charge = $this->payment->charge($cart->total(), $user);
        $order = $this->orders->createFromCart($cart, $charge);
        $this->notifier->sendConfirmation($user, $order);
        return $order;
    }
}
```

Organized by business process (checkout), not by entity. Depends on multiple entity services.

### Feature-Namespace Service Organization

For larger applications, services are organized into subdirectories:

```php
// App\Services\Users\UserService
// App\Services\Users\AuthenticationService
// App\Services\Users\ProfileService

// App\Services\Orders\OrderService
// App\Services\Orders\OrderCalculationService
// App\Services\Orders\OrderFulfillmentService

// App\Services\Payment\Contracts\PaymentServiceInterface
// App\Services\Payment\StripePaymentService
// App\Services\Payment\PayPalPaymentService
```

The namespace reflects the domain structure, making navigation predictable.

### Interface Binding for Swappable Services

```php
// In service provider
$this->app->bind(PaymentServiceInterface::class, StripePaymentService::class);

// Contextual binding for different consumers
$this->app
    ->when(SubscriptionController::class)
    ->needs(PaymentServiceInterface::class)
    ->give(StripePaymentService::class);

$this->app
    ->when(RefundController::class)
    ->needs(PaymentServiceInterface::class)
    ->give(PayPalPaymentService::class);
```

Only use interfaces when polymorphism is needed — multiple implementations of the same contract. For single-implementation services, concrete classes with auto-resolution are preferred.

---

## Architectural Decisions

### Why Services Are Not Framework-Enforced
The framework intentionally avoids defining a service layer. Service classes are a pure architectural convention. This means the framework does not constrain how services are organized, but it also provides no guardrails against common mistakes like the fat service anti-pattern. The community has converged on conventions through production experience, not through framework prescription.

### Why Statelessness Is Required
The container's singleton binding is the default recommendation for stateless services. If a service holds mutable state, singleton binding causes cross-request contamination under Octane and queue workers. Even when binding per-request (default `bind()`), stateful services are harder to test and create hidden coupling between operations. Statelessness is not optional — it is the only safe design for services in a shared-nothing architecture.

### Why Repository Injection vs Direct Eloquent
The repository pattern debate is the most contentious in service design. The community consensus:

- **Use repositories when:** Queries are complex, multi-tenant scoping is needed, or caching at the data access layer is required.
- **Do NOT use repositories when:** The service only does `Model::find()` or `Model::create()`. The abstraction adds indirection without benefit.
- **The pragmatic middle:** Start without repositories. Extract them when query complexity or cross-cutting concerns (caching, scoping) justify the abstraction.

### Why Concrete Classes Over Interfaces for Single Implementations
For services with a single implementation, injecting the concrete class is preferred. Interfaces add ceremony (interface file, binding in provider, test mock setup) without architectural benefit. The container resolves concrete classes automatically — no binding needed. Reserve interfaces for services where polymorphism is required (multiple payment gateways, multiple notification channels).

---

## Tradeoffs

### Entity-Oriented vs Capability-Oriented Design

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Entity: Predictable navigation — "user logic in UserService" | Entity: Unbounded growth — 15+ methods in one class | Entity services need discipline to prevent bloat |
| Capability: Cohesive by definition — all methods relate to one process | Capability: Scattered navigation — user logic in 4+ services | Capability services need documentation of responsibility boundaries |

### Repository Injection vs Direct Eloquent

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Repository: Centralized query complexity; test seam for mocking | Repository: Ceremony — interface + binding + repository class for simple operations | Use repository only when query complexity warrants it |
| Direct Eloquent: Zero ceremony, full Laravel productivity | Direct Eloquent: Coupled to Eloquent; harder to swap data source | Default to direct Eloquent; extract repository when justified |

### Shared Constructor DI vs Per-Method Injection

| Pattern | Benefit | Cost |
|---------|---------|------|
| Constructor: Shared dependencies resolved once, used by all methods | Constructor: All dependencies instantiated even for methods that don't use them | Acceptable when 80%+ methods use the dependency |
| Per-method: Only resolve what each method needs | Per-method: Duplicated type hints across methods; hard to see total dependency scope | Use when methods have disjoint dependency needs |

---

## Performance Considerations

### Resolution Cost
Service container resolution cost is proportional to dependency chain depth. A service with 4 direct dependencies, each with 2 transitive dependencies, requires 8+ container resolutions. Each resolution involves reflection on the constructor. Typical cost: ~0.01–0.05ms per resolution. For most applications, this is negligible.

### Singleton vs Bind Resolution
Singleton resolution: one-time cost at first resolution, then cached reference. Bind resolution: resolution cost paid on every resolution. For stateless services injected into controllers, the difference per request is ~0.01ms — not a performance concern, but singleton binding eliminates the resolution cost entirely.

### File Count and Autoloading
Service classes are autoloaded on first use. PHP OpCache caches compiled files, so per-request autoloading is zero after warmup. The file count difference between 20 service files and 80 service files is irrelevant for performance.

---

## Production Considerations

### Detecting Fat Services
Monitor these signals in code review:
- **Constructor dependency count:** 5+ dependencies suggests the service has too many concerns
- **Public method count:** 10+ methods suggests the service needs splitting
- **Method cohesion:** If two methods don't share at least 50% of the service's dependencies, they belong in different services
- **"And" in method names:** `createAndNotify` means two responsibilities in one method

### Service Directory Placement
Services belong in `app/Services/`, NOT under `app/Http/Services/`. Services must be transport-agnostic. Placing them under the HTTP namespace creates a wrong architectural signal — suggesting services belong to the HTTP layer rather than the application layer.

### Evolution Strategy
Start services as cohesive single-entity classes. When a service reaches 6-8 public methods with divergent dependencies, split into multiple services or extract non-cohesive operations into action classes. The split point is not a strict line count but a cohesion test: "would extracting this method and its dependencies make both the original and the new class more focused?"

---

## Common Mistakes

### The Fat Service Anti-Pattern
Why it happens: Every new feature adds one more method to an existing service. Each addition seems reasonable in isolation. Why it's harmful: The service loses cohesion, constructor dependencies balloon, and testing one method requires mocking dependencies used by unrelated methods. Better approach: When adding a method that requires dependencies not already present, consider whether it deserves its own service or action class.

### Empty Forwarding Service
Why it happens: Creating a service for every entity because "the architecture requires it." Why it's harmful: A service that just calls `Model::create()` with no additional logic adds ceremony without value. The controller could call the model directly with fewer files to navigate. Better approach: Only create services when there is business logic to centralize. Skip the service for simple CRUD pass-through operations.

### Injecting HTTP Dependencies
Why it happens: A service needs the current user, so `Request` is injected into the constructor. Why it's harmful: The service becomes coupled to HTTP. It cannot be called from Artisan commands, queue jobs, or scheduled tasks. Testing requires mocking the entire request. Better approach: Pass request-specific data (user ID, validated input) as method parameters.

### Mixing Service and Action Concerns
Why it happens: Adding a single-use, complex method to an existing entity service because "it's still about users." Why it's harmful: A complex workflow like `importUsers()` with its own transaction boundaries and error handling does not belong alongside simple CRUD methods. Better approach: Use a dedicated action class for complex single-use operations, keeping the entity service focused on cohesive business logic.

### Registering Services as Interfaces Unnecessarily
Why it happens: Following the "program to interfaces" principle dogmatically. Why it's harmful: Every service gets an interface, every interface needs a binding, every test needs interface mocking. The indirection adds no value when there is a single implementation. Better approach: Use interfaces only at architectural boundaries (external systems, polymorphic requirements).

---

## Failure Modes

### God Service
A service with 20+ methods across unrelated domains. The `UserService` handles registration, authentication, password resets, email verification, profile management, avatar uploads, API token management, and export/import. The class is 800+ lines, has 12 constructor dependencies, and any change to any method risks breaking unrelated functionality. The failure mode is gradual — no single commit creates the god service, but each commit adds one more method.

### Constructor Explosion
A service constructor with 8+ parameters. The class has absorbed too many responsibilities. Testing requires instantiating 8 mocked dependencies even for methods that use only 2 of them. New team members cannot understand the class's purpose from its constructor signature — it does too many things.

### Hidden State Leaks
A service with mutable properties (counters, caches, user context) registered as a singleton. Under Octane or queue workers, one request's state leaks to the next. The bug is intermittent — only occurs when the same worker process handles requests for different users in sequence. Debugging requires understanding the container lifecycle and worker architecture.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream uses action classes for all team management operations (`CreateTeam`, `UpdateTeam`, `AddTeamMember`). It does not use service classes. The pattern is action-per-operation with no service grouping. This demonstrates that even the framework authors choose actions over services for discrete operations.

### Laravel Horizon
Horizon uses services internally for queue management operations. The `HorizonService` coordinates queue metrics, process management, and dashboard data. Services are used for cohesive domain operations, actions for specific workflows.

### Spatie Packages
Spatie packages (like `laravel-permission`, `laravel-activitylog`) use service-like classes for their internal operations. The pattern is pragmatic — services for cohesive logic, not dogmatic adherence to a single pattern.

### Monica CRM (Production Open Source)
Monica CRM uses entity-oriented services extensively. `ContactService`, `ActivityService`, `RelationshipService` group operations by domain entity. The codebase demonstrates the entity-oriented pattern at scale with 30+ services organized by domain.

---

## Related Knowledge Units

### Prerequisites
- Service Container Basics — Container resolution and dependency injection for services
- Thin Controller Principles — Why services exist as the delegation target for controllers

### Related Topics
- Naming Conventions — Service naming strategies and namespace conventions
- Stateless Service Design — Why services must not hold mutable state
- Dependency Injection — Constructor vs method injection strategies
- Service Testing — Unit and integration testing for services

### Advanced Follow-up Topics
- Service Orchestration — Multi-service workflow coordination
- Transaction Management — Transaction boundaries in service operations
- Service vs Action Decision — Choosing between service classes and action classes
- Domain vs Application Services — The DDD distinction for service layering

---

## Research Notes

### Source Analysis
- Laravel Framework source: `Illuminate\Container\Container.php` — auto-resolution, singleton, scoped binding
- Laravel Jetstream: `App\Actions` — action-based pattern without service classes
- Monica CRM: Entity-oriented service layer with 30+ services organized by domain
- tegos/laravel-action-and-service-guideline — Service composition rules, dependency limits

### Key Insight
The service class is the most flexible and most dangerous pattern in the Laravel architecture toolbox. It is flexible because it imposes no constraints — any grouping logic, any number of methods, any dependency structure. It is dangerous because that same freedom provides no guardrails against bloat. The discipline must come from team conventions, not framework enforcement.

### Key Controversy
The service vs action debate is the most active architectural discussion in the Laravel community. The emerging consensus (2024–2026) is that both belong in the same codebase: services for cohesive entity operations, actions for single-purpose workflows. The choice is about navigation preference and team organization, not about right vs wrong.

### Version-Specific Notes
- PHP 8.0+ constructor property promotion: standard service DI pattern
- Laravel `scoped()` binding: available since Laravel 8, critical for Octane safety
- No version-specific changes to service design principles in Laravel 10–13
