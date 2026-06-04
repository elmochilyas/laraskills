# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 02-self-hosted-analytics
**Knowledge Unit:** self-hosted-analytics-platforms
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Self-hosted analytics platform selected: Plausible, Matomo, or PostHog
- [ ] Platform deployment architecture designed (single-server vs Docker vs Kubernetes)
- [ ] Reverse proxy pattern configured for ingesting analytics events
- [ ] Platform integration pattern implemented (JS snippet, PHP SDK, or HTTP API)
- [ ] ClickHouse schema understood for platform query performance (K006, K012 integration)
- [ ] GDPR compliance verified for chosen platform (cookie-free by design)

---

# Architecture Checklist

- [ ] Platform chosen based on use case: Plausible (simple/privacy), Matomo (enterprise/GA4 replacement), PostHog (product analytics/feature flags)
- [ ] Reverse proxy (Nginx/Caddy) placed in front of platform for caching and rate limiting
- [ ] Deployment isolation from main Laravel application (separate server or container)
- [ ] Database engine (ClickHouse/MySQL) selected per platform requirements
- [ ] Integration does not block the main application — async ingestion verified
- [ ] Platform version pinned and upgrade strategy documented

---

# Implementation Checklist

- [ ] Plausible integration via JavaScript snippet placed in layout blade template
- [ ] Matomo integration via PHP SDK with Laravel facade for server-side tracking
- [ ] PostHog integration via HTTP API wrapper with feature flag capture
- [ ] Umami evaluated as lightweight alternative for simple page-view tracking
- [ ] Reverse proxy configured for analytics.js and /api/event endpoints
- [ ] Docker Compose or deployment script created for platform services

---

# Performance Checklist

- [ ] Platform static assets (JS snippet) served from CDN or reverse proxy cache
- [ ] Reverse proxy rate limiting configured to prevent analytics ingestion overload
- [ ] ClickHouse query optimization for platform dashboards (K006 star schema)
- [ ] MergeTree engine configuration tuned for analytics write patterns (K012)
- [ ] Platform resource allocation (RAM, CPU, storage) sized for expected event volume

---

# Security Checklist

- [ ] Analytics platform admin panel secured behind authentication and IP whitelist
- [ ] API keys for event ingestion stored in environment config, not committed
- [ ] Reverse proxy terminates TLS for analytics subdomain
- [ ] Platform software updated regularly for security patches
- [ ] Analytics data isolated from main application database

---

# Reliability Checklist

- [ ] Platform health check endpoint monitored with automated alert
- [ ] Reverse proxy provides fallback page if platform unavailable
- [ ] Database backups configured for analytics platform data
- [ ] Upgrade rollback procedure documented per platform
- [ ] Platform storage usage monitored and alert at 80% capacity

---

# Testing Checklist

- [ ] Test JavaScript snippet fires events correctly in all major browsers
- [ ] Test server-side tracking via PHP SDK or HTTP API works without JS
- [ ] Test reverse proxy caching does not serve stale analytics.js
- [ ] Test platform dashboard renders queries correctly with representative data
- [ ] Test deployment rollback procedure in staging environment
- [ ] Test feature flags (PostHog) work in application middleware

---

# Maintainability Checklist

- [ ] Platform deployment configuration in version-controlled Docker Compose or Ansible
- [ ] Integration code isolated in dedicated service classes per platform
- [ ] Platform upgrade checklist maintained in operations documentation
- [ ] Database migration scripts versioned with application code
- [ ] Platform configuration documented with rationale for choices

---

# Anti-Pattern Prevention Checklist

- [ ] Do not embed analytics platform database credentials in application source
- [ ] Do not use self-hosted platform as primary data store — it is an analytics tool
- [ ] Do not deploy platform on same server as main application without resource limits
- [ ] Do not skip reverse proxy — direct platform exposure is a security risk
- [ ] Do not auto-upgrade platform — pin version and test before upgrading

---

# Production Readiness Checklist

- [ ] Prometheus/Grafana dashboard for platform health, query count, and storage usage
- [ ] Logged warning when platform query latency exceeds 500ms at p99
- [ ] Alert when platform service is unreachable for more than 30 seconds
- [ ] Database backup frequency RPO-compliant for analytics data
- [ ] Deploy checklist includes platform health verification after application deploy
- [ ] Runbook documented for common platform failure scenarios

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: platform selection match, reverse proxy, async ingestion, isolation
- [ ] Security requirements satisfied: admin panel secured, TLS termination, API key protection, patching
- [ ] Performance requirements satisfied: CDN for snippets, proxy rate limiting, ClickHouse optimization, resource sizing
- [ ] Testing requirements satisfied: JS snippet, server-side tracking, proxy cache, dashboard queries, rollback
- [ ] Anti-pattern checks passed: no embedded credentials, no primary data store misuse, pinned versions
- [ ] Production readiness verified: platform health dashboard, latency alerts, database backups, deploy checklist

---

# Related References

- K022 (GDPR Compliance): Cookie-free analytics default across all platforms
- K006 (Star Schema): ClickHouse schema design for PostHog/Plausible queries
- K012 (ClickHouse MergeTree): ClickHouse engine configuration for analytics
