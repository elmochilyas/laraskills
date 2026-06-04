# Skill: Implement Controller-DTO-Action Flow

## Purpose
Implement the standard three-layer request processing pattern: controller handles HTTP, DTO provides type-safe data contract, action executes single business operation — with clean layer boundaries and testability.

## When To Use
- Discrete CRUD operations (create user, update profile, place order)
- When each operation maps to a single action class
- Applications with <50 models where full service layer adds ceremony
- When independent testability of business logic without HTTP is a priority

## When NOT To Use
- When multiple related operations share enough dependencies for a service class
- For complex cross-cutting concerns (multi-step workflows, orchestration)
- When DTO would be exact copy of FormRequest with no additional value
- For trivial operations with zero business logic

## Prerequisites
- Thin controller principle
- DTO design patterns

## Inputs
- Endpoint specification
- Business operation logic

## Workflow
1. Create FormRequest for input validation (never inline `$request->validate()`)
2. Create DTO with typed constructor properties and `fromRequest()` factory method
3. Construct DTO from `$request->validated()` only — never raw request
4. Create single-action class with `execute()` or `__invoke()` method receiving DTO, returning domain data
5. Inject action into controller via constructor
6. Controller delegates to action — controller handles HTTP only
7. Action returns domain data (model, DTO, void) — never HTTP types
8. Controller builds response from action result — `204` for void actions
9. Test actions directly by constructing DTOs in tests — no HTTP required

## Validation Checklist
- [ ] Controller constructs DTO from validated request data
- [ ] Action receives DTO, not `$request` or loose parameters
- [ ] Action has no HTTP imports or HTTP return types
- [ ] DTO is typed class with named properties, not associative array
- [ ] Controller builds response from action result
- [ ] Flow testable without HTTP for action layer
- [ ] Three-layer responsibility boundaries respected

## Common Failures
- Passing `$request` to action — action becomes HTTP-coupled
- DTO and FormRequest duplication — intentional, separate concerns
- Action contains HTTP logic — returns redirect or sets cookie
- DTO-Action mismatch — DTO fields change but action consumers not updated

## Decision Points
- DTO vs validated array — DTO for >3 params or cross-action reuse, array for simple
- Invokable vs named method — `__invoke()` for single-method, named for multi-method
- Return model vs DTO from action — model for simple, DTO when HTTP concerns differ

## Performance Considerations
- DTO construction and action resolution ~0.01ms per request — negligible
- Action class autoloading zero-cost with OpCache
- DTO property promotion (PHP 8.0+) eliminates constructor boilerplate

## Security Considerations
- Authorization before or during action execution — never in DTO
- DTO carries only data, never performs authorization
- Actions must not implicitly trust DTO — business rule validation still in action

## Related Rules
- Controller Constructs DTO From Validated Data Only
- Action Receives DTO, Never Request
- Action Returns Domain Data, Controller Handles HTTP Response
- Three-Layer Responsibility Boundaries Must Be Respected
- Return 204 for Void Actions
- Test Flow Without HTTP by Constructing DTOs Directly

## Related Skills
- Thin Controller Principle — why controllers delegate
- Data Transfer Object Design — DTO patterns
- Action Class Design — single-action class patterns
- Controller-DTO-Service Flow — when a service layer sits between

## Success Criteria
- Controller method body is 3-5 lines: validate → DTO → action → respond
- Action testable without HTTP scaffolding
- DTO enforces type-safe data contract
- Layer boundaries never crossed
- 204 returned for void operations