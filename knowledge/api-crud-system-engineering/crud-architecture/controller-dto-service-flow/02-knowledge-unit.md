# Controller-DTO-Service Flow

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Controller-DTO-Service Flow
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

The Controller-DTO-Service flow extends the basic delegation pattern by introducing a service layer between the controller and data access. The controller constructs a DTO from validated HTTP input, delegates to a service (a multi-method class with cohesive business logic), and the service coordinates the operation internally — potentially calling multiple actions, repositories, or other services. This pattern is chosen over Controller-DTO-Action when an entity requires multiple related operations that share dependencies and business rules.

The engineering tradeoff is structure vs ceremony. Services group related operations under a single class with shared dependencies, reducing the per-operation file count compared to actions. However, services risk becoming dumping grounds (fat services) if not disciplined. The flow is best for entity-centric domains (User, Order, Product) where multiple CRUD operations share validation rules, query scopes, or notification logic.

---

## Core Concepts

### Four-Layer Flow

```
HTTP Request
  → Router + Middleware
  → Controller (extract, delegate, respond)
    → DTO (typed data carrier from validated request)
      → Service (orchestrates business logic, may call sub-actions/repositories)
        → Response
```

### Service as Coordinator

The service in this flow is a multi-method class that coordinates operations for a domain entity. It may call repositories, dispatch events, manage transactions, or delegate to action classes:

```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
        private NotificationService $notifier,
    ) {}

    public function register(RegisterUserDto $dto): User
    {
        $user = $this->users->create([
            'name' => $dto->name,
            'email' => $dto->email,
            'password' => $this->hasher->hash($dto->password),
        ]);
        $this->notifier->sendWelcome($user);
        return $user;
    }

    public function update(UpdateUserDto $dto): User
    {
        $user = $this->users->findOrFail($dto->userId);
        if ($dto->email !== $user->email) {
            $user->markEmailAsUnverified();
        }
        return $this->users->update($user, $dto->toArray());
    }
}
```

### Service vs Action in This Flow

The service is the public API for a domain entity. Actions may exist as internal implementation details that the service calls. The controller only knows about the service — it does not call actions directly:

```php
class UserService
{
    public function register(RegisterUserDto $dto): User
    {
        // Service may delegate to internal actions
        return $this->createUserAction->execute($dto);
    }
}
```

---

## Mental Models

### The Department Manager

The service is a department manager. It doesn't do all the work — it knows who does. When a request comes in, the manager delegates to the right person (action, repository) and coordinates the workflow. The controller (receptionist) only needs to know the manager, not every individual contributor.

### The Facade

The service acts as a facade over the complexity of a domain operation. The controller sees a simple method call (`$service->register($dto)`), while the service internally coordinates multiple steps. This reduces cognitive load on the controller.

---

## Internal Mechanics

### Container Resolution

Services are resolved by the container with all dependencies injected. The service constructor declares its dependencies explicitly:

```php
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private InventoryService $inventory,
        private PaymentGateway $payment,
    ) {}
}
```

The container auto-resolves concrete classes. Interface bindings are needed only when polymorphism is required.

### Service State Management

Services must be stateless. They hold no per-request mutable state. All request-specific data arrives through method parameters (DTOs, IDs, entities). This allows the container to safely resolve the service as a singleton or scoped binding.

### Method Parameters vs Constructor Injection

Request-specific data (user ID, validated input, tenant context) must be method parameters, not constructor dependencies. Transport-specific objects (Request, Response) must never enter the service layer.

---

## Patterns

### Entity Service with DTO Methods

```php
class ProductService
{
    public function create(CreateProductDto $dto): Product { /* ... */ }
    public function update(UpdateProductDto $dto): Product { /* ... */ }
    public function find(int $id): ?Product { /* ... */ }
    public function delete(DeleteProductDto $dto): void { /* ... */ }
}
```

Each method takes a typed DTO specific to the operation.

### Service with Internal Action Delegation

```php
class UserService
{
    public function __construct(
        private CreateUserAction $createAction,
        private UpdateUserAction $updateAction,
        private DeleteUserAction $deleteAction,
    ) {}

    public function register(RegisterUserDto $dto): User
    {
        return $this->createAction->execute($dto);
    }
}
```

The service is a thin coordinator over dedicated action classes. Useful when actions have complex internal logic that shouldn't be inline in the service.

