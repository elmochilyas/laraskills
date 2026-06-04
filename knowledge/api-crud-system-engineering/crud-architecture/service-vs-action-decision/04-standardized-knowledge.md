# ECC Standardized Knowledge — Service vs Action Decision

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Service vs Action Decision |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

The service vs action decision is one of the most common architectural choices in Laravel CRUD design. Actions are single-purpose classes that handle one operation. Services are multi-method classes that group related operations. The rule of thumb: start with an action; promote to a service when 3+ related operations share the same dependencies. Choosing correctly determines whether the codebase remains navigable and cohesive or becomes a dumping ground for misplaced logic.

## Core Concepts

- **Action Characteristics**: One public method, single purpose, few dependencies (1-3), independently testable, transaction boundary per operation, named by verb (`CreateUserAction`).
- **Service Characteristics**: Multiple public methods, entity or capability grouping, shared dependencies across methods, single injection point for controllers, named by noun (`UserService`).
- **Decision Matrix**: 1-2 operations → Action, 3+ operations with shared deps → Service. Low dependency sharing → Action, High dependency sharing → Service.
- **Hybrid Approach**: Services for core entities, actions for specific discrete operations. Most large codebases use both.

## When To Use

- Actions for discrete write operations (create user, delete product, cancel order)
- Actions when operations don't share dependencies with other operations
- Actions when maximum test isolation per operation is desired
- Services when 3+ related operations share the same dependencies
- Services when controller would need to inject 4+ individual actions
- Hybrid approach as the production-proven default

## When NOT To Use

- Dogmatic adherence to one pattern — forces the wrong pattern for certain operations
- Promoting to service too early — a service with 1-2 methods adds ceremony without value
- Keeping actions in a service that never grows beyond 1-2 methods
- Mixed inconsistency — no consistent decision logic across the codebase

## Best Practices

- Default to actions for new operations — promote to service when 3+ related operations exist
- Use the decision questions: How many operations? Share dependencies? Called together? Cross-cutting? Will it grow?
- Document the team's decision framework to ensure consistency
- In code review: if an action has 2+ public methods, is it really an action? If a service has 10+ methods, should some be extracted?
- Services can delegate to actions internally — actions remain the building blocks

## Architecture Guidelines

- Actions maximize isolation and clarity per operation; services maximize shared context and minimize injection points
- The best codebases use both, choosing based on operation grouping and dependency sharing
- Moving from actions to services is straightforward — inject actions into a service and expose their methods
- Moving from services to actions requires extracting each method into its own class
- The cost of choosing wrong is low — refactoring between patterns is straightforward

## Performance Considerations

- No meaningful performance difference — both patterns add ~0.01ms for container resolution
- The choice is purely architectural, not performance-driven

## Security Considerations

- Both patterns support authorization equally — the choice does not affect security posture
- Services with many methods may inadvertently share security context across unrelated operations — ensure authorization is per-method, not per-class

## Common Mistakes

- **Dogmatic Adherence to One Pattern**: Action-only or service-only forces the wrong pattern. Solution: Use both pragmatically based on the decision framework.
- **Promoting to Service Too Early**: Creating service classes for entities with 1-2 operations. Solution: Start with actions; add the service when the third operation emerges.
- **Keeping Actions in a Service That Doesn't Grow**: Service exists with 1 method for months. Solution: Don't create the service until multiple operations justify it.
- **Mixed Inconsistency**: No consistent decision logic — developers don't know where to find logic. Solution: Enforce the decision framework as a team convention.

## Anti-Patterns

- **Decision Paralysis**: Teams spend more time debating action vs service than writing code. Both work; refactoring is straightforward.
- **Fat Service from the Start**: Creating a service with 10 methods on day one because "we'll need them." Most methods never get implemented.
- **Anemic Action Library**: 50 action classes, each with one method that just calls `Model::create()`. No business logic — just ceremony.

## Examples

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

### Typical Evolution Pattern
```
Months 1-6:  Actions for everything
Months 6-12: Extract services for core entities (User, Order)
Months 12+:  Hybrid — services for entities, actions for specific workflows
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Action Class Design | What actions are | Prerequisite |
| Service Class Design | What services are | Prerequisite |
| Controller-DTO-Action Flow | Action-based delegation | Related |
| Controller-DTO-Service Flow | Service-based delegation | Related |
| Domain vs Application Services | DDD service distinctions | Follow-up |
| Architectural Decision Records | Documenting the decision | Follow-up |

## AI Agent Notes

- The decision is not right-or-wrong — it's a tradeoff in code organization
- Default to actions for new code; graduate to services when shared dependencies emerge
- The best codebases use both patterns, choosing based on operation grouping and dependency sharing
- When generating code, default to an action. Only generate a service when the entity clearly has 3+ related operations.
- The cost of refactoring between patterns is low — don't overthink the decision

## Verification

- [ ] 1-2 operations with few dependencies → Action pattern
- [ ] 3+ operations with shared dependencies → Service pattern
- [ ] Decision framework is documented and applied consistently
- [ ] Services are not created prematurely for single-method entities
- [ ] Actions are not artificially grouped into services that don't add value
- [ ] Code review enforces the team's action vs service conventions
- [ ] Migration path is understood for refactoring between patterns
