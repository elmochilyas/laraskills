# Skill: Implement HTTP-Layer Authorization in FormRequests

## Purpose
Add authorization gates to FormRequests that run before validation, ensuring unauthorized requests are rejected without processing input.

## When To Use
- Any action where access varies by user (update/delete own resources)
- Admin-only or role-gated actions
- Actions where authorization depends on route model binding results
- All mutating actions (create, update, delete) as a baseline security practice

## When NOT To Use
- Public endpoints (registration, password reset) with no user-specific access control
- Business-rule authorization that belongs in domain services or policies
- Actions where authorization is identical for all authenticated users

## Prerequisites
- FormRequest class extending `Illuminate\Foundation\Http\FormRequest`
- Laravel Policy or Gate defined for the resource
- Authenticatable user model

## Inputs
- Authenticated user via `$this->user()`
- Route model binding results via `$this->route('param')`
- Policy methods or Gate checks

## Workflow
1. Override `authorize()` in the FormRequest
2. Delegate to a Policy using `$this->user()->can('action', $model)`
3. Access route model binding results via `$this->route('param')` — do not re-query
4. Return `Illuminate\Auth\Access\Response::deny('message')` with a user-facing reason on denial
5. Return `Response::allow()` or `true` when authorized
6. Do NOT write inline role checks, database queries, or business logic in `authorize()`
7. Optionally override `failedAuthorization()` for custom 403 response format
8. Write integration tests for both authorized and unauthorized scenarios

## Validation Checklist
- [ ] `authorize()` implemented on every FormRequest (no reliance on default `true`)
- [ ] Authorization logic delegated to Policy or Gate (not inline)
- [ ] Route model binding accessed via `$this->route('param')` (no redundant queries)
- [ ] `Response::deny('reason')` used with descriptive message instead of `false`
- [ ] No database queries or business rules inside `authorize()`
- [ ] Tests cover 403 response for unauthorized users
- [ ] Tests verify authorization runs before validation (no validation errors for unauthorized users)

## Common Failures
- Omitting `authorize()` — defaults to `true`, bypassing access control
- Writing inline role checks instead of delegating to Policy
- Re-querying database for route model instead of using `$this->route('param')`
- Returning `false` without a denial message — generic 403 with no user feedback
- Mixing business rules into authorization logic

## Decision Points
- Use `$this->user()->can()` for simple Policy delegation vs `Gate::authorize()` for complex checks
- Use `Response::deny()` with message when user feedback is needed vs `false` for security-through-obscurity APIs
- Override `failedAuthorization()` for JSON API endpoints vs use default for web

## Performance Considerations
- Authorization adds ~0.1ms for Gate resolution
- Policy methods may query the database — ensure efficient queries with eager-loaded relations
- Authorization runs before validation — prevents wasted validation on unauthorized requests

## Security Considerations
- Authorization is the FIRST security gate — it runs before validation to prevent info leakage
- `AuthorizationException` is in Laravel's `internalDontReport` list — never logged
- Route model binding results are trusted (resolved by Laravel's router)
- FormRequest authorization complements (does not replace) service-layer authorization

## Related Rules
- Rule 1: Keep authorize() Thin — Delegate to Policies and Gates
- Rule 2: Always Implement authorize() on Each FormRequest
- Rule 3: Do Not Put Business Logic or Database Queries in authorize()
- Rule 4: Return Response::deny() with a Message Instead of False
- Rule 5: Override failedAuthorization() for Custom 403 Responses
- Rule 6: Route Model Binding Results Accessed via $this->route()

## Related Skills
- Implement HTTP-Layer Authorization in FormRequests
- Implement Custom Error Responses Using failedValidation

## Success Criteria
- Unauthorized requests receive 403 with meaningful message
- Authorized requests proceed to validation
- Authorization logic is testable through Policy unit tests
- No database queries execute on unauthorized requests before rejection
- All FormRequests have explicit `authorize()` methods

---

# Skill: Implement Custom 403 Response Format via failedAuthorization

## Purpose
Override the default authorization failure response to return a custom JSON error structure, particularly for API endpoints.

## When To Use
- API endpoints that require consistent JSON error structures
- When the default AuthorizationException 403 response format is not appropriate
- When authorization error responses need additional metadata

## When NOT To Use
- Web applications using default redirect behavior
- When the default 403 response format is already acceptable
- When error format is handled globally in the exception handler

## Prerequisites
- FormRequest with `authorize()` method implemented
- Understanding of the authorization pipeline and exception handling

## Inputs
- Authorization denial reason (from `Response::deny()` message)
- Request context (API vs web)

## Workflow
1. Override `failedAuthorization()` in the FormRequest
2. Build a custom response matching the application's error format
3. Throw `HttpResponseException` with the customized response and 403 status
4. Keep the response format consistent with validation error responses
5. Include the denial reason in a user-friendly format
6. Test that unauthorized requests return the expected response structure

## Validation Checklist
- [ ] `failedAuthorization()` overridden for API FormRequests
- [ ] Response format matches the application's error convention
- [ ] HTTP status code is 403
- [ ] Denial message is user-friendly and not misleading
- [ ] Tests verify the custom response on authorization failure
- [ ] Response format is consistent across all API endpoints

## Common Failures
- Overriding `failedAuthorization()` when the default behavior is sufficient
- Inconsistent error formats between validation and authorization failures
- Not testing the authorization failure path

## Decision Points
- Override per-FormRequest vs handle globally in `App\Exceptions\Handler`
- Include denial reason vs return generic 403 for security

## Performance Considerations
- Negligible — runs only on authorization failure
- Response construction is simple array/JSON building

## Security Considerations
- Denial reason must not reveal too much information about authorization logic
- For sensitive endpoints, use a generic 403 without reason
- Ensure the response does not reveal whether the resource exists (avoid info leakage)

## Related Rules
- Rule 5: Override failedAuthorization() for Custom 403 Responses

## Related Skills
- Implement HTTP-Layer Authorization in FormRequests
- Implement Custom Error Responses Using failedValidation

## Success Criteria
- Authorization failures return the custom response format
- Unauthorized API requests receive consistent JSON error structure
- Web requests continue to use default redirect behavior
- Response format matches validation error format
