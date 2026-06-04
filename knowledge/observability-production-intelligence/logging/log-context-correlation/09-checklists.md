# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 01-logging
**Knowledge Unit:** log-context-correlation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Context facade usage understood for request-scoped metadata
- [ ] PSR-3 context array pattern applied to all log calls
- [ ] Monolog processor pipeline configured for trace ID injection
- [ ] Correlation chain from user action to database query verified
- [ ] Sentry scope bridging implemented for error context
- [ ] W3C Trace Context propagation across service boundaries confirmed

---

# Architecture Checklist

- [ ] Context facade used instead of global state or static helpers for request metadata
- [ ] Monolog processors layered correctly: enrichment before formatting
- [ ] traceparent/span_id correlation between logs and distributed traces
- [ ] Sentry scope integration does not conflict with Context facade
- [ ] Correlation ID generation strategy (UUID vs ULID) decided per subdomain
- [ ] PSR-3 context array does not duplicate Context facade data

---

# Implementation Checklist

- [ ] Context facade configured via service provider boot method
- [ ] Monolog processor registered in `config/logging.php` channel config
- [ ] Trace ID extracted from OpenTelemetry Span and injected into processor
- [ ] Sentry scope bridged using `Sentry\Laravel\Integration::configureScope`
- [ ] `Log::withContext()` used for shared request-level metadata
- [ ] Correlation ID passed to queued jobs and HTTP client calls

---

# Performance Checklist

- [ ] Context facade data serialization overhead measured under load
- [ ] Monolog processor execution time benchmarked for hot code paths
- [ ] Large context arrays verified to not exceed configured log message size
- [ ] Context data truncation strategy defined for oversized fields
- [ ] Sentry scope data limits reviewed (max 200 breadcrumbs, 10MB per event)
- [ ] W3C trace header propagation overhead assessed in high-throughput endpoints

---

# Security Checklist

- [ ] No PII or secrets leaked through automatic Context facade injection
- [ ] Context facade data audited for sensitive fields before production
- [ ] PSR-3 context array reviewed for accidental credential exposure
- [ ] Sentry scope data redacted via `before_send` callback
- [ ] traceparent header validated and sanitized on incoming requests
- [ ] Correlation IDs not derived from user-controlled input

---

# Reliability Checklist

- [ ] Context facade `dehydrate()` failure does not crash request
- [ ] Monolog processor exception caught gracefully without breaking log pipeline
- [ ] Sentry scope flush confirmed on queue job completion
- [ ] Correlation ID generation retry on collision
- [ ] W3C header parsing handles malformed `tracestate` without throwing
- [ ] Context propagation verified across async queue job boundaries

---

# Testing Checklist

- [ ] Unit test: Context facade stores and retrieves scoped metadata
- [ ] Unit test: Monolog processor appends expected fields to log record
- [ ] Integration test: log entry JSON contains trace_id and correlation_id
- [ ] Integration test: Sentry exception event contains request context
- [ ] Feature test: W3C headers forwarded in HTTP client mock calls
- [ ] Failure test: processor throws gracefully handled

---

# Maintainability Checklist

- [ ] Custom Monolog processors placed in `App\Logging\Processors` namespace
- [ ] Context facade boot logic centralized in `AppServiceProvider` or dedicated provider
- [ ] Processor registration documented in `config/logging.php` comments
- [ ] Correlation ID format (UUID v4 vs ULID) documented in ADR
- [ ] Sentry scope configuration isolated in `config/sentry.php`
- [ ] W3C header handling abstracted behind a propagation service class

---

# Anti-Pattern Prevention Checklist

- [ ] Context facade not used for non-request-scoped data (cache, config)
- [ ] PSR-3 context not used as a replacement for structured logging
- [ ] Monolog processors not modifying `message` or `level` fields
- [ ] traceparent not manually constructed from raw strings
- [ ] Sentry scope not mutated inside queued job handlers without flush
- [ ] Correlation IDs not generated via unseeded `rand()` or `uniqid()`

---

# Production Readiness Checklist

- [ ] Context facade monitoring: metric for `dehydrate` call duration
- [ ] Log correlation verified end-to-end in staging environment
- [ ] Sentry release tracking configured for deployment correlation
- [ ] W3C Trace Context propagation tested across Laravel-to-service calls
- [ ] Context data size limits enforced in production logging config
- [ ] Rollback plan if Context facade causes serialization errors in queues

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Context facade, Monolog processors, PSR-3 pattern, Sentry scope, W3C headers all correctly layered
- [ ] Security requirements satisfied: no PII leakage, trace header sanitized, context audited
- [ ] Performance requirements satisfied: overhead measured, context size bounded, Sentry data limits applied
- [ ] Testing requirements satisfied: unit, integration, and failure-path tests for correlation chain
- [ ] Anti-pattern checks passed: no global state misuse, no manual header construction, no scope mutation without flush
- [ ] Production readiness verified: metrics monitored, staging validation passed, rollback plan documented

---

# Related References

- Monolog Architecture & Channel Configuration (processor pipeline)
- Structured JSON Logging (context fields in JSON output)
- OpenTelemetry PHP SDK (trace context propagation)
- Sentry Laravel Integration (Sentry scope bridging)
- W3C Trace Context Propagation (traceparent/span_id across service boundaries)
