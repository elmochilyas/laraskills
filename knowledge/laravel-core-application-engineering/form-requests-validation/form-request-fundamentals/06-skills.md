# Skill: Create and Wire a FormRequest to a Controller Action

## Purpose
Create a dedicated FormRequest class that encapsulates validation rules, authorization logic, and custom error messages for a single controller action.

## When To Use
- Any controller action that accepts user input
- Actions requiring authorization that varies per-request
- Forms with 3+ validation rules
- API endpoints needing consistent validation error responses

## When NOT To Use
- Simple forms with 1-2 rules (inline validation in controller suffices)
- Non-HTTP contexts (commands, jobs — use manual Validator)
- Actions that don't accept user input

## Prerequisites
- Laravel application with authentication and routing configured
- Controller action to be validated

## Inputs
- HTTP request data
- Authenticated user
- Route parameters (via route model binding)

## Workflow
1. Generate the FormRequest: `php artisan make:request StoreUserRequest`
2. Implement `authorize()`: return a Gate/Policy check or `true` for open endpoints
3. Implement `rules()`: return an array of validation rules for each input field
4. Optionally override `messages()` for custom, user-friendly error messages
5. Optionally override `attributes()` for human-readable field names
6. Type-hint the FormRequest in the controller method: `public function store(StoreUserRequest $request)`
7. Use `$request->validated()` in the controller to access validated data
8. Write integration tests for valid and invalid data scenarios

## Validation Checklist
- [ ] FormRequest generated in `app/Http/Requests/`
- [ ] `authorize()` implemented (never rely on default `true`)
- [ ] `rules()` uses array syntax for complex rules
- [ ] Controller uses `$request->validated()` not `$request->all()`
- [ ] Custom `messages()` defined for user-facing errors
- [ ] Integration tests cover validation failure and success
- [ ] Tests cover authorization failure (403)

## Common Failures
- Omitting `authorize()` — defaults to true, no access control
- Using `$request->all()` instead of `$request->validated()` — unvalidated data
- One FormRequest for create and update (use separate classes)
- Pipe-delimited strings for complex rules (use array syntax)
- Re-validating data in controller after FormRequest passes

## Decision Points
- Use separate FormRequests for each action vs shared request with conditionals
- Use array syntax vs string syntax based on rule complexity
- Co-locate requests in feature modules vs keep in `app/Http/Requests/`

## Performance Considerations
- FormRequest validation adds ~1-5ms for typical forms (5-20 fields)
- Database rules (`unique`, `exists`) add query overhead
- `bail` improves performance by stopping after first rule failure per field

## Security Considerations
- FormRequest is the validation and authorization boundary
- `validated()` guarantees only passed fields reach the controller
- Authorization runs before validation (unauthorized users don't trigger validation)
- `ValidationException` is automatically handled by Laravel

## Related Rules
- Rule 1: One FormRequest Per Controller Action
- Rule 2: Always Use validated() in Controllers — Never all()
- Rule 3: Return Rule Arrays — Not Pipe-Delimited Strings
- Rule 4: Implement authorize() on Every FormRequest
- Rule 5: Override messages() for User-Friendly Validation Errors
- Rule 6: Trust Validated Data — It Has Passed the Gate

## Related Skills
- Implement HTTP-Layer Authorization in FormRequests
- Apply Declarative Conditional Validation Rules
- Implement Cross-Field Validation Using withValidator and after

## Success Criteria
- FormRequest correctly validates all defined rules
- Invalid data produces appropriate validation errors
- Unauthorized requests receive 403 before validation
- Controller receives only validated data
- FormRequest is testable via HTTP integration tests
- Each action has its own dedicated request class
