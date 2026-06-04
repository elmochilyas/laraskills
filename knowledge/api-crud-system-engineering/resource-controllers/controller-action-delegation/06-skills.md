# Skill: Implement Controller Action Delegation

## Purpose
Delegate business logic from controllers to action/service classes: controllers receive request, validate, authorize, then call action; actions handle business logic, return result.

## When To Use
- Controllers with business logic beyond simple CRUD
- Separation of HTTP concerns from domain logic
- Testable business logic independent of HTTP layer

## When NOT To Use
- Simple CRUD with no business logic
- Read-only endpoints returning cached data

## Prerequisites
- Action class pattern
- Dependency injection

## Inputs
- Controller actions requiring business logic

## Workflow
1. Inject action class in controller constructor or method
2. Controller validates via Form Request
3. Controller authorizes via `$this->authorize()`
4. Controller extracts DTO from validated request
5. Controller calls action with DTO: `$this->action->execute($dto)`
6. Action returns result (model, DTO, collection)
7. Controller transforms result to Resource response
8. Controller returns proper HTTP status code
9. Keep controller under 10 lines per method
10. Keep action focused on single responsibility

## Validation Checklist
- [ ] Actions injected into controller
- [ ] Form Request handles validation
- [ ] `$this->authorize()` called before action
- [ ] DTO created from validated request
- [ ] Action called with DTO
- [ ] Action result transformed to Resource
- [ ] Controller < 10 lines per method
- [ ] Action has single responsibility

## Related Skills
- Action Class Design
- Data Transfer Object Design
- Thin Controller Principle
