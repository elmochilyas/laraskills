# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 07-dashboards-visualization
**Knowledge Unit:** laravel-pulse
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Laravel Pulse installed and configured (released 2024, first-party)
- [ ] Recorder registered for slow requests, slow queries, exceptions, queue throughput
- [ ] Database storage configured with optional Redis ingest for high traffic
- [ ] Livewire-powered dashboard authenticated and authorized
- [ ] Configurable cards arranged for team-specific needs
- [ ] Low-overhead aggregation model understood (batch DB writes)

---

# Architecture Checklist

- [ ] Recorder selection aligned with monitoring priorities
- [ ] Ingest driver chosen: database (default) vs Redis for high-traffic
- [ ] Sampling configured per recorder to balance storage vs granularity
- [ ] Aggregation strategy understood: bucketed entries in DB
- [ ] Card configuration: layout, time range, recorders displayed
- [ ] Pulse environment isolated from Telescope (dev vs prod)

---

# Implementation Checklist

- [ ] Package installed: `laravel/pulse`
- [ ] Service provider registered and config published
- [ ] Recorders enabled in `config/pulse.php`: requests, queries, exceptions, queue
- [ ] Servers card configured with system metrics (CPU, memory)
- [ ] Cache card enabled with hit/miss ratio display
- [ ] Dashboard route protected via `auth` and `verified` middleware

---

# Performance Checklist

- [ ] Pulse aggregation overhead measured (designed for low impact)
- [ ] Redis ingest driver evaluated if DB write contention observed
- [ ] Sampling rate adjusted per recorder to match traffic volume
- [ ] Entry pruning retention configured (default 1 week)
- [ ] Dashboard query performance verified for team usage
- [ ] Recorder offloaded for high-frequency events (e.g., cache statistics)

---

# Security Checklist

- [ ] Pulse dashboard access restricted to admin users
- [ ] Middleware gate applied: `can:viewPulse`
- [ ] Pulse data retention compliant with data governance policy
- [ ] Slow query recording does not capture parameter values with PII
- [ ] Exception recorder does not store full stack traces with sensitive data
- [ ] Redis ingest connection encrypted if used

---

# Reliability Checklist

- [ ] Pulse DB write failure does not crash application
- [ ] Heartbeat recorder configured to verify Pulse itself is active
- [ ] Recorder buffer overflow strategy defined (drop oldest)
- [ ] Dashboard renders without data (partial outage tolerance)
- [ ] Pulse stopped/started gracefully without data corruption
- [ ] Redis failover does not lose Pulse data permanently

---

# Testing Checklist

- [ ] Unit test: recorder captures expected entry data
- [ ] Unit test: sampling rate respected per recorder
- [ ] Integration test: dashboard displays recorder data
- [ ] Integration test: Redis ingest driver works as alternative
- [ ] Performance test: Pulse overhead within 2ms per request
- [ ] Security test: dashboard returns 401 for unauthenticated user

---

# Maintainability Checklist

- [ ] Custom recorder created in `App\Pulse\Recorders` if needed
- [ ] Custom card created in `App\Pulse\Cards` if business metrics needed
- [ ] Pulse configuration documented with card layout decisions
- [ ] Recorder changes communicated to team before deployment
- [ ] Dashboard card arrangement reviewed quarterly
- [ ] Pulse upgrade tracked via Dependabot

---

# Anti-Pattern Prevention Checklist

- [ ] Pulse not used in high-traffic prod without Redis ingest if needed
- [ ] Pulse not treated as replacement for structured logging
- [ ] Recorders not enabled without considering storage growth
- [ ] Dashboard not exposed to unauthenticated users
- [ ] Cache card not used as replacement for proper cache monitoring
- [ ] Pulse not used as only observability tool (complementary)

---

# Production Readiness Checklist

- [ ] Pulse dashboard added to team monitoring rotation
- [ ] Slow request threshold reviewed per endpoint
- [ ] Exception recorder reviewed for error spike detection
- [ ] Queue throughput monitored for backlog detection
- [ ] Cache hit/miss ratio tracked for optimization opportunities
- [ ] Pulse data retention configured and verified

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: recorders selected, ingest driver chosen, sampling configured, cards arranged
- [ ] Security requirements satisfied: access restricted, middleware applied, PII not captured
- [ ] Performance requirements satisfied: overhead measured, Redis ingest evaluated, sampling tuned, retention set
- [ ] Testing requirements satisfied: recorder captures data, sampling works, dashboard displays, overhead confirmed
- [ ] Anti-pattern checks passed: Redis if high traffic, not replacing logging, storage conscious, access protected
- [ ] Production readiness verified: dashboard in rotation, thresholds reviewed, queue monitored, retention verified

---

# Related References

- Laravel Telescope (development counterpart)
- Laravel Nightwatch (hosted production alternative)
- Custom Pulse Cards (business-specific metrics)
- OpenTelemetry Metrics API (complementary metrics for advanced use cases)
