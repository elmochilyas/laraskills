# Skill: Implement and Dispatch Actions

## Purpose
Implement action classes for single-responsibility write operations: create, update, delete, and domain actions, with dependency injection, return type hints, and invokable pattern.

## When To Use
- Write operations more complex than 3-4 lines
- Domain operations specific to business logic
- Separation of controller and business layer

## When NOT To Use
- Simple CRUD `create()` calls in controller — Eloquent suffices
- Read queries — use query classes, repositories, or scopes

## Prerequisites
- SOLID principles understanding
- Dependency injection

## Inputs
- Business operation specifications
- Model relationships involved

## Workflow
1. Create action class per single responsibility: `CreateOrderAction`, `UpdateUserProfileAction`
2. Use `__invoke()` for invokable action classes: `class CreateOrderAction { public function __invoke(...) { ... } }`
3. Inject dependencies in constructor (repositories, other actions, services)
4. Accept typed parameters (DTO or individual params) — never raw request data
5. Return typed response (model, DTO, boolean, void) — consistent return types
6. Handle domain events — fire within action, not in controller
7. Use transactions for multi-step operations — `DB::transaction()`
8. Keep action stateless — all state via parameters
9. Register action in container for auto-resolution
10. Error handling within action — throw domain exceptions, don't return error codes

## Validation Checklist
- [ ] Action class created per single responsibility
- [ ] `__invoke()` method used for invokable pattern
- [ ] Constructor injection for dependencies
- [ ] Typed parameters (DTO or individual params)
- [ ] Typed return values
- [ ] Domain events fired within action
- [ ] Multi-step operations wrapped in DB::transaction()
- [ ] Action is stateless — all state via parameters
- [ ] Action registered in container
- [ ] Domain exceptions thrown for business failures

## Common Failures
- Action doing too much — multiple responsibilities violate Single Responsibility
- Accepting `Request` object in action — couples action to HTTP layer, hard to test
- Returning error codes instead of throwing exceptions — breaks type safety
- Side effects in constructor — actions should be instantiable without running logic
- No interface/contract — tight coupling to concrete action class
- Actions calling other actions directly — should use composition through domain services

## Decision Points
- Invokable vs named method — invokable for single-method actions, named methods for multi-method
- DTO params vs individual params — DTO for >3 params, individual for simple cases
- Action vs service class — action for single operation, service for related operations

## Performance Considerations
- Constructor injection resolved once per request — minimal overhead
- Actions with many injected dependencies may indicate SRP violation
- Transaction overhead for actions that don't need multi-step DB writes — don't wrap in transaction unnecessarily

## Security Considerations
- Actions should not receive raw request data — prevents mass assignment and injection
- Authorization in action or controller — controller sets authorization, action trusts it
- Actions should guard against unauthorized state changes — check permissions if controller didn't

## Related Rules
- Create Action Classes Per Single Responsibility
- Use Invokable Classes for Action Pattern
- Inject Dependencies via Constructor
- Accept Typed Parameters Not Request Objects
- Return Typed Values For Predictability
- Fire Domain Events Within Actions

## Related Skills
- Data Transfer Object Design — for action parameter DTOs
- Action Class Testing — for testing action logic
- Domain Event Dispatching — for event-driven action design

## Success Criteria
- Each write operation has a single action class with clear responsibility
- Actions are stateless and testable independently of HTTP layer
- Domain events fired within actions for cross-cutting concerns
- Multi-step operations use database transactions
- Actions throw domain exceptions for business logic failures
- Actions can be called from multiple entry points (HTTP, CLI, queue)
