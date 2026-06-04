# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 01-event-tracking
**Knowledge Unit:** multi-tenancy-analytics
**Difficulty:** Foundation
**Category:** Multi-Tenancy
**Last Updated:** 2026-06-03

---

# Overview

Multi-tenancy in analytics introduces tenant-aware event capture, storage isolation, and query scoping. The central challenge is resolving the tenant context at ingestion time — identifying which tenant an event belongs to — and routing events to the correct isolated storage without leaking data between tenants.

Laravel analytics packages use three primary tenant resolution strategies: **header-based** (API key in HTTP header), **domain-based** (wildcard subdomains), and **path-based** (tenant slug in URL). Each has distinct tradeoffs for performance, caching, and SSO integration.

Engineers must care because multi-tenant analytics is one of the most common sources of data leaks in SaaS applications. A single misconfigured query or missing tenant filter can expose one customer's analytics data to another customer — a catastrophic trust and compliance failure.

---

# Core Concepts

## Tenant Resolution Strategies

- **Header-based:** The tenant is identified by an API key or token in the request header (e.g., `X-Tenant-Id`). Simple to implement, works regardless of domain or URL structure. Requires the client to manage and send the key.
- **Domain-based:** The tenant is derived from the domain or subdomain (e.g., `tenant1.app.com`). Natural for multi-tenant SaaS with custom domains. Caching is more complex because the cache key must include the domain.
- **Path-based:** The tenant slug is the first segment of the URL path (e.g., `/tenant1/dashboard`). Simplest for the client but couples URL structure to tenant identity.

## Data Isolation Models

- **Database-per-tenant:** Each tenant has a separate database. Strongest isolation. Most complex to manage (migrations, backups, connections).
- **Schema-per-tenant:** Same database, separate schemas. Good isolation. Supported by PostgreSQL. Requires schema-aware connection configuration.
- **Row-level isolation:** Same tables, tenant ID column on every row. Weakest isolation but simplest architecture. Requires vigilant query scoping.

## Tenant-Aware Queues

Events from different tenants may need different queue configurations — different priorities, different retry policies, different processing rates. Tenant-aware dispatch ensures that one tenant's event volume does not starve another tenant's events.

---

# When To Use

- SaaS platforms serving multiple customers with analytics dashboards
- White-label analytics products where each customer sees only their data
- Marketplace platforms where individual merchants need performance insights
- Enterprise applications with department-level data isolation requirements
- Any system where analytics data must be scoped per customer account

---

# When NOT To Use

- Single-tenant applications (use simple row-level user scoping)
- Internal tools with no customer data isolation requirement
- Applications where analytics data is aggregated and not per-tenant (purely internal metrics)
- Systems with fewer than 10 tenants and simple data models (overkill)

---

# Best Practices

## Resolve Tenant Early, Enforce Everywhere

Tenant context should be resolved in the middleware and stored in the request attributes. Every downstream query, queue job, and enrichment pipeline should receive the tenant context and enforce tenant scoping.

## Use Tenant-Scoped Cache Keys

Cache keys must include the tenant identifier to prevent cross-tenant cache leaks. A dashboard widget cached for Tenant A must not be served to Tenant B. Use a cache prefix per tenant.

## Implement Per-Tenant Rate Limiting

Each tenant should have independent rate limits for analytics API calls. One tenant's high-volume import should not degrade another tenant's dashboard performance.

## Test Tenant Isolation Rigorously

Every analytics query must be tested with multiple tenants to verify no cross-tenant data leakage. Write dedicated tests that assert Tenant A cannot see Tenant B's data.

---

# Architecture Guidelines

## Layer Placement

Tenant resolution belongs in the tracking middleware, before event capture. The resolved tenant identifier flows through the entire pipeline: event capture → queue dispatch → job processing → storage → query.

## Database Isolation Decision

Choose isolation level based on:
- **Regulatory requirements:** Healthcare/finance often requires database-per-tenant
- **Scale:** > 1000 tenants with moderate data each → database-per-tenant
- **Operational complexity tolerance:** < 50 tenants → database-per-tenant is manageable
- **Cost sensitivity:** Row-level isolation has lowest operational cost

