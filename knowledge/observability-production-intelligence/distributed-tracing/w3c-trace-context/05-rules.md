# Rules: W3C Trace Context Propagation

## Rule WTC-01: Use OTel propagator API for trace context injection/extraction
**Condition:** When injecting or extracting trace context from HTTP headers or queue messages.
**Action:** Use `OpenTelemetry\API\Globals::propagator()->inject()` and `->extract()`. Never construct or parse `traceparent` manually.
**Consequence:** Correct format guaranteed. Specification updates handled by SDK. Tracestate preserved.

## Rule WTC-02: Validate incoming traceparent headers before use
**Condition:** When receiving requests that may contain `traceparent` headers.
**Action:** Validate version byte (00), hex format, length of trace_id (32 hex), span_id (16 hex), trace_flags (2 hex). Discard invalid headers and start new trace.
**Consequence:** Prevents propagation of malformed context. Security against header injection.

## Rule WTC-03: Forward tracestate without modification
**Condition:** When propagating trace context to downstream services.
**Action:** Read `tracestate` from incoming request, pass to propagator for injection without modification.
**Consequence:** Vendor-specific context data preserved. Downstream vendor integrations continue working.

## Rule WTC-04: Propagate trace context through queue messages
**Condition:** When dispatching jobs to queues from traced contexts.
**Action:** Extract current trace context and serialize into job payload. On job execution, deserialize and set as active context before creating spans.
**Consequence:** Queue job traces are linked to parent traces. End-to-end visibility across async boundaries.

## Rule WTC-05: Set OTEL_PROPAGATORS to tracecontext,baggage
**Condition:** When configuring OTel propagators.
**Action:** Set `OTEL_PROPAGATORS=tracecontext,baggage` environment variable. This activates W3C TraceContext and W3C Baggage propagation.
**Consequence:** Standard propagation format active. Compatibility with all W3C-compliant services.

## Rule WTC-06: Bound baggage size to prevent propagation overhead
**Condition:** When using W3C Baggage for cross-service metadata.
**Action:** Limit total baggage size to 1024 bytes. Limit number of entries to 10. Monitor baggage for growth.
**Consequence:** Baggage does not become a performance or security vector.

## Rule WTC-07: Never pass trace context in URL parameters or request bodies
**Condition:** When propagating context to downstream services.
**Action:** Use only HTTP headers (traceparent, tracestate) for HTTP propagation. Use message metadata for queue propagation.
**Consequence:** Context is not exposed to logging, analytics, or external systems.
