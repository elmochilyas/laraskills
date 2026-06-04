# Error Logging Context

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-error-logging-context |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Configuration Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Every error log entry includes a rich, structured context payload — request ID, user ID, trace ID, endpoint, and relevant business data — that enables effective debugging without requiring reproduction. Context is automatically appended by middleware and the exception handler, not manually in each catch block.

## Core Concepts

- **Structured Logging**: Logs are written as structured JSON (not plain text) for aggregation tools.
- **Automatic Context**: Context is added globally via handler `context()` and middleware, not per-catch-block.
- **Trace ID**: Every request and every error log shares a correlation ID for cross-referencing.
- **User Context**: Authenticated user ID is always included (never PII).
- **Request Context**: Method, URL, IP, user agent, and request ID are always included.
- **Business Context**: Domain-specific data is added by the throwing code (e.g., order ID, payment ID).

## When To Use

- For any production API that needs debugging capability
- When using log aggregation tools (ELK, CloudWatch, DataDog)
- When supporting customer-reported issues that need log correlation
- For APIs with multiple services needing distributed tracing
- When compliance requires audit trails of API errors

## When NOT To Use

- For local development where simple echo debugging suffices
- For trivial applications with no log aggregation
- When log storage costs are prohibitive and context is unnecessary

## Best Practices (WHY)

- **Use `Log::withContext()` for request-scoped context**: Laravel-native; persists for the request lifecycle.
- **Set context at the handler level**: All log entries automatically get context from `Handler::context()`.
- **Use trace ID middleware**: Set `Log::withContext()` at request start for end-to-end tracing.
- **Keep core fields consistent**: Every log always has trace_id, user_id, request_id, url, method, ip.
- **Add business context at throw site**: Custom exceptions carry `$context` with domain-specific data.
- **Limit context to 50 fields, 100KB**: Prevents log bloat and excessive storage costs.
- **Use structured log driver**: `daily`, `syslog`, `stderr`, `cloudwatch` — never `single` for production.
- **Mask IPs if GDPR required**: Anonymize IP addresses in log context.

## Architecture Guidelines

- Set trace ID via middleware at request start using `Log::withContext()`.
- Override `Handler::context()` to add system-level context automatically.
- Custom exception constructors accept `$context` for business-specific data.
- Apply redaction (KU-16) to context before logging.
- Use a structured log driver for JSON output.
- Include context in error tracking events (Sentry `setExtra()`).
- Reset context at job start for queue workers (prevents cross-job context leak).

## Performance Considerations

- `Log::withContext()` stores data in memory for the request — minimal impact.
- Context array serialisation is O(n) on fields; keep < 50 fields.
- JSON log formatting adds 0.05ms per line — negligible.
- Avoid logging large objects (file uploads, raw request bodies) in context.
- Log level sampling for high-throughput endpoints in production.

## Security Considerations

- Never include `$request->all()` in context (includes passwords, tokens).
- Sanitise business context before logging (KU-16).
- Mask IP addresses if GDPR required.
- Ensure log files are not publicly accessible.
- Apply retention policies to log data containing PII.
- Do not log raw request bodies — they may contain PII.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Logging same context in every catch block | Duplication | Manual context per catch | Noisy logs; inconsistent | Use handler context() and Log::withContext() |
| Including $request->all() in context | Passwords, tokens in logs | Convenience for debugging | Credential leak | Use explicit fields only |
| Missing trace ID | Can't correlate logs across services | No middleware setter | Can't debug request chains | Always set trace ID at middleware |
| Logging in exception constructors | Exception constructed but never thrown creates noise | Side effects in constructors | Logs include non-errors | Never log in exception constructors |
| No context reset in queue workers | Cross-job data contamination | Not resetting between jobs | Wrong context in logs | Reset Log context at job start |
| Using error_log() instead of Log:: | Bypasses structured formatting and context | Legacy patterns | Unparseable log entries | Always use Log:: facade |

## Anti-Patterns

- **Logging same data in multiple places**: Context added at every layer instead of once globally.
- **Unstructured log messages**: `"User $id error"` — can't be parsed by log aggregation tools.
- **Logging sensitive data because "logs are internal"**: Logs are the #1 target in data breaches.
- **Infinite context**: Logging the entire request object, session, or response.
- **Context only at error time**: Context from earlier in the request lifecycle is missing.

## Examples

```php
class Handler extends ExceptionHandler
{
    public function context(): array
    {
        $request = request();

        return [
            'trace_id' => $request->header('X-Trace-ID') ?? Str::uuid()->toString(),
            'request_id' => $request->header('X-Request-ID'),
            'user_id' => $request->user()?->id,
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'environment' => app()->environment(),
        ];
    }
}

// In middleware or service:
Log::withContext([
    'order_id' => $order->id,
    'payment_intent' => $payment->intent_id,
]);
```

## Related Topics

- Global Exception Handler Config (where context() method lives)
- Sensitive Data Leak Prevention (sanitising context before logging)
- Error Tracking Integration (Sentry context enrichment)
- Server Error Responses (trace ID correlation)
- Middleware design for trace ID propagation

## AI Agent Notes

- Always set trace_id, user_id, and request_id in log context at middleware level.
- Never include $request->all() or raw request bodies in log context.
- Use `Log::withContext()` for request-scoped context — not manual logging in each catch block.
- When generating custom exceptions, include business context but never sensitive data.
- For queue workers, ensure Log context is reset between jobs.

## Verification

- [ ] Trace ID middleware sets `Log::withContext()` at request start
- [ ] `Handler::context()` enriches all logs with trace_id, user_id, request_id, url, method, ip
- [ ] Log driver is structured (JSON) for aggregation tool compatibility
- [ ] No `$request->all()` calls in log context creation
- [ ] Business context is added via exception $context, not manual log calls
- [ ] Context size is limited (50 fields, 100KB)
- [ ] Context is sanitised for sensitive data before logging
- [ ] Queue workers reset context between jobs
