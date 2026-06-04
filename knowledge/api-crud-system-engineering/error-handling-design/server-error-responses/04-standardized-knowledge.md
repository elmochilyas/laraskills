# Server Error Responses

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-server-error-responses |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

All server-side failures — unhandled exceptions, database outages, third-party service failures — return a consistent 500 response shape that **never leaks internal state**. Stack traces, SQL queries, file paths, and internal variable values are strictly excluded from the response while being fully captured in logs.

## Core Concepts

- **HTTP 500 Internal Server Error**: Status for all unexpected server failures.
- **Never Expose Internals**: No stack traces, file paths, SQL, or configuration values in any environment.
- **Trace ID for Correlation**: Every 500 response includes `detail.trace_id` linking to the server-side log entry.
- **Safe Generic Message**: "An internal server error occurred." — identical for all 500s.
- **Infrastructure-Specific Codes**: `SYSTEM.DATABASE_ERROR`, `SYSTEM.QUEUE_ERROR`, `SYSTEM.THIRD_PARTY_TIMEOUT`.
- **Default Code**: `SYSTEM.INTERNAL_ERROR` for unclassifiable failures.

## When To Use

- For any production API where internal details must be protected
- When integrating error tracking (Sentry, Flare) for internal diagnostics
- When debugging production issues via trace ID correlation
- For any API that handles unexpected exceptions

## When NOT To Use

- For local development where stack traces aid debugging (handled by dev mode)
- For expected operational errors (use 4xx responses instead)
- For health check endpoints that should return detailed status

## Best Practices (WHY)

- **Never return stack traces** in any environment response — use a separate `debug` key in dev mode.
- **Always include trace_id**: The single most important field — bridges client and server logging.
- **Use infrastructure-specific codes**: Enables differentiated monitoring (DB vs queue vs third-party).
- **Use safe generic message**: "An internal server error occurred." — identical for all causes.
- **Throw catch-all as last renderable**: Always register a `Throwable` fallback for unhandled exceptions.
- **Log full context before rendering**: Include trace_id, user, URL, method, and exception details.
- **Force `application/json` Content-Type**: Even if exception occurred before middleware set the type.
- **Monitor 500 rate**: Any non-zero 500 rate in production is a P1/P2 incident.

## Architecture Guidelines

- Generate a UUID trace ID per 500 response (not reused from request ID).
- Log full exception with trace_id, stack trace, and request context before rendering.
- Classify by exception type for infrastructure-specific codes (DB vs queue vs HTTP).
- Wrap render method in try/catch with hardcoded fallback (prevent error-during-error-handling).
- Configure async log channels (daily, syslog) to avoid blocking the response.
- Include trace_id in log aggregation tool (Sentry, ELK, CloudWatch).
- Health check endpoints should treat 500 as unhealthy node signal.

## Performance Considerations

- UUID generation and logging are the primary cost — roughly 1–2ms per 500 response.
- Avoid sending alert notifications from within the render method (circular dependency risk).
- Rate-limit log writes within the error handler to prevent log overflow during error bursts.
- Limit context size passed to logger to prevent memory exhaustion.

## Security Considerations

- Never include stack traces, file paths, or SQL in any part of the response.
- Never include `$_ENV`, `$_SERVER`, or configuration values in error responses.
- Never expose third-party API keys or service endpoints in error messages.
- Ensure the trace ID is a random UUID, not sequential — prevents request enumeration.
- Rate-limit error response production to prevent error flooding from exhausting response workers.
- PCI DSS Section 6.5.5 requires secure error handling — no sensitive data in responses.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Returning stack traces in production | `APP_DEBUG=true` in .env | Debug left enabled in production | Full information disclosure | Enforce CI check for APP_DEBUG=false |
| Exposing SQL in messages | "Column not found: `users_.name`" | Catching QueryException and rendering | Database schema exposure | Map all QueryExceptions to generic codes |
| Missing trace ID | No correlation between client error and server log | Assuming request ID is sufficient | Can't debug production issues | Always generate and include trace_id |
| Error during error handling | Render method itself throws | Complex rendering logic | Hardcoded Whoops/Symfony error | Wrap render in try/catch with fallback |
| Returning 500 for expected errors | Using 500 for validation failures | No error type taxonomy | Unnecessary P1 alerts | Use appropriate 4xx for expected errors |

## Anti-Patterns

- **Returning different 500 shapes per endpoint**: All server errors must have identical structure.
- **Including exception class name in response**: `error.code: "QueryException"` reveals internals.
- **Logging after sending the response**: Log before response generation ensures trace_id is in logs.
- **Reusing request X-Request-ID as trace_id**: The trace_id is specifically for the error, not the request.
- **Detailed error messages in staging**: Staging should mirror production error detail to catch issues.

## Examples

```php
public function renderServerError(Throwable $e, Request $request): JsonResponse
{
    $traceId = Str::uuid()->toString();

    Log::error('Internal server error', [
        'trace_id' => $traceId,
        'exception' => $e,
        'request_id' => $request->header('X-Request-ID'),
        'user_id' => $request->user()?->id,
        'url' => $request->fullUrl(),
        'method' => $request->method(),
    ]);

    return response()->json(
        new ErrorEnvelope(
            code: $this->resolveInfrastructureCode($e),
            message: 'An internal server error occurred.',
            status: 500,
            detail: ['trace_id' => $traceId],
        ),
        500,
    );
}
```

## Related Topics

- Production vs Dev Error Detail (dev mode response difference)
- Sensitive Data Leak Prevention (complementary security)
- Error Tracking Integration (trace ID correlation)
- Global Exception Handler Config (where 500 rendering is configured)
- Error Type Taxonomy (500 = programmer + infrastructure)

## AI Agent Notes

- Always include a trace_id in 500 responses — never omit it.
- Never hardcode sensitive information (database names, file paths) into 500 response messages.
- When generating catch blocks, always delegate to the exception handler rather than rendering manually.
- The 500 response must have the exact same envelope shape as all other error responses.
- For infrastructure-specific 500s (DB, queue), use specific error codes but keep the message generic.

## Verification

- [ ] All 500 responses contain `detail.trace_id` (UUID)
- [ ] No stack traces, file paths, or SQL appear in any 500 response
- [ ] A catch-all Throwable renderable is registered as last fallback
- [ ] 500 render method is wrapped in try/catch with hardcoded fallback
- [ ] Log entries for 500s include trace_id, user, URL, method, and full exception
- [ ] Infrastructure-specific error codes resolve correctly (DB, queue, third-party)
- [ ] Integration tests with APP_DEBUG=false verify no sensitive data in 500 responses
