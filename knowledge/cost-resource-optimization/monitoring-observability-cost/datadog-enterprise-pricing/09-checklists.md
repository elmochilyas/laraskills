# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 07-monitoring-observability-cost
**Knowledge Unit:** Datadog Enterprise Pricing
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Consolidate hosts to minimize per-host costs applied
- [ ] Use tag-based exclusion filters applied
- [ ] Set custom metric limits per host applied
- [ ] Consolidate Containers onto Fewer Hosts to Minimize Per-Host Costs followed
- [ ] Use Tag-Based Exclusion Filters Before Log Ingestion followed
- [ ] Limit Custom Metrics to 100 Per Host Ã¢â‚¬â€ Never Exceed Default without Review followed
- [ ] Buying Datadog for a single-service Laravel app prevented
- [ ] Ignoring host count optimization prevented
- [ ] Every ECS/Fargate task as a host prevented
- [ ] Unlimited custom metrics prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Datadog for multi-cloud/hybrid environments where a single pane of glass is required
- [ ] Architecture guideline: Prefer Scout APM over Datadog APM for Laravel-specific application monitoring
- [ ] Architecture guideline: Use Datadog infrastructure monitoring only (skip APM) to reduce per-host costs
- [ ] Architecture guideline: Implement log forwarding from CloudWatch to Datadog only for cross-service correlation
- [ ] Architecture guideline: For containerized Laravel on ECS/Fargate, evaluate if per-task billing justifies Datadog
- [ ] Consolidate Containers onto Fewer Hosts to Minimize Per-Host Costs followed
- [ ] Use Tag-Based Exclusion Filters Before Log Ingestion followed
- [ ] Limit Custom Metrics to 100 Per Host Ã¢â‚¬â€ Never Exceed Default without Review followed
- [ ] Use Synthetics Sparingly Ã¢â‚¬â€ Only Critical User Journeys followed
- [ ] Skip Datadog for Single-Cloud Laravel Teams Ã¢â‚¬â€ Use CloudWatch + Scout APM followed

---

# Implementation Checklist

- [ ] Best practice applied: Consolidate hosts to minimize per-host costs
- [ ] Best practice applied: Use tag-based exclusion filters
- [ ] Best practice applied: Set custom metric limits per host
- [ ] Best practice applied: Leverage Datadog standard metrics first
- [ ] Best practice applied: Use synthetics sparingly
- [ ] Consolidate Containers onto Fewer Hosts to Minimize Per-Host Costs followed
- [ ] Use Tag-Based Exclusion Filters Before Log Ingestion followed
- [ ] Limit Custom Metrics to 100 Per Host Ã¢â‚¬â€ Never Exceed Default without Review followed
- [ ] Use Synthetics Sparingly Ã¢â‚¬â€ Only Critical User Journeys followed
- [ ] Skip Datadog for Single-Cloud Laravel Teams Ã¢â‚¬â€ Use CloudWatch + Scout APM followed
- [ ] Workflow step completed: Inventory current Datadog Enterprise Pricing resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Datadog agent adds 1-3% CPU overhead per host; negligible for most workloads
- [ ] Log ingestion rate
- [ ] Custom metric submission
- [ ] Trace sampling

---

# Security Checklist

- [ ] Datadog agent communicates over TLS; API keys stored in agent config
- [ ] Restrict API key permissions to observability team only
- [ ] Sensitive data in logs can be scrubbed via Datadog Agent log processing rules
- [ ] SOC 2 and HIPAA compliance available in Enterprise tier
- [ ] RUM data contains user interaction data; ensure GDPR/privacy compliance

---

# Reliability Checklist

- [ ] Mistake prevented: Every ECS/Fargate task as a host
- [ ] Mistake prevented: Unlimited custom metrics
- [ ] Mistake prevented: Long log retention by default
- [ ] Mistake prevented: Full APM on all services

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
- [ ] Datadog Enterprise Pricing configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Consolidate Containers onto Fewer Hosts to Minimize Per-Host Costs followed
- [ ] Use Tag-Based Exclusion Filters Before Log Ingestion followed
- [ ] Limit Custom Metrics to 100 Per Host Ã¢â‚¬â€ Never Exceed Default without Review followed
- [ ] Use Synthetics Sparingly Ã¢â‚¬â€ Only Critical User Journeys followed
- [ ] Skip Datadog for Single-Cloud Laravel Teams Ã¢â‚¬â€ Use CloudWatch + Scout APM followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Buying Datadog for a single-service Laravel app
- [ ] Anti-pattern prevented: Ignoring host count optimization
- [ ] Anti-pattern prevented: No sampling strategy
- [ ] Anti-pattern prevented: Relying solely on Datadog without infra alerts
- [ ] Common mistake prevented: Every ECS/Fargate task as a host
- [ ] Common mistake prevented: Unlimited custom metrics
- [ ] Common mistake prevented: Long log retention by default
- [ ] Common mistake prevented: Full APM on all services

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
