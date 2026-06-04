# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 10-observability-monitoring
**Knowledge Unit:** infrastructure-monitoring-tools
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Three observability pillars understood (logging, metrics, tracing)
- [ ] Monitoring tool selected (Nightwatch, Pulse, Telescope, Sentry, Datadog, Flare)
- [ ] Health check endpoint implemented (returns 200 on success, 500 on failure)
- [ ] Structured logging configured (JSON output, channel separation)
- [ ] Alert thresholds defined for key metrics
- [ ] Performance impact of monitoring tools evaluated

---

# Architecture Checklist

- [ ] Observability pillars mapped to tools (Nightwatch for production, Pulse for dashboards, Telescope for debug)
- [ ] Logging channel architecture designed (stack, daily, slack, papertrail)
- [ ] Health check endpoints designed (application health, queue health, database connectivity)
- [ ] Alerting strategy defined (severity levels, notification channels, escalation)
- [ ] Data scrubbing and PII protection designed
- [ ] Tool selection documented with tradeoffs (first-party vs third-party)

---

# Implementation Checklist

- [ ] Nightwatch installed and configured for production monitoring
- [ ] Pulse dashboard configured with appropriate cards
- [ ] Telescope installed for development, disabled in production
- [ ] Sentry or Flare SDK installed for error tracking
- [ ] Health check endpoint created (Route::get('/health'))
- [ ] Logging channel configured for Docker stdout in containerized env

---

# Performance Checklist

- [ ] Pulse card refresh interval tuned (1-5 seconds, not real-time)
- [ ] Telescope database pruning configured (auto-cleanup)
- [ ] Logging channel impact measured (async vs sync driver)
- [ ] Nightwatch sampling rate configured
- [ ] Performance overhead of monitoring tools quantified

---

# Security Checklist

- [ ] Health check endpoint does not expose sensitive data
- [ ] Telescope access restricted to development/staging only
- [ ] Pulse dashboard authenticated (gate or middleware)
- [ ] Sentry PII scrubbing enabled (data_scrubber)
- [ ] Logs do not contain secrets, passwords, or PII
- [ ] Monitoring API keys stored as secrets

---

# Reliability Checklist

- [ ] Health check includes database and cache connectivity checks
- [ ] Alert on consecutive health check failures (3 strikes)
- [ ] Log shipping configured with retry and buffer
- [ ] Nightwatch local queue backed by database for reliability
- [ ] Monitoring tool failure does not crash the application

---

# Testing Checklist

- [ ] Health check endpoint tested (200 when healthy, 500 when not)
- [ ] Pulse dashboard renders with real data
- [ ] Sentry error capture tested (trigger exception, confirm capture)
- [ ] Logging channel outputs to expected destination
- [ ] Alert notification tested (trigger threshold, confirm alert delivered)

---

# Maintainability Checklist

- [ ] Monitoring tool configuration documented in README
- [ ] Alerting rules documented with rationale and thresholds
- [ ] Health check criteria documented for operators
- [ ] Tool dependencies pinned in composer.json
- [ ] Observability runbook created for incident response

---

# Anti-Pattern Prevention Checklist

- [ ] No health check endpoint without proper authentication or restriction
- [ ] No excessive logging in hot request path (high I/O)
- [ ] No Telescope in production (memory leak risk)
- [ ] No monitoring without alerting (dashboard only is not enough)
- [ ] No PII or secrets logged in plain text

---

# Production Readiness Checklist

- [ ] Nightwatch installed and receiving production metrics
- [ ] Pulse dashboard accessible to team members
- [ ] Health check endpoint integrated with load balancer
- [ ] Alert thresholds configured and tested
- [ ] Log shipping verified (indices, retention, search)
- [ ] Monitoring tool overhead measured (<5% performance impact)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: observability pillars mapped to tools
- [ ] Security requirements satisfied: PII scrubbing, auth on dashboards, no secrets in logs
- [ ] Performance requirements satisfied: sampling, refresh intervals, overhead quantified
- [ ] Testing requirements satisfied: health check, error capture, log output, alerts verified
- [ ] Anti-pattern checks passed: no Telescope in prod, no exceessive logging, alerts configured
- [ ] Production readiness verified: Nightwatch active, Pulse accessible, health check integrated

---

# Related References

- Forge Provisioning (Nightwatch integration)
- CI/CD Pipelines (deployment monitoring)
- K8s Orchestration (pod health probes)
