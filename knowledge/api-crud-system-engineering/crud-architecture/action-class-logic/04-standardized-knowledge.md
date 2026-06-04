# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Action Class Logic
**Difficulty:** Advanced
**Category:** CRUD Architecture
**Last Updated:** 2026-06-03

---

# Overview

Action Class Logic is the pattern of encapsulating single business operations into dedicated PHP classes — typically invokable, with typed parameters, typed returns, dependency injection, and domain event dispatching. Actions exist as an alternative to bloated service classes, enforcing single responsibility at the operation level rather than the service level.

Engineers must care because the gap between "thin controller" and "maintainable business logic" is where most Laravel applications accumulate complexity. Action classes provide a structured middle ground: more granular than services, more reusable than controller methods, and independently testable without HTTP concerns. They represent the "single operation, single class" philosophy that scales with application complexity.

---

# Core Concepts

**Single Responsibility:** One action class = one business operation. CreateOrder, UpdateUserProfile, SendPasswordReset. If a class does more than one thing, it's not an action.

**Invokable Pattern:** Action classes use `__invoke()` as the single entry point, making them callable as functions when resolved from the container.

**Dependency Injection:** Actions receive dependencies (repositories, other actions, services) via constructor injection. All state comes through method parameters.

**Typed Parameters:** Actions accept Data Transfer Objects (DTOs) or individually typed parameters — never raw Request objects. This decouples actions from HTTP.

**Typed Returns:** Actions return typed values — Model, DTO, bool, void. Consistent return types enable predictable composition.

**Domain Events:** Actions fire domain events for side effects (email sending, logging, cache invalidation). Events are dispatched within the action, not by the caller.

**Transaction Management:** Multi-step operations are wrapped in `DB::transaction()`. The action manages its own transactional boundary.

---

# When To Use

- Write operations more complex than 3-4 lines
- Domain operations with specific business logic
- Operations called from multiple entry points (HTTP controller, CLI command, queue job)
- Operations requiring independent unit testing
- Any operation where thin controller principle pushes logic out of controllers

---

# When NOT To Use

- Simple CRUD `create()` calls that just persist data — Eloquent directly in controller is fine
- Read queries — use query classes, repositories, or Eloquent scopes instead
- Operations with no business logic (simple pass-through to storage)

---

# Best Practices

**One action per responsibility.** CreateOrderAction creates orders. It doesn't send emails, update inventory, or log activity — those are separate concerns dispatched via events.

**Use __invoke() for single-operation actions.** If an action needs multiple public methods, it's likely a service class, not an action.

**Inject dependencies via constructor.** Never use `app()` or `resolve()` helper inside action methods. All dependencies should be explicit.

**Accept DTOs for complex parameters.** When an action needs 4+ input values, create a dedicated DTO. For 1-3 simple values, individual typed parameters are fine.

**Return typed values.** `public function __invoke(CreateUserDto $dto): User` makes the contract explicit.

**Fire events for side effects.** Email sending, cache clearing, logging, notification — dispatch events within the action, not after it returns.

---

# Architecture Guidelines

**Actions belong in the domain layer**, not the HTTP layer. They should have no knowledge of requests, responses, or HTTP concepts.

**Actions can call other actions** for composition but should prefer domain service orchestration for operations spanning multiple actions.

**Actions are registered in the container** for auto-resolution. Laravel's container resolves constructor dependencies automatically.

**Controller-to-Action flow:** Controller validates request (FormRequest) → creates DTO → resolves action from container → calls action → returns response.

**Test actions independently** by instantiating them with mocked dependencies. No HTTP kernel required.

---

# Performance Considerations

**Constructor injection is resolved once per request** — minimal overhead.

**Actions with many injected dependencies** (8+) may indicate SRP violation or excessive granularity.

**Transaction overhead** for actions that don't need multi-step DB writes. Don't wrap single-model operations in transactions unnecessarily.

---

# Security Considerations

**Actions must not receive raw request data.** Always pass validated DTOs or individual parameters. Prevents mass assignment and injection.

**Authorization should be handled before the action is called** — in the controller or middleware. Actions trust that authorization has occurred.

**Actions should still guard against unauthorized state changes.** Idempotency checks, ownership verification, and business rule enforcement belong in the action.

---

# Common Mistakes

**Action doing too much.** A "SaveOrderAction" that also sends emails, updates inventory, and logs activity violates SRP. Use events for side effects.

**Accepting Request object.** Couples the action to HTTP, making it unusable from CLI, queues, or tests.

**Returning error codes instead of exceptions.** `return ['error' => 'validation_failed']` breaks type safety. Throw domain exceptions.

**Side effects in constructor.** `__construct()` should only assign dependencies. No database calls, API requests, or business logic in constructors.

**No interface/contract.** Tight coupling to concrete action classes makes testing and substitution difficult.

---

# Anti-Patterns

**God Action:** An action class that handles "everything related to orders" — create, update, delete, archive, export, report.
**Better approach:** One class per business operation. CreateOrderAction, UpdateOrderAction, ArchiveOrderAction.

**Request-Hungry Action:** Action that type-hints the HTTP Request object as a parameter.
**Better approach:** Accept DTOs or individual typed parameters. Actions operate on data, not HTTP.

**Silent Action:** Action that returns void for operations that should indicate success or failure.
**Better approach:** Return typed values (bool, Model, DTO). Throw domain exceptions for failures.

---

# Examples

**Action class:**
```
class CreateOrderAction
{
    public function __construct(
        private OrderRepository $orders,
        private DispatchSavedEvent $dispatchSaved,
    ) {}

    public function __invoke(CreateOrderDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            $order = $this->orders->create($dto->toArray());
            $this->dispatchSaved->__invoke($order);
            return $order;
        });
    }
}
```

---

# Related Topics

**Prerequisites:**
- Dependency Injection in Laravel
- SOLID Principles — Single Responsibility

**Closely Related Topics:**
- Action Class Design — comprehensive action patterns
- Service Class Design — alternative for multi-operation classes
- Service vs Action Decision — choosing between patterns
- DTO Design — parameters for actions

**Advanced Follow-Up Topics:**
- Action Composition — combining actions
- Action Testing — unit testing action classes
- Transactional Actions — transaction management

**Cross-Domain Connections:**
- Thin Controller Principle — motivation for actions
- Domain Events — side effect management
- Queue Integration — dispatching actions to queues
