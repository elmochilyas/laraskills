# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 04-distributed-tracing
**Knowledge Unit:** w3c-trace-context
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] `traceparent` header format understood: `version-trace_id-span_id-trace_flags`
- [ ] `tracestate` header understood for vendor-specific metadata
- [ ] W3C TraceContext configured as default propagation format
- [ ] Trace ID and Span ID correlation verified across service calls
- [ ] Trace flags (sampled, recorded) propagation strategy defined
- [ ] Baggage header assessed for cross-service context propagation

---

# Architecture Checklist

- [ ] Propagator configured in OTel SDK (W3C TraceContext default)
- [ ] Incoming `traceparent` parsing implemented for HTTP middleware
- [ ] Outgoing `traceparent` injection implemented for HTTP client
- [ ] `tracestate` vendor entries handled without breaking propagation
- [ ] Trace flags decision flow: SDK → Sentry → downstream services
- [ ] Baggage propagation policy defined (allowed keys, size limits)

---

# Implementation Checklist

- [ ] OTel `PropagatorFactory::create()` configured with `TraceContextPropagator`
- [ ] HTTP middleware extracts `traceparent` from incoming request headers
- [ ] HTTP client (Guzzle) middleware injects `traceparent` on outgoing requests
- [ ] Queue job trace context extracted and propagated to job execution
- [ ] `tracestate` forwarded without modification to preserve vendor data
- [ ] Sentry propagation configured to use W3C format (default since 2023)

---

# Performance Checklist

- [ ] Header parsing overhead measured per request
- [ ] Header injection overhead measured per outgoing HTTP call
- [ ] `traceparent` header size verified within HTTP header size limits
- [ ] Baggage header size bounded to prevent request overhead
- [ ] Propagation context serialization cost measured for queue jobs
- [ ] Header extraction in middleware benchmarked for high-throughput routes

---

# Security Checklist

- [ ] `traceparent` header validated to prevent injection attacks
- [ ] Malformed `traceparent` handled without throwing exceptions
- [ ] `tracestate` vendor data reviewed for sensitive information
- [ ] Baggage content sanitized to prevent metadata leakage
- [ ] Propagation not spoofable to bypass trace-based security controls
- [ ] Trace ID generation not predictable (cryptographically random)

---

# Reliability Checklist

- [ ] Missing `traceparent` header starts new trace gracefully
- [ ] Invalid `traceparent` parsed without crashing (fallback to new trace)
- [ ] `tracestate` exceeded length limit truncated, not dropped
- [ ] Propagation across queue jobs tested for context loss
- [ ] Propagation across gRPC calls tested (binary vs text format)
- [ ] Sentry-Otel interop verified for context bridging

---

# Testing Checklist

- [ ] Unit test: `traceparent` parsed correctly with valid hex values
- [ ] Unit test: `traceparent` generated and injected into HTTP headers
- [ ] Integration test: trace context flows Laravel → external HTTP service
- [ ] Integration test: trace context flows through queue job execution
- [ ] Cross-service test: PHP service → Python service trace continuity
- [ ] Failure test: malformed header handled gracefully

---

# Maintainability Checklist

- [ ] Propagation configuration centralized in HTTP client service provider
- [ ] Header extraction/ injection middleware documented in ADR
- [ ] Baggage key naming convention documented and enforced
- [ ] Vendor-specific `tracestate` entries documented per service
- [ ] Propagation test suite runs in CI for every service boundary change
- [ ] W3C specification version tracked for updates

---

# Anti-Pattern Prevention Checklist

- [ ] `traceparent` not manually constructed from raw strings
- [ ] `tracestate` not modified without understanding vendor format
- [ ] Baggage not used for high-cardinality or large payload data
- [ ] Trace ID not parsed from external source without validation
- [ ] Propagation not implemented as custom middleware when SDK handles it
- [ ] `trace_flags` not checked before sampling decision (respect remote decision)

---

# Production Readiness Checklist

- [ ] End-to-end trace verified in staging across all service boundaries
- [ ] Propagation error rate monitored (missing/invalid headers)
- [ ] Baggage size monitored for proxy truncation issues
- [ ] Sentry transaction correlation to OTel trace verified
- [ ] Rollback plan if W3C propagation change breaks downstream services
- [ ] Cross-service trace continuity test automated in CI

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: propagator configured, header extraction/injection via middleware, baggage policy defined
- [ ] Security requirements satisfied: header validated, malformed cases handled, baggage sanitized, trace ID random
- [ ] Performance requirements satisfied: parsing/injection overhead measured, baggage size bounded
- [ ] Testing requirements satisfied: header parse and generate, HTTP and queue propagation, cross-service continuity
- [ ] Anti-pattern checks passed: no manual header construction, no tracestate mutation, baggage bounded
- [ ] Production readiness verified: staging propagation confirmed, error rate monitored, Sentry correlation passing

---

# Related References

- OpenTelemetry PHP SDK (propagator configuration)
- OTLP Exporter & Collector Configuration (trace export pipeline)
- Span Sampling Strategies (parent-based sampling decisions)
- Distributed Tracing Patterns (cross-service correlation)
