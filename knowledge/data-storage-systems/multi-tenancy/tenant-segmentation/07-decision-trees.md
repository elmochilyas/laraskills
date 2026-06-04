# 5-17 Tenant Segmentation - Decision Trees

## Tier Assignment Model

---

## Decision Context

Grouping tenants into tiers based on usage, revenue, or requirements — each tier uses a different isolation model with different cost and performance characteristics.

---

## Decision Criteria

* performance: higher tiers get dedicated resources; lower tiers share
* architectural: tier determines isolation model (shared-table → schema → DB-per-tenant)
* maintainability: tier assignment is dynamic — tenants can be promoted
* security: enterprise tier gets full data isolation

---

## Decision Tree

How to assign tenants to tiers?

↓

Tenant revenue or usage based?

↓

Free tier (< $100/mo or < 1000 MAU)?

YES → Shared-table with rate limiting

    ↓
    All free tenants in same database
    tenant_id column + global scope
    1000 req/min rate limit
    
    ↓
    Lowest cost per tenant
    Accept: some noisy neighbor impact
    No dedicated resources

NO → Pro tier ($100-1000/mo or 1000-100k MAU)?

    YES → Schema-per-tenant (PostgreSQL)
    
        ↓
    Each tenant gets dedicated schema
    Medium isolation — no shared rows
    Higher rate limits (5000 req/min)
    Priority queue processing

NO → Enterprise tier (> $1000/mo or > 100k MAU)?

    → Database-per-tenant
    Dedicated database instance
    Complete data isolation
    Custom rate limits, SLAs
    Dedicated support, backup schedule

---

## Recommended Default

**Default:** Free → shared-table; Pro → schema-per-tenant; Enterprise → database-per-tenant
**Reason:** Tier-based isolation aligns infrastructure cost with customer value. Free tenants are subsidized; Enterprise tenants pay for full isolation.

---

## Dynamic Connection Resolution by Tier

---

## Decision Context

Configuring database connections dynamically based on tenant tier — free tenants use shared database; enterprise tenants use dedicated database.

---

## Decision Criteria

* performance: tier check adds minimal overhead per request
* architectural: connection config differs by tier
* maintainability: central tier definition prevents scattered logic
* security: enterprise tenants must never touch shared database

---

## Decision Tree

How to resolve connection by tier?

↓

Free tier?

YES → Use shared connection config

    ↓
    config('database.connections.shared')
    Single database, single pool
    tenant_id column isolates rows

NO → Pro tier?

    YES → Use schema-based connection
    
        ↓
        config('database.connections.tenant')
        SET search_path TO tenant_{id}
        Same database server, different schemas

NO → Enterprise tier?

    → Use per-tenant database connection
    config()->set() with tenant's dedicated DB credentials
    DB::purge() + reconnect
    Tenant has own connection pool

---

## Recommended Default

**Default:** Resolve connection config in middleware based on tenant tier
**Reason:** Tier determines isolation model. Centralizing tier→connection mapping in middleware ensures consistent routing and prevents misconfiguration.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Tenant Segmentation
* Implement Per-Tenant Scaling
