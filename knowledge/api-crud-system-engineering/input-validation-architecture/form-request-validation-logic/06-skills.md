# Skill: Design and Validate Request Input

## Purpose
Create dedicated Form Request classes for all API write endpoints with conditional validation, custom rules, authorization gates, and consistent `failedValidation()` response overrides.

## When To Use
- All POST, PUT, PATCH, DELETE endpoints
- Endpoints with complex validation rules
- New API endpoints — always use Form Requests

## When NOT To Use
- GET endpoints — validation done via query parameter parsing
- Simple endpoints with 1-2 `sometimes` rules — may inline in controllers (rare)

## Prerequisites
- Form Request class creation
- Laravel validation rules

## Inputs
- Endpoint specification with field types and constraints
- Authorization rules per endpoint

## Workflow
1. Generate Form Request per write operation: `php artisan make:request StoreUserRequest`
2. Define `authorize()` method — check user can perform this operation
3. Define `rules()` method with field validation rules per type
4. Use `sometimes` rule for nullable fields and conditional validation
5. Create custom rule classes for domain-specific validation: `UniqueInCompanyRule`
6. Override `failedValidation()` to return consistent JSON error response with 422
7. Use `prepareForValidation()` for field normalization before validation
8. Add `messages()` for user-friendly, concrete error messages
9. Inject Form Request in controller method: `store(StoreUserRequest $request)`
10. Keep authorization separate from validation — `authorize()` method, not rules

## Validation Checklist
- [ ] Form Request created per write operation
- [ ] `authorize()` method with proper authorization check
- [ ] `rules()` method with all field validation rules
- [ ] `sometimes` used for conditional/optional fields
- [ ] Custom rule classes for domain-specific logic
- [ ] `failedValidation()` returns consistent JSON 422
- [ ] `messages()` with user-friendly error messages
- [ ] Form Request injected in controller method
- [ ] `prepareForValidation()` for field normalization
- [ ] Authorization separated from validation logic

## Common Failures
- Validation in controller method body — mixes concern, not reusable
- No `failedValidation()` override — Laravel default redirects, not JSON
- Authorization mixed into rules — `exists:` can reveal existence of records
- Boolean fields validated as `sometimes|boolean` — Laravel accepts `"1"`, `"true"`, `1`, `true`
- Using `required_without_all` without understanding it — complex conditional rules often buggy
- No `messages()` — default English `validation.required` is unhelpful

## Decision Points
- One Form Request per action vs per resource — per action (`StoreUserRequest`) for clarity
- `sometimes` vs `nullable` — `sometimes` omits field entirely, `nullable` accepts null value
- Custom rule class vs Closure — class for reusable, Closure for one-off

## Performance Considerations
- Form Request validation adds ~1-2ms per request
- Custom rules with database queries (exists, unique) add per-rule overhead
- Rules with `unique` on large tables benefit from composite indexes
- `before`/`after` validation hooks add minimal overhead

## Security Considerations
- `authorize()` gates access before validation — prevents information leakage via validation errors
- Never use `exists:` in `rules()` — reveals record existence to unauthenticated users
- `prepareForValidation()` must handle XSS and sanitization if needed
- `failedValidation()` override must not expose internal field names where sensitive

## Related Rules
- Create Form Requests Per Write Operation
- Override failedValidation For Consistent JSON Error Response
- Use `sometimes` For Conditional Validation Rules
- Define `authorize()` Method Separately From rules()
- Create Custom Rule Classes For Domain Validation
- Use `prepareForValidation()` For Field Normalization
- Provide User-friendly Error Messages In messages()

## Related Skills
- Validation Error Testing Patterns — for testing validation
- Validation Rule Composition — for complex rule building
- Authorization Gate Design — for authorize() implementation

## Success Criteria
- Every write endpoint has a dedicated Form Request
- All field rules match database and business constraints
- Authorization failures return 403 before validation runs
- Validation errors return consistent JSON with 422
- Error messages are user-friendly and actionable
- Custom rules handle domain-specific validation logic
