# Skill: Test Exception Reporting and Rendering

## Purpose
Write tests that verify application exceptions are correctly reported (reach error monitoring) and rendered (produce correct HTTP responses), including context data and sensitive data redaction.

## When To Use
- Creating custom application exceptions
- Implementing custom exception handler `report()` or `render()` methods
- Verifying error monitoring receives expected exceptions with correct context
- Testing that expected client errors (validation, 404) are NOT reported as errors

## When NOT To Use
- Testing framework exceptions handled before reporting (ModelNotFoundException, etc.)
- Testing expected/controlled exceptions (ValidationException) that should not be reported
- Using `Exceptions::fake()` when testing the real handler's behavior

## Prerequisites
- Custom exception classes with context data (optional)
- `App\Exceptions\Handler` with custom `report()` and `render()` methods
- Error monitoring service configured (Sentry, Flare, etc.)

## Inputs
- Custom exception classes and their context data
- Expected HTTP status codes and JSON error formats
- Sensitive data fields that must be redacted

## Workflow
1. Call `Exceptions::fake()` at the start of any test that verifies exception reporting — prevents real error monitoring from receiving test data
2. Trigger the exception through the application (HTTP request that causes the error)
3. Use `Exceptions::assertReported(ExceptionClass::class)` to verify the exception was reported
4. Use a callback in `assertReported()` to verify context data: `fn ($e) => $e->context['order_id'] === 123`
5. For expected client errors (422, 401, 403, 404), use `Exceptions::assertNotReported()` to verify they are NOT reported as errors
6. Test exception rendering: use HTTP tests with `assertStatus()` and `assertJson()` to verify the response format
7. Test sensitive data redaction: assert that passwords, tokens, and PII are NOT in exception context
8. Test environment-aware reporting: some exceptions should only report in production

## Validation Checklist
- [ ] `Exceptions::fake()` called before triggering exceptions in reporting tests
- [ ] Critical exceptions tested for both reporting and rendering
- [ ] Expected exceptions (validation, 404, auth) tested with `assertNotReported()`
- [ ] Exception context data verified for key debugging fields
- [ ] Sensitive data redaction in exception context tested
- [ ] Error response format tested (consistent JSON structure)
- [ ] Environment-aware reporting tested

## Common Failures
- Forgetting to call `Exceptions::fake()` — real error monitoring receives test data
- Testing exception rendering without testing reporting (silent failures in production)
- Testing reporting without testing rendering (user sees confusing error page)
- Not testing that validation errors are NOT reported — error monitoring polluted with noise
- Not verifying exception context — missing debugging data in production

## Decision Points
- Test both reporting AND rendering for every custom exception — they are independent concerns
- `Exceptions::assertReported()` with callback for context verification vs simple class match
- AssertNotReported is as important as assertReported — prevents error monitoring noise

## Performance Considerations
- `Exceptions::fake()` adds <1ms overhead
- Exception reporting in real handler may be slow (network calls); faking eliminates this
- Exception rendering assertions have similar cost to any HTTP response assertion

## Security Considerations
- Test that passwords, tokens, and PII are stripped from exception context before reporting
- Test that error responses don't leak stack traces, query parameters, or file paths
- Test that auth exceptions don't reveal whether a user exists

## Related Rules (from 05-rules.md)
- Rule 1: Always call `Exceptions::fake()` before triggering exceptions in reporting tests
- Rule 2: Test both reporting and rendering for critical exceptions
- Rule 3: Assert that expected exceptions (validation, 404, auth) are NOT reported
- Rule 4: Test exception context data for debugging information
- Rule 5: Test sensitive data redaction in exception context

## Success Criteria
- All custom exceptions are tested for both reporting and rendering
- Expected client errors are verified NOT reported (no error monitoring pollution)
- Exception context contains necessary debugging data
- Sensitive data is redacted from all exception reporting
- Error responses follow consistent format