## Queue Isolation

Use separate queue names per tenant for critical processing: `analytics-tenant-{id}-high` for dashboards, `analytics-tenant-{id}-low` for exports. Configure per-tenant queue worker counts based on tenant tier.

---

# Performance Considerations

- Domain-based resolution requires DNS resolution or a domain lookup — add caching to avoid per-request overhead.
- Database-per-tenant requires maintaining multiple connections; connection pooling is essential.
- Schema-per-tenant with PostgreSQL can use connection pooling efficiently because the connection is shared.
- Row-level isolation has the best connection reuse but requires tenant-scoped indexes on every query.
- Cache prefix per tenant increases Redis memory usage linearly with tenant count.

---

# Security Considerations

- Cross-tenant data leakage is the primary security risk. Every query must include a tenant filter.
- Tenant identifiers in URLs or headers can be spoofed. Validate tenant access against the authenticated user's tenant membership.
- API keys for header-based resolution must be hashed and stored securely.
- Database-per-tenant: a compromised tenant database connection cannot access other tenants' data.
- Row-level isolation: a single SQL injection can expose all tenants' data.

---

# Common Mistakes

## Mistake: Relying on Application-Level Scoping Only

Tenant scoping is enforced in application code but not in the database. An application bug or misconfiguration exposes all tenants' data.

**Better approach:** Implement tenant isolation at multiple layers: application queries, database views/RLS, and monitoring/alerting on cross-tenant access patterns.

## Mistake: Shared Cache Without Tenant Prefix

Dashboard widgets are cached with generic keys. Tenant A requests a widget, it's cached. Tenant B requests the same widget and gets Tenant A's data.

**Better approach:** Prefix all cache keys with the tenant identifier: `analytics:tenant:{id}:widget:{name}:{params}`.

## Mistake: Single Queue for All Tenants

All tenants share the same queue. One tenant imports 10 million events, and all other tenants' dashboards stall because their jobs are behind the import in the queue.

**Better approach:** Use per-tenant queue names with dedicated workers or priority queues.

---

# Anti-Patterns

## Tenant in Every URL

Putting the tenant identifier in every API URL path. This couples URL structure to tenant identity, makes API versioning harder, and requires URL rewriting for custom domains.

**Solution:** Use domain-based or header-based resolution for the primary identifier. Reserve path-based resolution for specific multi-tenant data access patterns.

## Late Tenant Resolution

Resolving the tenant late in the pipeline — at query time rather than at middleware ingestion time. This means all stored events must be reprocessed or re-queried with tenant context.

**Solution:** Resolve tenant at the earliest possible point — the tracking middleware — and persist the tenant identifier with every event.

---

# Examples

## Header-Based Tenant Resolution Middleware

```php
class ResolveTenant
{
    public function __construct(private TenantService $tenants) {}

    public function handle(Request $request, \Closure $next): mixed
    {
        $tenantId = $request->header('X-Tenant-Id')
            ?? $request->header('Authorization');

        $tenant = $this->tenants->resolve($tenantId);

        if (!$tenant) {
            abort(401, 'Invalid tenant');
        }

        $request->attributes->set('tenant', $tenant);

        return $next($request);
    }
}
```

## Tenant-Scoped Analytics Query

```php
class DashboardWidgetProvider
{
    public function getPageViews(Tenant $tenant, DateRange $range): Collection
    {
        return PageView::query()
            ->where('tenant_id', $tenant->id)
            ->whereBetween('created_at', [$range->start(), $range->end()])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as views')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }
}
```

---

# Related Topics

**Prerequisites:**
- Middleware Event Tracking — Tenant resolution happens in tracking middleware
- Queue Dispatching — Tenant-aware queue dispatch and processing

**Closely Related:**
- GDPR Compliance — Per-tenant data retention and anonymization
- Circuit Breaker — Per-tenant rate limiting for external enrichment

**Advanced Follow-Up:**
- Star Schema — Tenant dimension in star-schema modeling
- SCD Dimensions — Per-tenant slowly changing dimension handling

**Cross-Domain Connections:**
- Security & Identity Engineering — Tenant isolation and access control patterns
