# ECC Standardized Knowledge — Service Class Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Service Class Design |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

A service class is a multi-method class that groups related business operations organized by entity or domain capability. Unlike action classes (single-purpose, reusable), service classes provide cohesive method groupings for related operations — `UserService` with methods for register, update, suspend, and deactivate. The framework does not define a service layer; it is a pure architectural convention. A well-designed service is stateless, transport-agnostic, injected with its dependencies via constructor promotion, and testable without booting the framework.

## Core Concepts

- **Entity-Oriented (Noun-based)**: Services named after domain entities (`UserService`, `OrderService`). Predictable navigation but risks unbounded growth.
- **Capability-Oriented (Verb-based)**: Services organized around business processes (`AuthenticationService`, `CheckoutService`). Cohesive by design but harder to locate.
- **Statelessness Requirement**: Services must hold no per-request mutable state. All state arrives through method parameters. Stateless services are trivially testable and safe under Octane and queue workers.
- **Service Evolution Stages**: Stage 1 (Thin CRUD aggregator) → Stage 2 (Business logic centralization) → Stage 3 (Multi-service orchestrator) → Stage 4 (Event-driven split).
- **Fat Service Detection**: 5+ constructor dependencies suggests too many concerns. 10+ public methods suggests splitting is needed. If two methods don't share 50% of dependencies, they belong in different services.

## When To Use

- Multiple related operations that share dependencies (same repository, same notification logic)
- Entity-centric domains where grouping by entity provides natural navigation
- Applications >50k LOC where action-per-operation creates too many files
- When a single injection point in the controller is preferred over multiple action injections

## When NOT To Use

- Discrete operations that don't share dependencies with other operations (use actions instead)
- Simple CRUD with no business logic beyond `Model::create()` — the service adds ceremony without value
- When the service would have only one or two methods — prefer direct action delegation
- When the service would become a dumping ground for unrelated operations

## Best Practices

- Keep services stateless — no mutable properties, all state via method parameters
- Monitor constructor dependency count: 5+ is a warning, 8+ requires immediate refactoring
- Monitor public method count: 10+ suggests splitting by capability
- Use the cohesion check: if two methods don't share 50% of their dependencies, they belong in different services
- Place services in `app/Services/`, not under `app/Http/` — they are transport-agnostic
- Inject concrete classes by default; add interfaces only when polymorphism is required

## Architecture Guidelines

- Entity-oriented services are the default for CRUD-heavy domains
- Capability-oriented services are preferred for cross-cutting processes (checkout, export, authentication)
- Services may call sub-actions internally — the actions remain independently testable
- Services must NOT import HTTP-related classes (Request, Response)
- Singleton registration is safe only if the service is stateless
- Framework does not enforce service conventions — discipline must come from team rules

## Performance Considerations

- Container resolution cost is proportional to dependency depth — 4 direct dependencies with transitive deps adds ~0.05ms
- Singletons eliminate resolution cost after first resolution
- Stateless services registered as singletons pay resolution cost once per process lifetime

## Security Considerations

- Never inject `Request` into a service — pass request-specific data as method parameters
- Authorization checks should happen in the controller or be passed as an authorized actor parameter
- Services should not implicitly trust DTO data — business rule validation belongs in the service method
- Stateless services prevent cross-request data leaks under Octane

## Common Mistakes

- **The Fat Service Anti-Pattern**: Every new feature adds one more method to an existing service. Solution: When adding a method requiring new dependencies, consider if it deserves its own service or action class.
- **Empty Forwarding Service**: Service just calls `Model::create()` with no additional logic. Solution: Only create services when there is business logic to centralize.
- **Injecting HTTP Dependencies**: Service injects `Request` to get the current user. Solution: Pass request-specific data as method parameters.
- **Stateful Service**: Service stores per-request data in mutable properties. Solution: Keep services stateless — all state via method parameters.

## Anti-Patterns

- **God Service**: 20+ methods across unrelated domains with 12 constructor dependencies. Testing requires mocking unrelated dependencies.
- **Constructor Explosion**: 8+ constructor parameters. The class has absorbed too many responsibilities. New team members cannot understand its purpose.
- **Hidden State Leaks**: Mutable properties on a singleton service. Under Octane, one request's state leaks to the next.
- **Service Under Http/**: Placing services in `app/Http/Services/` signals they are HTTP-coupled, violating transport-agnostic design.

## Examples

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

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Service Container Basics | Container resolution for services | Prerequisite |
| Thin Controller Principle | Why services exist as delegation targets | Prerequisite |
| Service Orchestration | Multi-service coordination | Related |
| Service vs Action Decision | Choosing between services and actions | Related |
| Repository Pattern Design | Repository injection in services | Related |
| Transaction Management | Transaction boundaries in services | Follow-up |
| Domain vs Application Services | DDD service layering | Follow-up |

## AI Agent Notes

- The service class is the most flexible and most dangerous pattern in CRUD architecture — flexible because it imposes no constraints, dangerous because no guardrails prevent bloat
- Default to action classes for discrete operations; graduate to services when shared dependencies emerge
- Services are not framework-enforced — discipline must come from team conventions
- When generating services, start with entity-oriented naming; split by capability as the service grows
- Monitor constructor dependencies as a health signal — 5+ is a warning, 8+ requires refactoring

## Verification

- [ ] Service is stateless (no per-request mutable properties)
- [ ] Service constructor has fewer than 5 dependencies
- [ ] Service has fewer than 10 public methods
- [ ] Service does not import HTTP-related classes
- [ ] Service methods accept DTOs, not `$request`
- [ ] Service is testable without HTTP scaffolding
- [ ] Service methods are cohesive (share 50%+ of dependencies)
- [ ] Service is in `app/Services/`, not under `app/Http/`
