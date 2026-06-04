# Service vs Action Decision

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Service vs Action Decision
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

The service vs action decision is one of the most common architectural choices in Laravel CRUD design. Both patterns encapsulate business logic, but they differ in scope and grouping. Actions are single-purpose classes that handle one operation. Services are multi-method classes that group related operations. Choosing correctly determines whether the codebase remains navigable and cohesive or becomes a dumping ground for misplaced logic.

The decision framework is based on operation scope, dependency sharing, and complexity. Discrete write operations (create user, delete product) default to actions. Entity-centric operations with shared dependencies (user management, order processing) default to services. The rule of thumb: start with an action; promote to a service when 3+ related operations share the same dependencies.

---

## Core Concepts

### Action Characteristics
- One public method
- Single purpose ("register user", not "manage users")
- Few constructor dependencies (1-3 typical)
- Independently testable
- Transaction boundary per operation
- Named by verb: `CreateUserAction`, `CancelOrderAction`

### Service Characteristics
- Multiple public methods
- Entity or capability grouping ("UserService", "CheckoutService")
- Shared dependencies across methods
- Controllers inject the service, not individual actions
- Named by noun: `UserService`, `InventoryService`

### Decision Matrix

| Criterion | Action | Service |
|-----------|--------|---------|
| Number of related operations | 1-2 | 3+ |
| Dependency sharing across ops | Low | High |
| Operation complexity | Simple to moderate | Simple to complex |
| Cross-entity coordination | Internal action composition | Service orchestration |
| Test isolation per operation | Action tested alone | Service method tested with shared setup |

---

## Mental Models

### The Toolbox vs The Specialist

Actions are specialists — each has one tool and one job. Services are toolboxes — they hold related tools and you reach for the toolbox when you need to do multiple related jobs.

### The Growth Path

Start with a specialist (`CreateUserAction`). When you have 3+ specialists who all need the same tools (UserRepository, PasswordHasher), pack them into a toolbox (`UserService`).

---

## Internal Mechanics

### Action Resolution

Actions are single-method classes resolved by the container when type-hinted. Each action carries only the dependencies needed for its single operation. The container instantiates the action, resolves its constructor parameters, and the action's `execute()` method is called. Because dependencies are minimal, resolution is fast and the class is trivially testable in isolation.

### Service Resolution

Services are multi-method classes resolved once and shared across all calling methods within the same request. The container resolves all constructor dependencies once, caching the resolved instance. Subsequent calls to the same service within the request reuse the same instance. Service dependencies are resolved once regardless of how many methods are called.

### Under-the-Hood Differences

The key difference is dependency scope. An action's dependencies are scoped to a single operation — `CreateUserAction` requires only `UserRepository` and `PasswordHasher`. A service's dependencies are scoped to the entity — `UserService` requires `UserRepository`, `PasswordHasher`, `EmailService`, `AuditLogger`, and `NotificationService` because all of these are needed across its various methods. The container handles both patterns identically; the difference is purely one of class design and dependency breadth.

---

## Decision Framework

### Questions to Ask

1. **How many operations does this entity need?** 1-2: Use actions. 3+: Consider a service.
2. **Do the operations share dependencies?** If `createUser`, `updateUser`, and `suspendUser` all need `UserRepository` and `PasswordHasher`, grouping may help.
3. **Will the operations be called together?** If the controller injects 4+ individual actions, consider grouping them into a service.
4. **Is the operation cross-cutting?** Actions that span multiple entities (e.g., transfer funds between accounts) may still be actions if they're discrete.
5. **Will the operations grow?** If you anticipate 5+ operations, start with a service to avoid refactoring later.

### Default Recommendation

```php
// DEFAULT: Start with an action
class CreateUserAction { public function execute(CreateUserDto $dto): User }

// PROMOTE to service when 3+ related operations exist
class UserService
{
    public function create(CreateUserDto $dto): User;
    public function update(UpdateUserDto $dto): User;
    public function suspend(int $userId): void;
}
```

---

## Patterns

### Action as Building Block, Service as Facade

```php
// Actions as implementation details
class UserService
{
    public function __construct(
        private CreateUserAction $createUser,
        private UpdateUserAction $updateUser,
        private DeleteUserAction $deleteUser,
    ) {}

    public function register(RegisterUserDto $dto): User
    {
        return $this->createUser->execute($dto);
    }
}

// Controller only knows the service
class UserController
{
    public function __construct(private UserService $users) {}
}
```

