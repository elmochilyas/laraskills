# ECC Standardized Knowledge — Controller-DTO-Service Flow

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Controller-DTO-Service Flow |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

The Controller-DTO-Service flow extends the basic delegation pattern by introducing a service layer between the controller and data access. The controller constructs a DTO from validated HTTP input, delegates to a service (a multi-method class with cohesive business logic), and the service coordinates the operation internally — potentially calling multiple actions, repositories, or other services. This pattern is chosen over Controller-DTO-Action when an entity requires multiple related operations that share dependencies and business rules. The service balances structure vs ceremony — grouping related operations under a single class with shared dependencies.

## Core Concepts

- **Four-Layer Flow**: Controller → DTO → Service → Response. The service is a multi-method class that coordinates operations for a domain entity.
- **Service as Coordinator**: The service may call repositories, dispatch events, manage transactions, or delegate to action classes. The controller only knows about the service.
- **Service Statelessness**: Services must be stateless — no per-request mutable state. All request-specific data arrives through method parameters.
- **Method Parameters vs Constructor Injection**: Request-specific data (user ID, DTOs) must be method parameters; transport-specific objects (Request, Response) must never enter the service layer.
- **Service as Facade**: The controller sees a simple method call (`$service->register($dto)`), while the service internally coordinates multiple steps.

## When To Use

- Entity-centric domains (User, Order, Product) where multiple CRUD operations share dependencies
- When multiple operations share validation rules, query scopes, or notification logic
- Applications >50k LOC where action-per-operation creates too many files
- When a single injection point in the controller is preferred over multiple action injections

## When NOT To Use

- Discrete operations that don't share state or dependencies with other operations (use Controller-DTO-Action)
- Simple CRUD with no business logic beyond `Model::create()` — the service adds ceremony without value
- When the service would have only one or two methods — prefer direct action delegation
- When service constructor would have 5+ dependencies — indicates too many responsibilities

## Best Practices

- Limit service public methods to 6-8 — beyond that, extract non-cohesive operations into separate services
- Keep services stateless — all state arrives via method parameters
- Name services by domain entity: `UserService`, `OrderService`, `ProductService`
- Split by capability when an entity service grows: `AuthenticationService`, `ProfileService`, `BillingService`
- Test services by constructing with real or mocked dependencies and calling methods directly

## Architecture Guidelines

- A service constructor with 5+ dependencies is a warning signal; 8+ requires immediate refactoring
- Services can delegate to action classes internally — the action classes remain independently testable
- Interface bindings are needed only when polymorphism is required; concrete service classes resolve automatically
- Stateless services can safely be bound as singletons, paying resolution cost once per process lifetime

## Performance Considerations

- Service resolution cost is proportional to dependency depth: 4 dependencies × their deps ≈ 8 resolutions at ~0.01ms each
- Stateless services bound as singletons pay this cost once per process lifetime
- Compared to database query time (1-50ms), service resolution overhead is irrelevant

## Security Considerations

- Never inject `Request` or `Response` into a service — this creates HTTP coupling and bypasses request validation
- Authorization checks should happen in the controller or be passed as an authorized actor parameter
- Services should not implicitly trust DTO data — business rule validation belongs in the service method

## Common Mistakes

- **Injecting Request into Service**: Service becomes HTTP-coupled and untestable without HTTP. Solution: Extract all needed data into a DTO before calling the service.
- **Service with Mixed Entity Responsibilities**: `UserService` handles authentication, profiles, and billing. Solution: Create separate services per capability.
- **Empty CRUD Service**: Service just calls `Model::create()` with no additional logic. Solution: Only introduce services when there is business logic to centralize.
- **Fat Entity Service**: 15+ public methods and 10 constructor dependencies. Solution: Split by capability.

## Anti-Patterns

- **Service as Dumping Ground**: Every method loosely related to an entity ends up in the same service, destroying cohesion.
- **Service Circular Dependencies**: Service A depends on Service B, which depends on Service A. Resolve by extracting shared logic to a new service or action.
- **Stateful Service**: Service stores per-request data in properties, making it unsafe for singleton resolution and concurrent requests.

## Examples

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

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Thin Controller Principle | Why controllers delegate to services | Prerequisite |
| Data Transfer Object Design | DTO as typed boundary | Prerequisite |
| Service Class Design | Service patterns and conventions | Related |
| Controller-DTO-Action Flow | Simpler alternative for discrete ops | Related |
| Service Orchestration | Multi-service coordination | Follow-up |
| Service vs Action Decision | Decision framework for choosing flows | Follow-up |
| Transaction Management | Transactional boundaries in service ops | Follow-up |

## AI Agent Notes

- Controller-DTO-Service is the most common multi-layer pattern in production Laravel applications >50k LOC
- Default to Controller-DTO-Action for discrete operations; graduate to service when shared dependencies emerge
- Service bloat is the critical risk — monitor method count and dependency count
- Services are the public API for a domain entity; actions may exist as internal implementation details
- When generating services, start with the interface (if multiple implementations are anticipated) or skip the interface for single-implementation services

## Verification

- [ ] Service is stateless (no per-request mutable properties)
- [ ] Service constructor has fewer than 5 dependencies
- [ ] Service has fewer than 8 public methods
- [ ] Service does not import HTTP-related classes
- [ ] Service methods accept DTOs, not `$request`
- [ ] Service is testable without HTTP scaffolding
- [ ] Service methods are cohesive (all relate to the same domain capability)
