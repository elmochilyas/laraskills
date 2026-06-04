# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 07-dashboards-visualization
**Knowledge Unit:** laravel-nightwatch
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Laravel Nightwatch agent installed and configured (released 2025)
- [ ] Built on Amazon MSK (Kafka) and ClickHouse architecture understood
- [ ] Sub-second query performance verified for dashboard exploration
- [ ] Deep Laravel instrumentation confirmed: requests, queries, queue, cache, exceptions
- [ ] SOC 2 certification and free tier (300k events/month) noted
- [ ] Vendor lock-in risk assessed and documented

---

# Architecture Checklist

- [ ] Agent installation via Composer: `laravel/nightwatch`
- [ ] Token-based authentication configured for agent communication
- [ ] Event ingestion pipeline: agent → MSK → ClickHouse
- [ ] Dashboard access managed via Laravel Nightwatch user management
- [ ] Auto-instrumentation verified: no manual span creation required
- [ ] Exclusion rules configured for noise reduction (health checks, static paths)

---

# Implementation Checklist

- [ ] Nightwatch API key generated from Nightwatch dashboard
- [ ] `NIGHTWATCH_TOKEN` environment variable set in `.env`
- [ ] Agent service provider registered in `config/app.php`
- [ ] Ingestion region configured closest to application servers
- [ ] Exclusion rules configured in `config/nightwatch.php`
- [ ] Data retention settings reviewed against compliance requirements

---

# Performance Checklist

- [ ] Agent CPU overhead measured under peak request volume
- [ ] Memory consumption of agent process monitored
- [ ] Network egress for event ingestion budgeted
- [ ] Exclusion rules verified to drop health check noise from ingestion
- [ ] Agent batch send interval tuned for latency vs overhead
- [ ] Agent buffer size configured for temporary network interruptions

---

# Security Checklist

- [ ] Nightwatch token stored in `.env`, not hardcoded
- [ ] Agent communication encrypted (TLS)
- [ ] Ingestion data reviewed for PII before enabling auto-instrumentation
- [ ] User access to Nightwatch dashboard restricted to engineering team
- [ ] Query and request body ingestion disabled if not needed
- [ ] SOC 2 certification compliance reviewed for regulatory requirements

---

# Reliability Checklist

- [ ] Agent failure does not crash application
- [ ] Agent buffer configured to prevent data loss on network interruption
- [ ] Ingestion pipeline degraded mode understood (Kafka backlog)
- [ ] Dashboard query performance verified under concurrent team usage
- [ ] Agent version pinned and changelog reviewed per update
- [ ] Data retention grace period known (how long data recoverable after delete)

---

# Testing Checklist

- [ ] Unit test: agent configuration loads with valid token
- [ ] Integration test: request appears in Nightwatch dashboard
- [ ] Integration test: database query details visible in request detail
- [ ] Performance test: agent overhead within documented limits
- [ ] Exclusion test: configured noise paths excluded from ingestion
- [ ] Security test: token rotation verified

---

# Maintainability Checklist

- [ ] Nightwatch configuration version-controlled in `config/nightwatch.php`
- [ ] Vendor lock-in assessment documented in ADR
- [ ] Migration guide maintained for self-hosted/OTel alternatives
- [ ] Agent upgrade procedure documented
- [ ] Monthly cost review scheduled (per-event pricing)
- [ ] Team trained on Nightwatch dashboard features: filters, saved searches, alerts

---

# Anti-Pattern Prevention Checklist

- [ ] Agent not bypassed for critical telemetry (vendor diversity)
- [ ] Not relying solely on Nightwatch for all observability needs
- [ ] Agent not installed in development environments (adds noise)
- [ ] Exclusions not overly broad hiding legitimate issues
- [ ] Not exceeding free tier without budget approval
- [ ] Nightwatch not treated as permanent without exit strategy

---

# Production Readiness Checklist

- [ ] Nightwatch dashboard added to team monitoring rotation
- [ ] Saved queries created for common debugging workflows
- [ ] Alerting configured for error spikes and performance regressions
- [ ] Ingestion quota monitored for overage billing
- [ ] Migration plan documented for eventual vendor transition
- [ ] On-call runbook includes Nightwatch investigation steps

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: agent installed, token auth configured, auto-instrumentation confirmed, exclusions set
- [ ] Security requirements satisfied: token protected, TLS enabled, PII reviewed, access restricted
- [ ] Performance requirements satisfied: overhead measured, memory monitored, exclusion effective, buffer sized
- [ ] Testing requirements satisfied: config valid, request visible, query details confirmed, exclusion verified
- [ ] Anti-pattern checks passed: vendor diversity maintained, not solo observability, budget tracked, exit strategy exists
- [ ] Production readiness verified: dashboard added, saved queries created, alerts set, quota monitored

---

# Related References

- Laravel Pulse (first-party alternative, self-hosted)
- Laravel Telescope (development counterpart)
- OpenTelemetry PHP Ecosystem (vendor-neutral alternative)
