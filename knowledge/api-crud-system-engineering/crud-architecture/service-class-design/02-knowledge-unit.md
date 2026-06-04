# Service Class Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Service Class Design
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

A service class is a multi-method class that groups related business operations organized by entity or domain capability. Unlike action classes (single-purpose, reusable), service classes provide cohesive method groupings for related operations — `UserService` with methods for register, update, suspend, and deactivate. The framework does not define a service layer; it is a pure architectural convention.

The engineering significance of service class design lies in the boundary it creates between HTTP handling and business logic. Services are the first layer where business rules are applied without HTTP coupling. A well-designed service is stateless, transport-agnostic, injected with its dependencies via constructor promotion, and testable without booting the framework. A poorly designed service becomes a dumping ground — the "fat service" anti-pattern that simply relocates bloat from controllers.

---

## Mental Models

### Service as Orchestration

In the orchestration model, a service coordinates calls to multiple sub-services or actions. It does not contain domain logic itself — it sequences operations, manages transactions, and handles errors. The `CheckoutService` calls cart, inventory, payment, and notification services in order. The service is a conductor, not a musician.

### Service as Domain Logic

In the domain logic model, a service encapsulates business rules and operations. The `UserService.register()` method applies validation rules, enforces uniqueness constraints, hashes passwords, creates the user, dispatches events, and returns the result. The service IS the domain logic — it does not delegate the core operation to other services.

### The Spectrum

Most services sit on a spectrum between pure orchestration and pure domain logic. A service often contains domain logic for its primary operation and orchestrates sub-services for cross-cutting concerns (logging, notifications, auditing). The balance depends on domain complexity and whether the service represents a bounded context.

---

## Core Concepts

### Entity-Oriented vs Capability-Oriented Design

**Entity-oriented (noun-based):** Services named after domain entities: `UserService`, `OrderService`, `ProductService`.

- Benefit: Predictable navigation — developers know where to find user-related logic.
- Risk: Unbounded growth — `UserService` accumulates `register()`, `suspend()`, `impersonate()`, `exportUsers()` over time.
- When to use: CRUD-heavy domains where most operations center around a single aggregate.

**Capability-oriented (verb/feature-based):** Services organized around business processes: `AuthenticationService`, `ExportService`, `CheckoutService`.

- Benefit: Cohesive by design — every method in `CheckoutService` relates to checkout.
- Cost: Harder to locate — user-related logic may span `UserService`, `AuthenticationService`, `ProfileService`.
- When to use: Cross-cutting capabilities that span multiple entities.

### Statelessness Requirement

Services must be stateless. No mutable properties that hold per-request state. A stateless service is trivially testable (construct, call method, assert result). State eliminates testability and causes cross-request contamination under Octane and queue workers.

### Service Evolution Stages

**Stage 1 — Thin CRUD Aggregator:** The service forwards calls to models/repositories. If it only forwards calls without adding business logic, it may not justify its existence.

**Stage 2 — Business Logic Centralization:** The service applies business rules, prepares payloads, manages transactions. The service earns its existence here.

**Stage 3 — Multi-Service Orchestrator:** The service coordinates multiple sub-services or actions. `createProject()` calls `ActivityService::log()`, `NotificationService::notify()`, `InventoryService::reserve()`.

**Stage 4 — Event-Driven Split:** At high complexity, the service splits into commands (actions for writes), queries (query classes for reads), and an application coordinator.

---

## Internal Mechanics

### Laravel's Dependency Resolution for Services

Services are resolved by the service container based on constructor type-hints. When a controller type-hints `private UserService $users`, the container instantiates `UserService`, resolves its constructor dependencies recursively, and injects the fully-resolved instance. Services registered as singletons (`$this->app->singleton(UserService::class)`) are resolved once per process and shared across all consumers.

### Stateless Service Pattern

A stateless service holds no mutable per-request state. All state is passed as method parameters or return values. This ensures safety under Octane (no cross-request contamination), safety in queue workers (no state leaking between jobs), and trivial testability (construct, call method, assert result). Statelessness is enforced by convention: if a class property is assigned from a method parameter, the service is no longer stateless.

### Binding and Resolution

```php
// Service provider binding
$this->app->bind(UserService::class, function ($app) {
    return new UserService(
        $app->make(UserRepository::class),
        $app->make(PasswordHasher::class),
    );
});
```

Services without interfaces are typically resolved via auto-resolution — no explicit binding is needed as long as constructor dependencies are resolvable by the container.

---

## Patterns

### Entity-Oriented Service

