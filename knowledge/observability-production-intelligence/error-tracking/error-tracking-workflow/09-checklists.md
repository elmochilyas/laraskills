# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 02-error-tracking
**Knowledge Unit:** error-tracking-workflow
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Error lifecycle understood: capture, group, triage, resolve, release
- [ ] Error fingerprinting strategy defined for grouping identical errors
- [ ] Crash-free rate target set per release
- [ ] Suspect commit identification configured via VCS integration
- [ ] Release health tracking set up in error tracking platform
- [ ] Source maps uploaded for JavaScript error resolvability

---

# Architecture Checklist

- [ ] Capture stage: error tracking middleware configured, global exception handler integrated
- [ ] Group stage: error fingerprint rules defined for common false splits
- [ ] Triage stage: ticketing system integration (Jira, Linear) configured
- [ ] Resolve stage: release-commit linking established
- [ ] Release stage: version tracking automated in CI/CD pipeline
- [ ] Breadcrumb collection configured for request, query, and user context

---

# Implementation Checklist

- [ ] Error tracking SDK installed via Composer with Laravel service provider
- [ ] Global exception handler modified to report all unhandled exceptions
- [ ] Custom error fingerprint resolver implemented for domain-specific grouping
- [ ] Release version injected via CI environment variable in deployment step
- [ ] Source map upload step added to frontend build pipeline
- [ ] Breadcrumb auto-instrumentation enabled for Eloquent queries and HTTP client calls

---

# Performance Checklist

- [ ] Error capture overhead measured per report call under load
- [ ] Breadcrumb collection buffer size configured to avoid memory bloat
- [ ] Performance tracing sampling rate set separately from error capture rate
- [ ] Source map upload size optimized with minification
- [ ] Error grouping throughput verified for high-frequency error bursts
- [ ] Release health data ingestion latency acceptable for dashboard use

---

# Security Checklist

- [ ] Error payloads reviewed for PII leakage before transmission
- [ ] User email and IP address scrubbed from error reports by default
- [ ] Stack trace reviewed for secrets (DB credentials, API keys)
- [ ] Error tracking DSN stored as environment variable, never committed
- [ ] Access control on error tracking project limited to engineering team
- [ ] Session replay data redacted per privacy policy

---

# Reliability Checklist

- [ ] Error reporting failure does not crash the application
- [ ] Report queuing configured with retry on network failure
- [ ] Rate limiting configured to handle error burst without data loss
- [ ] Error tracking service degradation plan documented
- [ ] Release health degrades gracefully if tracking data delayed
- [ ] Fingerprint merge/unmerge capability understood for handling inaccuracies

---

# Testing Checklist

- [ ] Unit test: custom fingerprint resolver returns expected group key
- [ ] Integration test: exception triggers capture with correct context
- [ ] Integration test: breadcrumb appears in captured error report
- [ ] Feature test: release version appears in error tracking dashboard
- [ ] Regression test: previously resolved error reopens on reoccurrence
- [ ] Security test: sensitive data not present in captured error payload

---

# Maintainability Checklist

- [ ] Error grouping rules documented with examples per domain
- [ ] Release version format documented and consistent across environments
- [ ] Custom fingerprint resolvers placed in `App\ErrorTracking\Fingerprinters`
- [ ] Error tracking configuration version-controlled with comments
- [ ] On-call runbook includes error spike triage steps
- [ ] Postmortem template includes error tracking dashboard links

---

# Anti-Pattern Prevention Checklist

- [ ] Errors not silently swallowed without reporting
- [ ] Fingerprint rules not overly broad causing unrelated errors to merge
- [ ] Release not marked as resolved before verifying fix in production
- [ ] Source maps not missing for production JavaScript errors
- [ ] Breadcrumb data not over-collected (user keystrokes, full request bodies)
- [ ] Error tracking not used as replacement for proper logging

---

# Production Readiness Checklist

- [ ] Error alerting configured for crash-free rate drop below threshold
- [ ] Suspect commit workflow integrated into code review process
- [ ] Release health dashboard added to team monitoring rotation
- [ ] Error tracking SLA understood: ingestion delay, retention, uptime
- [ ] Rollback trigger defined when crash-free rate drops by 5% or more
- [ ] Weekly error review meeting established in team calendar

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: capture, group, triage, resolve, release lifecycle fully configured
- [ ] Security requirements satisfied: PII scrubbed, DSN protected, access controlled
- [ ] Performance requirements satisfied: overhead measured, buffer sized, sampling separated
- [ ] Testing requirements satisfied: fingerprint tested, capture verified, release health confirmed
- [ ] Anti-pattern checks passed: no silent swallowing, no over-broad grouping, source maps uploaded
- [ ] Production readiness verified: alerting set, runbook ready, SLA reviewed

---

# Related References

- Sentry Laravel Integration (primary tool implementing this workflow)
- Flare & BugSnag Alternatives (alternative workflows)
- Log Context & Correlation (rich error context)
