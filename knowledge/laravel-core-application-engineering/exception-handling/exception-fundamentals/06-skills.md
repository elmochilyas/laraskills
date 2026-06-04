# Skill: Configure the Exception Handler

## Purpose

Set up the centralized exception handler in a Laravel application, configuring `dontReport`, `reportable`, `renderable`, and `shouldRenderJsonWhen` to produce consistent error responses and appropriate log reporting.

## When To Use

- During initial Laravel application setup (new project)
- When adding API routes to an existing application
- When onboarding an existing project that has no handler configuration
- When upgrading from Laravel 10 to Laravel 11 (migrate from Handler class to `withExceptions()`)

## When NOT To Use

- The default Laravel behavior is sufficient for applications with no API routes and no custom exceptions
- During rapid prototyping where error handling detail is unnecessary

## Prerequisites

- Understanding of the Laravel version (11+ vs 10-)
- Access to `bootstrap/app.php` (Laravel 11+) or `App\Exceptions\Handler` (Laravel 10-)
- List of expected exception types for `dontReport`

## Inputs

- Laravel version (determines API: `withExceptions()` vs `Handler` class)
- Application route structure (API vs web-only, Inertia)
- List of expected exception types (validation, auth, 404)
- Custom exception classes (if any)

## Workflow

1. Determine the correct API based on Laravel version:
   - **Laravel 11+**: Edit `bootstrap/app.php` and add `->withExceptions(...)` to the application builder chain
   - **Laravel 10-**: Edit `App\Exceptions\Handler` and use `$this->reportable()`, `$this->renderable()` in `register()`

2. Configure `dontReport` to suppress expected exceptions from ERROR-level logging:
   ```php
   $exceptions->dontReport([
       AuthenticationException::class,
       ValidationException::class,
       AuthorizationException::class,
       NotFoundHttpException::class,
       ThrottleRequestsException::class,
   ]);
   ```

3. Configure `shouldRenderJsonWhen` for applications with API routes:
   ```php
   $exceptions->shouldRenderJsonWhen(function (Request $request) {
       return $request->is('api/*') || $request->expectsJson();
   });
   ```

4. Add global context via the `context()` method to enrich all exception reports:
   ```php
   protected function context(): array
   {
       return [
           'user_id' => auth()->id(),
           'url' => request()?->fullUrl(),
           'method' => request()?->method(),
           'ip' => request()?->ip(),
           'request_id' => request()?->header('X-Request-Id'),
       ];
   }
   ```

5. Register `renderable()` callbacks for custom exception types, ordering from most-specific to most-general (catch-all for `Throwable` last).

6. Keep the handler logic simple — no database queries, external API calls, or complex business logic. Error tracking SDK calls (Sentry, Flare, Bugsnag) are the only exception.

## Validation Checklist

- [ ] Version-appropriate API is used (`withExceptions()` for Laravel 11+, `Handler` class for Laravel 10-)
- [ ] `dontReport` includes expected exceptions (validation, 404, auth, throttled)
- [ ] `shouldRenderJsonWhen` is configured with route prefix and Accept header checks
- [ ] Global context via `context()` includes user_id, url, method, ip, request_id
- [ ] `renderable()` callbacks exist for all custom exception types
- [ ] Handler logic is simple with no complex dependencies
- [ ] Report and render pipelines are independent (no logging in renderable, no rendering in reportable)
- [ ] The two patterns are not mixed (no Handler class in Laravel 11+ unless during upgrade)

## Common Failures

1. **Mixing version patterns**: Using `Handler` class in Laravel 11+ (requires manual container binding, loses fluent API).

2. **Empty dontReport**: All exceptions including expected 404s and validation errors are logged as ERROR, flooding monitoring systems.

3. **No shouldRenderJsonWhen**: API routes without `Accept: application/json` header receive HTML error pages.

4. **Complex handler logic**: Database queries or API calls in the handler cause cascading failures when the handler itself throws.

5. **Over-reporting**: Logging every exception at ERROR level (including validation and 404s) buries real server errors.

## Decision Points

- **Laravel 11 vs 10 pattern**: Always use the new `withExceptions()` for Laravel 11+. Keep the old `Handler` class only during an active upgrade, then migrate.
- **dontReport vs levels**: Use `dontReport` to completely suppress expected exceptions. Use `$levels` to map exceptions to specific log levels when you want partial visibility (e.g., WARNING for 404s during security audits).

## Performance Considerations

- Exception handling is not a performance path (exceptions should be exceptional)
- `shouldRenderJsonWhen` checks are O(1) string matches
- Callback registration traversal is O(n) — keep under 20–30 callbacks
- Avoid mailing, HTTP calls, or heavy operations in reportable callbacks

## Security Considerations

- Never expose stack traces in production error responses
- `context()` method must not include sensitive fields (passwords, tokens, PII)
- If the handler itself throws, Laravel's fallback produces a bare 500 — no details leaked
- Verified `APP_DEBUG` is `false` in production

## Related Rules

- Centralize All Exception Handling in the Handler, Never in Controllers
- Keep the Exception Handler Simple — No Complex Dependencies
- Always Configure dontReport for Expected Exceptions
- Always Configure shouldRenderJsonWhen for Applications with API Routes
- Separate Report and Render Pipelines — Never Couple Logging to Response Generation
- Use withExceptions() for Laravel 11+, Handler Class for Laravel 10-
- Add Global Context via context() for All Exception Reports

## Related Skills

- Configure Global API Error Handler (api-exception-handling)
- Configure Production Logging and Error Tracking (exception-logging-reporting)
- Register Custom Exception Rendering and Reporting (custom-exception-classes)

## Success Criteria

