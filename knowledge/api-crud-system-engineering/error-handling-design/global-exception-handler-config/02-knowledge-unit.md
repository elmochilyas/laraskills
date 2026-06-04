# Global Exception Handler Configuration

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
The global exception handler — Laravel's `App\Exceptions\Handler` — is the central routing point for all error responses and logging. It is configured declaratively, using registration callbacks for mapping, rendering, and reporting, so that adding a new exception type never requires modifying handler logic — only configuration.

## Core Concepts
- **Registration, Not Override**: All handler behaviour is configured via `register()` callbacks, not by overriding parent methods.
- **Three Responsibilities**: Mapping (exception → response), Rendering (exception → HTTP response), Reporting (exception → log/alert).
- **Order of Evaluation**: Renderable callbacks are evaluated in registration order; first match wins.
- **Context Enhancement**: `context()` method enriches all logged error context.
- **Ignorable Exceptions**: `$dontReport` lists exceptions that should not be logged (e.g., `AuthenticationException` — noisy and expected).

## Mental Models
The handler is a mail sorting facility. Mail (exceptions) comes in and is sorted by type. Each sorting rule (renderable callback) picks up its matching mail and routes it to the right output bin. Mail that doesn't match any rule goes to the "general bin" (default 500 response).

## Internal Mechanics
1. Laravel catches all exceptions via `Handler->render()`. 
2. `register()` callbacks are stored internally and tried in order.
3. First callback that returns a non-null value wins.
4. If no callback matches, the default Symfony/Whoops renderer is used.
5. `report()` callbacks run independently of `render()` for logging.

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
            return $this->handleAuthenticationError($e, $request);
        });

        $this->renderable(function (AuthorizationException $e, Request $request) {
            return $this->handleAuthorizationError($e, $request);
        });

        $this->reportable(function (QueryException $e) {
            if ($e->getCode() === '23000') {
                Log::warning('Duplicate entry detected', ['trace_id' => $this->getTraceId()]);
            }
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

## Patterns
- **Dedicated Handler Methods**: Each renderable callback delegates to a dedicated method (`handleAuthenticationError`, `handleValidationError`).
- **Request-Type Guard**: All renderable callbacks check `$request->expectsJson()` before returning JSON (fallback to HTML for non-API routes).
- **Grouped Registration**: Use `$this->renderable()` with `instanceof` for base exception types; specific types first, general types last.
- **Reporting Pipeline**: Register `reportable()` callbacks for side effects (Sentry, Slack, PagerDuty) separate from rendering.
- **Final Fallback**: The last registered callback is a catch-all `Throwable` renderable for 500 responses.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Registration order | Specific → general | Specific exceptions should be matched before fallbacks |
| JSON check | Gate all renderables | Prevents HTML responses for API requests |
| Reporting integration | Via `reportable()` callbacks | Decouples logging from response generation |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Renderable location | All in Handler class | Separate classes per exception | Handler class with delegate methods — easier to audit |
| Report callbacks | Inline closures | Separate listener classes | Inline for simple cases; listeners for complex reporting |
| Default fallback | Symfony HTML page | Custom JSON fallback | Custom JSON fallback — always return JSON for API |

## Performance Considerations
- Callback registration is boot-time only — no runtime overhead.
- Each renderable adds a micro-benchmark `instanceof` check.
- With < 20 renderable callbacks, overhead is negligible.
- Use cached routes and config to speed boot time, but handler registration is not a bottleneck.

## Production Considerations
- Keep `$dontReport` minimal — only exclude expected, high-volume, non-actionable exceptions.
- Add `url`, `method`, `ip`, and `user_id` to `context()` for all log entries.
- Test handler by simulating exception scenarios in deployment smoke tests.
- Set up a health check endpoint that forces an exception to verify handler rendering.
- Pin Handler class in OPcache — it's loaded on every request.

## Common Mistakes
- Overriding `render()` instead of using `register()` — breaks framework upgrade path.
- Forgetting `$request->expectsJson()` check — API endpoints get HTML error pages.
- Registering the same exception type twice — first callback wins silently.
- Adding `Closure`-based renderables that capture heavy dependencies (memory leak risk).
- Not handling exceptions from queue workers (separate handler context).
- Logging sensitive data in `context()` (see KU-16).

## Failure Modes
- **Infinite Loop**: A renderable throws an exception that matches its own handler. Mitigation: wrap renderable body in try/catch with hardcoded fallback.
- **Registration Miss**: New exception type added but no renderable registered. Mitigation: CI rule warns if any ApiException subclass has no renderable test.
- **Performance Degradation**: Too many renderable callbacks cause slow matching. Mitigation: flatten hierarchy, use `switch` instead of multiple callbacks if > 20.
- **Silent Failure**: A renderable catches an exception but returns nothing (null). Mitigation: always return a response in renderable.

## Ecosystem Usage
- **Laravel**: `App\Exceptions\Handler` extends `Illuminate\Foundation\Exceptions\Handler`.
- **Sentry**: `Sentry\Laravel\Integration` registers its own renderable.
- **Laravel Horizon**: Queue exception handler is separate — must be configured independently.
- **Laravel Telescope**: Intercepts and records all exceptions regardless of handler.

## Related Knowledge Units
### Prerequisites
- KU-13 Custom Exception Classes (what gets caught)
- KU-05 Exception-to-Code Mapping (the mapping registry it uses)

### Related Topics
- KU-15 Production vs Dev Error Detail (environment-dependent rendering)
- KU-18 Error Logging Context (context enrichment in handler)

### Advanced Follow-up Topics
- Multi-handler per domain (Phase 4 — when API grows large enough to warrant per-module handlers).

## Research Notes
### Source Analysis
Laravel's exception handler design — a single class with registration callbacks — was introduced in Laravel 8. Prior versions required overriding `render()`. The callback pattern makes it easy for packages (Sentry, Bugsnag) to add their own handlers without modifying Handler.

### Key Insight
**The handler should be the only file that needs to change when adding a new exception type.** If you find yourself modifying logic in the handler (beyond adding a new renderable), the architecture is wrong. Delegate to dedicated classes.

### Version-Specific Notes
- Laravel 10+ `register()` method is the standard approach.
- Laravel 11+ `$this->renderable()` accepts a class name string, not just closures: `$this->renderable(MyRenderable::class)`.