```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
    ) {}

    public function register(RegisterUserDto $dto): User { /* ... */ }
    public function update(UpdateUserDto $dto): User { /* ... */ }
    public function suspend(int $userId): void { /* ... */ }
}
```

### Service with Internal Action Delegation

```php
class UserService
{
    public function __construct(
        private CreateUserAction $createAction,
        private UpdateUserAction $updateAction,
    ) {}

    public function register(RegisterUserDto $dto): User
    {
        return $this->createAction->execute($dto);
    }
}
```

---

## Architectural Decisions

### Why Services Are Not Framework-Enforced

The framework intentionally avoids defining a service layer. This means no constraint on organization and no guardrails against bloat. The discipline comes from team conventions.

### Why Repository Injection vs Direct Eloquent

Use repositories when queries are complex, multi-tenant scoping is needed, or caching at the data access layer is required. Do NOT use when the service only does `Model::find()` or `Model::create()`.

### Why Concrete Classes Over Interfaces for Single Implementations

For single-implementation services, concrete class injection is preferred. Interfaces add ceremony without benefit. Reserve interfaces for architectural boundaries requiring polymorphism.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Shared dependencies across operations | Service risk of bloat | Monitor method count and dependency scope |
| Single class to inject in controller | More indirection than direct-to-action flow | Acceptable when service adds coordination value |
| Natural entity-oriented organization | Team must resist adding unrelated methods | Enforce cohesion rules in code review |

---

## Performance Considerations

Container resolution cost is proportional to dependency depth. A service with 4 direct dependencies each with transitive dependencies adds ~0.05ms resolution time. Singletons eliminate this after first resolution.

---

## Production Considerations

### Detecting Fat Services

- **Constructor dependency count:** 5+ suggests too many concerns
- **Public method count:** 10+ suggests splitting is needed
- **Method cohesion:** If two methods don't share 50% of dependencies, they belong in different services

### Service Directory Placement

Services belong in `app/Services/`, not under `app/Http/Services/`. Services must be transport-agnostic — placing them under `Http/` signals the wrong architectural boundary.

---

## Common Mistakes

### The Fat Service Anti-Pattern
Why it happens: Every new feature adds one more method to an existing service. Why it's harmful: The service loses cohesion, constructor dependencies balloon, and testing one method requires mocking unrelated dependencies. Better approach: When adding a method requiring new dependencies, consider if it deserves its own service or action class.

### Empty Forwarding Service
Why it happens: Creating a service for every entity because "architecture requires it." Why it's harmful: A service that just calls `Model::create()` with no additional logic adds ceremony without value. Better approach: Only create services when there is business logic to centralize.

### Injecting HTTP Dependencies
Why it happens: A service needs the current user, so `Request` is injected. Why it's harmful: The service becomes HTTP-coupled — not callable from Artisan commands, queue jobs, or tests. Better approach: Pass request-specific data as method parameters.

---

## Failure Modes

### God Service
A service with 20+ methods across unrelated domains. 12 constructor dependencies. Testing requires mocking dependencies for unrelated methods.

### Constructor Explosion
8+ constructor parameters. The class has absorbed too many responsibilities. New team members cannot understand the class's purpose from its constructor.

### Hidden State Leaks
Mutable properties on a service registered as a singleton. Under Octane, one request's state leaks to the next. Debugging requires understanding the container lifecycle.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream uses action classes (not services) for all team management. Services are avoided in favor of actions.

### Monica CRM
Monica uses entity-oriented services extensively — `ContactService`, `ActivityService`, `RelationshipService` — demonstrating the entity-oriented pattern at scale.

---

## Related Knowledge Units

### Prerequisites
- Service Container Basics — Container resolution for services
- Thin Controller Principle — Why services exist as delegation targets

### Related Topics
- Service Orchestration — Multi-service coordination
- Service vs Action Decision — Choosing between services and actions
- Repository Pattern Design — Repository injection in services

### Advanced Follow-up Topics
- Transaction Management — Transaction boundaries in services
- Domain vs Application Services — DDD service layering

---

## Research Notes

### Source Analysis
- Monica CRM: Entity-oriented service layer with 30+ services
- Laravel Jetstream: Pure action-based pattern without service classes
- Community convention: Services common in applications >50k LOC

### Key Insight
The service class is the most flexible and most dangerous pattern in CRUD architecture. It is flexible because it imposes no constraints. It is dangerous because no guardrails prevent bloat. Discipline must come from team conventions.

### Version-Specific Notes
- PHP 8.0+ constructor property promotion: standard service DI pattern
- Laravel `scoped()` binding: available since Laravel 8
