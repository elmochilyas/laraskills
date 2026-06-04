# Skill: Configure Environment-Specific Exception Handling

## Purpose

Set up the exception handler to provide detailed error information in local/development environments and generic, safe error responses in production, ensuring maximum debugging support for developers and minimum information leakage for users.

## When To Use

- During initial application setup
- When deploying an application to production for the first time
- When auditing an existing application's production security posture
- When adding API support that requires different error formats per environment

## When NOT To Use

- Development-only applications with no production deployment
- Ephemeral environments where all users are developers

## Prerequisites

- Exception handler configured (see "Configure the Exception Handler" in exception-fundamentals)
- Access to `.env` files for production and local environments
- Understanding of Laravel's `app()->environment()` method

## Inputs

- Application environments (local, staging, production)
- API route structure (for JSON vs HTML content negotiation)
- Custom exception classes and their rendering rules
- Error page views for production (branded, no internals)

## Workflow

1. Verify `APP_DEBUG=false` in the production `.env` file. This is the primary control for debug vs production mode:
   ```
   # .env.production
   APP_DEBUG=false
   APP_ENV=production
   ```

2. Configure environment-specific error messages in `renderable()` callbacks:
   ```php
   $exceptions->renderable(function (Throwable $e, Request $request) {
       if (!$request->is('api/*') && !$request->expectsJson()) {
           return;
       }

       $message = app()->environment('local')
           ? $e->getMessage()
           : 'An unexpected error occurred.';

       return response()->json([
           'error' => [
               'message' => $message,
               'type' => 'server_error',
               'code' => $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500,
           ],
           'request_id' => $request->header('X-Request-Id'),
       ], 500);
   });
   ```

3. Register a catch-all `renderable()` for `Throwable` in production to ensure unexpected exceptions don't fall through to default debug pages:
   ```php
   $exceptions->renderable(function (Throwable $e, Request $request) {
       if (!$request->is('api/*') && !$request->expectsJson()) {
           return;
       }

       return response()->json([
           'error' => [
               'message' => 'An unexpected error occurred.',
               'type' => 'server_error',
               'code' => 500,
           ],
           'request_id' => $request->header('X-Request-Id'),
       ], 500);
   });
   ```

4. Set appropriate log levels per exception type, filtering expected exceptions from ERROR-level reporting:
   ```php
   protected $levels = [
       AuthenticationException::class => LogLevel::INFO,
       ValidationException::class => LogLevel::INFO,
       NotFoundHttpException::class => LogLevel::INFO,
       ThrottleRequestsException::class => LogLevel::WARNING,
       HttpException::class => LogLevel::WARNING,
       Throwable::class => LogLevel::CRITICAL,
   ];
   ```

5. Add global context via `context()` for all environments — it enriches reports without appearing in user-facing responses.

6. Test that production mode returns generic errors (no stack traces) and local mode returns detailed errors (with messages and traces).

## Validation Checklist

- [ ] `APP_DEBUG=false` in production `.env`
- [ ] `APP_DEBUG=true` in local `.env`
- [ ] API error messages are generic in production (no `$e->getMessage()` leaked for 500s)
- [ ] API error messages are detailed in local environment
- [ ] Catch-all `renderable()` for `Throwable` exists in production
- [ ] Expected exceptions are filtered from ERROR-level reporting
- [ ] Global context is configured via `context()` method
- [ ] Handler logic is simple with no complex dependencies

## Common Failures

1. **APP_DEBUG=true in production**: Full stack traces, environment variables, and query logs visible to any user who triggers an error. The most common Laravel security misconfiguration.

2. **Static error messages**: Using the same generic message in local and production — developers lose debugging information.

3. **No catch-all in production**: Unknown exception types fall through to Laravel's default handler, which may render HTML debug pages if `APP_DEBUG` is accidentally true, or blank pages if false.

4. **Over-reporting**: Every exception including expected 404s and validation errors logged at ERROR level — monitoring dashboards are flooded with noise.

## Decision Points

- **Message disclosure policy**: For `5xx` errors, show generic message in production, detailed in local. For `4xx` errors (validation, 404, 403), the original message is usually user-facing and can be shown in both environments.
- **APP_DEBUG vs renderable()**: `APP_DEBUG` controls Ignition/debug page rendering. Custom `renderable()` callbacks always execute first. If a custom callback returns a response, it overrides the debug page entirely.

## Performance Considerations

- `app()->environment()` is a cached string comparison — negligible cost
- Handler logic must remain simple even with environment branching
- No performance concern; error responses are not on the hot path

## Security Considerations

- `APP_DEBUG=true` in production exposes DB credentials, API keys, file paths — verify it's always false
- Ignition debug pages (Laravel 10) show environment variables, query logs, and request data — never enable in production
- Environment-specific render callbacks must still follow security rules: no stack traces in production, no PII in messages
- Global context (`context()`) provides debugging metadata without exposing internals to users

## Related Rules

- Never Run Production with APP_DEBUG=true
- Use Environment-Specific Error Pages — Detailed in Local, Generic in Production
- Register a Catch-All renderable() for Throwable in Production
- Filter Expected Exceptions from ERROR-Level Reporting
- Set Appropriate Log Levels per Exception Type Using the $levels Property
- Add Global Context via context() to Every Exception Report
- Keep Handler Logic Simple and Free of Complex Dependencies

## Related Skills

- Configure the Exception Handler (exception-fundamentals)
- Configure Production Logging and Error Tracking (exception-logging-reporting)

## Success Criteria

- `APP_DEBUG=false` is always set in production
- Local environment shows detailed error information for debugging
- Production environment shows generic, branded error responses
- Unknown exception types are caught by the catch-all handler
- Expected exceptions are not reported at ERROR level
- No sensitive internal data is exposed in any production error response
