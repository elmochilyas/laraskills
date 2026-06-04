# Skill: Test Validation Rules with Datasets

## Purpose
Write comprehensive validation tests using Pest datasets and boundary testing patterns — covering valid, missing, and invalid scenarios for every field with fast isolated Form Request tests.

## When To Use
- Every Form Request in the application
- Every custom validation rule
- Every field validation boundary (max length, format, required, unique)
- Security-relevant input testing (XSS, SQL injection)

## When NOT To Use
- Testing business logic beyond validation (extract to separate unit tests)
- Testing authorization (use separate authentication/authorization tests)
- Exhaustive value testing (test boundaries, not every value)

## Prerequisites
- Form Requests created in `app/Http/Requests/`
- Custom validation rules created (if applicable)
- Understanding of Pest datasets and boundary testing

## Inputs
- Form Request class with rules() and authorize() methods
- Field validation rules (required, max, min, unique, mimes, etc.)
- Custom validation rule objects

## Workflow
1. For each field, test three scenarios: valid data passes, missing field fails, one invalid format fails
2. Use boundary testing: for `max:255`, test N-1 (passes), N (passes), and N+1 (fails) — not every value
3. Use Pest datasets with named keys for readable failure output: `->with(['valid email' => [..., true], 'empty string' => [..., false]])`
4. Test Form Requests in isolation using `$this->assertValidationFails($request, $data)` for fast rule verification (<5ms per scenario)
5. Supplement with HTTP integration tests for end-to-end validation (CSRF, middleware, error display)
6. Assert error structure with `assertJsonValidationErrors(['email'])` or `assertSessionHasErrors(['email'])` — never assert exact error message text
7. Test Form Request `authorize()` method in separate tests from validation rules — they are independent concerns
8. Test custom `ValidationRule` objects with unit tests: instantiate rule, call `validate()` with a fail callback, assert callback was/wasn't invoked

## Validation Checklist
- [ ] Every Form Request has a corresponding validation test file
- [ ] Every custom validation rule has a unit test
- [ ] Each field tested with valid, missing, and invalid scenarios
- [ ] Boundaries tested (N-1, N, N+1), not every value
- [ ] Dataset cases use named keys for readable failure output
- [ ] Form Requests tested in isolation (fast) AND via HTTP (integration)
- [ ] Error structure asserted, not exact message text
- [ ] `authorize()` method tested separately from rules

## Common Failures
- Only testing with valid data — missing/invalid data bypasses validation
- Asserting exact error message text — breaks on Laravel upgrades or locale changes
- Testing every possible invalid value — bloated test suite with diminishing returns
- Testing validation only via HTTP — slower than necessary
- Not testing Form Request `authorize()` — mixed authorization and validation bugs

## Decision Points
- Direct Form Request tests for speed vs HTTP tests for integration — use both with ~90/10 split
- Named dataset keys for readability vs unnamed for programmatically generated data
- Boundary testing (3 cases per rule) vs exhaustive testing (all values)

## Performance Considerations
- Isolated Form Request tests: <5ms per scenario
- HTTP validation tests: ~30-50ms per scenario (full Laravel boot)
- Custom rule unit tests: <1ms per scenario
- Dataset explosion warning: combining multiple dataset dimensions can generate thousands of tests

## Security Considerations
- Validation is the primary security boundary against injection attacks
- Include XSS payloads in string field datasets
- Include SQL injection payloads in search/filter field datasets
- Include path traversal payloads in file upload field datasets

## Related Rules (from 05-rules.md)
- Rule 1: Test every boundary, not every value
- Rule 2: For every field, test valid, missing, and one invalid format
- Rule 3: Test Form Requests in isolation for speed; test via HTTP for integration
- Rule 4: Use named datasets for readable failure output
- Rule 5: Assert error structure, not exact error message text
- Rule 6: Test Form Request `authorize()` method separately from validation rules

## Success Criteria
- Every field boundary validated with minimum test cases (N-1, N, N+1)
- Form Request rule tests complete in milliseconds (tested in isolation)
- Error structure stable across Laravel upgrades and locale changes
- `authorize()` method independently verified for role-based access
