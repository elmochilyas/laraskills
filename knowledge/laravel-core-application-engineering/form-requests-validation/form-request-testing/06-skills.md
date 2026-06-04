# Skill: Test Validation Boundaries via HTTP Integration Tests

## Purpose
Verify FormRequest validation rules by sending HTTP requests to routes that use them and asserting on the response, covering valid data passes, rule violations, and boundary conditions.

## When To Use
- Every FormRequest needs tests covering valid data, each rule violation, and edge cases
- Regression testing when validation rules change
- Ensuring the validation boundary is intact (invalid data cannot reach controller)

## When NOT To Use
- Unit-testing FormRequest internals directly (e.g., testing `rules()` method in isolation)
- Testing built-in Laravel rule behavior (test your rule combinations, not the framework)
- Testing rules you haven't explicitly defined

## Prerequisites
- Route using the FormRequest
- PHPUnit or Pest configured with Laravel application testing
- Test database (SQLite in-memory or equivalent)

## Inputs
- HTTP method and endpoint
- Request payload (valid, invalid, edge cases)
- Authenticated user (for authorization tests)

## Workflow
1. Write an integration test that sends an HTTP request to the route using the FormRequest
2. For valid data: assert `$response->assertSessionHasNoErrors()` (web) or `$response->assertStatus(200)` (API)
3. For each rule violation: submit data that breaks the rule, assert field-specific error
4. Use Pest datasets for combinatorial testing of multiple values per field
5. Test boundary conditions: null, empty strings, max lengths, special characters
6. Test authorization separately: assert 403 for unauthorized users
7. Use `assertInvalid(['field'])` (Laravel 11+) for cross-context assertions

## Validation Checklist
- [ ] Integration test for each FormRequest
- [ ] Test covers valid data passing validation
- [ ] Test covers each defined rule violation with field-specific assertion
- [ ] Boundary conditions tested (null, empty, max, special chars)
- [ ] Authorization failure tested (403 response)
- [ ] Pest datasets used for combinatorial testing (reduces test boilerplate)
- [ ] API and web response formats tested where applicable
- [ ] No unit-testing of FormRequest internals

## Common Failures
- Asserting `assertSessionHasErrors()` without specifying which field — passes even if wrong field has error
- Testing only the happy path — boundary bugs reach production
- Testing Laravel's built-in rules (redundant)
- Forgetting authorization tests — auth bypass goes undetected
- One giant test for all rules — unclear failures, missed combinations

## Decision Points
- Use `assertInvalid()` for cross-context tests vs `assertSessionHasErrors()`/`assertJsonValidationErrors()` for context-specific
- Use Pest datasets for rule permutations vs separate test methods for clarity
- Test each rule violation individually vs test few combined scenarios

## Performance Considerations
- Integration tests take 50-200ms per test
- Use `RefreshDatabase` or `DatabaseTransactions` for test isolation
- Batch similar test cases with Pest datasets to reduce test count
- Run validation tests in CI on every commit

## Security Considerations
- Tests must verify that invalid/malicious input is rejected
- Test SQL injection vectors in string fields
- Test XSS vectors in fields that will be rendered
- Test mass-assignment attempt with extra fields
- Ensure authorization tests prove unauthorized users get 403, not validation errors

## Related Rules
- Rule 1: Test FormRequests via HTTP Integration Tests — Not Unit Tests
- Rule 2: Test Authorization Failure Separately from Validation
- Rule 3: Assert on Field-Specific Errors — Not Generic Checks
- Rule 4: Use Pest Datasets for Combinatorial Rule Testing
- Rule 5: Test Boundary Conditions — Not Just Happy Paths
- Rule 6: Use assertInvalid() for Cross-Context Assertions (Laravel 11+)

## Related Skills
- Test Custom Validation Rules in Isolation
- Implement HTTP-Layer Authorization in FormRequests

## Success Criteria
- All FormRequests have test coverage
- Each rule violation produces the expected field-specific error
- Valid data passes without errors
- Unauthorized users receive 403
- Boundary edge cases are covered
- Tests run in CI and fail on validation regressions
- No testing of framework internals or built-in rule behavior

---

# Skill: Test Authorization Failures in FormRequests

## Purpose
Write dedicated integration tests that verify unauthorized users are properly rejected (403) before validation runs, independent of input data.

## When To Use
- Every FormRequest with an `authorize()` method
- Regression testing when authorization logic changes
- Ensuring authorization order (auth before validation)

## When NOT To Use
- Testing authorization logic that is already covered by Policy unit tests
- Testing authorization for public endpoints (always authorized)

## Prerequisites
- FormRequest with `authorize()` implemented
- Test users with different roles/permissions
- Route using the FormRequest

## Inputs
- Authenticated user (unauthorized context)
- Valid request data (to isolate authorization failure from validation failure)

## Workflow
1. Create a user who should NOT be authorized for the action
2. Submit a request with valid data to ensure 403 is from authorization, not validation
3. Assert `$response->assertStatus(403)` (API) or `$response->assertForbidden()`
4. Create a user who SHOULD be authorized
5. Submit the same request and assert 200/302 success
6. Verify that unauthorized users do NOT receive validation errors (which could leak info)
7. Test edge cases: guest users, users with different roles, resource owners vs non-owners

## Validation Checklist
- [ ] Test for unauthorized user (403 expected)
- [ ] Test for authorized user (success expected)
- [ ] Valid data used in authorization tests to isolate from validation
- [ ] Guest (unauthenticated) user tested where applicable
- [ ] Different user roles/permissions tested where applicable
- [ ] Assertion is on status code, not error message (proves auth, not validation)
- [ ] No validation errors appear for unauthorized users

## Common Failures
- Using invalid data in authorization tests — cannot tell if 403 is from auth or validation
- Testing authorization together with validation in the same test case
- Not testing the authorized path — proving the test setup is correct
- Testing only one role when multiple roles have different access levels
- Forgetting to test guest (unauthenticated) access

## Decision Points
- Test authorization through HTTP (integration) vs through Policy (unit) — both recommended
- Use `actingAs($user)` for authenticated tests vs `$this->post()` for guest tests

## Performance Considerations
- Authorization tests are fast — simple HTTP requests with status assertions
- Use factory states for creating users with different roles

## Security Considerations
- Authorization tests are critical for security validation
- Ensure unauthorized users NEVER see validation errors (information leakage)
- Test that `AuthorizationException` (not `ValidationException`) is thrown for unauthorized users
- Verify that authorization truly runs before validation

## Related Rules
- Rule 2: Test Authorization Failure Separately from Validation

## Related Skills
- Test Validation Boundaries via HTTP Integration Tests
- Implement HTTP-Layer Authorization in FormRequests

## Success Criteria
- Unauthorized users receive 403 with valid data
- Authorized users receive success response with same data
- Guest users are handled appropriately (redirect to login or 403)
- No validation error information leaks to unauthorized users
- Tests cover all relevant user roles and permissions
