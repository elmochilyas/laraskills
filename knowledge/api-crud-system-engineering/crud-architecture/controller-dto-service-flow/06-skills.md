# Skill: Implement Controller-DTO-Service Flow

## Purpose
Extend request processing with a service layer between controller and data access — a multi-method service class with cohesive business logic, shared dependencies, and clean layer boundaries.

## When To Use
- Entity-centric domains (User, Order, Product) with multiple CRUD operations sharing dependencies
- When multiple operations share validation rules, query scopes, or notification logic
- Applications >50k LOC where action-per-operation creates too many files
- When a single injection point in the controller is preferred

## When NOT To Use
- Discrete operations that don't share dependencies with other operations
- Simple CRUD with no business logic beyond `Model::create()` — service adds ceremony
- When service would have only 1-2 methods — prefer direct action delegation
- When service constructor would have 5+ dependencies — too many responsibilities

## Prerequisites
- Thin controller principle
- Service class design patterns

## Inputs
- Entity business logic
- Shared dependency specifications

## Workflow
1. Create service class per domain entity — `UserService`, `OrderService`, `ProductService`
2. Limit service public methods to 6-8 maximum — extract non-cohesive methods
3. Limit constructor dependencies to 5 — split service when exceeded
4. Keep service stateless — all state via method parameters, no mutable properties
5. Never inject `Request` or `Response` into service — HTTP coupling
6. Construct DTO in controller, pass to service method — never loose parameters
7. Service may delegate to action classes internally — actions remain independently testable
8. Test services directly by constructing DTOs and calling methods — no HTTP

## Validation Checklist
- [ ] Service is stateless (no per-request mutable properties)
- [ ] Service constructor has <5 dependencies
- [ ] Service has <8 public methods
- [ ] Service does not import HTTP-related classes
- [ ] Service methods accept DTOs, not `$request`
- [ ] Service is testable without HTTP scaffolding
- [ ] Service methods are cohesive (same domain capability)

## Common Failures
- Injecting Request into Service — HTTP-coupled, untestable
- Service with mixed entity responsibilities — split by capability
- Empty CRUD service — just calls `Model::create()` with no additional logic
- Fat entity service — 15+ methods, 10+ constructor dependencies

## Decision Points
- Service vs action class — service for related operations, action for single operation
- Interface vs concrete service — interface for polymorphism, concrete for simplicity
- Service bound as singleton — stateless services safe, stateful dangerous

## Performance Considerations
- Service resolution proportional to dependency depth (~0.01ms each)
- Stateless services as singletons pay resolution cost once per process
- Compared to database queries (1-50ms), service overhead irrelevant

## Security Considerations
- Never inject Request/Response — creates HTTP coupling
- Authorization in controller or passed as actor parameter
- Services should not implicitly trust DTO data — business rule validation in service

## Related Rules
- Keep Service Public Methods to 6-8 Maximum
- Limit Constructor Dependencies to 5
- Never Inject Request or Response into Services
- Keep Services Stateless
- Construct DTOs Before Calling Service
- Test Services Directly Without HTTP

## Related Skills
- Controller-DTO-Action Flow — simpler alternative for discrete ops
- Service Class Design — service patterns and conventions
- Service Orchestration — multi-service coordination
- Thin Controller Principle — why controllers delegate to services

## Success Criteria
- Service groups related operations with shared dependencies
- Service remains stateless and testable without HTTP
- Method count stays under 8, dependencies under 5
- No HTTP imports in service layer
- DTOs form typed boundary between HTTP and service