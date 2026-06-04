# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Feature & HTTP Testing |
| Knowledge Unit | Exception Handling Testing |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | HTTP test helpers, PHP exception handling, Error monitoring concepts |
| Related KUs | HTTP test helpers, Validation testing, Authentication testing |
| Source | domain-analysis.md K023 |

# Overview

Exception handling testing verifies that application exceptions are correctly reported, logged, and converted to appropriate HTTP responses. Laravel provides the `Exceptions` facade for faking exception reporting, `assertReported()` and `assertNotReported()` for verification, and custom exception handling via `App\Exceptions\Handler`. Testing exception handling ensures errors are reported to the right channels, sensitive data is not leaked in responses, and the application degrades gracefully under failure conditions.

# Core Concepts

- **`Exceptions::fake()`**: Replaces the real exception handler with a fake that captures reported exceptions without sending to configured channels.
- **`assertReported($exceptionClass)`**: Asserts an exception was reported. Optionally match by class, message, or callback.
- **`assertNotReported($exceptionClass)`**: Asserts an exception was not reported.
- **`assertReportedCount($count)`**: Asserts the total number of reported exceptions.
- **Custom exception handler**: `App\Exceptions\Handler` defines `report()` and `render()` methods. Test these methods directly.
- **Exception context**: `assertReported()` can verify exceptions were reported with specific context data.

# When To Use

- For custom application exceptions (verify they are reported and rendered correctly)
- For critical failure paths (verify errors reach Sentry/Flare/Flare)
- For API error format testing (verify consistent JSON error responses)
- For testing sensitive data redaction in exception context
- For testing environment-aware reporting (some exceptions only reported in production)

# When NOT To Use

- For testing framework exceptions (ModelNotFoundException, etc.) that are handled before reporting
- For testing expected/controlled exceptions (ValidationException) that should not be reported as errors
- When `Exceptions::fake()` would mask real exception handler behavior (test real handler separately)
- For testing exceptions that are caught and handled within application code without reaching the handler

# Best Practices (WHY)

- **Test both reporting and rendering**: Reporting verifies error monitoring receives the exception. Rendering verifies the user/client sees the correct response. Missing either means silent failures or confusing error pages.
- **Always call `Exceptions::fake()` before triggering the exception**: Without it, exceptions are reported to the real handler. Test errors reach error monitoring, and `assertReported()` fails.
- **Assert exceptions are NOT reported for expected failures**: Validation errors, 404s, and authorization failures should not be reported as errors. Use `assertNotReported()` to verify.
- **Test exception context data**: When exceptions carry debugging context (order_id, user_id, request data), verify the context is correct. Error monitoring relies on this data.

# Architecture Guidelines

- **`Exceptions::fake()` vs custom handler testing**: Use `Exceptions::fake()` for integration tests. Test custom handler methods directly for unit-level handler behavior.
- **Reporting vs Rendering tests**: Test reporting to verify error monitoring. Test rendering to verify user-facing error pages. Test separately.
- **Production vs testing reporting**: Some exceptions should only be reported in production. Test that `report()` checks environment before reporting.
- **Silent exception handling**: HTTP exceptions should return appropriate status codes even if reporting fails. Test exception handling resilience.

# Performance Considerations

- `Exceptions::fake()` overhead: <1ms. Stores exceptions in an array.
- Exception reporting in real handler: Could be slow (network calls to Sentry/Flare). Faking eliminates this.
- Exception rendering assertions: Similar cost to any HTTP response assertion.
- Custom handler unit tests: Sub-millisecond.

# Security Considerations

