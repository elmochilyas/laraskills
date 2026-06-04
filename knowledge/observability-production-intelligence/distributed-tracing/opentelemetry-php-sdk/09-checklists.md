# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 04-distributed-tracing
**Knowledge Unit:** opentelemetry-php-sdk
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] `open-telemetry/opentelemetry-php` SDK installed via Composer
- [ ] Modular packages understood: API, Context, SDK, exporters
- [ ] TracerProvider, MeterProvider, LoggerProvider initialized
- [ ] Auto-instrumentation evaluated (`OTEL_PHP_AUTOLOAD_ENABLED=true`)
- [ ] Manual instrumentation implemented for fine-grained spans
- [ ] OTLP exporter configured for Collector or backend destination

---

# Architecture Checklist

- [ ] Provider hierarchy understood: TracerProvider, MeterProvider, LoggerProvider
- [ ] Span lifecycle defined: start, set attributes, record exception, end
- [ ] Context propagation strategy chosen (W3C TraceContext default)
- [ ] Sampler configured at SDK level (TraceIdRatio, ParentBased)
- [ ] SpanProcessor type selected (Simple vs Batch)
- [ ] OTel auto-instrumentation PHP extension evaluated for zero-code observability

---

# Implementation Checklist

- [ ] Composer packages installed: `api`, `context`, `sdk`, `otlp-exporter`
- [ ] `OTEL_SERVICE_NAME` environment variable set
- [ ] TracerProvider configured in service provider boot method
- [ ] Custom spans created for business-critical operations
- [ ] Span attributes set for correlation (order_id, user_id, payment_id)
- [ ] Span status set correctly (OK, ERROR) on operation outcome

---

# Performance Checklist

- [ ] Batch SpanProcessor configured for production (not Simple)
- [ ] Span export interval tuned (default 5000ms) for latency vs overhead
- [ ] Sampling rate configured to manage span volume
- [ ] OTLP exporter timeout configured (< request timeout)
- [ ] Span attribute count and size bounded to avoid large payloads
- [ ] SDK initialization measured on cold start

---

# Security Checklist

- [ ] OTLP export encrypted (TLS endpoint or collector sidecar on localhost)
- [ ] Span attributes reviewed for PII or secrets before production
- [ ] Headers for trace context validated on incoming requests
- [ ] SDK configuration does not expose internal infrastructure details
- [ ] Exporter endpoint authentication configured (API key, mTLS)
- [ ] Span attribute values sanitized for sensitive data

---

# Reliability Checklist

- [ ] Span export failure does not crash request
- [ ] Batch span processor buffer limit configured (default 2048 spans)
- [ ] Exporter retry logic verified (default OTLP exporter retries)
- [ ] SpanProcessor shutdown registered on application termination
- [ ] Context propagation verified across queue job boundaries
- [ ] SDK version pinned and regression-tested

---

# Testing Checklist

- [ ] Unit test: TracerProvider creates span with correct name
- [ ] Unit test: span attributes recorded and retrievable
- [ ] Unit test: sampler returns expected sampling decision
- [ ] Integration test: span exported and visible in backend
- [ ] Integration test: trace context propagated through HTTP call
- [ ] Performance test: span creation overhead within 1ms

---

# Maintainability Checklist

- [ ] Custom instrumentation placed in `App\OpenTelemetry\Instrumentation`
- [ ] TracerProvider bootstrap centralized in `App\OpenTelemetry\OpenTelemetryServiceProvider`
- [ ] Span attribute names documented with naming convention
- [ ] SDK configuration version-controlled and environment-parameterized
- [ ] Exporter endpoint change documented in deployment runbook
- [ ] Team trained on manual instrumentation best practices

---

# Anti-Pattern Prevention Checklist

- [ ] Not creating duplicate spans for the same operation
- [ ] Span not held open beyond operation completion
- [ ] Span attributes not used for high-cardinality values (session IDs, timestamps)
- [ ] SpanProcessor not set to Simple in production
- [ ] OTLP exporter endpoint not hardcoded in application code
- [ ] Tracer not retrieved for every span creation (use cached provider)

---

# Production Readiness Checklist

- [ ] Batch span processor confirmed in production config
- [ ] Sampling rate effective span volume within backend budget
- [ ] OTLP exporter connectivity tested to staging collector
- [ ] Span export delay monitored (metric: `otel.span_export.duration`)
- [ ] SDK version pinned with known upgrade path
- [ ] Rollback plan if SDK update causes incompatibility

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: provider hierarchy, span lifecycle, context propagation, sampler, processor
- [ ] Security requirements satisfied: export encrypted, attributes sanitized, headers validated
- [ ] Performance requirements satisfied: batch processor active, interval tuned, sampling rate set, attribute size bounded
- [ ] Testing requirements satisfied: span creation, export, context propagation, overhead measured
- [ ] Anti-pattern checks passed: no duplicate spans, no Simple processor in production, no high-cardinality attributes
- [ ] Production readiness verified: batch mode confirmed, sampling effective, connectivity tested, version pinned

---

# Related References

- OTel Auto-Instrumentation (PHP extension + Composer instrumentation packages)
- W3C Trace Context Propagation (distributed trace headers)
- OTLP Exporter & Collector Configuration (export pipeline)
- Span Sampling Strategies (sampling configuration)
- OTel Metrics API (MeterProvider, instruments)
- Community Packages (keepsuit, overtrue wrappers)
