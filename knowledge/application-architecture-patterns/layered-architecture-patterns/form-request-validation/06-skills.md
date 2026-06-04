# Skill: Build Form Request Validation Boundaries

## Purpose
Create dedicated Form Request classes that encapsulate all validation and authorization logic for each HTTP endpoint, keeping controllers thin and validation logic reusable.

## When To Use
- Controllers with 3+ validation rules
- Validation logic needed in multiple endpoints
- Need centralized authorization per endpoint
- Testing validation independently from controllers

## When NOT To Use
- Single-field validation with inline `validate()` suffice
- Simple endpoints that will never need custom validation rules
- Prototyping where speed is primary concern

## Prerequisites
- Laravel project with Form Request support
- Understanding of Laravel validation rules
- Pest or PHPUnit for testing

## Inputs
- Route/endpoint HTTP input specifications
- Authorization requirements per endpoint
- Database constraints for uniqueness checks
- Business rules for input validation

## Workflow
1. **Create Form Request with `php artisan make:request`.** Generate for each distinct HTTP endpoint or resource. Name after the operation it validates (e.g., `StoreInvoiceRequest`, `UpdateUserProfileRequest`).

2. **Define `authorize()` method for endpoint-specific access.** Check if the authenticated user can perform this operation. Use Policy gates if available. Return `true` for public endpoints.

3. **Define `rules()` method returning validation array.** Add rules for each field. Use Laravel's built-in rules, custom Rule objects, or `Rule::unique()` for database uniqueness.

4. **Customize error messages with `messages()` method.** Override default messages for business-specific error text. Use translations for localization if needed.

5. **Prepare input before validation using `prepareForValidation()`.** Transform or sanitize input data before validation runs. Use this for normalizing phone numbers, trimming whitespace, etc.

6. **Handle failed validation with `failedValidation()` (optional).** Customize the validation exception response. For APIs, customize JSON error structure.

7. **Inject Form Request in Controller method.** Type-hint the Form Request in the controller method parameter. Laravel resolves and validates before the controller method executes.

## Validation Checklist
- [ ] `authorize()` method defined for all non-public endpoints
- [ ] `rules()` covers all expected input fields
- [ ] Custom Rule objects used for complex validations (not closures)
- [ ] Error messages are user-friendly and specific
- [ ] Form Request is injected in Controller method signature
- [ ] Validation is tested independently (unit test for rules())
- [ ] Authorization check is tested separately from validation
- [ ] No inline validation remains in Controller
- [ ] Form Request tests cover valid and invalid inputs

## Common Failures
- **Validation in controllers.** Using `$request->validate()` inline in controllers — extract to Form Request for testing and reuse.
- **Overly permissive rules.** Using `sometimes` or `nullable` when field should be required. Be explicit.
- **Authorization logic in controller.** Using middleware or `Gate::` in controller when Form Request's `authorize()` handles it.
- **Validation and authorization mixed.** Using `authorize()` to do validation. These are separate concerns.
- **Closure-based rules.** Using `Rule::unique(...)->where(...)` with closures — extract to Rule objects for clarity and testing.

## Decision Points
- **Form Request vs direct validation?** Use Form Request for any endpoint with 3+ rules, authorization needs, or reuse potential.
- **Single Form Request vs separate for create/update?** Use separate Form Requests when create and update have different rules. Share a base request for common rules.

## Performance Considerations
- Form Request validation runs on every request — negligible overhead.
- Database unique validations execute a query — minimize by caching results for batch operations.
- Custom Rule objects are reusable and don't add overhead beyond equivalent inline validation.

## Security Considerations
- `authorize()` is the primary endpoint-level security gate — always verify user permissions here.
- SQL injection through validation is prevented by parameterized queries in Rule objects.
- File upload validation (mimes, max size) prevents resource exhaustion attacks.

## Related Rules
- Rule: Form Request for 3+ Rules (LAP-12/05-rules.md)
- Rule: Define authorize() Method (LAP-12/05-rules.md)
- Rule: Custom Rules for Complex Logic (LAP-12/05-rules.md)
- Rule: Test Form Requests Independently (LAP-12/05-rules.md)
- Rule: Separate Form Requests per Operation (LAP-12/05-rules.md)
- Rule: No Inline Validation in Controllers (LAP-12/05-rules.md)
- Rule: Authorization Is Separate from Validation (LAP-12/05-rules.md)

## Related Skills
- Implement Three-Layer Architecture (LAP-01/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Implement Value Objects (LAP-07/06-skills.md)
- Write Controller Unit Tests (MMD-04/06-skills.md)

## Success Criteria
- Every endpoint with 3+ validation rules has a dedicated Form Request.
- Controllers contain no inline validation logic.
- Validation and authorization are independently testable.
- Form Request handles authorization, rules, messages, and input preparation.
