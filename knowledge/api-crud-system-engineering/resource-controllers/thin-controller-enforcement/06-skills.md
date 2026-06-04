# Skill: Implement Thin Controller Principle

## Purpose
Keep API controllers thin by delegating validation (Form Request), authorization (Policy), business logic (Action/Service), and response transformation (API Resource) to dedicated classes.

## When To Use
- Every API controller
- Code organization and maintainability
- Testing and separation of concerns

## When NOT To Use
- Simple read-only endpoints (2-3 lines)
- Prototyping before refactoring

## Prerequisites
- Form Request, Policy, Action, Resource patterns
- Laravel dependency injection

## Inputs
- Controller method specifications

## Workflow
1. Inject Form Request in method signature for validation
2. Call `$this->authorize()` for authorization
3. Delegate business logic to action/service class
4. Return API Resource instance for response transformation
5. Extract DTO from validated request for action parameters
6. Keep controller method under 10 lines
7. Keep controller under 5 injected dependencies
8. Controller only coordinates — no business logic
9. Test controller behavior via integration tests
10. Document delegation pattern for team consistency

## Validation Checklist
- [ ] Form Request handles validation
- [ ] Policy or authorize() handles authorization
- [ ] Action/service handles business logic
- [ ] API Resource handles response transformation
- [ ] Controller methods < 10 lines
- [ ] Controller < 5 injected dependencies
- [ ] No business logic in controller
- [ ] Integration tests cover full flow

## Related Skills
- Controller Action Delegation
- Action Class Design
- API Resource Controllers
- Service Class Design
