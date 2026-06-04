# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 04-distributed-tracing
**Knowledge Unit:** w3c-trace-context
**Difficulty:** Intermediate
**Category:** Trace Propagation
**Last Updated:** 2026-06-03

# Overview

W3C TraceContext (`traceparent` and `tracestate` headers) is the industry standard for propagating trace context across service boundaries. It enables end-to-end request tracing through polyglot microservices — a Laravel API calls a Python service, which calls a Go worker, and all spans are correlated under a single trace. OpenTelemetry and Sentry both use W3C TraceContext as their default propagation format.

Without standard trace context propagation, each service operates in its own trace island. Cross-service debugging requires manually correlating trace IDs across vendor-specific headers (x-datadog-trace-id, X-B3-TraceId, x-amzn-trace-id). W3C TraceContext eliminates this fragmentation.

Engineers should care because trace propagation is the mechanism that makes distributed tracing work. Without correct propagation, each service's traces are isolated — you cannot trace a request from Laravel through a downstream service to its database.

# Core Concepts

**traceparent Header:** The primary trace context header. Format: `{version}-{trace_id}-{span_id}-{trace_flags}`. Example: `00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01`. Total 55 bytes.

**tracestate Header:** Carries vendor-specific trace context data. Used by platforms like Datadog, New Relic, and Azure Monitor to propagate their internal trace context alongside the W3C standard.

**Trace ID:** 16 bytes (32 hex characters). Identifies the entire trace across all services. All spans in the same trace share the same trace ID.

**Span ID:** 8 bytes (16 hex characters). Identifies a single span within a trace. Changes at each service boundary.

**Trace Flags:** 1 byte (2 hex characters). Bitmap of flags. Bit 0 (00000001) = `sampled` flag — indicates whether the trace should be sampled. Bit 1 (00000010) = `random` flag — indicates trace was selected by random sampling.

**Baggage:** An additional W3C specification for propagating arbitrary key-value pairs across service boundaries. Less commonly used than TraceContext but useful for propagating tenant IDs, user roles, or feature flags.

**Propagator:** The OTel component that injects (serializes) and extracts (deserializes) trace context from carriers (HTTP headers, queue messages, gRPC metadata).

# When To Use

- **Every service in a distributed system** — W3C TraceContext is the universal standard
- **Polyglot environments** where services use different languages and frameworks
- **OpenTelemetry-based observability** — W3C is the default propagation format
- **Sentry-integrated applications** — Sentry uses W3C as default since 2023

# When NOT To Use

- **Single-service applications** — no cross-service propagation needed
- **Legacy vendor-specific propagation only** — transitional, but plan migration to W3C

# Best Practices

**Use OTel Propagator API, not manual header construction.** Never build `traceparent` strings manually. Use `Propagator::inject()` and `Propagator::extract()` from the OTel SDK.

**Configure W3C as the primary propagator.** Set `OTEL_PROPAGATORS=tracecontext,baggage` in the PHP SDK. This ensures W3C headers are injected and extracted.

**Forward tracestate without modification.** The `tracestate` header contains vendor-specific data. Do not modify it in application code — forward it as-is.

**Validate incoming traceparent headers.** Parse the header, validate hex format, hex length, version byte. If invalid, start a new trace rather than propagating garbage.

**Propagate context through queues.** For queue jobs, serialize the trace context into the job payload. On job execution, extract the context to create child spans under the parent trace.

# Architecture Guidelines

Trace propagation flow across service boundaries:
1. **Laravel service** receives request without trace context → starts new trace, generates `traceparent`
2. **Laravel service** calls downstream HTTP API → OTel HTTP client middleware injects `traceparent` into outgoing request
3. **Downstream service** extracts `traceparent` from incoming request → creates child span linked to parent trace
4. **Downstream service** makes database query → child span added under the same trace
5. **Downstream service** queues job → trace context serialized into job message
6. **Queue worker** extracts trace context → creates spans under the same trace

Each step adds spans to the same trace ID. The trace can be viewed end-to-end in the tracing backend.

