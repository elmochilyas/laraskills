# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 03-apm-performance-monitoring
**Knowledge Unit:** apm-tool-integration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] General-purpose APM (New Relic, Datadog) vs Laravel-specialized (Scout APM, Blackfire) evaluated
- [ ] Instrumentation depth assessed for Laravel-specific components
- [ ] Cost at projected scale modeled and compared across tools
- [ ] Operational complexity (agent install, config, maintenance) reviewed
- [ ] Transaction tracing, span timing, and N+1 detection capabilities verified
- [ ] Response time percentiles and Apdex score available in chosen tool

---

# Architecture Checklist

- [ ] Transaction trace boundaries defined (request, queue, job, artisan command)
- [ ] Span timing granularity validated for sub-second operations
- [ ] N+1 detection integration considered for Scout APM strength
- [ ] Distributed tracing support evaluated for multi-service architecture
- [ ] Vendor-neutral OTel SDK assessed as alternative to avoid lock-in
- [ ] Laravel Pulse considered as lightweight first-party alternative

---

# Implementation Checklist

- [ ] APM agent installed and configured via environment variables
- [ ] Transaction name mapping to Laravel routes configured
- [ ] Queue job tracing enabled for worker process
- [ ] Database query instrumentation verified (raw, Eloquent, Redis)
- [ ] Cache operation tracing enabled for hit/miss metrics
- [ ] External HTTP call tracing configured for outgoing requests

---

# Performance Checklist

- [ ] APM agent CPU overhead measured under peak traffic
- [ ] Memory consumption of agent process monitored
- [ ] Span sampling rate tuned against budget and data utility
- [ ] Transaction trace detail level reduced for high-throughput endpoints
- [ ] Agent startup time impact on deployment cold start evaluated
- [ ] Database explain plan capture disabled in high-query-rate endpoints

---

# Security Checklist

- [ ] APM data transmission encrypted (TLS) from agent to collector
- [ ] Database query parameters scrubbed to prevent SQL leakage
- [ ] Custom instrumentation does not capture PII or secrets
- [ ] Agent API keys stored in environment variables
- [ ] Access control on APM platform restricted to engineering team
- [ ] Data retention policy compliant with GDPR/CCPA requirements

---

# Reliability Checklist

- [ ] Agent connection failure does not crash application
- [ ] Span buffer configured to prevent memory exhaustion on collector latency
- [ ] Agent graceful shutdown verified (flush pending spans)
- [ ] Collector endpoint redundancy configured (failover endpoint)
- [ ] Backpressure handling understood when collector is slow
- [ ] Agent version pinned and regression-tested per deploy

---

# Testing Checklist

- [ ] Unit test: transaction trace initializes with correct operation name
- [ ] Integration test: database query appears as child span
- [ ] Integration test: queue job trace visible in APM dashboard
- [ ] Performance test: agent overhead within documented threshold
- [ ] Stress test: span buffer handles burst traffic without OOM
- [ ] Smoke test: all endpoints produce traces with correct naming

---

# Maintainability Checklist

- [ ] Tool selection documented with cost comparison and tradeoff analysis
- [ ] Agent config stored in version-controlled deployment scripts
- [ ] Transaction naming convention documented for new routes
- [ ] Dashboard templates created for standard Laravel metrics
- [ ] Agent upgrade procedure documented and tested on staging
- [ ] Monthly APM spend review scheduled

---

# Anti-Pattern Prevention Checklist

- [ ] Agent not installed in non-production environments
- [ ] Not instrumenting every single span indiscriminately
- [ ] Not relying solely on APM for database performance analysis
- [ ] Agent config not changed without staged rollout
- [ ] Transaction names not based on dynamic parameters (user IDs)
- [ ] Not running multiple APM agents simultaneously

---

# Production Readiness Checklist

- [ ] APM dashboard configured with team-visible service overview
- [ ] Apdex score target defined and monitored
- [ ] Baseline performance metrics captured before launch
- [ ] Alerting configured for p95/p99 latency threshold breaches
- [ ] Deploy marker (release tracking) configured in APM
- [ ] Cost monitoring set up: span ingestion, trace retention

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: transaction tracing, span timing, distributed tracing, OTel alternative assessed
- [ ] Security requirements satisfied: TLS transmission, query scrubbing, API key protection, data retention compliant
- [ ] Performance requirements satisfied: agent overhead measured, sampling tuned, buffer sized
- [ ] Testing requirements satisfied: traces verified per endpoint, queue job spans confirmed, stress test passed
- [ ] Anti-pattern checks passed: no staging agent, no dynamic transaction names, single agent
- [ ] Production readiness verified: dashboard created, Apdex target set, alerts configured, cost monitored

---

# Related References

- Performance Profiling & Bottleneck Detection (deep-dive profiling complementary to APM)
- N+1 Query Detection (specific to Scout APM's strength)
- OpenTelemetry PHP SDK (vendor-neutral APM alternative)
- Laravel Pulse (first-party lightweight APM alternative)
- Span Sampling Strategies (APM agent sampling configuration)
