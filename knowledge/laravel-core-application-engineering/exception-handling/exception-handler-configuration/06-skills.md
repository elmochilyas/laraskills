# Skill: Configure the Exception Handler

## Purpose

Set up the centralized exception handler, configuring `dontReport`, `reportable`, `renderable`, and `shouldRenderJsonWhen` to produce consistent error responses and appropriate log reporting.

## When To Use

- During initial Laravel application setup
- When adding API routes to an existing application
- When onboarding a project with no handler configuration
- When upgrading from Laravel 10 to 11 (migrate to `withExceptions()`)

## When NOT To Use

- Default behavior is sufficient for applications with no API routes and no custom exceptions
- During rapid prototyping where error detail is unnecessary

## Prerequisites

- Understanding of the Laravel version (11+ vs 10-)
- Access to `bootstrap/app.php` (Laravel 11+) or `App\Exceptions\Handler` (Laravel 10-)
- List of expected exception types for `dontReport`

## Inputs

- Laravel version (determines API)
- Application route structure (API vs web-only)
- List of expected exception types
- Custom exception classes (if any)

## Workflow

1. Determine the correct API based on Laravel version.

2. Configure `dontReport` to suppress expected exceptions:
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

4. Add global context via `context()` method:
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

5. Register `renderable()` callbacks for custom exception types, most-specific to most-general (catch-all last).

6. Keep handler logic simple — no database queries, external API calls, or complex business logic.

## Validation Checklist

- [ ] Version-appropriate API is used
- [ ] `dontReport` includes expected exceptions
- [ ] `shouldRenderJsonWhen` is configured with route prefix and Accept header checks
- [ ] Global context via `context()` includes user_id, url, method, ip, request_id
- [ ] `renderable()` callbacks exist for all custom exception types
- [ ] Handler logic is simple with no complex dependencies
- [ ] Report and render pipelines are independent
- [ ] Version patterns are not mixed

## Common Failures

1. **Mixing version patterns**: Using `Handler` class in Laravel 11+ with manual container binding.
2. **Empty dontReport**: All exceptions logged as ERROR, flooding monitoring.
3. **No shouldRenderJsonWhen**: API routes without Accept header get HTML error pages.
4. **Complex handler logic**: Database queries or API calls cause cascading failures.
5. **Over-reporting**: Logging every exception at ERROR level buries real server errors.

## Decision Points

- **Laravel 11 vs 10 pattern**: Always use `withExceptions()` for Laravel 11+. Keep Handler only during upgrade.
- **dontReport vs levels**: Use `dontReport` to completely suppress. Use `$levels` when partial visibility is needed.

## Performance Considerations

- Exception handling is not a performance path
- `shouldRenderJsonWhen` checks are O(1) string matches
- Keep callback count under 20-30 for negligible overhead

## Security Considerations

- Never expose stack traces in production
- `context()` must not include sensitive fields
- Verified `APP_DEBUG=false` in production

## Related Rules

- Use the Version-Appropriate Handler API
- Always Configure dontReport for Expected Exceptions
- Keep the Handler Simple
- Separate Report and Render Pipelines
- Always Configure shouldRenderJsonWhen for APIs
- Add Global Context via context()

## Success Criteria

- Handler is configured with version-appropriate API
- Expected exceptions are excluded from ERROR-level reporting
- API routes return JSON errors, not HTML
- Every exception report includes global context
- Custom exception types have defined rendering behavior
- Handler is simple with no cascading failure risk

---

# Skill: Set Up Exception Reporting and Logging Configuration

## Purpose

Configure the reporting pipeline including `dontReport` exclusions, log level mapping, `context()` enrichment, and domain-specific `reportable()` callbacks.

## When To Use

- After configuring the basic exception handler
- When fine-tuning log levels to reduce noise
- When adding domain-specific logging channels
- When integrating an external error tracker

## Prerequisites

- Exception handler is configured
- Logging configuration in `config/logging.php`
- Understanding of RFC 5424 log levels

## Workflow

1. Define `dontReport` with all expected exception types.
2. Set log levels per exception type using `$levels`.
3. Add global context via `context()` method.
4. Add `reportable()` callbacks for domain-specific logging.
5. Integrate external error tracker via `reportable()` callback.
6. Verify pipelines remain independent.

## Validation Checklist

- [ ] `dontReport` suppresses all expected exceptions
- [ ] Log levels are mapped per exception type
- [ ] Global context adds user_id, url, method, ip, request_id
- [ ] Reportable callbacks are independent of rendering logic
- [ ] External error tracker is integrated (if needed)
- [ ] No sensitive data in log context

## Common Failures

1. Empty `dontReport` flooding monitoring dashboards.
2. PII in context violating GDPR/CCPA.
3. Coupled pipelines causing double-logging.

## Decision Points

- **dontReport vs levels**: Use dontReport to exclude. Use $levels for lower severity.
- **Domain channels**: Create separate channels for high-volume domains.

## Related Rules

- Always Configure dontReport for Expected Exceptions
- Separate Report and Render Pipelines
- Add Global Context via context()
- Never Log Sensitive Data

## Success Criteria

- Expected exceptions excluded from ERROR-level logs
- Every report includes global context
- Log levels reflect severity per exception type
- Pipelines are independent
- No sensitive data in log outputs
