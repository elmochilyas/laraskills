# Production vs Dev Error Detail

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
Error responses contain different levels of detail depending on the environment — maximum detail for local development and testing, minimal safe detail for production — controlled exclusively by `APP_DEBUG` and environment detection, never by code changes. This ensures developers get the diagnostic information they need while production users never see internals.

## Core Concepts
- **APP_DEBUG=true (local/dev)**: Full stack traces, query details, environment information, and Whoops error page.
- **APP_DEBUG=false (staging/production)**: Standard error envelope with no internal detail.
- **No New Responses in Dev**: Dev mode enhances responses; it does not add new response types (always use the envelope).
- **Environment Detection**: `app()->environment('local')`, `APP_DEBUG`, and `config('app.debug')` are the only switches.
- **Safe Defaults**: When in doubt, hide detail. Dev mode must be explicitly enabled.

## Mental Models
Dev mode is a mechanic's diagnostic screen in a workshop — shows engine telemetry, error codes, and wiring diagrams. Production mode is the dashboard in the driver's seat — just the check-engine light and a trace ID to give the mechanic.

## Internal Mechanics
1. Handler checks `config('app.debug')` at the start of each render.
2. If debug is true, it returns enhanced responses (stack trace, file, line, previous exceptions).
3. If debug is false, it returns the standard safe envelope.
4. Environment config is loaded at boot and cached.

```php
public function render($request, Throwable $e): JsonResponse
{
    $response = $this->buildSafeEnvelope($e);

    if (config('app.debug') && app()->isLocal()) {
        $response->setData($response->getData(true) + [
            'debug' => [
                'exception' => $e::class,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTrace(),
                'previous' => $e->getPrevious()?->getMessage(),
            ],
        ]);
    }

    return $response;
}
```

## Patterns
- **Debug Key Addition**: Append a top-level `debug` key in dev mode — never modify the `error` envelope structure.
- **Environment Gate**: Use `app()->isLocal()` not just `APP_DEBUG` — prevents accidental debug in staging if misconfigured.
- **Structured Dev Detail**: Include exception class, file, line, trace (limited to 10 frames), and server variables.
- **Dev-Only Whoops Replacement**: Still return JSON for API routes; use Whoops for browser routes only.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Debug data location | Separate `debug` top-level key | Does not pollute the `error` envelope |
| Environment guard | `isLocal()` + `APP_DEBUG` | Double safety; staging misconfig won't expose details |
| Trace depth in dev | 10 frames max | Enough for debugging without overwhelming |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Detail level | Full trace (all frames) | Limited trace (10 frames) | Limited — sufficient for debugging, prevents log bloat |
| Dev shape | Modify error envelope | Separate debug key | Separate debug key — client error parsing is unchanged |
| Whoops for HTML | Yes | Always JSON | Yes for browser routes; JSON for API routes |

## Performance Considerations
- Dev mode stack trace generation is slower but acceptable (local dev only).
- Production mode skips trace formatting — no overhead.
- The debug check is a single boolean compare — negligible.

## Production Considerations
- **Never set APP_DEBUG=true in production.** Enforce via CI (fail if `.env` contains `APP_DEBUG=true`).
- **Never set APP_DEBUG=true in staging** — it becomes a security incident if left enabled.
- Use environment-specific `.env` files (`.env.production`, `.env.staging`) with `APP_DEBUG=false`.
- Add a middleware that prevents debug mode on production even if misconfigured.
- Audit `APP_DEBUG` value on deploy via health check endpoint.

## Common Mistakes
- Setting `APP_DEBUG=true` in production for "temporary debugging" and forgetting to revert.
- Including stack traces in log files but excluding them from error responses (reverse of what's needed).
- Returning different error envelope shapes in dev vs prod (client testing on dev fails on prod).
- Hardcoding debug behaviour instead of using config (goes out of sync with environment).
- Whoops page leaking `$_ENV` values including database credentials.

## Failure Modes
- **Dev Mode Leak in Production**: If `APP_DEBUG` is accidentally `true`, attackers get full stack traces. Mitigation: middleware that checks and logs a CRITICAL alert if prod has debug enabled.
- **Inconsistent Testing**: Tests pass in dev but fail in prod due to different error shapes. Mitigation: write tests with `APP_DEBUG=false` to validate production error shapes.
- **Debug Info Bleed**: Dev detail added to a cached response shared with production. Mitigation: never cache error responses.

## Ecosystem Usage
- **Laravel**: Default Whoops renderer uses `APP_DEBUG` and `app()->environment()`.
- **Symfony**: `kernel.debug` parameter controls error detail.
- **Sentry**: `Sentry\Laravel\Integration` respects `APP_DEBUG` for error reporting.
- **Flare (Ignition)**: Laravel Ignition page in dev; disabled in production.

## Related Knowledge Units
### Prerequisites
- KU-12 Server Error Responses (what the safe production response looks like)
- KU-14 Global Exception Handler Config (where the dev/prod switch lives)

### Related Topics
- KU-16 Sensitive Data Leak Prevention (dev mode must also strip PII from debug output)
- Environment-specific configuration management

### Advanced Follow-up Topics
- Debug endpoints (e.g., `/api/_debug/error`) that return dev-level detail behind admin authentication (Phase 4).

## Research Notes
### Source Analysis
Laravel's convention uses `APP_DEBUG` for controlling error detail. The suggestion to use an additional `debug` top-level key (not modifying the error envelope) comes from API design best practices where client libraries parse the error envelope regardless of environment.

### Key Insight
**The production error response must be the same regardless of the underlying cause.** A validation error, a 500, and a network timeout all return the same envelope shape in production. The only difference is the `code` and `status`. Dev mode should never change the envelope — only add data.

### Version-Specific Notes
- Laravel 9+ `config('app.debug')` is type-safe boolean.
- Laravel Ignition (default in Laravel 9+) replaces Whoops — still controlled by `APP_DEBUG`.
