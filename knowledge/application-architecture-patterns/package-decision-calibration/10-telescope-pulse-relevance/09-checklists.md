# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Package Decision Calibration
**Knowledge Unit:** Telescope & Pulse Relevance
**Generated:** 2026-06-22
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Telescope disabled in production (gated by environment check)
- [ ] Pulse configured with relevant recorders (not all available blindly)

---

# Architecture Checklist

- [ ] Telescope used for local/staging debugging only (never production)
- [ ] Pulse used for production aggregate monitoring (not individual request debugging)
- [ ] Pulse + Sentry/Datadog layered (Pulse is complementary, not a replacement)
- [ ] Telescope and Pulse data storage separated (different tables, different purposes)
- [ ] Team understands: Telescope = debugging, Pulse = trending, Sentry = alerting

---

# Implementation Checklist

- [ ] Workflow step completed: Telescope disabled in production via `APP_ENV=production` guard
- [ ] Workflow step completed: Telescope dashboard authenticated in staging
- [ ] Workflow step completed: Telescope data pruning configured (1h local, 24-48h staging)
- [ ] Workflow step completed: Telescope sensitive data filters configured for staging
- [ ] Workflow step completed: Pulse recorders configured (start with 4: slow queries, slow jobs, exceptions, cache)
- [ ] Workflow step completed: Pulse dashboard shows metrics the team actually monitors and acts on
- [ ] Workflow step completed: Pulse database retention configured (`PULSE_TRIM_LOTTERY`)
- [ ] Workflow step completed: Exception tracking (Sentry/Bugsnag) configured alongside Pulse

---

# Performance Checklist

- [ ] Telescope overhead measured in staging (10-30ms per request — acceptable for debugging)
- [ ] Pulse overhead measured in production (1-3ms per request — designed to be production-safe)
- [ ] Telescope database growth monitored and pruning verified
- [ ] Pulse database growth monitored (10-50MB/day for active apps)
- [ ] Production database has capacity for Pulse data volume
- [ ] Telescope and Pulse not both running in production (cumulative database write load)

---

# Security Checklist

- [ ] Telescope NEVER accessible in production
- [ ] Telescope dashboard authenticated in staging
- [ ] Telescope sensitive data filters configured (passwords, tokens, PII scrubbed)
- [ ] Pulse does not expose individual request data or PII (aggregate only)
- [ ] Telescope database access restricted (contains full request payloads in staging)

---

# Reliability Checklist

- [ ] Failure addressed: Telescope deployed to production:
- [ ] Failure addressed: Expecting Pulse to replace Sentry for exception alerting:
- [ ] Failure addressed: Running Telescope AND Pulse in production simultaneously:
- [ ] Failure addressed: Adding Pulse cards for metrics nobody monitors:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Telescope is disabled in production (gated by environment check)
- [ ] Telescope dashboard is authenticated in staging
- [ ] Telescope data pruning is configured and running
- [ ] Pulse is configured with relevant recorders (not all available recorders blindly)
- [ ] Pulse is NOT the sole exception tracking solution (Sentry/Bugsnag is also configured)
- [ ] Pulse dashboard shows metrics the team actually monitors and acts on
- [ ] Pulse database retention is configured (`PULSE_TRIM_LOTTERY`)
- [ ] Telescope and Pulse data storage is separated (different tables)
- [ ] Production database has capacity for Pulse's data volume (monitored)
- [ ] Team understands the difference: Telescope = debugging, Pulse = trending, Sentry = alerting

### Success Criteria
- [ ] Zero Telescope data in production database
- [ ] Pulse dashboard reviewed by team at least weekly
- [ ] Exception alerts from Sentry reach on-call engineer within 5 minutes
- [ ] Telescope pruning keeps database under 500MB in staging

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Telescope in production (the cardinal anti-pattern)
- [ ] Anti-pattern prevented: Pulse as APM (expecting distributed tracing, service maps)
- [ ] Anti-pattern prevented: Telescope for long-term data (using as audit log)
- [ ] Anti-pattern prevented: Both Telescope and Pulse without pruning (disk exhaustion)

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Telescope accidentally enabled in production:
- [ ] Failure scenario handled: Pulse recorder causes performance regression:
- [ ] Failure scenario handled: Telescope database fills staging disk:

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
