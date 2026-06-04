# Production vs Dev Error Detail

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-production-vs-dev-error-detail |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Configuration Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Error responses contain different levels of detail depending on the environment — maximum detail for local development and testing, minimal safe detail for production — controlled exclusively by `APP_DEBUG` and environment detection, never by code changes. This ensures developers get the diagnostic information they need while production users never see internals.

## Core Concepts

- **APP_DEBUG=true (local/dev)**: Full stack traces, query details, environment information, and Whoops error page.
- **APP_DEBUG=false (staging/production)**: Standard error envelope with no internal detail.
- **No New Responses in Dev**: Dev mode enhances responses; it does not add new response types.
- **Environment Detection**: `app()->environment('local')`, `APP_DEBUG`, and `config('app.debug')` are the only switches.
- **Safe Defaults**: When in doubt, hide detail. Dev mode must be explicitly enabled.

## When To Use

- For any Laravel API deployed to production
- When debugging production issues via log correlation (trace IDs)
- When multiple environments (local, staging, production) need different error detail
- When onboarding new developers who need diagnostic information during development

## When NOT To Use

- For local-only development tools with no production deployment
- For APIs where all consumers are internal and trusted with diagnostic data
- When using a separate debug endpoint instead of environment-based switching

## Best Practices (WHY)

- **Add debug data under a separate `debug` key**: Never modify the `error` envelope structure — client parsing is unchanged.
- **Use `app()->isLocal()` AND `APP_DEBUG`**: Double safety prevents staging misconfig from exposing details.
- **Limit trace to 10 frames in dev**: Sufficient for debugging without overwhelming or causing log bloat.
- **Always return JSON for API routes in dev**: Don't show Whoops HTML for API requests.
- **Never set APP_DEBUG=true in production**: Enforce via CI — fail if `.env` contains `APP_DEBUG=true`.
- **Audit APP_DEBUG on deploy**: Health check endpoint verifies debug is disabled.
- **Test with APP_DEBUG=false**: Write dedicated tests that validate production-safe error responses.

## Architecture Guidelines

- Check `config('app.debug')` at the start of each render in the handler.
- In dev mode, append a top-level `debug` key with exception class, file, line, limited trace, and previous exception.
- In production, return the standard safe envelope with trace ID only.
- Use `app()->isLocal()` not just `APP_DEBUG` for environment gating.
- Return JSON for API routes in dev mode; Whoops for browser routes only.
- Never cache error responses — dev detail should never leak to production via cache.
- Use environment-specific `.env` files (`.env.production`, `.env.staging`) with `APP_DEBUG=false`.

## Performance Considerations

- Dev mode stack trace generation is slower but acceptable (local dev only).
- Production mode skips trace formatting entirely — no overhead.
- The debug check is a single boolean compare — negligible.
- Dev mode trace serialisation adds ~1-2ms per error response.

## Security Considerations

- **Never set APP_DEBUG=true in production** — becomes a security incident if left enabled.
- Add middleware that prevents debug mode on production even if misconfigured.
- Dev mode must still strip PII from debug output (passwords, tokens).
- Whoops page leaks `$_ENV` values including database credentials — ensure it's never shown for API routes.
- Production error response must be identical regardless of underlying cause.
- Dev mode should never change the envelope — only add data.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| APP_DEBUG=true in production | Full stack traces exposed | "Temporary debugging" left enabled | Information disclosure | CI fails if .env contains APP_DEBUG=true |
| Including traces in logs but not responses | Reverse of what's needed | Misunderstanding error handling goals | Can't debug from client reports | Include traces in logs; exclude from responses |
| Different envelope shapes per environment | Envelope fields differ in dev vs prod | Modifying error envelope in dev | Client testing on dev fails on prod | Use separate `debug` key, never modify envelope |
| Hardcoding debug behaviour | `if (env('APP_DEBUG'))` instead of config | Convenience | Goes out of sync with environment | Use `config('app.debug')` |
| Whoops page for API routes | HTML error for JSON endpoint | Not checking expectsJson() | Client parses HTML as JSON | Always return JSON for API routes |

## Anti-Patterns

- **Returning dev detail in staging**: Staging should mirror production error detail.
- **Conditional rendering based on request parameter**: `?debug=1` exposes internals intentionally.
- **Debug mode dependent on IP**: Security through obscurity — can be bypassed.
- **Different error envelope shape per environment**: The contract is the envelope, not the debug key.
- **Environment detection in exception classes**: Classification should be environment-agnostic.

## Examples

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
                'trace' => array_slice($e->getTrace(), 0, 10),
                'previous' => $e->getPrevious()?->getMessage(),
            ],
        ]);
    }

    return $response;
}
```

## Related Topics

- Server Error Responses (the safe production response baseline)
- Global Exception Handler Config (where the dev/prod switch lives)
- Sensitive Data Leak Prevention (dev mode must also strip PII)
- Error Response Testing (testing both dev and production modes)

## AI Agent Notes

- Always use a separate `debug` key for dev detail — never modify the `error` envelope.
- Gate dev detail checks on both `config('app.debug')` AND `app()->isLocal()`.
- Never generate code that enables debug mode based on request parameters or IP.
- When writing tests, include a test suite that runs with `APP_DEBUG=false` to validate production responses.
- Ensure debug output still sanitizes sensitive data (passwords, tokens, PII).

## Verification

- [ ] Dev detail appears under a separate `debug` key, never in the `error` envelope
- [ ] Dev mode is gated by both `config('app.debug')` and `app()->isLocal()`
- [ ] API routes always return JSON in dev mode (no Whoops HTML)
- [ ] CI enforces `APP_DEBUG=false` in production/staging
- [ ] Debug detail includes: exception class, file, line, limited trace (10 frames), previous exception
- [ ] Production error response shape is identical across all error types
- [ ] Test suite includes production-mode error response tests
