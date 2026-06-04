# W3C Trace Context Propagation

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 04-distributed-tracing
- **Knowledge Unit:** w3c-trace-context
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

W3C TraceContext (`traceparent` and `tracestate` headers) is the industry standard for propagating trace context across service boundaries, enabling end-to-end request tracing through polyglot microservices. Without it, each service operates in its own trace island — a Laravel API calling a Python service cannot correlate spans under a single trace.

---

## Core Concepts

- **traceparent Header:** Primary trace context header — format `{version}-{trace_id}-{span_id}-{trace_flags}` (55 bytes)
- **tracestate Header:** Carries vendor-specific trace context data alongside the W3C standard
- **Trace ID:** 16 bytes (32 hex characters) identifying the entire trace across all services
- **Span ID:** 8 bytes (16 hex characters) identifying a single span within a trace, changes at each service boundary
- **Trace Flags:** 1 byte bitmap — bit 0 (sampled), bit 1 (random)
- **Baggage:** W3C specification for propagating arbitrary key-value pairs across service boundaries (< 1KB)

---

## Mental Models

- **Passport Model:** `traceparent` is a passport — it gets stamped at each service boundary, maintaining identity and travel history
- **Baton Model:** Trace context is a relay baton — passed from service to service. If one service drops it, the entire trace is broken
- **Postcard Model:** `traceparent` is the address on a postcard (small, standardized), `tracestate` is the message on the back (vendor-specific), and baggage is a separate envelope (arbitrary key-value pairs)

---

## Internal Mechanics

When a Laravel service receives a request, it checks for incoming `traceparent` header. If present, the OTel propagator extracts the trace context and creates a child span. If absent, a new trace starts. Outgoing HTTP calls via Guzzle automatically inject `traceparent` into request headers via the propagator. The header format: `00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01` (version, trace ID, span ID, flags). The propagator uses the OTel SDK's `Propagator::inject()` and `Propagator::extract()` methods.

---

## Patterns

- **HTTP Header Propagation:** OTel HTTP client middleware automatically injects `traceparent` into outgoing requests. Benefit: zero-code propagation. Tradeoff: only covers HTTP — gRPC and message queues need separate configuration.
- **Queue Context Propagation:** Serialize trace context into job payload; extract on execution to create child spans. Benefit: trace continuity through async boundaries. Tradeoff: requires explicit serialization/deserialization logic.
- **Header Validation Guard:** Validate incoming `traceparent` format (hex, length, version) — start new trace if invalid. Benefit: prevents malformed header propagation. Tradeoff: ~5μs overhead per request.

---

## Architectural Decisions

**Use OTel Propagator API, not manual header construction.** Never build `traceparent` strings via string interpolation. Use `Propagator::inject()` and `Propagator::extract()` from the OTel SDK.

**Configure W3C as the primary propagator.** Set `OTEL_PROPAGATORS=tracecontext,baggage` in the PHP SDK. This ensures W3C headers are injected and extracted.

**Forward tracestate without modification.** The header contains vendor-specific data. Do not modify it in application code — forward it as-is.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Universal standard across all languages and vendors | ~5μs header parsing per request | Negligible overhead |
| Enables end-to-end distributed tracing | Requires explicit queue propagation | Trace integrity across async boundaries needs attention |
| traceparent is compact (55 bytes) | tracestate is variable (50-500 bytes) | Monitor tracestate size in polyglot environments |

---

## Performance Considerations

Header parsing takes ~5μs per incoming request. Header injection takes ~2μs per outgoing HTTP call. `traceparent` is 55 bytes; `tracestate` is 50-500 bytes — negligible HTTP performance impact. Baggage can be arbitrarily large if unbounded — set maximum size (typically 1024 bytes). Queue propagation adds ~10μs per job for serialization/deserialization.

---

## Production Considerations

Malformed `traceparent` headers can be used for injection attacks — validate hex format and length. If trace-based security controls exist (rate limiting by trace), validate that trace IDs are not spoofed from external sources. Baggage content travels through all services — sanitize to prevent metadata leakage. Vendor-specific data in `tracestate` should not be forwarded to unauthorized services.

---

## Common Mistakes

**Manual traceparent construction** — building via string interpolation: `"00-{$traceId}-{$spanId}-01"`. This omits validation, may produce invalid format, and breaks on specification updates.

**Modifying tracestate** — stripping or modifying vendor entries, breaking downstream vendor integrations. Forward unchanged.

**No queue propagation** — trace context is lost when jobs are queued. The queue job appears as a separate trace, unrelated to the parent request.

**Not validating incoming headers** — using `traceparent` values without validation, allowing malformed headers to propagate through the system.

---

## Failure Modes

**Header not propagated:** An intermediary (reverse proxy, load balancer) strips the `traceparent` header. Detection: broken trace chains across services. Mitigation: verify proxy configuration allows `traceparent` and `tracestate` headers.

**tracestate overflow:** Accumulated vendor entries exceed header size limits. Detection: downstream services reject the request due to oversized headers. Mitigation: limit tracestate vendor entries; monitor header size.

**Baggage pollution:** Unbounded baggage content slows propagation and may leak sensitive data. Detection: large baggage payloads in traces. Mitigation: set maximum baggage size; sanitize content before injection.

---

## Ecosystem Usage

OpenTelemetry PHP SDK uses W3C TraceContext as the default propagation format. Sentry uses W3C as default since 2023. Laravel's HTTP client (Guzzle) is instrumented by OTel auto-instrumentation to inject trace context. Queue drivers (Redis, SQS) require manual trace context propagation.

---

## Related Knowledge Units

### Prerequisites
- OpenTelemetry PHP SDK (propagator configuration)

### Related Topics
- OTLP Exporter & Collector Configuration (trace export pipeline)
- Span Sampling Strategies (parent-based sampling decisions)

### Advanced Follow-up Topics
- Distributed Tracing Patterns (cross-service correlation)

---

## Research Notes

W3C TraceContext (`traceparent`) is the universal standard — use it everywhere. Never construct `traceparent` manually — use OTel propagator API. Always validate incoming `traceparent` headers. Forward `tracestate` without modification. Propagate trace context through queue jobs explicitly. Baggage is for lightweight metadata only (< 1KB).
