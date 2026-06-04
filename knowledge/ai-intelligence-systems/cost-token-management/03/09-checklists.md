# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** cost-token-management
**Knowledge Unit:** ku-03
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Build runbooks for every alert.
- [ ] Define SLOs before building dashboards.
- [ ] Implement structured logging
- [ ] Set up multi-channel alerting
- [ ] Use SLO-based alerting
- [ ] Alerts have runbooks with clear response steps.
- [ ] Burn rate alerts are configured (not static thresholds).
- [ ] Dashboards visualize the four golden signals (latency, traffic, errors, saturation).
- [ ] Rules for Observability & Alerting

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Build runbooks for every alert.
- [ ] Define SLOs before building dashboards.
- [ ] Implement structured logging
- [ ] Set up multi-channel alerting
- [ ] Use SLO-based alerting
- [ ] Use the four golden signals:
- [ ] Rules for Observability & Alerting

---

# Performance Checklist

- [ ] Alert evaluation frequency: evaluate burn rate alerts every 1-5 minutes (not continuously).
- [ ] Log sampling: at high throughput (>1000 req/s), sample debug/info logs at 1:10 or 1:100. Errors are always logged at full fidelity.
- [ ] Log storage costs can exceed LLM API costs at scale. Implement retention policies: detailed logs for 7-30 days, sampled logs for 90 days, aggregated metrics for 1+ year.
- [ ] Metrics emission should be <1ms per request. Use batch metric writers that flush every 5-10 seconds.
- [ ] Tracing overhead is 1-5% of request latency. Use head-based sampling (1:100) for production.

---

# Security Checklist

- [ ] Access control:
- [ ] Alert information disclosure:
- [ ] Audit trail integrity:
- [ ] Log confidentiality:
- [ ] Monitoring system security:

---

# Reliability Checklist

- [ ] Alert fatigue: too many alerts that nobody responds to. Start with 3-5 critical alerts and expand cautiously.
- [ ] Building dashboards before defining SLOs â€” dashboards without targets are decoration.
- [ ] Missing provider-specific alerts â€” a provider outage with no alert means users discover the outage before the team does.
- [ ] Not documenting runbooks â€” when an alert fires at 3 AM, the on-call engineer needs clear instructions.
- [ ] Not monitoring cost â€” the most expensive AI incident is not a technical failure but a budget overrun discovered on the invoice.

---

# Testing Checklist

- [ ] Alerts have runbooks with clear response steps.
- [ ] Burn rate alerts are configured (not static thresholds).
- [ ] Dashboards visualize the four golden signals (latency, traffic, errors, saturation).
- [ ] Log retention policies are defined and enforced.
- [ ] Observability infrastructure is secured with authentication and access control.
- [ ] SLOs are defined for latency, error rate, and cost per request.
- [ ] Structured logging is implemented with correlation ID across all services.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Implement structured logging

---

# Anti-Pattern Prevention Checklist

- [ ] [No Max Tokens Set â€” Unbounded Output Length]
- [ ] [Truncating Input Without Notice â€” User Not Warned]
- [ ] [Hard Truncation Losing Critical Context]
- [ ] [Same Max Tokens for All Model Sizes]
- [ ] [No Token Counting Before Sending Request]
- [ ] Alert on Everything:
- [ ] Dashboard Sprawl:
- [ ] No Correlation ID:
- [ ] Reactive Monitoring:
- [ ] Vanity Metrics:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


