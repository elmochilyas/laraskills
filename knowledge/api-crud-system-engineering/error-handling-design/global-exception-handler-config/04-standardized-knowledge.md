# Global Exception Handler Configuration

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-global-exception-handler-config |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Advanced |
| Classification | Configuration Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

The global exception handler — Laravel's `App\Exceptions\Handler` — is the central routing point for all error responses and logging. It is configured declaratively using registration callbacks for mapping, rendering, and reporting, so that adding a new exception type never requires modifying handler logic — only configuration.

## Core Concepts

- **Registration, Not Override**: All handler behaviour is configured via `register()` callbacks, not by overriding parent methods.
- **Three Responsibilities**: Mapping (exception → response), Rendering (exception → HTTP response), Reporting (exception → log/alert).
- **Order of Evaluation**: Renderable callbacks are evaluated in registration order; first match wins.
- **Context Enhancement**: `context()` method enriches all logged error context automatically.
- **Ignorable Exceptions**: `$dontReport` lists exceptions that should not be logged (expected high-volume ones).

## When To Use

- For any Laravel API that needs custom error responses
- When implementing standardized error envelopes and codes
- When integrating error tracking services (Sentry, Flare)
- For APIs with multiple exception types requiring different response shapes
- When the handler must support both API (JSON) and web (HTML) error responses

## When NOT To Use

- For apps using default Laravel error handling with no customisation
- When error handling is done entirely at the controller level (catch blocks)
- For Laravel applications with no API routes

## Best Practices (WHY)

- **Use `register()` callbacks, never override `render()`**: Ensures framework upgrade compatibility.
- **Guard renderables with `$request->expectsJson()`**: Prevents HTML error pages for API requests.
- **Register specific exceptions first, general last**: More specific types matched before fallbacks.
- **Delegate to dedicated handler methods**: Each renderable callback delegates to a named method for testability.
- **Use `reportable()` for side effects**: Keep rendering separate from reporting (Sentry, Slack, PagerDuty).
- **Register a Throwable fallback as the last callback**: Ensures every exception produces a JSON response.
- **Keep $dontReport minimal**: Only exclude expected, high-volume, non-actionable exceptions.
- **Add context via `context()` method**: URL, method, IP, user_id automatically enrich every log entry.
- **Wrap renderable body in try/catch**: Prevents error-during-error-handling infinite loops.

## Architecture Guidelines

- All renderable callbacks check `$request->expectsJson()` before returning JSON.
- Use dedicated handler methods per exception type (`handleAuthenticationError`, `handleValidationError`).
- Register framework exceptions explicitly: `AuthenticationException`, `AuthorizationException`, `ModelNotFoundException`, `ValidationException`, `ThrottleRequestsException`.
- Use `instanceof` in base exception type registration for hierarchy support.
- Register a final fallback `Throwable` renderable for all unhandled exceptions.
- Use `reportable()` callbacks for error tracking integration, separate from rendering.
- Keep the handler as the only file that changes when adding new exception types.

## Performance Considerations

- Callback registration is boot-time only — no runtime overhead.
- Each renderable adds a micro-benchmark `instanceof` check (< 20 = negligible).
- Handler registration is not a bottleneck — use cached routes and config.
- Pin Handler class in OPcache — it's loaded on every request.

## Security Considerations

- Guard all renderables with `$request->expectsJson()` to prevent HTML error exposure.
- Never log sensitive data in `context()` method.
- Ensure `$dontReport` does not silence critical errors.
- Test handler by simulating exception scenarios in deployment smoke tests.
- Add a health check endpoint that forces an exception to verify handler rendering.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Overriding `render()` instead of using `register()` | Custom `render()` method | Following old tutorials | Breaks framework upgrade path | Always use `register()` callbacks |
| Missing `expectsJson()` check | HTML error page for API request | Assuming all requests are API | Client gets unparseable HTML | Guard every renderable |
| Registering same exception twice | First callback wins silently | Copy-paste registration | Unexpected handler behavior | Test handler with all exception types |
| Closures capturing heavy dependencies | Memory leak risk | Closure-based renderables | Increased memory per request | Use class-based renderables or named methods |
| Not handling queue exceptions | Separate handler context for queues | Only configuring web handler | Silent queue failures | Configure separate handler for queue workers |
| Logging sensitive data in context() | Passwords, tokens in error logs | Overly broad context() | Data breach via log access | Always sanitise context() data |

## Anti-Patterns

- **Single monolithic render() method**: Giant switch statement on exception class — violates Open/Closed principle.
- **Handler doing business logic**: Querying databases, calling services in renderable callbacks.
- **No fallback handler**: Exceptions not matching any callback produce Symfony/Whoops HTML.
- **Handler as a dumping ground**: All error-related logic thrown into one file.
- **Silent failures**: Renderable catches exception but returns null (no response sent).

## Examples

```php
class Handler extends ExceptionHandler
{
    protected $dontReport = [
        AuthenticationException::class,
        AuthorizationException::class,
        ThrottleRequestsException::class,
    ];

    public function register(): void
    {
        $this->renderable(function (AuthenticationException $e, Request $request) {
            return $request->expectsJson()
                ? $this->handleAuthenticationError($e, $request)
                : null;
        });

        $this->renderable(function (Throwable $e, Request $request) {
            return $request->expectsJson()
                ? $this->handleServerError($e, $request)
                : null;
        });
    }

    public function context(): array
    {
        return [
            'trace_id' => request()->header('X-Trace-ID') ?? Str::uuid()->toString(),
            'environment' => app()->environment(),
        ];
    }
}
```

## Related Topics

- Custom Exception Classes (what gets caught by the handler)
- Exception-to-Code Mapping (the mapping registry the handler uses)
- Server Error Responses (the catch-all fallback response)
- Production vs Dev Error Detail (environment-dependent rendering)
- Error Logging Context (context enrichment in handler)

## AI Agent Notes

- Always use `register()` callbacks, never override `render()`.
- Always guard renderables with `$request->expectsJson()`.
- Register a `Throwable` fallback as the very last callback.
- When adding a new exception type, add a dedicated renderable callback, not more logic in an existing one.
- Use `reportable()` for error tracking side effects, separate from rendering.
- Keep `context()` clean of sensitive data.

## Verification

- [ ] All handler behaviour uses `register()` callbacks, not overridden `render()`
- [ ] Every renderable callback is guarded with `$request->expectsJson()`
- [ ] A `Throwable` fallback renderable is registered as the last callback
- [ ] All Laravel framework exceptions have explicit renderable callbacks
- [ ] `context()` method enriches all error logs without sensitive data
- [ ] `$dontReport` only excludes expected, non-actionable exceptions
- [ ] Renderable callbacks are wrapped in try/catch for error-during-error-handling protection
