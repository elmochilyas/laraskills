# Server Error Responses

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
All server-side failures — unhandled exceptions, database outages, third-party service failures — return a consistent 500 response shape that **never leaks internal state**. Stack traces, SQL queries, file paths, and internal variable values are strictly excluded from the response while being fully captured in logs.

## Core Concepts
- **HTTP 500 Internal Server Error**: Status for all unexpected server failures.
- **Never Expose Internals**: No stack traces, file paths, SQL, variable dumps, or configuration values in any environment response.
- **Trace ID for Correlation**: Every 500 response includes a `detail.trace_id` that links to the server-side log entry for support diagnosis.
- **Safe Generic Message**: "An internal server error occurred." — identical for all 500s, regardless of underlying cause.
- **Error Code**: `SYSTEM.INTERNAL_ERROR` (generic) — additional codes for specific infrastructure failures (database: `SYSTEM.DATABASE_ERROR`, queue: `SYSTEM.QUEUE_ERROR`).

## Mental Models
500 is a sealed black box. The client sees the box but can't look inside. The trace ID is a reference number they can give to support, who has the key to open the box internally. The client never needs (and must never receive) the box's internal schematics.

## Internal Mechanics
1. Any unhandled exception reaches the global exception handler.
2. Handler generates a `trace_id` (UUID v4).
3. Handler logs the full exception with trace_id, stack trace, request context.
4. Handler returns a sanitised 500 response with trace_id and generic message.
5. `APP_DEBUG=true` is detected and handled separately (see KU-15).

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

## Patterns
- **Trace ID Generation**: Always generate a new UUID per 500 response; do not reuse request IDs (they exist before the error).
- **Infrastructure-Specific Codes**: Database errors → `SYSTEM.DATABASE_ERROR`, queue errors → `SYSTEM.QUEUE_ERROR`, third-party timeout → `SYSTEM.THIRD_PARTY_TIMEOUT`.
- **Safe Catch-All**: If the error cannot be classified, default to `SYSTEM.INTERNAL_ERROR`.
- **Content-Type Enforcement**: Force `application/json` even if the exception was thrown before middleware set the content type.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Stack trace in response | Never, regardless of environment | Security: prevents information disclosure |
| Trace ID format | UUID v4 | Unpredictable, globally unique |
| Code classification | By exception type | Distinguishes DB from app from third-party errors |
| Default code | SYSTEM.INTERNAL_ERROR | Safe fallback when type unknown |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Trace ID in response | Always | Only on 500 | Only on 500 — reduces overhead on success responses |
| Generic vs specific message | Generic for all | Specific ("Database unavailable") | Specific messages for operational failures; generic for unknown |
| Debug info in dev | Yes (stack trace) | No trace ever | Handled by KU-15 (production vs dev) — see separate policy |

## Performance Considerations
- UUID generation and logging are the primary cost — roughly 1–2ms per 500 response.
- Avoid sending alert notifications from within the render method (circular dependency risk).
- Use async log channels (daily, syslog) to avoid blocking the response.

## Production Considerations
- Monitor 500 rate: any non-zero 500 rate in production is a P1/P2 incident.
- Alert on new 500 error messages (previously unseen exception types).
- Ensure the trace ID is included in log aggregation tool (Sentry, ELK, CloudWatch) for correlation.
- Never return 500 for expected operational errors (use 4xx instead).
- Load balancer health checks should treat 500 as unhealthy node.

## Common Mistakes
- Returning stack traces in production responses (`APP_DEBUG=true` in .env).
- Returning SQL query text in error messages ("Column not found: `users_.name`").
- Including file paths in messages ("/var/www/app/Models/User.php:42").
- Using the same trace ID for both request and error (they serve different purposes).
- Writing error details to the response before the error handler runs (e.g., in middleware).

## Failure Modes
- **Error During Error Handling**: The render method itself throws an exception. Mitigation: wrap in try/catch with hardcoded fallback response.
- **Trace ID Collision**: UUIDs are astronomically unlikely to collide.
- **Log Overflow**: A sudden burst of 500s floods log storage. Mitigation: rate-limit log writes within the error handler.
- **Memory Exhaustion**: The exception object holds large context data. Mitigation: limit context size in the handler.

## Ecosystem Usage
- **Stripe**: 500 with `error.type: "api_error"` and no additional detail.
- **GitHub**: 500 with `message: "Server Error"` and no detail.
- **Twilio**: 500 with `code: 20001` (generic server error) and `more_info` URL.
- **Laravel**: Default `Whoops` page in debug; override in `Handler->render()`.

## Related Knowledge Units
### Prerequisites
- KU-02 Standardized Error Envelope
- KU-01 Error Type Taxonomy (500 = programmer + infrastructure)

### Related Topics
- KU-15 Production vs Dev Error Detail (dev mode differences)
- KU-16 Sensitive Data Leak Prevention (complementary)

### Advanced Follow-up Topics
- Health check endpoints for distinguishing app-level vs infrastructure-level 500s (Phase 4).

## Research Notes
### Source Analysis
OWASP guidelines mandate no sensitive information in error responses. PCI DSS Section 6.5.5 requires secure error handling. All major API providers (Stripe, GitHub, Twilio, Google) return minimal 500 responses.

### Key Insight
The trace ID is the single most important field in a 500 response. It bridges the gap between the client-facing opaque error and the internal diagnostic information. **Without a trace ID, support can't help.** Always include it.

### Version-Specific Notes
- Laravel 10+ `Log::error()` with `exception` context automatically serialises the stack trace.
- Laravel 11+ `$this->renderable()` can override the default Whoops page.
