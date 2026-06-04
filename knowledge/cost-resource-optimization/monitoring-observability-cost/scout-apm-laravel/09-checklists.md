# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 07-monitoring-observability-cost
**Knowledge Unit:** Scout APM for Laravel
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Pair Scout APM with CloudWatch applied
- [ ] Start with $99/month plan applied
- [ ] Enable Octane instrumentation applied
- [ ] Pair Scout APM with CloudWatch for Complete Observability followed
- [ ] Start at $99/Month Plan Ã¢â‚¬â€ Only Upgrade When Consistently Exceeding 100 Req/Min followed
- [ ] Enable Octane Instrumentation for Octane-Based Apps followed
- [ ] Scout for multi-language environments prevented
- [ ] Scout without infrastructure monitoring prevented
- [ ] Using Scout as the only monitoring tool prevented
- [ ] Not configuring the plan to match scale prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Scout APM as the primary Laravel APM tool for application-layer visibility
- [ ] Architecture guideline: CloudWatch for infrastructure metrics (EC2, RDS, Lambda, ELB) at $0 cost
- [ ] Architecture guideline: For log management, use CloudWatch Logs with 7-day retention or S3 export
- [ ] Architecture guideline: Scout fits into hybrid observability
- [ ] Architecture guideline: No need for full-stack enterprise APM if Laravel is primary technology
- [ ] Pair Scout APM with CloudWatch for Complete Observability followed
- [ ] Start at $99/Month Plan Ã¢â‚¬â€ Only Upgrade When Consistently Exceeding 100 Req/Min followed
- [ ] Enable Octane Instrumentation for Octane-Based Apps followed
- [ ] Use Scout's Deployment Tracking for Release Comparison followed
- [ ] Configure Scout Error Alerting Ã¢â‚¬â€ It's Included in Flat Pricing followed

---

# Implementation Checklist

- [ ] Best practice applied: Pair Scout APM with CloudWatch
- [ ] Best practice applied: Start with $99/month plan
- [ ] Best practice applied: Enable Octane instrumentation
- [ ] Best practice applied: Use deployment tracking
- [ ] Best practice applied: Set up error alerting
- [ ] Pair Scout APM with CloudWatch for Complete Observability followed
- [ ] Start at $99/Month Plan Ã¢â‚¬â€ Only Upgrade When Consistently Exceeding 100 Req/Min followed
- [ ] Enable Octane Instrumentation for Octane-Based Apps followed
- [ ] Use Scout's Deployment Tracking for Release Comparison followed
- [ ] Configure Scout Error Alerting Ã¢â‚¬â€ It's Included in Flat Pricing followed
- [ ] Workflow step completed: Inventory current Scout Apm Laravel resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Scout agent adds ~2-5ms overhead per request (1-3% of typical response time)
- [ ] N+1 detection runs asynchronously; no impact on request response times
- [ ] Octane support adds minimal overhead per worker process
- [ ] Agent auto-throttles in high-traffic bursts to prevent performance impact

---

# Security Checklist

- [ ] Scout agent communicates over TLS; API key stored in application config
- [ ] Agent does not send raw request data or user PII by default
- [ ] IP addresses can be anonymized in Scout settings
- [ ] Deployment tracking via API; use dedicated deployment tokens
- [ ] Data stored in Scout's cloud infrastructure (US/EU regions configurable)

---

# Reliability Checklist

- [ ] Mistake prevented: Using Scout as the only monitoring tool
- [ ] Mistake prevented: Not configuring the plan to match scale
- [ ] Mistake prevented: Ignoring Scout's queue tracing
- [ ] Mistake prevented: Staying on Scout when needing multi-language monitoring

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Scout Apm Laravel configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Pair Scout APM with CloudWatch for Complete Observability followed
- [ ] Start at $99/Month Plan Ã¢â‚¬â€ Only Upgrade When Consistently Exceeding 100 Req/Min followed
- [ ] Enable Octane Instrumentation for Octane-Based Apps followed
- [ ] Use Scout's Deployment Tracking for Release Comparison followed
- [ ] Configure Scout Error Alerting Ã¢â‚¬â€ It's Included in Flat Pricing followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Scout for multi-language environments
- [ ] Anti-pattern prevented: Scout without infrastructure monitoring
- [ ] Anti-pattern prevented: Highest tier by default
- [ ] Anti-pattern prevented: No error alerting
- [ ] Common mistake prevented: Using Scout as the only monitoring tool
- [ ] Common mistake prevented: Not configuring the plan to match scale
- [ ] Common mistake prevented: Ignoring Scout's queue tracing
- [ ] Common mistake prevented: Staying on Scout when needing multi-language monitoring

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

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
