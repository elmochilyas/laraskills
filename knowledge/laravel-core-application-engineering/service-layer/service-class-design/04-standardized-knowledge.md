# ECC Standardized Knowledge — Service Class Design

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Service Layer Pattern |
| **Knowledge Unit** | Service Class Design |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Business Logic |
| **Last Updated** | 2026-06-02 |

---

## Overview

Service classes organize related business operations around an entity or capability. Unlike actions (which are single-method), services have multiple related methods grouped by domain concept — `UserService` with `register()`, `update()`, `suspend()`, `activate()`. Services are the orchestrators and organizers of business logic.

Service class design focuses on: method granularity (how many operations per service), constructor injection (shared dependencies), state management (stateless vs stateful), and the boundary between the service layer and the controller layer.

---

## Core Concepts

### Entity-Oriented Services
Grouped by business entity: `UserService`, `OrderService`, `InvoiceService`. Methods relate to that entity.

### Capability-Oriented Services
Grouped by capability: `AuthenticationService`, `NotificationService`, `PaymentService`. Methods relate to that capability.

### Constructor Injection
Dependencies are injected via constructor and available to all methods. Shared dependencies (repositories, gateways, loggers) live here.

### Method Granularity
Each method should be a single, complete operation. Methods that exceed 20-30 lines likely need extraction.

---

## When To Use

- Multiple related operations on the same entity
- Operations that share dependencies (same repository, same gateway)
- Orchestration workflows that coordinate multiple steps
- Business logic that doesn't fit the single-action pattern

---

## When NOT To Use

- Single operations with no shared dependencies (use actions)
- Operations called from multiple entry points needing isolated testing (use actions)
- CRUD pass-through to Eloquent (use models directly)

---

## Best Practices

### Make Services Stateless
Services should not capture per-call state on `$this`.

**Why:** Stateless services are safe in Octane/RoadRunner, composable without side effects, and trivially testable. Stateful services leak data across requests in long-lived processes.

### Keep Constructor Dependencies Under 8
Inject repositories, gateways, and infrastructure — not request data.

**Why:** Constructor parameter count correlates with responsibility scope. High count means the service is coupled to too many subsystems.

### Name Methods as Operations, Not HTTP Actions
Use `register()` not `store()`, `suspend()` not `disable()`.

**Why:** Method names should reflect business operations, not HTTP verbs. Services should not know about HTTP.

### Return Typed Results
Each method should return a typed result — Model, DTO, bool, void, or custom result object.

**Why:** Typed return values are contracts. Callers know what to expect without reading the implementation.

---

## Architecture Guidelines

### Service Structure
```php
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private InventoryService $inventory,
    ) {}

    public function place(Cart $cart, User $user): Order { /* ... */ }
    public function cancel(Order $order): void { /* ... */ }
    public function ship(Order $order): void { /* ... */ }
}
```

### Controller → Service Flow
```
Controller → extracts data from request → calls service method
Service → performs operation → returns result
Controller → formats result as HTTP response
```

---

## Common Mistakes

### 40-Method Services
Desc: Service with dozens of unrelated methods.
Cause: Adding every operation to the same service class.
Consequence: Violates single responsibility; hard to navigate and test.
Better: Split into multiple services or extract to actions.

### Stateful Services
Desc: Setting `$this->property` during method execution.
Cause: Familiarity with stateful OOP patterns.
Consequence: Not safe in Octane/RoadRunner; state leaks between requests.
Better: Return results; don't store state on the instance.

### HTTP Dependencies in Services
Desc: Injecting Request, Session, or Response into services.
Cause: Convenience — controller already has these.
Consequence: Service coupled to HTTP; cannot be used from CLI/queue.
Better: Extract data from HTTP objects in the controller; pass plain data to services.

---

## Anti-Patterns

### God Service
A single service class with 20+ methods covering every operation for a domain. This is the most common Laravel anti-pattern. Split by responsibility or extract complex operations to actions.

### Service as Controller Helper
A service that exists only to shorten the controller — no real encapsulation or business logic. If the service is just a pass-through to Eloquent, it adds no value.

---

## Examples

### Entity-Oriented Service
```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
    ) {}

    public function register(RegisterUserData $data): User
    {
        return $this->users->create([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $this->hasher->hash($data->password),
        ]);
    }

    public function suspend(User $user): void
    {
        $user->update(['suspended_at' => now()]);
    }
}
```

---

## Related Topics

### Prerequisites
- **Service Container Basics** — Constructor DI resolution
- **Controller Architecture** — Services as delegation targets

### Closely Related
- **Naming Conventions** — Service class naming patterns
- **Service Orchestration** — Complex workflow coordination
- **Stateless Service Design** — Ensuring services are safe in any runtime

### Advanced
- **Service vs Action Decision** — Choosing between patterns
- **Domain vs Application Services** — Architectural distinction

---

## AI Agent Notes

### Important Decisions
- Entity-oriented: one service per business entity
- Capability-oriented: one service per cross-cutting capability
- Services are stateful in dependencies, stateless in execution
- Constructor injection is the primary DI mechanism

### Important Constraints
- Services must not depend on HTTP (Request, Session, Response)
- Services must be stateless in execution (no mutable properties)
- Methods should return typed results
- Max 8 constructor dependencies as guideline

---

## Verification

This document has been validated against:
- Community consensus (Spatie, Tighten, Beyond Code)
- Production service class patterns
- Octane/RoadRunner compatibility requirements