- Test that sensitive data (passwords, tokens, PII) is stripped from exception context before reporting.
- Test that error responses don't leak internal details (stack traces, query parameters, file paths).
- Test that authentication exceptions don't reveal whether a user exists.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not calling `Exceptions::fake()` before triggering exception | Exception reported to real handler | Real error monitoring receives test errors; `assertReported()` fails | Always call `Exceptions::fake()` at start of tests verifying exception reporting |
| Testing exception rendering without testing reporting | Focus on what the user sees | Exceptions may not be reported; silent failures in production | Test both reporting and rendering for critical exceptions |
| Forgetting to restore exception handler | `Exceptions::fake()` persists | Subsequent tests use fake handler; real reporting untested | Pest handles auto-restoration; PHPUnit needs `tearDown()` |
| Testing framework exceptions instead of application exceptions | Expecting `ModelNotFoundException` to be reported | Framework exceptions handled before reporting | Test application-specific custom exceptions |
| Not testing sensitive data redaction | Focus on happy path exception flow | Passwords/tokens leaked in error monitoring | Test that sensitive context is redacted |

# Anti-Patterns

- **`Exceptions::fake()` without assertions**: Faking exceptions but never asserting they were reported. Instead, always add `assertReported()` or `assertNotReported()` assertions.
- **Testing framework internals**: Expecting specific framework exceptions to be reported. Framework exceptions are handled by Laravel before reaching the handler.
- **Ignoring error response format**: Only testing that exceptions are reported, not what the user sees. Error responses are part of the API contract.
- **No test for expected (non-reported) exceptions**: Not asserting that validation errors, 404s, and auth failures are NOT reported, creating noise in error monitoring.

# Examples

```php
// Exception reporting with context
public function test_order_failure_is_reported()
{
    Exceptions::fake();

    $this->actingAs($user)
        ->postJson('/orders', ['product_id' => 999])
        ->assertStatus(422);

    Exceptions::assertReported(
        fn (OrderFailedException $e) => $e->context['user_id'] === $user->id
    );
}

// Exception NOT reported for expected failures
public function test_validation_errors_are_not_reported()
{
    Exceptions::fake();

    $this->postJson('/api/users', [])
        ->assertStatus(422);

    Exceptions::assertNotReported(ValidationException::class);
}

// Custom exception render test
public function test_custom_exception_renders_correctly()
{
    $exception = new PaymentFailedException('Insufficient funds');
    $handler = app(ExceptionHandler::class);
    $request = Request::create('/api/payments', 'POST');

    $response = $handler->render($request, $exception);

    $this->assertEquals(402, $response->getStatusCode());
    $this->assertJsonStringEqualsJsonString(
        '{"error": "Payment failed", "details": "Insufficient funds"}',
        $response->getContent()
    );
}

// Sensitive data redaction
public function test_password_not_in_exception_context()
{
    Exceptions::fake();

    $this->post('/login', [
        'email' => 'test@example.com',
        'password' => 'secret123',
    ]);

    Exceptions::assertReported(
        fn (LoginException $e) => !isset($e->context['password'])
    );
}
```

# Related Topics

- **Prerequisites**: HTTP test helpers, PHP exception handling, Error monitoring concepts
- **Related**: HTTP test helpers, Validation testing, Authentication testing
- **Advanced**: Custom exception handler design, Error monitoring integration testing, API error contract testing

# AI Agent Notes

- The most common mistake is forgetting to call `Exceptions::fake()`. Always do this first in any test that verifies exception reporting.
- Test both sides: exceptions that SHOULD be reported (application errors) and exceptions that should NOT be reported (validation errors, 404s). Both assertions are equally important.
- Exception context data is critical for debugging. Always verify that meaningful context is included with reported exceptions.

# Verification

- [ ] `Exceptions::fake()` is called before triggering exceptions in reporting tests
- [ ] Critical exceptions are tested for both reporting and rendering
- [ ] Expected exceptions (validation, 404, auth) are tested with `assertNotReported()`
- [ ] Exception context data is verified for key fields
- [ ] Sensitive data redaction in exception context is tested
- [ ] Error response format is tested (consistent JSON structure)
- [ ] Environment-aware reporting is tested (some exceptions only in production)
- [ ] Custom exception handler `report()` and `render()` methods have unit tests
