# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 01-event-tracking
**Knowledge Unit:** multi-tenancy-analytics
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Tenant resolution strategy chosen (header-based, domain-based, or path-based)
- [ ] Data isolation for each tenant confirmed (separate tables, schemas, or row-level scoping)
- [ ] Cross-tenant aggregation query designed for admin-level reporting
- [ ] Tenant-aware queue dispatch implemented using per-tenant queue connections or tags
- [ ] Tenant context resolved in middleware before event capture (K001 integration)
- [ ] Per-tenant data retention and anonymization configured (K022 integration)

---

# Architecture Checklist

- [ ] Tenant resolution mechanism placed in middleware layer, not in controllers
- [ ] Storage isolation strategy chosen per tenant scale (schema-per-tenant vs row-level tenant_id)
- [ ] Cross-tenant queries prevented at application level for non-admin contexts
- [ ] Queue connection per tenant isolation or tagged jobs per tenant implemented
- [ ] Tenant context passed through entire pipeline — middleware -> queue -> storage
- [ ] Tenant resolution strategy compatible with SSO and caching infrastructure

---

# Implementation Checklist

- [ ] Tenant resolved from header (X-Tenant-Id), domain (subdomain), or path (/{tenant}) in middleware
- [ ] event table includes tenant_id column indexed for query scoping
- [ ] All analytics queries scoped by tenant_id automatically via global scope or middleware
- [ ] Queue jobs tagged with tenant_id for per-tenant monitoring and failure handling
- [ ] Cross-tenant aggregation query isolated behind admin-only authorization gate
- [ ] Tenant-specific configuration (retention, anonymization) loaded dynamically per request

---

# Performance Checklist

- [ ] Tenant resolution is zero-extra-DB-query — cached after first resolution per request
- [ ] tenant_id column indexed in all analytics tables for query scoping
- [ ] Cross-tenant aggregation uses separate summary table, not union of all tenant tables
- [ ] Queue jobs per tenant do not starve other tenants — fair queue processing implemented
- [ ] Tenant-specific config cached (Redis) to avoid per-request config loading

---

# Security Checklist

- [ ] Tenant ID validated server-side — cannot be spoofed via header
- [ ] Cross-tenant data leakage prevented by tenant scope applied before query execution
- [ ] Rate limiting applied per tenant, not globally (one tenant cannot exhaust limits for others)
- [ ] Tenant deletion cascade does not affect other tenants' data
- [ ] Admin cross-tenant queries require elevated authorization check

---

# Reliability Checklist

- [ ] Tenant resolution failure (unknown tenant) returns HTTP 404, not data leak or crash
- [ ] Queue worker per tenant or fair queue prevents one tenant's backlog affecting others
- [ ] Tenant config merge with defaults — missing config does not cause failure
- [ ] Tenant isolation verified in staging with multi-tenant load test
- [ ] Tenant deletion restores storage capacity without data fragmentation

---

# Testing Checklist

- [ ] Test all three tenant resolution strategies (header, domain, path) with representative requests
- [ ] Test tenant-scoped query returns only that tenant's events
- [ ] Test cross-tenant query blocked without admin authorization
- [ ] Test one tenant's high volume does not degrade another tenant's performance
- [ ] Test tenant deletion cascade removes all associated events
- [ ] Test tenant resolution handles missing/empty tenant ID gracefully

---

# Maintainability Checklist

- [ ] Tenant resolution strategy configurable via single config file entry
- [ ] Tenant isolation strategy documented with rationale and migration path
- [ ] Queue topology per tenant documented in operations runbook
- [ ] Tenant model and middleware in dedicated directory (app/MultiTenancy/)
- [ ] Tenant bootstrap logic in service provider, not scattered across application

---

# Anti-Pattern Prevention Checklist

- [ ] Do not trust tenant ID from request without server-side validation
- [ ] Do not implement tenant isolation at application layer only — ensure DB-level scoping too
- [ ] Do not use a single queue for all tenants without fair queuing or priority
- [ ] Do not hardcode tenant IDs in queries — use middleware-resolved context
- [ ] Do not cache cross-tenant results in shared cache without tenant key prefix

---

# Production Readiness Checklist

- [ ] Prometheus/Grafana dashboard with per-tenant event count, error rate, latency
- [ ] Logged warning when per-tenant queue backlog exceeds threshold
- [ ] Alert if tenant resolution failure rate exceeds 1% of requests
- [ ] Per-tenant rate limit burst capacity isolated (one tenant spike does not throttle others)
- [ ] Deployment checklist includes tenant isolation verification step
- [ ] New tenant onboarding documented and automated

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: middleware-based resolution, storage isolation strategy, queue per tenant
- [ ] Security requirements satisfied: validated tenant ID, scoped queries, admin-only cross-tenant, per-tenant rate limit
- [ ] Performance requirements satisfied: indexed tenant_id, cached resolution, fair queue processing
- [ ] Testing requirements satisfied: resolution strategies, data isolation, tenant performance isolation, deletion
- [ ] Anti-pattern checks passed: no trusting header, no app-only isolation, no hardcoded IDs, fair queue
- [ ] Production readiness verified: per-tenant metrics, backlog alerts, burst isolation, onboarding runbook

---

# Related References

- K001 (Middleware Event Tracking): Tenant resolution happens in tracking middleware
- K002 (Queue Dispatching): Tenant-aware queue dispatch and processing
- K022 (GDPR Compliance): Per-tenant data retention and anonymization
