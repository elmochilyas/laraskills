# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 09-advanced-topics
**Knowledge Unit:** otel-auto-instrumentation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] OTel PHP extension installed and verified on all target environments
- [ ] Composer instrumentation packages added for framework and library hooks
- [ ] Environment variables configured to enable zero-code trace/metric/log collection
- [ ] Auto-instrumented spans confirmed in OTel backend without application code changes

---

# Architecture Checklist

- [ ] Zero-code auto-instrumentation chosen over code-based instrumentation based on team capability and control requirements
- [ ] OTel PHP extension evaluated against eBPF-based alternatives for PHP observability
- [ ] Instrumentation library coverage reviewed for all application dependencies
- [ ] Hybrid approach designed: auto-instrumentation for base framework, manual for business-critical paths

---

# Implementation Checklist

- [ ] PHP OTel extension installed via platform package manager or Dockerfile
- [ ] Composer packages added for Laravel, PSR-18 HTTP client, PDO, Redis instrumentation
- [ ] `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, and `OTEL_TRACES_SAMPLER` environment variables configured
- [ ] Hook registration verified by checking extension-loaded output

---

# Performance Checklist

- [ ] Auto-instrumentation overhead benchmarked against baseline (no instrumentation)
- [ ] Sampling configured to control span volume from auto-instrumentation
- [ ] PSR-18 instrumentation monitored for HTTP client overhead on external API calls
- [ ] Memory usage profiled with auto-instrumentation enabled

---

# Security Checklist

- [ ] OTel PHP extension binary sourced from official OpenTelemetry distribution
- [ ] Auto-instrumented spans reviewed for accidental sensitive data capture (headers, query params)
- [ ] Instrumentation package versions audited for known vulnerabilities

---

# Reliability Checklist

- [ ] Graceful degradation verified when PHP extension fails to load
- [ ] Auto-instrumentation tested under high concurrency for race conditions
- [ ] Span export failures confirmed not to bubble up to application layer
- [ ] Extension compatibility tested across PHP version upgrades

---

# Testing Checklist

- [ ] Smoke test confirms auto-instrumented trace appears in OTel backend
- [ ] Tests verify spans created for HTTP requests, database queries, cache ops, queue jobs
- [ ] Load test validates auto-instrumentation stability under production traffic
- [ ] Regression tests run after each instrumentation package upgrade

---

# Maintainability Checklist

- [ ] Extension and package versions documented in infrastructure-as-code configuration
- [ ] Auto-instrumentation vs manual instrumentation boundaries documented
- [ ] Upgrade procedure documented for PHP extension and composer packages

---

# Anti-Pattern Prevention Checklist

- [ ] No complete reliance on auto-instrumentation for business-critical tracing
- [ ] No disabling auto-instrumentation in production without performance evidence
- [ ] No mixing conflicting instrumentations (auto + manual for same span source)

---

# Production Readiness Checklist

- [ ] PHP extension included in deployment artifacts or Docker image
- [ ] Auto-instrumentation load-tested to confirm no regression under peak traffic
- [ ] Rollback plan documented for disabling auto-instrumentation if issues arise
- [ ] OTel collector capacity sized to handle auto-instrumentation span volume

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related References

- OpenTelemetry PHP SDK (SDK configuration for auto-instrumented traces)
- W3C Trace Context Propagation (auto-injection of traceparent by PSR-18 instrumentation)
- Community Packages (Laravel-specific convenience wrappers)
- OTel Collector Production Hardening (collector receives auto-instrumented data)
