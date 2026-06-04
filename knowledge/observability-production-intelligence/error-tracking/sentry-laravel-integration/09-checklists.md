# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 02-error-tracking
**Knowledge Unit:** sentry-laravel-integration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] `sentry/sentry-laravel` package installed via Composer
- [ ] DSN configured via `SENTRY_LARAVEL_DSN` environment variable
- [ ] Auto-instrumentation enabled for queries, views, queues, cache, notifications, HTTP client
- [ ] Performance tracing configured with `traces_sample_rate` or `traces_sampler`
- [ ] Release tracking integrated with CI/CD for version association
- [ ] Profiling and session replay evaluated for additional insight

---

# Architecture Checklist

- [ ] DSN-based authentication configured without hardcoding
- [ ] Transaction boundaries defined (request lifecycle, queue job execution)
- [ ] Span collection configured per auto-instrumented component
- [ ] Release version format aligned with deployment strategy (git SHA, tag)
- [ ] Scope configuration centralized: user context, tags, extras
- [ ] Breadcrumb buffer size configured for meaningful context without memory pressure

---

# Implementation Checklist

- [ ] `config/sentry.php` published and reviewed
- [ ] Environment (`environment`) set to current app environment
- [ ] `traces_sampler` callback implemented for dynamic sampling decisions
- [ ] `before_send` callback configured for PII redaction
- [ ] User context attached via `Sentry\configureScope` in middleware
- [ ] Artisan command errors reported with command name as transaction

---

# Performance Checklist

- [ ] Traces sample rate configured relative to traffic volume and budget
- [ ] Profiling overhead measured for sampled transactions
- [ ] Span count per transaction reviewed to avoid payload limits
- [ ] SDK initialization time measured on application boot
- [ ] Queue job transaction overhead benchmarked separately
- [ ] Breadcrumbs limited to relevant events (exclude debug noise)

---

# Security Checklist

- [ ] `before_send` callback redacts PII and secrets from events
- [ ] DSN stored in `.env`, never hardcoded or committed
- [ ] Session replay disabled if not needed (privacy implications)
- [ ] Stack trace reviewed for credential leakage in local variables
- [ ] User IP address scrubbed via `send_default_pii` set to `false`
- [ ] Sentry project access limited to engineering team members

---

# Reliability Checklist

- [ ] Sentry failure does not crash request (try-catch around capture)
- [ ] Queue job report rejects handled gracefully
- [ ] Performance data loss acceptable on SDK connection failure
- [ ] Rate limit 429 response handled by SDK (backoff understood)
- [ ] Event queue depth monitored for ingestion lag
- [ ] Release health status accurate across deployment types

---

# Testing Checklist

- [ ] Unit test: exception captured through Sentry with correct context
- [ ] Unit test: `traces_sampler` returns expected sample decision
- [ ] Integration test: breadcrumbs collected for request lifecycle
- [ ] Integration test: release version appears in Sentry dashboard
- [ ] Performance test: traced request overhead within 50ms added latency
- [ ] Security test: `before_send` correctly redacts configured fields

---

# Maintainability Checklist

- [ ] SDK version pinned and monitored for security updates
- [ ] `config/sentry.php` documented with inline comments
- [ ] Custom `traces_sampler` logic isolated in `App\Sentry\Sampler`
- [ ] `before_send` redaction rules documented in project security ADR
- [ ] Breadcrumb whitelist documented and reviewed quarterly
- [ ] Sentry release tracking automated in CI/CD deployment script

---

# Anti-Pattern Prevention Checklist

- [ ] DSN not committed to version control
- [ ] SDK not installed in development-only dependencies
- [ ] `traces_sample_rate` not set to 1.0 in production
- [ ] `send_default_pii` not enabled without explicit review
- [ ] Breadcrumbs not over-collected (keystrokes, full request body)
- [ ] Profiling not enabled without measuring cost

---

# Production Readiness Checklist

- [ ] Sentry alerting configured for error spike and crash-free rate drop
- [ ] Release tracking verified in staging before production
- [ ] Performance dashboard reviewed: transaction names clean, spans sensible
- [ ] Quota monitoring set up for event and performance volume
- [ ] Rollback trigger defined on crash-free rate regressions
- [ ] On-call runbook includes Sentry investigation steps

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: DSN auth, transaction/scoping/breadcrumb config, release tracking
- [ ] Security requirements satisfied: `before_send` redaction active, PII disabled, DSN protected
- [ ] Performance requirements satisfied: sample rate tuned, overhead measured, span count bounded
- [ ] Testing requirements satisfied: capture verified, sampler tested, breadcrumbs confirmed, security redaction tested
- [ ] Anti-pattern checks passed: DSN not committed, dev-only install, PII not leaked
- [ ] Production readiness verified: alerts configured, quota monitored, runbook ready

---

# Related References

- Error Tracking Workflow (capture, group, triage, resolve, release lifecycle)
- Flare & BugSnag Alternatives (comparison with other error tracking platforms)
- Log Context & Correlation (Sentry scope optimization)
- Span Sampling Strategies (Sentry traces_sampler configuration)
