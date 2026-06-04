# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 01-logging
**Knowledge Unit:** log-context-correlation
**Difficulty:** Intermediate
**Category:** Logging Enrichment
**Last Updated:** 2026-06-03

# Overview

Log context correlation is the practice of embedding request-scoped metadata — user IDs, trace IDs, correlation IDs, session identifiers — into every log entry so that individual log lines can be assembled into a coherent narrative spanning services, queues, and user sessions. Without correlation, production debugging becomes a manual, time-consuming hunt across disparate log files with no linking identifier.

In Laravel, correlation is achieved through three mechanisms: the `Context` facade (Laravel 11+), PSR-3 context arrays passed to every `Log::info()` call, and Monolog processors that inject ambient metadata automatically. The goal is a traceable path from user action → HTTP request → log entry → database query → queued job → external service call.

Engineers should care because correlated logs directly reduce MTTR. When every log line carries the same trace ID, a single search in your log aggregator reveals the complete request lifecycle. Without correlation, each incident requires cross-referencing timestamps and guessing at request boundaries.

# Core Concepts

**Context Facade:** Laravel 11 introduced `Illuminate\Log\Context\Context` as a first-class mechanism for storing request-scoped metadata. Data set via `Context::add('key', 'value')` is automatically appended to every log entry created during the request lifecycle. It is serialized, stored, and flushed automatically, replacing ad-hoc global state patterns.

**PSR-3 Context Array:** The PSR-3 logging standard defines a `$context` parameter on all log methods. Laravel's logger merges this array into the log record. Unlike the Context facade, PSR-3 context is explicit per-call — it is appropriate for specific, call-site-scoped metadata that is not ambient.

**Monolog Processors:** Monolog processors are callables that receive the log record and return an enriched version. They run in a pipeline before formatting. Processors are the correct layer for injecting ambient context (trace IDs, environment, version) into every log entry without call-site changes.

**Correlation ID:** A unique identifier assigned at the earliest entry point (HTTP request, queue job, CLI command) and propagated through the entire execution path. Correlation IDs enable log grouping across asynchronous boundaries.

**Trace ID:** The OpenTelemetry trace identifier (`trace_id`) that links spans across service boundaries. Injecting the trace ID into log entries creates a bridge between logging and distributed tracing.

**Scope (Sentry):** Sentry's scope object holds contextual data (user, tags, extras, breadcrumbs) attached to error events. Bridging the Laravel Context facade to Sentry's scope ensures error reports carry the same correlation context as logs.

# When To Use

- **Production debugging:** Every production Laravel application should correlate logs to enable efficient debugging
- **Multi-service architectures:** Correlation IDs become essential when a single request traverses multiple services
- **Queue-heavy applications:** Jobs execute outside the request lifecycle — correlation context must be manually propagated
- **Regulatory compliance:** Audit trails require linking user actions to system events across services
- **Customer support:** Support teams benefit from searching logs by customer ID or order ID

# When NOT To Use

- **Trivial single-purpose services:** A monitoring sidecar or simple redirect service does not need log correlation
- **Development-only applications:** The overhead of context propagation is unnecessary for local development
- **Extremely high-throughput endpoints (>10k req/s):** Context serialization may add measurable overhead — evaluate with profiling

# Best Practices

**Use Context facade over global state.** The `Context` facade is the correct mechanism for request-scoped metadata. Do not use `$_REQUEST`, static class properties, or service container singletons to store correlation context.

**Inject trace IDs via Monolog processors.** Configure a processor that extracts the current OpenTelemetry trace ID from the OTel context and adds it to every log record. This creates a reliable bridge between traces and logs.

**Propagate context to queues.** Use `Context::hydrate()` and `Context::dehydrate()` to pass context through queued jobs. In Laravel 11+, queue job middleware can automate context propagation.

**Keep PSR-3 context for call-site specifics.** Use the PSR-3 context array for metadata that is specific to a single log call — the order ID being processed, the validation error for a specific field — not for ambient request context.

**Breadcrumb strategically.** Configure breadcrumb collection to capture meaningful events without excessive noise. Too many breadcrumbs obscure signal; too few lose context.

# Architecture Guidelines

The context enrichment pipeline follows a strict order:

1. **Entry point** (HTTP middleware / queue middleware): Initialize correlation ID, extract W3C traceparent headers
2. **Context facade:** Store user ID, session ID, request path, IP (pseudonymized) via `Context::add()`
3. **Monolog processors:** Inject trace ID, environment, release version into every log record
4. **PSR-3 context:** Call-site adds operation-specific metadata to individual log calls
5. **Sentry scope:** Bridge Context facade data to Sentry scope for error event enrichment
6. **Log aggregator:** Ingest JSON logs with correlation fields for searchable storage

The Context facade sits before Monolog processors in the data flow. Processors enrich the log record, which already contains Context facade data merged by Laravel's logging system.

# Performance Considerations