---

## Architectural Decisions

### When to Use Controller-DTO-Service vs Controller-DTO-Action

Use Controller-DTO-Action for discrete operations that don't share state or dependencies with other operations. Use Controller-DTO-Service when multiple operations for the same entity share dependencies (same repository, same notification logic) and benefit from being grouped.

### Service Method Count Limit

A service with 6-8 public methods is approaching the split threshold. Beyond that, consider extracting non-cohesive operations into separate services or action classes.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Shared dependencies across operations | Service risk of bloat and multiple responsibilities | Monitor method count and dependency count |
| Single class to inject in controller | More indirection than direct-to-action flow | Acceptable when service adds coordination value |
| Natural entity-oriented organization | Team must resist adding unrelated methods | Enforce cohesion rules in code review |

---

## Performance Considerations

Service resolution cost is proportional to dependency depth. A service with 4 direct dependencies (each with their own dependencies) requires ~8 container resolutions at ~0.01ms each. Stateless services bound as singletons pay this cost once per process lifetime.

---

## Production Considerations

### Service Constructor as Health Signal

A service constructor with 5+ dependencies is a warning signal. Review whether the service has too many responsibilities. A constructor with 8+ dependencies requires immediate refactoring.

### Testing Strategy

Services are tested by constructing them with real or mocked dependencies and calling methods directly — no HTTP scaffolding:

```php
$service = new UserService(
    $this->createMock(UserRepository::class),
    new PasswordHasher(),
    $this->createMock(NotificationService::class),
);
$user = $service->register($dto);
```

---

## Common Mistakes

### Injecting Request into Service
Why it happens: The service needs request data, and injecting `$request` is faster than passing DTOs. Why it's harmful: The service becomes HTTP-coupled, untestable without HTTP, and unusable from CLI/queue. Better approach: Extract all needed data into a DTO before calling the service.

### Service with Mixed Entity Responsibilities
Why it happens: `UserService` starts handling authentication, profile management, and billing queries because they all relate to "user." Why it's harmful: The service loses cohesion. Better approach: Create separate services per capability (`AuthenticationService`, `ProfileService`, `BillingService`).

### Empty CRUD Service
Why it happens: Creating a service for every entity because "the architecture requires it." Why it's harmful: A service that just calls `Model::create()` with no additional logic adds ceremony without value. Better approach: Only introduce services when there is business logic to centralize.

---

## Failure Modes

### Fat Entity Service
A `UserService` with 15+ public methods covering registration, authentication, password resets, email verification, profile management, avatar uploads, and billing. The class has 10 constructor dependencies and any change to any method risks breaking unrelated functionality.

### Service Circular Dependencies
Service A depends on Service B, which depends on Service C, which depends on Service A. The container detects this and throws a `CircularDependencyException`. Resolve by extracting the shared logic to a new service or action.

---

## Ecosystem Usage

### Laravel Spark (Billable)
Spark uses services for subscription management. The `SubscriptionService` coordinates plan changes, invoices, and payment method updates — multiple related operations under a single service.

### Monica CRM
Monica uses entity-oriented services (`ContactService`, `ActivityService`, `RelationshipService`) that follow the Controller-DTO-Service pattern extensively.

---

## Related Knowledge Units

### Prerequisites
- Thin Controller Principle — Why controllers delegate to services
- Data Transfer Object Design — DTO patterns for the typed boundary

### Related Topics
- Controller-DTO-Action Flow — The simpler alternative for discrete operations
- Service Class Design — Service patterns and conventions
- Service Orchestration — Multi-service coordination

### Advanced Follow-up Topics
- Service vs Action Decision — Decision framework for choosing between flows
- Transaction Management — Transactional boundaries in service operations

---

## Research Notes

### Source Analysis
- Monica CRM: Entity-oriented service layer with 30+ services
- Laravel Spark: SubscriptionService for billing operations
- Community convention: Service layer common in applications >50k LOC

### Key Insight
The Controller-DTO-Service flow is the most common multi-layer pattern in production Laravel applications. It balances structure (typed DTO boundaries, coordinated operations) with flexibility (service can grow in complexity). The critical risk is service bloat — requiring disciplined monitoring of method count and dependency scope.

### Version-Specific Notes
- Laravel 11+: No changes to service layer patterns
- PHP 8.1+ readonly properties enhance DTO type safety in the flow