# Performance Considerations

- **Header parsing:** ~5μs per incoming request for `traceparent` validation and parsing
- **Header injection:** ~2μs per outgoing HTTP call for `traceparent` generation and injection
- **Header size:** `traceparent` = 55 bytes. `tracestate` = variable (typically 50-500 bytes). Negligible impact on HTTP performance
- **Baggage size:** Can be arbitrarily large if not bounded. Set maximum baggage size (typically 1024 bytes)
- **Queue propagation overhead:** Serialization + deserialization of trace context adds ~10μs per job

# Security Considerations

- **Header validation:** Malformed `traceparent` headers can be used for injection attacks. Validate hex format and length before using values
- **Trace ID spoofing:** If trace-based security controls exist (rate limiting by trace, trace-based canary), validate that trace IDs are not spoofed from external sources
- **Baggage sanitization:** Baggage content is application-defined but travels through all services. Sanitize baggage to prevent cross-service metadata leakage
- **tracestate vendor data:** May contain vendor-specific tokens or identifiers that should not be forwarded to unauthorized services

# Common Mistakes

**Manual traceparent construction.** Building `traceparent` via string interpolation: `"00-{$traceId}-{$spanId}-01"`. This omits validation, may produce invalid format, and breaks on specification updates.

**Modifying tracestate.** Stripping or modifying vendor entries in `tracestate`, breaking downstream vendor integrations. Forward `tracestate` unchanged.

**No queue propagation.** Trace context is lost when jobs are queued. The queue job appears as a completely separate trace, unrelated to the parent request.

**Not validating incoming headers.** Using `traceparent` values without validation. A malformed header can propagate through the entire system, breaking all traces.

**Sentry and OTel propagation mismatch.** Sentry uses W3C by default but may need explicit configuration to interoperate with OTel propagation. Verify both use the same format.

# Anti-Patterns

**Trace context in URL parameters instead of headers:** Some teams pass `trace_id` as a query parameter. This leaks trace context to logs, analytics, and external systems. Use HTTP headers.

**Baggage overuse:** Using baggage to pass large payloads (response data, configuration objects). Baggage should carry only lightweight metadata (tenant ID, user role). Use headers for large data.

**traceparent from external sources without validation:** Accepting `traceparent` values from user-controlled inputs (query parameters, form fields). Only accept trace context from trusted upstream services via headers.

# Examples

**OTel propagator configuration:**
```php
$propagator = \OpenTelemetry\API\Globals::propagator();
$carrier = [];
$propagator->inject($carrier);
// $carrier now contains 'traceparent' and optionally 'tracestate' headers
```

**Incoming traceparent validation:**
```php
function validateTraceparent(string $header): bool
{
    $parts = explode('-', $header);
    if (count($parts) !== 4) return false;
    if ($parts[0] !== '00') return false;
    if (!ctype_xdigit($parts[1]) || strlen($parts[1]) !== 32) return false;
    if (!ctype_xdigit($parts[2]) || strlen($parts[2]) !== 16) return false;
    if (!ctype_xdigit($parts[3]) || strlen($parts[3]) !== 2) return false;
    return true;
}
```

# Related Topics

**Prerequisites:**
- OpenTelemetry PHP SDK (propagator configuration)

**Closely Related Topics:**
- OTLP Exporter & Collector Configuration (trace export pipeline)
- Span Sampling Strategies (parent-based sampling decisions)

**Advanced Follow-Up Topics:**
- Distributed Tracing Patterns (cross-service correlation)

**Cross-Domain Connections:**
- Async & Distributed Systems — queue trace propagation

# AI Agent Notes

- W3C TraceContext (`traceparent`) is the universal standard — use it everywhere
- Never construct `traceparent` manually — use OTel propagator API
- Always validate incoming `traceparent` headers
- Forward `tracestate` without modification
- Propagate trace context through queue jobs explicitly
- `traceparent` = 55 bytes, negligible overhead
- Baggage is for lightweight metadata only (< 1KB)
- Sentry and OTel both support W3C — verify interoperability
