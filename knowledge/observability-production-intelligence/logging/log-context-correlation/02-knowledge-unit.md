# Log Context Correlation

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 01-logging
- **Knowledge Unit:** log-context-correlation
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Log context correlation embeds request-scoped metadata into every log entry so individual lines assemble into a coherent narrative across services, queues, and user sessions. Without it, production debugging becomes a manual hunt across disparate log files with no linking identifier, directly increasing Mean Time To Resolution (MTTR).

---

## Core Concepts

- **Context Facade:** Laravel 11+ `Illuminate\Log\Context\Context` stores request-scoped metadata automatically appended to every log entry
- **PSR-3 Context Array:** Explicit per-call metadata passed to individual `Log::info()` invocations
- **Monolog Processors:** Pipeline callables that inject ambient context (trace IDs, environment) into every record before formatting
- **Correlation ID:** Unique identifier assigned at entry points and propagated through the entire execution path
- **Trace ID:** OpenTelemetry trace identifier linking spans across service boundaries, bridged into log entries

---

## Mental Models

- **Narrative Model:** Every log line is a sentence; correlation ID is the chapter number that groups sentences into a coherent story
- **Bridge Model:** Logs show what happened, traces show the path — correlation bridges them so you can move from "what" to "where" in one search
- **Envelope Model:** Context facade is the envelope (always present), PSR-3 context is the letter inside (specific to this message), processors are the stamp (ambient metadata)

---

## Internal Mechanics

The context enrichment pipeline follows a strict order: entry point middleware initializes correlation ID and extracts W3C traceparent headers → Context facade stores user ID, session ID, request path → Monolog processors inject trace ID, environment, release version → PSR-3 context adds operation-specific metadata → Sentry scope bridges context to error events. The Context facade serializes via `dehydrate()` on every request and restores via `hydrate()` in queue workers.

---

## Patterns

- **Queue Context Propagation:** Use `Context::hydrate()` and `Context::dehydrate()` in queue middleware to pass context through job boundaries. Benefit: trace continuity across async boundaries. Tradeoff: serialization overhead for large context objects.
- **Trace ID Injection via Processor:** A Monolog processor extracts the current OpenTelemetry span context and adds `trace_id` to every log record. Benefit: logs and traces are queryable by the same ID. Tradeoff: processor adds microseconds per log call.
- **Breadcrumb Strategy:** Configure meaningful breadcrumb collection without excessive noise. Benefit: rich request lifecycle narrative. Tradeoff: too many breadcrumbs obscure signal; too few lose context.

---

## Architectural Decisions

**Use Context facade over global state** for request-scoped metadata. The Context facade is properly scoped and serialized; global state (static properties, `$_REQUEST`) leaks between jobs in long-running processes.

**Inject trace IDs via Monolog processors, not in application code.** Processors run automatically on every log call without call-site changes. Application code should focus on business logic, not observability plumbing.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Correlated logs reduce MTTR from hours to minutes | Context serialization adds sub-millisecond per request | Acceptable for all but highest-throughput endpoints |
| Trace ID in logs bridges observability signals | Processor overhead per log call | Keep processors stateless and fast; avoid I/O |
| Queue context propagation maintains trace continuity | Serialization adds Redis/DB payload size | Trim context to essential fields before dispatch |

---

## Performance Considerations

Context facade serialization (`dehydrate()`) runs on every request — typically sub-millisecond for <50 fields, <10KB total. Each Monolog processor adds microseconds per log call. Oversized context (~1MB+) increases storage cost and ingestion latency. Queue context serialization adds Redis/DB payload size.

---

## Production Considerations

Audit all Context facade data for PII before production deployment. Never store passwords, API keys, or tokens in context. Validate incoming W3C traceparent headers to prevent malformed header attacks. Configure Sentry `before_send` callback to redact sensitive fields from error events.

---

## Common Mistakes

**Using global state for correlation metadata** — fails in queue workers where state leaks between jobs. Use the Context facade, which is properly scoped and serialized.

**Failing to propagate context to queues** — context set during HTTP requests is lost when queued jobs execute in separate processes. Explicitly hydrate/dehydrate context in queue middleware.

**Injecting too much context** — 50+ fields per entry increases storage cost and slows ingestion. Limit to 10-15 high-value fields.

---

## Failure Modes

**Queue context loss:** Context facade data set during HTTP request is absent in queue worker. Detection: missing correlation IDs in job logs. Mitigation: implement queue middleware that calls `Context::hydrate()` before job execution and `Context::dehydrate()` after.

**Traceparent header malformation:** Invalid incoming headers propagate through the system, breaking all traces. Detection: missing or malformed trace IDs in logs. Mitigation: validate hex format, version byte, and length on ingress.

**PII leakage through context:** Sensitive user data automatically appended to all logs via Context facade. Detection: compliance audit finds PII in log storage. Mitigation: audit all context fields before production deployment; implement redaction processor.

---

## Ecosystem Usage

Laravel's `Context` facade provides first-class request-scoped metadata in 11+. Monolog processors are the standard mechanism for ambient field injection. Sentry Laravel SDK bridges context via `configureScope`. OpenTelemetry PHP SDK provides `trace_id` injection points.

---

## Related Knowledge Units

### Prerequisites
- Monolog Architecture & Configuration (processor pipeline)
- Structured JSON Logging (context fields in JSON output)

### Related Topics
- OpenTelemetry PHP SDK (trace context propagation)
- Sentry Laravel Integration (Sentry scope bridging)
- W3C Trace Context Propagation (traceparent/span_id across service boundaries)

### Advanced Follow-up Topics
- Span Sampling Strategies (trace-level sampling impact on log correlation)
- PII Redaction & Log Sampling (sanitizing context fields)

---

## Research Notes

The Context facade (`Illuminate\Log\Context\Context`) is the recommended mechanism for Laravel 11+ request-scoped metadata. Monolog processors are the correct abstraction for injecting ambient fields. Queue context propagation must be explicit — never assume context survives serialization. Trace IDs from OpenTelemetry should be injected into logs, not the reverse — logs are downstream of traces. Correlation ID format (UUID v4 vs ULID) should be decided early and documented to avoid breaking aggregator searches.
