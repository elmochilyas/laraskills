# Skill: Design API Form Requests

## Purpose
Create Form Request classes as the authoritative entry gate for API endpoints, implementing the four-pillar interface (`rules`, `authorize`, `messages`, `attributes`) with array syntax, per-action classes, and consistent error formatting.

## When To Use
- Every API endpoint that accepts input data
- When validation rules need independent testability
- When authorization is tightly coupled to input validation

## When NOT To Use
- Trivial endpoints with no input validation
- Service-layer validation with no HTTP request (jobs, CLI commands)
- When using Spatie Laravel Data's `DataRequest` which auto-generates FormRequests

## Prerequisites
- Laravel validation fundamentals
- FormRequest lifecycle understanding

## Inputs
- Validation rules per endpoint
- Authorization logic per endpoint
- Error response format requirements

## Workflow
1. Create a base `ApiRequest` class extending `FormRequest` with overridden `failedValidation()` for consistent JSON error responses
2. Create one FormRequest per action: `StorePostRequest`, `UpdatePostRequest` — never reuse via `isMethod()` conditionals
3. Use array syntax for all validation rules — never pipe-delimited strings
4. Always define explicit `authorize()` method — (defaults to `false`)
5. Type-hint FormRequest in controller method instead of `Request`
6. Override `validationData()` to scope input to JSON body only, preventing route parameter contamination
7. Set `$stopOnFirstFailure = true` for write-heavy endpoints with expensive validation rules
8. Inject dependencies via constructor injection, not facades or `app()` helper
9. Place FormRequests in `App\Http\Requests\Api\V1\{Resource}\{Action}Request.php`

## Validation Checklist
- [ ] Base `ApiRequest` class with overridden `failedValidation()`
- [ ] One FormRequest per action (not shared via `isMethod()`)
- [ ] Array syntax for all validation rules
- [ ] Explicit `authorize()` method in every FormRequest
- [ ] `validationData()` overridden to scope input
- [ ] `$stopOnFirstFailure` configured appropriately
- [ ] Dependencies injected via constructor
- [ ] FormRequest type-hinted in controller signature

## Common Failures
- Using pipe-delimited rules — can't use Rule objects, harder to extend
- Calling `$this->all()` in rules() — stream already consumed by middleware
- Using `auth()->user()` instead of `$this->user()` — loses testability
- Missing `failedValidation()` override — returns web-oriented redirect
- Single FormRequest for Store and Update — fragile conditional branch logic

## Decision Points
- Separate FormRequests vs conditional `isMethod()` — always separate for testability
- `$stopOnFirstFailure` — true for write-heavy endpoints, false for multi-field forms needing all errors
- Input scope — `validationData()` to restrict to JSON body vs include query params for index endpoints

## Performance Considerations
- FormRequests resolved once per request — singleton-like in request lifecycle
- Avoid DB queries inside `rules()` for every field — batch queries in constructor
- `validationData()` filtering reduces validator workload on large payloads
- `$stopOnFirstFailure` reduces processing for batch validation

## Security Considerations
- `authorize()` runs before `rules()` — prevents unauthorized actors from triggering validation
- Never include sensitive data in validation error messages
- Use `validationData()` to exclude route parameters from validation scope
- Log validation failures at warning level for observability

## Related Rules
- Always Use Array Syntax for Validation Rules
- Define authorize() in Every FormRequest
- Override failedValidation() in a Base ApiRequest Class
- Use One FormRequest Per Action
- Inject Dependencies via Constructor, Not Facades
- Override validationData() to Control Input Scope
- Use $stopOnFirstFailure for Write-Heavy Endpoints

## Related Skills
- Form Request Organization — for directory placement and naming
- Authorization in Form Requests — for authorize() patterns
- Validation Rule Array Design — for rule composition
- Custom Validation Rules — for Rule objects and closures

## Success Criteria
- Every API endpoint with input has a dedicated FormRequest class
- All FormRequests use array syntax and have explicit authorize() methods
- Error responses are consistent JSON across all endpoints (via base class override)
- FormRequests are independently testable with no HTTP boilerplate
- Route parameters never contaminate validated data
