# Metadata

**Domain:** api-integration-engineering
**Subdomain:** observability
**Knowledge Unit:** integration-health-checks
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Checks test connectivity, auth, and response time
- [ ] Consecutive failure threshold configured for alerting
- [ ] Per-integration health check endpoint exists
- [ ] Alert on Consecutive Failures, Not Single Failures
- [ ] Cache Health Check Results (30-60s TTL)
- [ ] Create Pulse Card for Integration Health Dashboard
- [ ] Implement Interface for Pluggable Health Checks
- [ ] Implement Per-Integration Health Check Endpoints
- [ ] Alerts for unhealthy critical integrations
- [ ] External monitoring configured
- [ ] Health check implemented per integration
- [ ] Add health check to external monitoring (Pingdom, Datadog)
- [ ] Add response time measurement per health check
- [ ] Alert on unhealthy status for critical integrations

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add health check to external monitoring (Pingdom, Datadog)
- [ ] Add response time measurement per health check
- [ ] Alert on unhealthy status for critical integrations
- [ ] Cache health check results with short TTL
- [ ] Design health check per integration (simple ping or authenticated call)
- [ ] Implement health check service class per integration
- [ ] Register routes: `/health/integrations`
- [ ] Return status: healthy, degraded, unhealthy
- [ ] Alert on Consecutive Failures, Not Single Failures
- [ ] Cache Health Check Results (30-60s TTL)
- [ ] Create Pulse Card for Integration Health Dashboard
- [ ] Implement Interface for Pluggable Health Checks

---

# Performance Checklist

- [ ] Cache results to prevent thundering herd on dashboard page load
- [ ] Failed checks add no extra load (fail-fast on timeout)
- [ ] Health checks add load to upstream APIs; run every 30-60s, not per-request
- [ ] Lightweight endpoints (simple ping) are fast: 50-200ms

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Alerting on every transient failure (use consecutive failure threshold)
- [ ] Checking health from a single location (may not reflect all server regions)
- [ ] Making full business API calls in health checks (slow, expensive, may create resources)
- [ ] Not caching results (health endpoint fails under dashboard load)

---

# Testing Checklist

- [ ] Alerts for unhealthy critical integrations
- [ ] Checks test connectivity, auth, and response time
- [ ] Consecutive failure threshold configured for alerting
- [ ] External monitoring configured
- [ ] Health check implemented per integration
- [ ] Health results cached with short TTL
- [ ] Health route registered `/health/integrations`
- [ ] Per-integration health check endpoint exists
- [ ] Pulse card displays integration health status
- [ ] Response time measured per check

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Making Full Business API Calls in Health Checks]
- [ ] [Not Caching Health Check Results]
- [ ] [Alerting on Every Transient Failure]
- [ ] [Single Location Health Checks]
- [ ] [No Consecutive Failure Threshold]

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


