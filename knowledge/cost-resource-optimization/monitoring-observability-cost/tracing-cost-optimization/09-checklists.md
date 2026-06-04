# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 07-monitoring-observability-cost
**Knowledge Unit:** Tracing Cost Optimization
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Trace sampling rate set (1-5% for healthy requests)
- [ ] Health check endpoints excluded from tracing
- [ ] Low-value spans aggregated (cache, config lookups)
- [ ] Error traces captured at 100%
- [ ] Trace budget alerts configured
- [ ] Use head-based sampling with 1-10% rate applied
- [ ] Filter health check traces applied
- [ ] Span aggregation for low-value operations applied
- [ ] Use Head-Based Sampling with 1-10% Rate Ã¢â‚¬â€ 100% for Errors followed
- [ ] Filter Health Check and Internal Monitoring Traces followed
- [ ] Aggregate Low-Value Spans (Cache GET/SET, Config Reads) followed
- [ ] Tracing without monitoring cost prevented
- [ ] Excessive span detail prevented
- [ ] 100% trace sampling at high traffic prevented
- [ ] Not filtering health checks prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Single Laravel service
- [ ] Architecture guideline: Multi-service
- [ ] Architecture guideline: AWS-native
- [ ] Architecture guideline: High-traffic (1000+ req/s)
- [ ] Architecture guideline: Queue tracing
- [ ] Architecture guideline: Always exclude internal monitoring traffic from tracing (health checks, admin pings)
- [ ] Use Head-Based Sampling with 1-10% Rate Ã¢â‚¬â€ 100% for Errors followed
- [ ] Filter Health Check and Internal Monitoring Traces followed
- [ ] Aggregate Low-Value Spans (Cache GET/SET, Config Reads) followed
- [ ] Set Trace Budget Alerts Ã¢â‚¬â€ Tracing Cost Should <10% of Observability Spend followed
- [ ] Use OpenTelemetry for Vendor-Neutral Tracing followed

---

# Implementation Checklist

- [ ] Best practice applied: Use head-based sampling with 1-10% rate
- [ ] Best practice applied: Filter health check traces
- [ ] Best practice applied: Span aggregation for low-value operations
- [ ] Best practice applied: Use tail-based sampling for error traces
- [ ] Best practice applied: Set trace budget alerts
- [ ] Best practice applied: Use OpenTelemetry for vendor-neutral tracing
- [ ] Use Head-Based Sampling with 1-10% Rate Ã¢â‚¬â€ 100% for Errors followed
- [ ] Filter Health Check and Internal Monitoring Traces followed
- [ ] Aggregate Low-Value Spans (Cache GET/SET, Config Reads) followed
- [ ] Set Trace Budget Alerts Ã¢â‚¬â€ Tracing Cost Should <10% of Observability Spend followed
- [ ] Use OpenTelemetry for Vendor-Neutral Tracing followed
- [ ] Workflow step completed: Inventory current Tracing Cost Optimization resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Tracing instrumentation adds 1-5% CPU overhead per request
- [ ] Span export adds 1-10ms if synchronous; use async export
- [ ] OTel collector can batch spans, reducing export API calls by 100x
- [ ] High span count per request (>50) degrades app throughput; aggregate or trim spans
- [ ] Trace context propagation adds ~0.5ms per HTTP call

---

# Security Checklist

- [ ] Traces may contain sensitive data (query parameters, request bodies, response data)
- [ ] Use OTel span processors to redact sensitive attributes before export
- [ ] Restrict trace data access to SRE/backend engineering teams
- [ ] X-Ray traces are encrypted at rest and in transit
- [ ] Don't trace endpoints handling PII or financial data (or redact span attributes)

---

# Reliability Checklist

- [ ] Mistake prevented: 100% trace sampling at high traffic
- [ ] Mistake prevented: Not filtering health checks
- [ ] Mistake prevented: Individual spans for every Redis command

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Trace sampling rate set (1-5% for healthy requests)
- [ ] Health check endpoints excluded from tracing
- [ ] Low-value spans aggregated (cache, config lookups)
- [ ] Error traces captured at 100%
- [ ] Trace budget alerts configured
- [ ] Tracing cost < 10% of observability spend
- [ ] OpenTelemetry or similar vendor-neutral SDK used

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Tracing Cost Optimization configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Use Head-Based Sampling with 1-10% Rate Ã¢â‚¬â€ 100% for Errors followed
- [ ] Filter Health Check and Internal Monitoring Traces followed
- [ ] Aggregate Low-Value Spans (Cache GET/SET, Config Reads) followed
- [ ] Set Trace Budget Alerts Ã¢â‚¬â€ Tracing Cost Should <10% of Observability Spend followed
- [ ] Use OpenTelemetry for Vendor-Neutral Tracing followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Tracing without monitoring cost
- [ ] Anti-pattern prevented: Excessive span detail
- [ ] Anti-pattern prevented: No sampling configuration
- [ ] Common mistake prevented: 100% trace sampling at high traffic
- [ ] Common mistake prevented: Not filtering health checks
- [ ] Common mistake prevented: Individual spans for every Redis command

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Trace sampling rate set (1-5% for healthy requests)
- [ ] Verification passed: Health check endpoints excluded from tracing
- [ ] Verification passed: Low-value spans aggregated (cache, config lookups)

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

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
