# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 07-monitoring-observability-cost
**Knowledge Unit:** Metric Cost Optimization
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Custom metrics < 50 per service
- [ ] Scout APM or similar used for Laravel-specific metrics
- [ ] Metric resolution = standard (1-min) unless justified
- [ ] High-cardinality data aggregated before emission
- [ ] Quarter metric audit performed
- [ ] Limit custom metrics to 50 per service applied
- [ ] Use Scout APM for Laravel-specific metrics applied
- [ ] Aggregate high-cardinality data before emitting applied
- [ ] Limit Custom Metrics to 50 Per Service followed
- [ ] Use Scout APM for Laravel-Specific Metrics Ã¢â‚¬â€ Not Custom CloudWatch Metrics followed
- [ ] Aggregate High-Cardinality Data Before Emitting Metrics followed
- [ ] Metric explosion prevented
- [ ] No metric cost monitoring prevented
- [ ] Per-endpoint custom metrics prevented
- [ ] High-resolution for everything prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Start with Scout APM for Laravel (low cost, Laravel-native metrics)
- [ ] Architecture guideline: Add custom CloudWatch/Datadog metrics only for business-specific needs
- [ ] Architecture guideline: Tag metrics with environment (prod/staging/dev) and service name for cost allocation
- [ ] Architecture guideline: Use metric math for derived metrics (e.g., error rate = errors/total requests)
- [ ] Architecture guideline: Set CloudWatch metric alarms with 3+ evaluation periods to reduce false alarms
- [ ] Architecture guideline: Review custom metrics quarterly; remove any not used in dashboards or alerts
- [ ] Limit Custom Metrics to 50 Per Service followed
- [ ] Use Scout APM for Laravel-Specific Metrics Ã¢â‚¬â€ Not Custom CloudWatch Metrics followed
- [ ] Aggregate High-Cardinality Data Before Emitting Metrics followed
- [ ] Set Metric Resolution to Standard (1-Minute) Unless Justified followed
- [ ] Conduct Quarterly Metric Audit Ã¢â‚¬â€ Remove Unused Metrics followed

---

# Implementation Checklist

- [ ] Best practice applied: Limit custom metrics to 50 per service
- [ ] Best practice applied: Use Scout APM for Laravel-specific metrics
- [ ] Best practice applied: Aggregate high-cardinality data before emitting
- [ ] Best practice applied: Set metric resolution to standard for business metrics
- [ ] Best practice applied: Monitor metric cost per host
- [ ] Best practice applied: Use ServiceLens/CloudWatch Dashboards
- [ ] Limit Custom Metrics to 50 Per Service followed
- [ ] Use Scout APM for Laravel-Specific Metrics Ã¢â‚¬â€ Not Custom CloudWatch Metrics followed
- [ ] Aggregate High-Cardinality Data Before Emitting Metrics followed
- [ ] Set Metric Resolution to Standard (1-Minute) Unless Justified followed
- [ ] Conduct Quarterly Metric Audit Ã¢â‚¬â€ Remove Unused Metrics followed
- [ ] Workflow step completed: Inventory current Metric Cost Optimization resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Emitting metrics adds <0.1ms per metric (asynchronous)
- [ ] Batch metric emission
- [ ] CloudWatch PutMetricData API can accept up to 20 metrics per call (batch for efficiency)
- [ ] Metric aggregation at application level reduces network calls from N per request to 1 per minute
- [ ] Scout APM agent uses ~1-3% CPU for instrumentation

---

# Security Checklist

- [ ] Custom metrics may leak business data (revenue, user counts) if monitoring is exposed
- [ ] Restrict CloudWatch/Scout APM API access to authorized services only
- [ ] Metric dashboards should have appropriate IAM permissions
- [ ] Don't emit metrics containing sensitive values (user IDs, emails)
- [ ] Use monitoring tools with SOC 2/HIPAA compliance for regulated apps

---

# Reliability Checklist

- [ ] Mistake prevented: Per-endpoint custom metrics
- [ ] Mistake prevented: High-resolution for everything
- [ ] Mistake prevented: Unused metrics accumulated

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Custom metrics < 50 per service
- [ ] Scout APM or similar used for Laravel-specific metrics
- [ ] Metric resolution = standard (1-min) unless justified
- [ ] High-cardinality data aggregated before emission
- [ ] Quarter metric audit performed
- [ ] Metric cost tracked and < 5% of infra spend
- [ ] No per-endpoint custom metrics (use APM instead)

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Metric Cost Optimization configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Limit Custom Metrics to 50 Per Service followed
- [ ] Use Scout APM for Laravel-Specific Metrics Ã¢â‚¬â€ Not Custom CloudWatch Metrics followed
- [ ] Aggregate High-Cardinality Data Before Emitting Metrics followed
- [ ] Set Metric Resolution to Standard (1-Minute) Unless Justified followed
- [ ] Conduct Quarterly Metric Audit Ã¢â‚¬â€ Remove Unused Metrics followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Metric explosion
- [ ] Anti-pattern prevented: No metric cost monitoring
- [ ] Anti-pattern prevented: duplicate metrics
- [ ] Anti-pattern prevented: Excessive granularity
- [ ] Common mistake prevented: Per-endpoint custom metrics
- [ ] Common mistake prevented: High-resolution for everything
- [ ] Common mistake prevented: Unused metrics accumulated

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Custom metrics < 50 per service
- [ ] Verification passed: Scout APM or similar used for Laravel-specific metrics
- [ ] Verification passed: Metric resolution = standard (1-min) unless justified

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
