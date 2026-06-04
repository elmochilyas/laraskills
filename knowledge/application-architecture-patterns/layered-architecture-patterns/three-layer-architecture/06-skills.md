# Skill: Implement Three-Layer Architecture (Presentation, Business, Data)

## Purpose
Structure Laravel applications using Controller → Service → Model pattern, with clear separation between Presentation (HTTP concerns), Business Logic (rules and orchestration), and Data Access (persistence).

## When To Use
- Most Laravel applications (small to medium)
- Need clear but lightweight separation between HTTP, business logic, and data
- Default MVC structure is causing specific pain (fat controllers, duplicated logic)
- Teams want testable business rules

## When NOT To Use
- Ultra-simple CRUD with no business logic — default MVC may suffice
- When team cannot commit to enforcing layer boundaries
- For prototypes where speed is the only priority

## Prerequisites
- Laravel project with default structure
- Understanding of MVC pattern and dependency injection
- Pest or PHPUnit for architecture tests

## Inputs
- Current controller files containing business logic
- List of business operations requiring orchestration
- Existing Eloquent model structure

## Workflow
1. **Extract Service classes when controllers exceed 200 lines.** Move business logic and orchestration from controllers into service classes. Controllers should only validate input (via Form Requests), call services, and return responses.

2. **Use Form Requests for validation boundaries.** Create dedicated Form Request classes for every endpoint with 3+ validation rules. Encapsulate validation logic in self-contained, testable classes.

3. **Never pass Request objects to Service methods.** Extract needed data in the Controller and pass primitives or DTOs. `Illuminate\Http\Request` leaked into the Business layer makes services untestable without HTTP mocks.

4. **Never call Eloquent from Controllers.** Always delegate through a Service class. Direct `Model::find()` in controllers bypasses the Business layer, making business rules optional.

5. **Design the Business layer for unit testing without Laravel bootstrap.** Use dependency injection and avoid facades. Services should be testable by constructing them with mocked dependencies.

6. **Apply authentication and authorization at the Presentation layer boundary.** Use middleware and Form Request `authorize()` methods. The Business layer receives already-authenticated context.

7. **Write architecture tests to enforce layer boundaries.** Create Pest tests that controllers don't call Eloquent models directly and services don't reference HTTP concerns.

## Validation Checklist
- [ ] Controllers contain zero business logic (only HTTP delegation)
- [ ] Services contain business logic; do not simply wrap CRUD
- [ ] No `Request` objects passed to Service methods
- [ ] No Model calls from Controllers (use Services)
- [ ] Architecture tests enforce layer boundaries in CI
- [ ] Services are testable without Laravel HTTP bootstrap

## Common Failures
- **Leaky Presentation layer:** Controllers with business logic or database calls. Always delegate to Service classes.
- **Anemic Business layer:** Services that only wrap Model CRUD without adding business value.
- **Cross-layer shortcuts:** Passing Request objects to Services or calling Model from Views.
- **Layer bypass under pressure:** Calling `Model::find()` from Controller because "it's just one query."

## Decision Points
- **Start with three layers before adding more.** Three layers handle most needs. Add Clean Architecture layers only when justified by demonstrated complexity.
- **Service vs Action?** Use services for orchestration of multiple operations; use actions for single, isolated operations.

## Performance Considerations
- Layer indirection adds negligible cost — Controller → Service → Model is three PHP method calls.
- No measurable performance impact at any scale.

## Security Considerations
- Authentication and authorization should be applied at the Presentation layer boundary.
- Business layer should not handle authentication — it receives already-authenticated context.

## Related Rules
- Rule: Controller Delegates to Service (LAP-01/05-rules.md)
- Rule: Form Request Encapsulates Validation (LAP-01/05-rules.md)
- Rule: Never Pass Request Object to Service (LAP-01/05-rules.md)
- Rule: Extract Services at Controller Growth (LAP-01/05-rules.md)
- Rule: Never Call Eloquent from Controllers (LAP-01/05-rules.md)
- Rule: Business Layer Testable Without Laravel (LAP-01/05-rules.md)
- Rule: Security at Presentation Boundary (LAP-01/05-rules.md)
- Rule: Three Layers Before More (LAP-01/05-rules.md)
- Rule: Architecture Tests Enforce Boundaries (LAP-01/05-rules.md)
- Rule: Services Add Business Value (LAP-01/05-rules.md)

## Related Skills
- Design a Service Class (SLP-01/06-skills.md)
- Apply Clean Architecture Layers (LAP-02/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)
- Organize Code by Layer Within Default Laravel Structure (COS-02/06-skills.md)

## Success Criteria
- Controllers contain zero business logic — only HTTP orchestration.
- Services encapsulate meaningful business rules, not just CRUD wrappers.
- Architecture tests prevent layer violations in CI.
- Business logic is testable without HTTP or database bootstrap.
