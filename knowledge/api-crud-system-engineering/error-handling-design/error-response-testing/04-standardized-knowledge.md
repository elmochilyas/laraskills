# Error Response Testing

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-error-response-testing |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Testing Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Error responses are tested as first-class citizens of the API contract — every endpoint has test cases that assert the error shape, code, status, and detail structure for all failure modes. Tests cover envelope shape, field-level validation errors, auth errors, status codes, and the absence of sensitive data in production mode.

## Core Concepts

- **Shape Assertions**: Every error test asserts the exact JSON structure of the error envelope.
- **Code Assertions**: Each error test asserts the specific error code string.
- **Field-Level Assertions**: Validation error tests assert per-field message arrays.
- **No-Sensitive-Data Assertions**: Tests run with `APP_DEBUG=false` and assert no stack traces or file paths.
- **Boundary Tests**: Edge cases — empty request bodies, malformed JSON, exceeding rate limits, missing headers.
- **Error Matrix**: Data provider iterates all endpoints and their known error modes.

## When To Use

- For any API with documented error responses
- When error responses are part of the API contract
- When implementing new endpoints (error tests required for each endpoint)
- When refactoring error handling code
- When compliance requires verified error response behavior

## When NOT To Use

- For prototypes or throwaway APIs
- When error handling is not yet designed or documented
- For endpoints that have no error modes (unlikely)

## Best Practices (WHY)

- **Test error shapes as contracts**: Error responses are part of the API contract — test them as rigorously as success responses.
- **Use snapshot testing for stable error shapes**: Full JSON snapshot comparison prevents accidental shape changes.
- **Use shared assertions**: `AssertErrorResponse` trait provides reusable assertions across all tests.
- **Test with APP_DEBUG=false**: Validates production-safe error responses with no sensitive data.
- **Test all documented error modes**: Each documented error code should have at least one test.
- **Test headers**: `WWW-Authenticate`, `Retry-After`, `Content-Type` must be verified.
- **Use integration tests**: Exercises the full stack including middleware and handler.
- **Include error tests in CI gating**: Mandatory pass before deploy.
- **Require error test coverage for each new error code**: PR must include error tests for new endpoints.

## Architecture Guidelines

- Create an `AssertErrorResponse` trait with methods like `assertErrorShape()`, `assertErrorCode()`, `assertNoSensitiveData()`.
- Use data providers that iterate all endpoints and their error modes.
- Write integration tests (HTTP), not unit tests for the handler — catches middleware and serialisation issues.
- Use snapshot testing (`spatie/phpunit-snapshot-assertions`) for stable, infrequently-changing error shapes.
- Write a dedicated production-mode test suite with `APP_DEBUG=false`.
- Test each error scenario: missing auth, invalid auth, forbidden, not found, validation failure, conflict, rate limited, server error.

## Performance Considerations

- Error response tests are slower than success-case tests (exception handling overhead).
- Use `RefreshDatabase` only when needed — most error tests don't need DB.
- Group error tests into a separate suite for CI parallelism.
- Avoid `dd()` in error responses during tests — captures output, breaks assertions.
- Mock rate limiters to avoid timing-dependent test delays.

## Security Considerations

- Error tests with `APP_DEBUG=false` must assert absence of stack traces, file paths, and SQL.
- Test that sensitive data (passwords, tokens) is never included in error responses.
- Verify error codes do not leak internal system structure.
- Ensure dev-mode tests don't accidentally pass in production-mode CI.
- Snapshot files for error shapes should not contain sensitive data.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Only testing happy path | No error response tests | Assumption that errors work | Error responses break silently | Test every documented error mode |
| Asserting status only, not shape | `assertStatus(422)` but no structure assertion | Minimal testing | Shape changes undetected | Assert both status and envelope structure |
| Tests pass with APP_DEBUG=true, fail in production | Dev mode debug key in response | Used default test environment | Production-mode errors untested | Run dedicated suite with APP_DEBUG=false |
| Asserting exact message strings | Fragile — messages change for i18n | Hardcoded message assertions | Tests break on localization | Assert code and shape, not exact message |
| Not testing headers | WWW-Authenticate, Retry-After missing | Forgetting response headers | Standards non-compliance | Assert all relevant headers |
| Testing handler in isolation | Doesn't exercise middleware stack | Faster tests | Misses middleware-induced errors | Use integration tests |

## Anti-Patterns

- **Testing only the generic error shape**: Not testing specific error codes per endpoint.
- **Snapshot testing dynamic values (trace_id, timestamp)**: Snapshot fails on every run.
- **No negative testing**: Only testing that error IS returned, not what the error CONTAINS.
- **Flaky tests due to rate limiting**: Tests that depend on real rate limit timing.
- **One test for all error types**: Single test that doesn't distinguish between error scenarios.

## Examples

```php
class ErrorResponseTest extends TestCase
{
    public function test_validation_error_shape(): void
    {
        $response = $this->postJson('/api/users', []);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'error' => [
                    'code',
                    'message',
                    'status',
                    'detail' => ['fields' => ['email', 'name']],
                ],
            ])
            ->assertJson([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'status' => 422,
                ],
            ]);
    }

    public function test_no_stack_trace_in_production(): void
    {
        app()->detectEnvironment(fn () => 'production');
        config(['app.debug' => false]);

        $response = $this->postJson('/api/users', []);

        $response->assertJsonMissingPath('error.trace');
        $response->assertJsonMissingPath('debug');
    }
}
```

## Related Topics

- Standardized Error Envelope (the shape being tested)
- Domain-Specific Error Codes (the codes being asserted in tests)
- Authentication/Authorization/NotFound/Conflict/RateLimit Error Responses (specific shapes to test)
- Production vs Dev Error Detail (testing both environments)
- Integration/Feature Testing patterns in Laravel

## AI Agent Notes

- When creating a new endpoint, always generate error tests for every documented error mode.
- Use `assertJsonStructure()` for shape and `assertJson()` for code/status assertions.
- Always include a production-mode test that verifies no sensitive data leaks.
- Use shared assertion traits to avoid duplicating error test logic.
- When adding a new error code, add at least one test that asserts that code is returned for the correct scenario.

## Verification

- [ ] Every endpoint has error tests for all documented error modes
- [ ] Error shape assertions use `assertJsonStructure()` for the full envelope
- [ ] Error code assertions use `assertJson()` for specific codes
- [ ] Production-mode test suite runs with `APP_DEBUG=false`
- [ ] No sensitive data (stack traces, file paths) appears in production-mode tests
- [ ] Headers (WWW-Authenticate, Retry-After, Content-Type) are tested
- [ ] CI gating requires error test coverage for new endpoints
- [ ] Error test matrix covers all endpoints and their failure modes
