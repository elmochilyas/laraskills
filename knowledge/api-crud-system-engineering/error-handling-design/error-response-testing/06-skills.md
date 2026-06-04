# Skill: Test Error Responses

## Purpose
Write automated tests that verify error response shape, status codes, error codes, headers, and envelope structure for every error scenario — ensuring consistent error API contract.

## When To Use
- For every API endpoint that can return error responses
- When maintaining error response consistency across versions
- As part of CI pipeline to catch error response regressions

## When NOT To Use
- For endpoints with no error responses (not realistic)
- During prototyping before error handling is finalized
- For internal-only code paths that never produce API errors

## Prerequisites
- HTTP testing framework (Laravel HTTP tests)
- Error envelope specification

## Inputs
- Error scenario list
- Expected response shapes per scenario

## Workflow
1. Create test cases for every error scenario — validation, auth, authorization, not found, conflict, server error, rate limit
2. Assert HTTP status code — exact match for each error type
3. Assert error code presence and value — verify against code taxonomy
4. Assert response structure — envelope fields present (error code, message, status, detail, source)
5. Assert headers — `WWW-Authenticate` for 401, `Retry-After` for 429, etc.
6. Assert sensitivity — never stack traces, file paths, or credentials in responses
7. Test in both debug and production modes — production must never expose internals
8. Run error response tests in CI on every PR that touches exception handling
9. Maintain snapshot tests for critical error response shapes

## Validation Checklist
- [ ] Test case per error scenario
- [ ] HTTP status code asserted per test
- [ ] Error code asserted against taxonomy
- [ ] Response envelope structure verified
- [ ] Error-specific headers asserted
- [ ] No sensitive data in response
- [ ] Tests pass in both debug and production mode
- [ ] Error response tests in CI

## Common Failures
- Testing only happy path — errors are untested until production
- Asserting only status code — not checking error code or envelope shape
- Not testing production mode — debug mode correct but production leaks
- Not testing headers — missing WWW-Authenticate or Retry-After

## Decision Points
- Unit vs integration error tests — integration for HTTP shape, unit for exception-to-code mapping
- Snapshot vs explicit assertion — snapshot for complex shapes, explicit for key fields
- Full coverage vs critical path only — full coverage for public APIs, critical for internal

## Performance Considerations
- Error response tests add minimal overhead (~10-50ms per test)
- Snapshot tests may need baseline updates when error shapes evolve
- Test suite for errors typically <5% of total test execution time

## Security Considerations
- Test that production mode never returns stack traces or file paths
- Test that error messages don't reveal system internals
- Test that auth errors don't distinguish user existence
- Test that sensitive data is never included in error details

## Related Rules
- Test Every Error Scenario
- Assert Status Code and Error Code
- Assert Response Envelope Structure
- Assert Error-Specific Headers
- Test in Both Debug and Production Modes
- Run Error Response Tests in CI

## Related Skills
- Error Type Taxonomy — classifying errors to test
- Standardized Error Envelope — shape to assert against
- Production vs Dev Error Detail — mode-specific assertions

## Success Criteria
- Every error scenario has a passing test
- Tests verify status code, error code, and envelope shape
- Production mode tests confirm no sensitive data leakage
- CI blocks PRs that break error response contract
- Snapshot tests catch unexpected error shape changes