- **Context facade serialization:** `dehydrate()` runs on every request — measure its duration in high-traffic routes. Typically sub-millisecond for reasonable data volumes (< 50 fields, < 10KB total)
- **Processor overhead:** Each Monolog processor adds microseconds per log call. Keep processors stateless and fast. Avoid I/O in processors.
- **Large context arrays:** Context data is serialized into every log entry. Oversized context (~1MB+) increases storage cost and ingestion latency. Set practical limits.
- **Queue context serialization:** Passing large context objects through queue serialization adds Redis/DB payload size. Trim context to essential fields before queue dispatch.

# Security Considerations

- **PII leakage:** The Context facade automatically appends its data to all logs. Audit all context data for PII (emails, phone numbers, government IDs) before production deployment.
- **Credential exposure:** Never store passwords, API keys, or tokens in the Context facade or PSR-3 context.
- **traceparent validation:** Incoming W3C traceparent headers must be validated — malformed headers can be an attack vector. Validate hex format, version byte, and length.
- **Context facade visibility:** Data in the Context facade is available application-wide. Do not store secrets under the assumption they are private to the logging subsystem.
- **Sentry before_send:** Configure Sentry's `before_send` callback to redact sensitive fields from error events.

# Common Mistakes

**Using global state for correlation metadata.** Developers store user IDs in static class properties accessible across the request. This fails in long-running processes (queue workers) where state leaks between jobs. Use the Context facade, which is properly scoped and serialized.

**Failing to propagate context to queues.** Context set via the Context facade during an HTTP request is lost when a queued job executes in a separate process. Explicitly hydrate/dehydrate context in queue middleware.

**Injecting too much context.** Adding 50+ fields to every log entry increases storage cost, slows ingestion, and makes search harder. Limit context to 10-15 high-value fields.

**Mixing correlation and trace IDs.** A correlation ID groups a user's request across services; a trace ID groups spans across services. Use both — they serve different purposes — but document which is which.

**Manual header construction.** Never construct `traceparent` headers from raw strings. Always use the OpenTelemetry SDK to generate and parse trace context headers.

# Anti-Patterns

**Global state context:** Using `Illuminate\Support\Facades\Log::shareContext()` (deprecated) or static arrays for request-scoped data. These patterns do not scope correctly in queue workers.

**Context over-injection:** Automatically adding every model attribute, request header, and session variable to context. This creates log entries that are expensive to store and difficult to search.

**Missing context in async paths:** Correlating only HTTP requests while queue jobs, scheduled commands, and broadcast events lack context. Every execution path must propagate correlation context.

**PSR-3 as primary context:** Using the PSR-3 context array exclusively — without the Context facade or Monolog processors — means every log call must manually repeat ambient context. This is error-prone and leads to incomplete correlation.

# Examples

**Correlation ID initialization middleware:**
```php
public function handle($request, Closure $next)
{
    $correlationId = $request->header('X-Correlation-ID', (string) Str::uuid());
    Context::add('correlation_id', $correlationId);
    Context::add('request_path', $request->path());
    Context::add('user_id', $request->user()?->id);
    return $next($request);
}
```

**Monolog trace ID processor:**
```php
class TraceIdProcessor
{
    public function __invoke(array $record): array
    {
        $span = OpenTelemetry\API\Globals::getTracerProvider()
            ->getTracer('app')
            ->getCurrentSpan();
        $record['extra']['trace_id'] = $span->getContext()->getTraceId();
        return $record;
    }
}
```

**Queue context middleware (Laravel 11+):**
```php
public function handle($job, $next)
{
    Context::hydrate($job->context);
    $result = $next($job);
    Context::dehydrate();
    return $result;
}
```

# Related Topics

**Prerequisites:**
- Monolog Architecture & Channel Configuration (processor pipeline)
- Structured JSON Logging (context fields in JSON output)

**Closely Related Topics:**
- OpenTelemetry PHP SDK (trace context propagation)
- Sentry Laravel Integration (Sentry scope bridging)
- W3C Trace Context Propagation (traceparent/span_id across service boundaries)

**Advanced Follow-Up Topics:**
- Span Sampling Strategies (trace-level sampling impact on log correlation)
- PII Redaction & Log Sampling (sanitizing context fields)

**Cross-Domain Connections:**
- Application Architecture Patterns — request lifecycle correlation
- Async & Distributed Systems — queue context propagation patterns

# AI Agent Notes

- The Context facade (`Illuminate\Log\Context\Context`) is the recommended mechanism for Laravel 11+ request-scoped metadata
- Monolog processors are the correct abstraction for injecting ambient fields (trace IDs, environment) that should appear on every log entry
- Queue context propagation must be explicit — never assume context survives serialization
- Trace IDs from OpenTelemetry should be injected into logs, not the reverse — logs are downstream of traces
- Correlation ID format (UUID v4 vs ULID) should be decided early and documented — changing formats later breaks aggregator searches
