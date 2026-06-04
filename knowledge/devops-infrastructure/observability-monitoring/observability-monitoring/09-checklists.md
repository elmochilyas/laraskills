# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 10-observability-monitoring
**Knowledge Unit:** observability-monitoring
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Three-pillar model implemented (structured logging, metrics, distributed tracing)
- [ ] Nightwatch configured for production monitoring (Forge integration)
- [ ] Pulse dashboard set up for real-time system health
- [ ] Telescope configured for development debugging (disabled in production)
- [ ] Third-party tool selected and integrated (Sentry, Flare, Datadog)
- [ ] Health check endpoints implemented and monitored

---

# Architecture Checklist

- [ ] Logging channels designed (stack driver for dev, json for prod, dedicated channel per service)
- [ ] Pulse dashboard card layout chosen (queues, cache, HTTP, schedule)
- [ ] Telescope scoped to non-production environments only
- [ ] Nightwatch Forge integration planned for server-level metrics
- [ ] Third-party APM tool selected (Sentry for error tracking, Datadog for full APM)
- [ ] Alerting strategy designed (severity levels, on-call rotations)

---

# Implementation Checklist

- [ ] `composer require laravel/nightwatch` installed and configured
- [ ] Pulse installed (`php artisan pulse:install`) and cards configured
- [ ] Telescope installed (`composer require laravel/telescope --dev`)
- [ ] Sentry/Flare SDK installed with DSN in .env
- [ ] Health check endpoint created (`/health` returning app, DB, cache status)
- [ ] Logging channel configured to write to stdout for containerized deployments

---

# Performance Checklist

- [ ] Pulse recording interval tuned (1 second for key metrics)
- [ ] Telescope data pruning scheduled (daily clean old records)
- [ ] Nightwatch sampling rate configured for high-traffic apps
- [ ] Sentry traces sample rate configured (10-20% for production)
- [ ] Logging overhead measured (async driver preferred)

---

# Security Checklist

- [ ] Nightwatch API key stored as secret
- [ ] Pulse dashboard access gated (middleware auth)
- [ ] Telescope auth gate configured (only devs in non-prod)
- [ ] Sentry PII scrubbing enabled (`send_default_pii: false`)
- [ ] Logs filtered for secrets and PII

---

# Reliability Checklist

- [ ] Health check monitors database, cache, and queue connectivity
- [ ] Alert fatigue prevention (thresholds, debounce, severity)
- [ ] Monitoring tool failure does not affect application (fire-and-forget)
- [ ] Log shipping retry configured (buffer + batch)
- [ ] Pulse performance recording does not consume excessive DB storage

---

# Testing Checklist

- [ ] Health check endpoint returns 200 for healthy, 500 for degraded
- [ ] Pulse dashboard shows live metrics after first request
- [ ] Sentry/Flare captures a test exception
- [ ] Nightwatch reports server metrics in Forge dashboard
- [ ] Log output verified in expected location (stdout, file, papertrail)

---

# Maintainability Checklist

- [ ] Monitoring configuration version-controlled
- [ ] Alert rules documented with thresholds and rationale
- [ ] Health check criteria documented for operations team
- [ ] Monitoring tool inventory maintained (tools, config, costs)
- [ ] Incident response runbook created

---

# Anti-Pattern Prevention Checklist

- [ ] No Telescope running in production
- [ ] No health check endpoint that returns success without verifying dependencies
- [ ] No PII or secrets in log entries
- [ ] No alerting without actionable runbook
- [ ] No dashboard-only monitoring (alerts must be configured)

---

# Production Readiness Checklist

- [ ] Nightwatch integrated and receiving production data
- [ ] Pulse dashboard accessible to team with auth
- [ ] Health check endpoints monitored by orchestrator
- [ ] Alert thresholds tuned and tested
- [ ] Log shipping to central location verified
- [ ] Performance impact measured (<5% overhead)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: logs, metrics, traces pillars implemented
- [ ] Security requirements satisfied: PII scrubbing, auth on dashboards, secrets secured
- [ ] Performance requirements satisfied: sampling, intervals, overhead quantified
- [ ] Testing requirements satisfied: health check, error capture, metric display verified
- [ ] Anti-pattern checks passed: no Telescope in prod, no dashboard-only monitoring
- [ ] Production readiness verified: Nightwatch active, alerts tuned, runbook ready

---

# Related References

- Laravel Forge Provisioning (KU-001) -- Forge metrics and Nightwatch integration
- CI/CD Pipelines (KU-008/009) -- deployment monitoring
