# Error Logging Context

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
Every error log entry includes a rich, structured context payload — request ID, user ID, trace ID, endpoint, and relevant business data — that enables effective debugging without requiring reproduction. Context is automatically appended by middleware and the exception handler, not manually in each catch block.

## Core Concepts
- **Structured Logging**: Logs are written as structured JSON (not plain text) for aggregation tools.
- **Automatic Context**: Context is added globally via handler `context()` and middleware, not per-catch-block.
- **Trace ID**: Every request and every error log shares a correlation ID for cross-referencing.
- **User Context**: Authenticated user ID is always included.
- **Request Context**: Method, URL, IP, user agent, and request ID are always included.
- **Business Context**: Domain-specific data is added by the throwing code (e.g., order ID, payment ID).

## Mental Models
Think of logging context as a passport stamp. Every significant event in the request lifecycle leaves a stamp: "arrived at controller", "authenticated as user 42", "fetched order 1001". When an exception occurs, the passport tells you the full journey, not just where the error happened.

## Internal Mechanics
1. Request arrives — middleware generates a trace ID (if not provided).
2. Throughout the request, middleware and services append context via `Log::withContext()`.
3. When an exception is thrown, the handler reads accumulated context.
4. Handler's `context()` method adds system-level context.
5. The full context array is sent to the logger and tracking service.

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

## Patterns
- **Global Context from Handler**: All log entries automatically get the context from `Handler::context()`.
- **Per-Request Context via Middleware**: Trace ID middleware sets `Log::withContext()` at request start.
- **Business Context at Throw Site**: Custom exceptions carry `$context` array with domain-specific data.
- **Sensitive Context Redaction**: See KU-16 — context is sanitised before logging.
- **Context Size Limit**: Enforce a max context size (e.g., 50 fields, 100KB) to prevent log bloat.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Context source | Automatic (handler) + manual (throw site) | Automatic covers the basics; manual covers domain specifics |
| Context transport | `Log::withContext()` | Laravel-native; persists for the request lifecycle |
| Correlation ID | X-Trace-ID from client; generated if missing | Enables end-to-end tracing from client to server |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Context at handler vs throw site | Handler only (limited) | Throw site only (inconsistent) | Both — handler for infra; throw site for domain |
| Trace ID source | Generated server-side | Provided by client | Client header with server fallback — enables end-to-end |
| Context size | Unlimited | Hard limit (50 fields, 100KB) | Hard limit — prevents log flooding |

## Performance Considerations
- `Log::withContext()` stores data in memory for the request — minimal impact.
- Context array serialisation is O(n) on fields; keep < 50 fields.
- JSON log formatting adds 0.05ms per line — negligible.
- Avoid logging large objects (file uploads, raw request bodies) in context.

## Production Considerations
- Use a structured log driver (`daily`, `syslog`, `stderr`, `cloudwatch`) — never `single` for production.
- Log aggregation tool (ELK, CloudWatch, DataDog) expects structured JSON context.
- Set up log retention policies (30–90 days depending on compliance).
- Mask IP addresses if GDPR required.
- Ensure log files are not publicly accessible (`.env` leak risk if stored in `storage/logs` with wrong permissions).

## Common Mistakes
- Logging the same context in every catch block (duplication — use handler context instead).
- Including `$request->all()` in context (includes passwords, tokens).
- Forgetting to remove sensitive data from business context (e.g., `payment.card_number` in payment context).
- Not including a trace ID — makes log correlation across services impossible.
- Using `error_log()` or `print_r()` instead of `Log::` — bypasses structured formatting and context.
- Logging in exceptions' constructors (exception may be constructed but never thrown — noisy logs).

## Failure Modes
- **Context Leak**: Sensitive data logged via business context (e.g., `customer.email` in order exception). Mitigation: sanitise context before logging (KU-16).
- **Log Overflow**: High-throughput endpoint logs too much context. Mitigation: sample debug log level in production.
- **Trace ID Collision**: Two requests get the same trace ID (UUID collision — astronomically unlikely).
- **Broken Pipeline**: Log driver fails (disk full). Mitigation: use `fallback` log channel.
- **Context Not Flushed**: Context persists across requests in long-running processes (queue workers). Mitigation: reset context at job start.

## Ecosystem Usage
- **Laravel**: `Log::withContext()` (introduced Laravel 9.x) for request-scoped context.
- **Monolog**: Processors for adding context (`UidProcessor`, `WebProcessor`, `IntrospectionProcessor`).
- **Sentry**: `Scope::setExtra()` for context in error tracking events.
- **ELK Stack**: Structured JSON logs parsed by Logstash; queried in Kibana.
- **OpenTelemetry**: Trace ID and span ID propagation for distributed tracing.

## Related Knowledge Units
### Prerequisites
- KU-14 Global Exception Handler Config (where context() method lives)
- KU-16 Sensitive Data Leak Prevention (sanitising context)

### Related Topics
- KU-17 Error Tracking Integration (Sentry context enrichment)
- Middleware design for trace ID propagation

### Advanced Follow-up Topics
- Distributed tracing with OpenTelemetry — propagating trace context across microservices (Phase 4).

## Research Notes
### Source Analysis
Twelve-Factor App principles mandate logs as event streams. Laravel's `Log::withContext()` (9.x) made request-scoped context a first-class feature. Monolog processors have supported this pattern for years via `pushProcessor()`.

### Key Insight
**Consistent context is more valuable than verbose context.** If every error log always includes trace_id, user_id, and request_id, debugging any error becomes a matter of three clicks. Adding 20 rarely-used fields just adds noise and cost. Focus on the core fields and let business context be added per-exception.

### Version-Specific Notes
- Laravel 9+ `Log::withContext()` is the recommended approach.
- Laravel 10+ `Log::shareContext()` shares context across channels.
- PHP 8.1+ array unpacking simplifies context merging.
