# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 07-monitoring-observability-cost
**Knowledge Unit:** Monitoring Cost Comparison
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Match monitoring tool to infrastructure maturity applied
- [ ] Keep monitoring cost under 10-15% of total infrastructure spend applied
- [ ] Use hybrid approach for Laravel teams applied
- [ ] Match Monitoring Tool to Infrastructure Maturity followed
- [ ] Keep Monitoring Cost Under 15% of Total Infrastructure Spend followed
- [ ] Use Hybrid Approach for Laravel Teams Ã¢â‚¬â€ CloudWatch + Scout APM followed
- [ ] Enterprise tool for startup scale prevented
- [ ] No hybrid strategy prevented
- [ ] Choosing Datadog for a single Laravel app at mid-scale prevented
- [ ] Not factoring engineering time for self-hosted prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Start with CloudWatch (free metrics) + basic log monitoring
- [ ] Architecture guideline: Add Scout APM at $39/month when APM visibility needed (500+ requests/day)
- [ ] Architecture guideline: Migrate to Grafana Cloud if Kubernetes/container-heavy deployment
- [ ] Architecture guideline: Consider New Relic only if multi-cloud or per-GB billing preferred
- [ ] Architecture guideline: Only adopt Datadog at enterprise scale with dedicated observability budget
- [ ] Architecture guideline: Self-hosted Prometheus+Grafana for teams with existing SRE capabilities
- [ ] Match Monitoring Tool to Infrastructure Maturity followed
- [ ] Keep Monitoring Cost Under 15% of Total Infrastructure Spend followed
- [ ] Use Hybrid Approach for Laravel Teams Ã¢â‚¬â€ CloudWatch + Scout APM followed
- [ ] Implement Sampling BEFORE Traffic Grows Ã¢â‚¬â€ Not After followed
- [ ] Review and Clean Unused Observability Resources Quarterly followed

---

# Implementation Checklist

- [ ] Best practice applied: Match monitoring tool to infrastructure maturity
- [ ] Best practice applied: Keep monitoring cost under 10-15% of total infrastructure spend
- [ ] Best practice applied: Use hybrid approach for Laravel teams
- [ ] Best practice applied: Implement sampling before scaling up
- [ ] Best practice applied: Review and clean unused resources quarterly
- [ ] Match Monitoring Tool to Infrastructure Maturity followed
- [ ] Keep Monitoring Cost Under 15% of Total Infrastructure Spend followed
- [ ] Use Hybrid Approach for Laravel Teams Ã¢â‚¬â€ CloudWatch + Scout APM followed
- [ ] Implement Sampling BEFORE Traffic Grows Ã¢â‚¬â€ Not After followed
- [ ] Review and Clean Unused Observability Resources Quarterly followed
- [ ] Workflow step completed: Inventory current Monitoring Cost Comparison resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] APM agents add 1-5% overhead per request regardless of vendor
- [ ] Log ingestion rate
- [ ] Trace sampling
- [ ] Custom metrics

---

# Security Checklist

- [ ] All major platforms support SOC 2, HIPAA, and GDPR compliance at enterprise tiers
- [ ] OpenTelemetry provides vendor-neutral data collection; lock-in risk is lower
- [ ] Self-hosted Prometheus/Grafana gives full data control but requires security maintenance
- [ ] Log data may contain PII; ensure scrubbing before ingestion into any platform

---

# Reliability Checklist

- [ ] Mistake prevented: Choosing Datadog for a single Laravel app at mid-scale
- [ ] Mistake prevented: Not factoring engineering time for self-hosted
- [ ] Mistake prevented: Ignoring sampling at scale
- [ ] Mistake prevented: Tool sprawl

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
- [ ] Monitoring Cost Comparison configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Match Monitoring Tool to Infrastructure Maturity followed
- [ ] Keep Monitoring Cost Under 15% of Total Infrastructure Spend followed
- [ ] Use Hybrid Approach for Laravel Teams Ã¢â‚¬â€ CloudWatch + Scout APM followed
- [ ] Implement Sampling BEFORE Traffic Grows Ã¢â‚¬â€ Not After followed
- [ ] Review and Clean Unused Observability Resources Quarterly followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Enterprise tool for startup scale
- [ ] Anti-pattern prevented: No hybrid strategy
- [ ] Anti-pattern prevented: Tool proliferation
- [ ] Anti-pattern prevented: Set-and-forget monitoring cost
- [ ] Common mistake prevented: Choosing Datadog for a single Laravel app at mid-scale
- [ ] Common mistake prevented: Not factoring engineering time for self-hosted
- [ ] Common mistake prevented: Ignoring sampling at scale
- [ ] Common mistake prevented: Tool sprawl

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
