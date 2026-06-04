# Action Class Logic

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** crud-architecture
- **Knowledge Unit:** Action Class Logic
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Action Class Logic encapsulates a single business operation into a dedicated class, moving logic out of controllers and into testable, reusable action objects. This pattern is central to Laravel CRUD architecture, enabling thin controllers and rich domain logic.

---

## Core Concepts
- **Single Responsibility**: Each action class handles exactly one business operation (e.g., `CreateUserAction`, `SendPasswordResetAction`)
- **Invokable Actions**: Using `__invoke()` to make action classes callable like functions
- **Controller Delegation**: Controllers receive form request data and delegate to action classes
- **Action Return Values**: Actions return DTOs, models, or result objects rather than HTTP responses
- **Action Composition**: Combining multiple action classes into complex workflows
- **Transactional Actions**: Wrapping action logic in database transactions

---

## Mental Models
1. **Assembly Line Model**: The controller is a conveyor belt that passes raw materials (request data) to action workers. Each action performs one operation and passes the result to the next.
2. **Recipe Card Model**: An action is a recipe card describing exactly one dish — ingredients (inputs), steps (logic), and result (output). Follow the recipe to reproduce the same result every time.

---

## Internal Mechanics
The controller receives the request and validates it through a form request. The validated data is passed to the action class (via Laravel's service container). The action executes business logic (validation, database operations, event dispatching) and returns a result. The controller formats the result into an HTTP response. Actions can be unit-tested independently of HTTP.

---

## Patterns

### Pattern 1: Single Action Class
**Purpose**: One invokable class per business operation
**Benefits**: Simple, clear, easy to test
**Tradeoffs**: Leads to many classes; requires discipline in organization

### Pattern 2: Action with Handle Method
**Purpose**: Use `handle()` instead of `__invoke()` for more explicit semantics
**Benefits**: Clear method name; multiple methods possible
**Tradeoffs**: Loses the callable convenience of `__invoke`

---

## Architectural Decisions
### When To Use
- CRUD-heavy applications with clear business operations
- APIs with complex business logic beyond simple CRUD
- Teams that value testability and separation of concerns

### When To Avoid
- Simple CRUD operations that map directly to Eloquent (use controllers directly)
- Prototypes where speed trumps architecture
- Controllers that only call Eloquent methods (over-engineering)

### Alternatives
- Service classes for grouped related operations
- Repository pattern for data access abstraction
- Direct Eloquent in controllers for trivial CRUD

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Highly testable business logic | Many files and classes | Use directory conventions for organization |
| Thin controllers | Action class boilerplate | Balance with controller simplicity |
| Reusable operations | Action discovery can be hard | Use consistent naming conventions |
| Transactional integrity | Over-abstraction for simple cases | Use actions only when logic is non-trivial |

---

## Performance Considerations
- Action class resolution via the container is negligible (~1ms)
- Each action should be stateless to avoid memory leaks
- For high-throughput endpoints, consider caching action class resolutions

---

## Production Considerations
- Log action execution for audit trails
- Use Laravel's event system to fire events after action completion
- Monitor action execution duration for performance regression
- Document action class inputs and outputs for team understanding

---

## Common Mistakes
**Actions that return HTTP responses**: Actions should return domain objects, not responses. Controllers handle HTTP concerns.
**Giant actions that do too much**: An action should have one reason to change. If an action has multiple responsibilities, split it.
**Actions with side effects**: Actions should declare their side effects (database writes, event dispatches) explicitly.

---

## Failure Modes
**Transactionally inconsistent actions**: An action that partially fails leaves data in an inconsistent state. *Detection:* Data integrity checks. *Mitigation:* Wrap write operations in `DB::transaction()`.
**Action logic duplication**: Similar logic in multiple action classes. *Detection:* Code review. *Mitigation:* Extract shared logic into services or traits.

---

## Ecosystem Usage
Laravel doesn't prescribe action classes but the pattern is widely used in the community. Packages like `spatie/laravel-action` provide an action base class with features like validation, authorization, and job queuing built in.

---

## Related Knowledge Units
### Prerequisites
- Controller-Service-Repository flow
- Service container and dependency injection

### Related Topics
- DTO construction patterns
- Service class design
- Transactional actions

### Advanced Follow-up Topics
- Action queuing for async operations
- Action event hooks and observers
- Action monitoring and metrics

---

## Research Notes
- The action pattern (also called "Command pattern") is recommended by Laravel creator Taylor Otwell for complex operations
- Actions work well with PHP 8 attributes for routing, middleware, and authorization
- Spatie's laravel-action package offers validation and authorization within the action class itself