### Mixed Codebase

Most large codebases use both — services for core entities, actions for specific operations:

```php
// Services for core entity operations
UserService, OrderService, InvoiceService

// Actions for specific, discrete operations
GenerateReportAction, ProcessRefundAction, ImportUsersAction
```

---

## Architectural Decisions

### The Team Convention

The most important decision is consistency. Whether the team chooses actions, services, or a hybrid, the pattern must be applied consistently. A codebase where some entities have services and others have actions with no consistent reasoning is confusing.

### Migration Path

Moving from actions to services is straightforward — inject actions into the service and expose their methods. Moving from services to actions requires extracting each service method into its own class — more work but the service provides a natural grouping to guide the extraction.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Actions: maximum test isolation | Actions: more files per entity | Higher file count but simpler tests |
| Services: shared setup and dependencies | Services: risk of bloat | Monitor method count |
| Actions: clear single responsibility | Services: method count grows invisibly | Regular architecture reviews needed |
| Services: single class to inject | Actions: controller may need many injections | Use constructor injection grouping |

---

## Performance Considerations

No meaningful performance difference. Both patterns add ~0.01ms for container resolution. The choice is architectural, not performance-driven.

---

## Production Considerations

### Code Review Checklist

- If an action has 2+ public methods, is it really an action?
- If a service has 10+ methods, should some be extracted?
- If the controller injects 5+ individual actions, should they be grouped into a service?
- If a service method has dependencies not used by other methods, should it be an action?

### Evolution in Practice

Most teams report:
- Months 1-6: Use actions for everything
- Months 6-12: Extract services for core entities (User, Order)
- Months 12+: Hybrid — services for entities, actions for specific workflows

---

## Common Mistakes

### Dogmatic Adherence to One Pattern
Why it happens: "We're an action-only team" or "We're a service-only team." Why it's harmful: Forces the wrong pattern for certain operations. Some operations benefit from service grouping; others are cleaner as isolated actions. Better approach: Use both pragmatically based on the decision framework.

### Promoting to Service Too Early
Why it happens: Creating service classes for entities with 1-2 operations "because we'll add more later." Why it's harmful: Premature abstraction. The service is empty (one method) and adds ceremony without value. Better approach: Start with actions. Add the service when the third operation emerges.

### Keeping Actions in a Service That Doesn't Grow
Why it happens: Creating `UserService` with only `createUser()` for months. Why it's harmful: The service exists but adds no value over a direct action. Better approach: Don't create the service until multiple operations justify it.

---

## Failure Modes

### Decision Paralysis
Teams spend more time debating action vs service than writing code. Both patterns work. The cost of choosing wrong is low — refactoring from one to the other is straightforward.

### Mixed Inconsistency
Some entities use services, others use actions, with no consistent decision logic. Developers don't know where to find logic for a given operation. Enforce the decision framework as a team convention.

---

## Ecosystem Usage

### Laravel Jetstream
Pure action-based. No service classes. Every team operation is an action.

### Monica CRM
Primarily service-based for core entities. Uses actions sparingly.

### Most Production Codebases
Hybrid — services for entities with 3+ operations, actions for specific workflows.

---

## Related Knowledge Units

### Prerequisites
- Action Class Design — What actions are
- Service Class Design — What services are

### Related Topics
- Controller-DTO-Action Flow — Action-based delegation
- Controller-DTO-Service Flow — Service-based delegation

### Advanced Follow-up Topics
- Domain vs Application Services — DDD service distinctions
- Architectural Decision Records — Documenting the decision

---

## Research Notes

### Source Analysis
- Laravel Jetstream: Pure action pattern from framework authors
- Monica CRM: Entity service pattern from production open source
- Community survey (2024): 60% hybrid, 25% action-only, 15% service-only

### Key Insight
The service vs action decision is not a right-or-wrong choice — it's a tradeoff in code organization. Actions maximize isolation and clarity per operation. Services maximize shared context and minimize injection points. The best codebases use both, choosing based on operation grouping and dependency sharing.

### Version-Specific Notes
- No Laravel version-specific changes — this is an architectural decision, not a framework feature
- PHP 8+ constructor promotion makes both patterns equally concise
