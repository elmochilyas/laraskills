# Decomposition: W3C Trace Context Propagation

## Topic Overview
W3C TraceContext (`traceparent` and `tracestate` headers) is the industry standard for propagating trace context across service boundaries. It enables end-to-end request tracing through polyglot microservices â€” a Laravel API calls a Python service, which calls a Go worker, and all spans are correlated under a single trace. OpenTelemetry and Sentry both use W3C TraceContext as their default propagation format.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
distributed-tracing/w3c-trace-context/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### W3C Trace Context Propagation
- **Purpose:** W3C TraceContext (`traceparent` and `tracestate` headers) is the industry standard for propagating trace context across service boundaries. It enables end-to-end request tracing through polyglot microservices â€” a Laravel API calls a Python service, which calls a Go worker, and all spans are correlated under a single trace. OpenTelemetry and Sentry both use W3C TraceContext as their default propagation format.
- **Difficulty:** Intermediate
- **Dependencies:
  - OpenTelemetry PHP SDK (propagator configuration)
  - OTLP Exporter & Collector Configuration (trace export pipeline)
  - Span Sampling Strategies (parent-based sampling decisions)
  - Distributed Tracing Patterns (cross-service correlation)

## Dependency Graph
**Depends on:**
  - OpenTelemetry PHP SDK (propagator configuration)
  - OTLP Exporter & Collector Configuration (trace export pipeline)
  - Span Sampling Strategies (parent-based sampling decisions)
  - Distributed Tracing Patterns (cross-service correlation)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - traceparent header
  - tracestate header
  - Trace ID
  - Span ID
  - Trace flags
  - Baggage

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization