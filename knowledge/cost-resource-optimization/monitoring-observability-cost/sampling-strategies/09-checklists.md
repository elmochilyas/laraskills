# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 07-monitoring-observability-cost
**Knowledge Unit:** Sampling Strategies
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Priority sampling configured (errors at 100%, healthy at 1-5%)
- [ ] Sampling coordinated across services (trace ID hash)
- [ ] Sample rate dynamic (adjusts with traffic volume)
- [ ] Error traces captured at 100%
- [ ] Sampling coverage tested quarterly
- [ ] Always sample healthy requests, never errors applied
- [ ] Use consistent sample rate across services applied
- [ ] Implement priority sampling for APM applied
- [ ] Always Sample Healthy Requests, Never Errors followed
- [ ] Use Consistent Sample Rate Across All Services in a Trace followed
- [ ] Implement Dynamic Sampling Ã¢â‚¬â€ Adjust Rate with Traffic Volume followed
- [ ] Static sample rate prevented
- [ ] No error priority prevented
- [ ] Random sampling without error prioritization prevented
- [ ] Inconsistent sampling across services prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Configure sampling at the tracing provider level (X-Ray sampling rules, Datadog APM sampling)
- [ ] Architecture guideline: Use OpenTelemetry sampler for vendor-neutral configuration
- [ ] Architecture guideline: Set up two-tier sampling
- [ ] Architecture guideline: Coordinate sampling across services via trace ID hash (consistent sampling)
- [ ] Architecture guideline: Log sample rate as a metric to monitor effective sample percentage
- [ ] Architecture guideline: Document sampling strategy in runbook
- [ ] Always Sample Healthy Requests, Never Errors followed
- [ ] Use Consistent Sample Rate Across All Services in a Trace followed
- [ ] Implement Dynamic Sampling Ã¢â‚¬â€ Adjust Rate with Traffic Volume followed
- [ ] Use Pre-Aggregation for Metrics Ã¢â‚¬â€ Don't Emit Per-Request Metrics followed
- [ ] Test Sampling Coverage Quarterly Ã¢â‚¬â€ Simulate Error Scenarios followed

---

# Implementation Checklist

- [ ] Best practice applied: Always sample healthy requests, never errors
- [ ] Best practice applied: Use consistent sample rate across services
- [ ] Best practice applied: Implement priority sampling for APM
- [ ] Best practice applied: Adjust sample rate based on traffic volume
- [ ] Best practice applied: Use pre-aggregation for metrics
- [ ] Best practice applied: Test sampling coverage quarterly
- [ ] Always Sample Healthy Requests, Never Errors followed
- [ ] Use Consistent Sample Rate Across All Services in a Trace followed
- [ ] Implement Dynamic Sampling Ã¢â‚¬â€ Adjust Rate with Traffic Volume followed
- [ ] Use Pre-Aggregation for Metrics Ã¢â‚¬â€ Don't Emit Per-Request Metrics followed
- [ ] Test Sampling Coverage Quarterly Ã¢â‚¬â€ Simulate Error Scenarios followed
- [ ] Workflow step completed: Inventory current Sampling Strategies resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Sampling decision adds <0.1ms per request (negligible)
- [ ] Tail-based sampling requires buffering traces (memory
- [ ] Head-based sampling has zero memory overhead (decision made immediately)
- [ ] Coordinated sampling adds ~0.5ms for trace ID hash computation
- [ ] Aggregated metrics

---

# Security Checklist

- [ ] Sampling decisions should not be based on user roles (don't sample-paying-users-only)
- [ ] Sampling must respect data privacy rules (don't sample PII-containing requests differently)
- [ ] Audit log of sampling configuration changes (tampering with sampling can hide incidents)
- [ ] Disable sampling temporarily for security incidents (need full trace data)
- [ ] Ensure raw trace data is access-controlled regardless of sampling rate

---

# Reliability Checklist

- [ ] Mistake prevented: Random sampling without error prioritization
- [ ] Mistake prevented: Inconsistent sampling across services
- [ ] Mistake prevented: Not sampling at all at scale

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Priority sampling configured (errors at 100%, healthy at 1-5%)
- [ ] Sampling coordinated across services (trace ID hash)
- [ ] Sample rate dynamic (adjusts with traffic volume)
- [ ] Error traces captured at 100%
- [ ] Sampling coverage tested quarterly
- [ ] Sampling config in environment/config (not hardcoded)
- [ ] Observability cost reduced by 90%+ from sampling

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Sampling Strategies configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Always Sample Healthy Requests, Never Errors followed
- [ ] Use Consistent Sample Rate Across All Services in a Trace followed
- [ ] Implement Dynamic Sampling Ã¢â‚¬â€ Adjust Rate with Traffic Volume followed
- [ ] Use Pre-Aggregation for Metrics Ã¢â‚¬â€ Don't Emit Per-Request Metrics followed
- [ ] Test Sampling Coverage Quarterly Ã¢â‚¬â€ Simulate Error Scenarios followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Static sample rate
- [ ] Anti-pattern prevented: No error priority
- [ ] Anti-pattern prevented: Sampling configuration in code
- [ ] Anti-pattern prevented: Sampling logs but not traces
- [ ] Common mistake prevented: Random sampling without error prioritization
- [ ] Common mistake prevented: Inconsistent sampling across services
- [ ] Common mistake prevented: Not sampling at all at scale

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Priority sampling configured (errors at 100%, healthy at 1-5%)
- [ ] Verification passed: Sampling coordinated across services (trace ID hash)
- [ ] Verification passed: Sample rate dynamic (adjusts with traffic volume)

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
