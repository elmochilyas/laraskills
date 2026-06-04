# Multi-Tenancy Analytics

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 01-event-tracking
- **Knowledge Unit:** multi-tenancy-analytics
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Multi-tenancy in analytics introduces tenant-aware event capture, storage isolation, and query scoping — the central challenge is resolving tenant context at ingestion time and routing events to isolated storage without leaking data between tenants. This is one of the most common sources of data leaks in SaaS applications, where a single misconfigured query or missing tenant filter can expose one customer's data to another.

---

## Core Concepts

- **Tenant Resolution Strategies:** Header-based (API key in HTTP header), Domain-based (wildcard subdomains), Path-based (tenant slug in URL) — each with distinct tradeoffs for performance, caching, and SSO integration
- **Data Isolation Models:** Database-per-tenant (strongest isolation, complex management), Schema-per-tenant (PostgreSQL, good isolation), Row-level isolation (weakest isolation but simplest, requires vigilant scoping)
- **Tenant-Aware Queues:** Different tenants may need different queue configurations — different priorities, retry policies, processing rates — to prevent one tenant's volume from starving others

---

## Mental Models

- **Tenant as Cell in Prison:** Each tenant's data is a separate cell. Guards (tenant filters) must be at every door. A missing guard at any checkpoint allows prisoners (data) to wander between cells. Database-per-tenant is like separate prison buildings — structural isolation.
- **Tenant Resolution as Key Ring:** The middleware resolves which key opens which door. The resolved tenant identifier is the key that must be presented at every lock (query, cache, queue) throughout the system.

---

## Internal Mechanics

Tenant context is resolved in the middleware layer and stored in request attributes. The resolved tenant identifier flows through the entire pipeline: event capture → queue dispatch → job processing → storage → query. Cache keys must include tenant prefix (`analytics:tenant:{id}:widget:{name}`) to prevent cross-tenant cache leaks. Queue isolation uses separate queue names per tenant (`analytics-tenant-{id}-high` for dashboards, `analytics-tenant-{id}-low` for exports). Every downstream query, queue job, and enrichment pipeline receives and enforces tenant context.

---

## Patterns

- **Resolve Tenant Early, Enforce Everywhere:** Tenant context resolved in middleware and stored in request attributes — every downstream system receives tenant context and enforces scoping
- **Per-Tenant Queue with Priority Tiers:** Separate queue names per tenant (`analytics-tenant-{id}-high`, `analytics-tenant-{id}-low`) with dedicated workers or priority queues based on tenant tier
- **Tenant-Scoped Cache Prefix:** All cache keys include tenant identifier to prevent cross-tenant data leaks — a dashboard widget cached for Tenant A must never be served to Tenant B

---

## Architectural Decisions

Choose database isolation level based on regulatory requirements (healthcare/finance → database-per-tenant), scale (> 1000 tenants → database-per-tenant), operational complexity tolerance (< 50 tenants → manageable), and cost sensitivity (row-level → lowest cost). Use domain-based or header-based resolution for primary identifier — avoid path-based as it couples URL structure to tenant identity and complicates API versioning.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Strongest data isolation (db-per-tenant) | Complex migration management, connection pooling required | Best for regulated industries |
| Simple architecture (row-level) | Every query needs tenant filter — SQL injection exposes all | Must implement RLS or vigilant query scoping |
| Natural URLs (domain-based) | DNS resolution overhead, complex caching | Cache key must include domain |
| Simple client integration (header-based) | Client must manage and send API key | Validate against authenticated user's membership |

---

## Performance Considerations

Domain-based resolution requires DNS or domain lookup — add caching to avoid per-request overhead. Database-per-tenant requires multiple connections with connection pooling. Row-level isolation has best connection reuse but needs tenant-scoped indexes on every query. Cache prefix per tenant increases Redis memory usage linearly with tenant count.

---

## Production Considerations

Cross-tenant data leakage is the primary security risk — every query must include a tenant filter. Tenant identifiers in headers can be spoofed — validate tenant access against authenticated user's membership. API keys for header-based resolution must be hashed and stored securely. Test tenant isolation rigorously with dedicated tests asserting Tenant A cannot see Tenant B's data.

---

## Common Mistakes

- **Relying on Application-Level Scoping Only:** Tenant scoping enforced only in application code — an application bug exposes all tenants' data. Better: implement isolation at multiple layers (application queries, database views/RLS, monitoring).
- **Shared Cache Without Tenant Prefix:** Dashboard widgets cached with generic keys — Tenant B gets Tenant A's cached data. Better: prefix all cache keys with tenant identifier.
- **Single Queue for All Tenants:** One tenant's 10M event import stalls all other tenants' dashboards. Better: use per-tenant queue names with dedicated workers or priority queues.

---

## Failure Modes

- **Late Tenant Resolution:** Resolving tenant at query time rather than middleware ingestion time — stored events must be reprocessed with tenant context. Mitigation: resolve at earliest point (tracking middleware), persist tenant identifier with every event.
- **Tenant ID in Every URL:** Putting tenant identifier in every API URL path — couples URL structure to tenant identity, complicates versioning and custom domains. Mitigation: use domain-based or header-based resolution.
- **Cross-Tenant SQL Injection:** Row-level isolation with a single SQL injection that exposes all tenants' data. Mitigation: database-per-tenant contains blast radius to one tenant.

---

## Ecosystem Usage

Laravel multi-tenancy packages like `stancl/tenancy` integrate with analytics at the middleware level. The tenant resolution middleware typically runs before the analytics tracking middleware. Packages like `spatie/laravel-analytics` can be extended with tenant-aware query scopes. For ClickHouse/Snowflake, separate databases or schemas per tenant are configured at the connection level.

---

## Related Knowledge Units

### Prerequisites
- Middleware Event Tracking — Tenant resolution happens in tracking middleware
- Queue Dispatching — Tenant-aware queue dispatch and processing

### Related Topics
- GDPR Compliance — Per-tenant data retention and anonymization
- Circuit Breaker — Per-tenant rate limiting for external enrichment

### Advanced Follow-up Topics
- Star Schema — Tenant dimension in star-schema modeling
- SCD Dimensions — Per-tenant slowly changing dimension handling

---

## Research Notes

Multi-tenant analytics is one of the most common sources of data leaks in SaaS applications. The principle of "resolve early, enforce everywhere" is critical — tenant context determined once at ingress must propagate through every layer. Database-per-tenant is increasingly preferred for regulated industries, while row-level isolation with PostgreSQL Row-Level Security (RLS) provides a middle ground for most SaaS applications.
