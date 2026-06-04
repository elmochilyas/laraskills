# Skill: Test Form Requests Unit

## Purpose
Write isolated unit tests for Laravel form requests — testing `rules()`, `authorize()`, `messages()`, `prepareForValidation()` methods in isolation without HTTP kernel boot, using datasets for conditional rules, user resolver for authorization states, and positive-negative pairs for validation boundaries.

## When To Use
- Any form request with custom `rules()`, `authorize()`, or `prepareForValidation()` logic
- Complex conditional validation (different rules based on user role, resource type, or input combinations)
- Form requests with custom error messages

## When NOT To Use
- Simple form requests with no custom logic
- Feature-level route wiring verification
- Testing controller behavior or service layer integration

## Prerequisites
- Laravel Form Requests
- Feature test structure
- PHPUnit Mocking basics

## Inputs
- Form request class files
- Input data combinations for rule variation testing
- User role/permission definitions

## Workflow
1. Test `rules()` return value: assert array structure with correct keys and rule strings for given input state
2. Test dynamic rules with datasets: enumerate input combinations (draft vs published, create vs update) and assert different rule sets
3. Test `authorize()` with different user states: set user resolver to admin (expect true) and regular user (expect false)
4. Call `$request->setContainer(app())` before `$request->validator()` — validator factory required
5. Test `prepareForValidation()`: create request with raw input, call method manually, assert transformed input
6. Test validation persistence: assert both `->validator()->passes()` with valid data and `->fails()` with invalid data
7. Test custom error messages: `$request->validator()->errors()->get('title')` returns expected messages

## Validation Checklist
- [ ] `rules()` return value asserted for each input state
- [ ] Conditional rules tested via datasets
- [ ] `authorize()` tested with both permitted and forbidden user states
- [ ] `prepareForValidation()` transformations tested explicitly
- [ ] Both `passes()` and `fails()` tested for rule boundaries
- [ ] Custom error messages verified
- [ ] At least one feature-level test verifies form request is wired to correct route

## Common Failures
- Not calling `$request->setContainer(app())` before `$request->validator()` — validator factory unavailable
- Not setting up user resolver when testing `authorize()` — `$request->user()` returns null
- Forgetting `prepareForValidation()` must be called manually in unit tests
- Testing only failure case or only passing case — incomplete boundary verification

## Decision Points
- Unit vs feature coverage: unit tests for rule correctness, feature tests for route wiring
- Dataset organization: per-field vs per-scenario vs per-role
- Duplicate coverage: avoid testing same validation scenarios at unit and feature levels

## Performance Considerations
- Form request unit tests are among the fastest — <5ms even with 50 rules
- Run in pre-CI stage to fail fast on validation rule errors
- Use PestPHP datasets to exhaustively cover conditional rule combinations without performance impact

## Security Considerations
- Test `authorize()` with all relevant user roles/permissions — gaps expose endpoints
- Ensure validation rules don't leak internal information in error messages
- Test that `prepareForValidation()` doesn't override security-critical fields (e.g., `is_admin`)

## Related Rules
- Test Rules Return Value
- Test Dynamic Rules With Data Providers
- Test Authorize With Different User States
- Test PrepareForValidation Transformations
- Test Validation Persistence

## Related Skills
- Test Validation Failures
- Isolate Test Layers
- Test DTO Unit

## Success Criteria
- Every form request with custom logic has unit tests
- Conditional rules produce correct rule sets for all input combinations
- Authorization logic correctly permits/denies based on user state
- Input transformations verified
- Validation boundaries correctly calibrated (valid passes, invalid fails)
- Custom error messages returned as expected
