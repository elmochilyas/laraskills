# Skill: Write Exception Handler Tests

## Purpose

Write unit tests for custom exception class construction and integration tests for the exception handler's rendering behavior across HTML, JSON, and Inertia request types, ensuring every error path produces correct responses.

## When To Use

- After creating any custom exception class
- After configuring the exception handler's `renderable()` callbacks
- When adding error page views (at minimum 404 and 500)
- When adding a new endpoint with `findOrFail()` or route model binding
- As part of CI pipeline setup for exception handling

## When NOT To Use

- For framework-internal exception behavior — test only your application's handling
- For exception types that are purely service-layer (never propagated to HTTP)
- When the cost of testing every possible exception type exceeds value — focus on custom exceptions and key HTTP errors

## Prerequisites

- PHPUnit or Pest test suite configured
- Custom exception classes (see "Create a Typed Custom Exception Class")
- Handler configured with `renderable()` callbacks (see "Configure the Exception Handler")
- Error page views exist (for web route tests)

## Inputs

- Custom exception class names and their constructor parameters
- List of endpoints with `findOrFail()` or implicit route model binding
- Error page view names (e.g., `errors.404`, `errors.500`)
- API error contract (envelope shape, field names, types)

## Workflow

1. Write a unit test for every custom exception class, verifying construction, message, code, and all context properties:
   ```php
   test('payment failed exception contains correct context', function () {
       $exception = new PaymentFailedException(
           paymentMethod: 'pm_123',
           amount: 50.00,
           failureReason: 'insufficient_funds',
       );

       expect($exception->paymentMethod)->toBe('pm_123');
       expect($exception->amount)->toBe(50.00);
       expect($exception->failureReason)->toBe('insufficient_funds');
       expect($exception->getMessage())->toBe('Payment processing failed.');
       expect($exception->getCode())->toBe(422);
   });
   ```

2. Write HTTP tests for each request type that the handler supports (HTML, JSON, Inertia):
   ```php
   public function test_404_returns_api_error()
   {
       $response = $this->getJson('/api/non-existent-route');
       $response->assertStatus(404);
       $response->assertJson([
           'error' => ['message' => 'Resource not found.', 'type' => 'not_found', 'code' => 404],
       ]);
   }

   public function test_404_returns_html_for_web()
   {
       $response = $this->get('/non-existent-page');
       $response->assertStatus(404);
       $response->assertViewIs('errors.404');
       $response->assertSee('Go Home');
   }
   ```

3. Test error page views directly to ensure they render without errors:
   ```php
   public function test_404_page_has_expected_content()
   {
       $view = $this->view('errors.404', ['exception' => new NotFoundHttpException()]);
       $view->assertSee('Page Not Found');
       $view->assertSee('Go Home');
       $view->assertDontSee('Stack Trace');
   }
   ```

4. Test that production error pages do not expose stack traces or file paths:
   ```php
   public function test_500_page_does_not_leak_details()
   {
       app()->detectEnvironment(fn () => 'production');

       $response = $this->get('/trigger-500');
       $response->assertStatus(500);
       $response->assertDontSee('Stack Trace');
       $response->assertDontSee('in /var/www/');
       $response->assertSee('Something went wrong');
   }
   ```

5. Test both with and without exception handling:
   ```php
   // Raw exception type
   public function test_model_not_found_exception()
   {
       $this->withoutExceptionHandling();
       $this->expectException(ModelNotFoundException::class);

       $this->get('/api/users/99999');
   }

   // Rendered response
   public function test_404_response_format()
   {
       $response = $this->getJson('/api/users/99999');
       $response->assertStatus(404);
       $response->assertJson(['error' => ['type' => 'not_found']]);
   }
   ```

6. Write "not found" tests for every endpoint using `findOrFail()`, `firstOrFail()`, or implicit route model binding.

## Validation Checklist

- [ ] Every custom exception class has a unit test for construction and context
- [ ] HTTP error responses are tested for HTML requests (assertViewIs, assertSee)
- [ ] HTTP error responses are tested for JSON requests (assertJson, assertStatus)
- [ ] Inertia error rendering is tested if applicable
- [ ] Error page views (at minimum 404, 500) render without errors
- [ ] Production error pages do not expose stack traces, file paths, or line numbers
- [ ] Tests exist both with exception handling (rendered) and `withoutExceptionHandling` (raw)
- [ ] Every `findOrFail()` path has a "not found" test
- [ ] Exception tests are included in the CI pipeline

## Common Failures

1. **False positives with try/catch**: Using `try { ... } catch (Exception $e) { ... }` instead of `expectException()` — test passes even if no exception is thrown.

2. **Only testing happy path**: Endpoints tested only for success — 404, 403, and 422 paths are untested until production.

3. **No withoutExceptionHandling**: Tests only verify the rendered response, never the raw exception type — handler could return 404 for the wrong reason.

4. **Brittle log assertions**: Asserting exact log message strings instead of using `Log::spy()` with `shouldHaveReceived`.

5. **Not testing error page views**: A layout refactor silently breaks the 404 page — only detected when a real user encounters it.

## Decision Points

- **expectException() vs try/catch**: Always use `$this->expectException()` for asserting exceptions are thrown. The try/catch approach produces false positives.
- **withoutExceptionHandling vs default**: Use `withoutExceptionHandling()` to test the raw exception type/message. Use the default handler to test the final HTTP response. Test both.

## Performance Considerations

- Unit tests for exception classes: ~1ms each
- HTTP integration tests for error responses: ~50–100ms each
- Exception tests are fast and should run in every CI build
- Use `Log::spy()` to avoid filesystem I/O in logging assertions

## Security Considerations

- Assert that production error pages and API responses do not contain stack traces, file paths, or class names
- Verify that debug mode shows detailed information and production mode shows generic messages
- Ensure 500-level errors return generic messages in production

## Related Rules

- Write a Unit Test for Every Custom Exception Class
- Test Error Rendering for Every Request Type — HTML, JSON, and Inertia
- Test Error Page Views to Ensure They Render Without Errors
- Use $this->expectException() to Assert Exceptions Are Thrown
- Test Both with and without Exception Handling
- Test That Production Error Pages Do Not Expose Stack Traces
- Use Log::spy() to Assert Logging Behavior Without Writing to Disk
- Test Every findOrFail() Path for a 404 Response
- Test That Expected Exceptions Are NOT Reported at ERROR Level
- Include Exception Tests in CI Pipeline

## Related Skills

- Create a Typed Custom Exception Class (custom-exception-classes)
- Configure the Exception Handler (exception-fundamentals)
- Configure Global API Error Handler (api-exception-handling)

## Success Criteria

- Every custom exception has a construction test
- Every error path (404, 403, 422, 500) has tests for HTML and JSON formats
- Error page views render without exceptions
- Production error responses contain no stack traces or file paths
- Tests run in CI and catch regressions before deployment
- No `findOrFail()` path is missing a "not found" test