- The exception handler is configured and version-appropriate
- Expected exceptions are excluded from ERROR-level reporting
- API routes return JSON errors (not HTML)
- Every exception report includes user_id, url, method, ip, and request_id
- Custom exception types have defined rendering behavior
- The handler is simple and does not introduce cascading failure risk

---

# Skill: Set Up Exception Reporting and Logging Configuration

## Purpose

Configure the exception handler's reporting pipeline, including `dontReport` exclusions, log level mapping, `context()` enrichment, and domain-specific `reportable()` callbacks for appropriate log visibility.

## When To Use

- After configuring the basic exception handler (see "Configure the Exception Handler")
- When fine-tuning log levels to reduce noise from expected exceptions
- When adding domain-specific logging channels for billing, audit, or security events
- When integrating an external error tracker (Sentry, Flare, Bugsnag)

## When NOT To Use

- Default reporting behavior is sufficient for development-only applications
- No external error tracker or alerting infrastructure is being used

## Prerequisites

- Exception handler is configured with the version-appropriate API
- Logging configuration in `config/logging.php` (channels, drivers)
- Understanding of RFC 5424 log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)

## Inputs

- List of expected exception types to exclude from ERROR-level reporting
- Domain-specific log channels (e.g., `billing`, `audit`)
- Error tracker DSN and configuration (if integrating)
- Global context fields to include in all reports

## Workflow

1. Define `dontReport` with all expected exception types:
   ```php
   $exceptions->dontReport([
       AuthenticationException::class,
       ValidationException::class,
       AuthorizationException::class,
       NotFoundHttpException::class,
       ThrottleRequestsException::class,
   ]);
   ```

2. Set log levels per exception type using the `$levels` property (on Handler class) or via `context()` checks:
   ```php
   protected $levels = [
       AuthenticationException::class => LogLevel::INFO,
       ValidationException::class => LogLevel::INFO,
       NotFoundHttpException::class => LogLevel::INFO,
       ThrottleRequestsException::class => LogLevel::WARNING,
       PaymentFailedException::class => LogLevel::ERROR,
       Throwable::class => LogLevel::CRITICAL,
   ];
   ```

3. Add global context via the `context()` method:
   ```php
   protected function context(): array
   {
       return [
           'user_id' => auth()->id(),
           'url' => request()?->fullUrl(),
           'method' => request()?->method(),
           'ip' => request()?->ip(),
           'request_id' => request()?->header('X-Request-Id'),
       ];
   }
   ```

4. Optionally add `reportable()` callbacks for domain-specific logging:
   ```php
   $exceptions->reportable(function (PaymentFailedException $e) {
       Log::channel('billing')->error($e->getMessage(), [
           'payment_method' => $e->paymentMethod,
           'amount' => $e->amount,
           'failure_reason' => $e->failureReason,
       ]);
   });
   ```

5. If using an external error tracker, add a `reportable()` callback that captures exceptions:
   ```php
   $exceptions->reportable(function (Throwable $e) {
       if (app()->environment('production')) {
           \Sentry\captureException($e);
       }
   });
   ```

6. Verify that `reportable()` callbacks do not contain rendering logic and `renderable()` callbacks do not contain logging logic — keep the pipelines independent.

## Validation Checklist

- [ ] `dontReport` suppresses all expected exception types
- [ ] Log levels are mapped per exception type (INFO for expected, ERROR for failures, CRITICAL for unknown)
- [ ] Global `context()` adds user_id, url, method, ip, request_id to all reports
- [ ] Reportable callbacks are independent of rendering logic
- [ ] External error tracker is integrated (if applicable)
- [ ] Domain-specific channels are used for relevant exception types
- [ ] No sensitive data (passwords, tokens, PII) appears in log context

## Common Failures

1. **Empty dontReport**: Every 404 and validation error is logged as ERROR, flooding monitoring dashboards.

2. **PII in context**: Adding `email`, `phone`, or full user data to `context()` — violates GDPR/CCPA if logs are breached.

3. **Coupled pipelines**: Logging inside a `renderable()` callback causes double-logging or logging on every render.

4. **Over-reporting domain exceptions**: `PaymentFailedException` with a full credit card number in the log context.

## Decision Points

- **dontReport vs levels**: Use `dontReport` to completely exclude expected exceptions from logs. Use `$levels` when you want them at a lower severity (e.g., WARNING for 404s during security audits).
- **Domain channels**: Create separate log channels for high-volume domains (billing, audit) to isolate their logs from the main application log.

## Performance Considerations

- File logging: ~1–5ms per entry
- External error tracker: ~50–200ms per call (network)
- Use `stack` channel to send to both file and error tracker
- Async drivers or queue-based logging for non-blocking reporting

## Security Considerations

- Never log passwords, tokens, credit card numbers, or PII
- `context()` must be reviewed for accidental PII inclusion
- External error trackers may expose data — configure data scrubbing
- LOG_LEVEL must be `warning` or higher in production, never `debug`

## Related Rules

- Always Configure dontReport for Expected Exceptions
- Separate Report and Render Pipelines
- Add Global Context via context() for All Exception Reports
- Log Expected Exceptions at INFO Level, Not ERROR
- Never Log Sensitive Data in Exception Contexts

## Related Skills

- Configure the Exception Handler (this file, above)
- Configure Production Logging and Error Tracking (exception-logging-reporting)
- Register Custom Exception Rendering and Reporting (custom-exception-classes)

## Success Criteria

- Expected exceptions are excluded from ERROR-level logs
- Every exception report includes global context for debugging
- Log levels reflect severity per exception type
- Report and render pipelines are independent
- No sensitive data appears in log outputs
