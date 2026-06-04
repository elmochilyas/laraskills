# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 07-monitoring-observability-cost
**Knowledge Unit:** New Relic Ingestion Pricing
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Set log verbosity to WARN+ in production applied
- [ ] Use trace sampling at 10% for high-traffic endpoints applied
- [ ] Drop health check and heartbeat traffic applied
- [ ] Effectively Use the 100GB Free Tier Before Paying followed
- [ ] Set Log Verbosity to WARN+ in Production followed
- [ ] Use Trace Sampling at 10% Ã¢â‚¬â€ Never 100% at Scale followed
- [ ] Sending infrastructure metrics to New Relic prevented
- [ ] Full tracing on all endpoints prevented
- [ ] Not using the 100GB free tier effectively prevented
- [ ] Ingesting full telemetry from all environments prevented

---

# Architecture Checklist

- [ ] Architecture guideline: New Relic for teams wanting consistent per-GB pricing across all telemetry types
- [ ] Architecture guideline: Combine with CloudWatch for AWS infrastructure metrics (free) to minimize New Relic infra data
- [ ] Architecture guideline: Use OpenTelemetry SDK for vendor-neutral instrumentation; send to New Relic as backend
- [ ] Architecture guideline: Implement log forwarding only for ERROR and above from Laravel; INFO/DEBUG stays in local files
- [ ] Architecture guideline: For high-scale environments, route verbose logs to cheaper storage (S3) and only errors to New Relic
- [ ] Effectively Use the 100GB Free Tier Before Paying followed
- [ ] Set Log Verbosity to WARN+ in Production followed
- [ ] Use Trace Sampling at 10% Ã¢â‚¬â€ Never 100% at Scale followed
- [ ] Monitor Per-Service Data Volume with NRQL followed
- [ ] Set Ingest Budget Alerts Ã¢â‚¬â€ Never Wait for the Bill followed

---

# Implementation Checklist

- [ ] Best practice applied: Set log verbosity to WARN+ in production
- [ ] Best practice applied: Use trace sampling at 10% for high-traffic endpoints
- [ ] Best practice applied: Drop health check and heartbeat traffic
- [ ] Best practice applied: Monitor per-service data volume
- [ ] Best practice applied: Set ingest budget alerts
- [ ] Effectively Use the 100GB Free Tier Before Paying followed
- [ ] Set Log Verbosity to WARN+ in Production followed
- [ ] Use Trace Sampling at 10% Ã¢â‚¬â€ Never 100% at Scale followed
- [ ] Monitor Per-Service Data Volume with NRQL followed
- [ ] Set Ingest Budget Alerts Ã¢â‚¬â€ Never Wait for the Bill followed
- [ ] Workflow step completed: Inventory current New Relic Ingestion Pricing resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] New Relic agent adds 1-3% overhead per request; similar to Datadog agent
- [ ] Log ingestion rate
- [ ] Trace sampling at 10% reduces APM overhead proportionally
- [ ] Custom attributes on spans increase ingest volume; limit to 10-15 attributes per span

---

# Security Checklist

- [ ] New Relic supports SOC 2, HIPAA, and FedRAMP compliance
- [ ] Data encryption in transit (TLS) and at rest (KMS)
- [ ] API keys used for agent communication; rotate regularly
- [ ] Drop sensitive data (PII, passwords) via agent configuration before ingestion
- [ ] New Relic's FedRAMP Moderate authorization for government workloads

---

# Reliability Checklist

- [ ] Mistake prevented: Not using the 100GB free tier effectively
- [ ] Mistake prevented: Ingesting full telemetry from all environments
- [ ] Mistake prevented: High-cardinality custom attributes
- [ ] Mistake prevented: No data minimization strategy

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
- [ ] New Relic Ingestion Pricing configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Effectively Use the 100GB Free Tier Before Paying followed
- [ ] Set Log Verbosity to WARN+ in Production followed
- [ ] Use Trace Sampling at 10% Ã¢â‚¬â€ Never 100% at Scale followed
- [ ] Monitor Per-Service Data Volume with NRQL followed
- [ ] Set Ingest Budget Alerts Ã¢â‚¬â€ Never Wait for the Bill followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Sending infrastructure metrics to New Relic
- [ ] Anti-pattern prevented: Full tracing on all endpoints
- [ ] Anti-pattern prevented: Logging everything to New Relic
- [ ] Anti-pattern prevented: No ingest budget
- [ ] Common mistake prevented: Not using the 100GB free tier effectively
- [ ] Common mistake prevented: Ingesting full telemetry from all environments
- [ ] Common mistake prevented: High-cardinality custom attributes
- [ ] Common mistake prevented: No data minimization strategy

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
