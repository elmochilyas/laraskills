# Skill: Implement Service Class Design

## Purpose
Create service classes for complex business operations involving multiple models or actions: stateless, injectable, with single responsibility and return type hints.

## When To Use
- Operations involving multiple models
- Business logic shared across multiple entry points
- Complex workflows beyond single action

## When NOT To Use
- Simple CRUD operations — use action classes
- Single-model operations — use action class

## Prerequisites
- SOLID principles
- Dependency injection

## Inputs
- Business operation specifications

## Workflow
1. Create service class per domain: `OrderService`, `PaymentService`, `NotificationService`
2. Keep service stateless — all state via parameters
3. Inject dependencies via constructor
4. Define public methods for each operation
5. Return typed results — never mixed returns
6. Use DTOs for complex parameters
7. Throw domain exceptions for business failures
8. Register service in container for auto-resolution
9. Test service independently of HTTP layer
10. Keep service focused on single domain

## Validation Checklist
- [ ] Service class per domain
- [ ] Stateless — all state via parameters
- [ ] Constructor injection
- [ ] Typed public methods
- [ ] DTOs for complex parameters
- [ ] Domain exceptions for failures
- [ ] Registered in container
- [ ] Independently testable
- [ ] Single domain responsibility

## Related Skills
- Action Class Design
- Service vs Action Decision
- Service Orchestration
