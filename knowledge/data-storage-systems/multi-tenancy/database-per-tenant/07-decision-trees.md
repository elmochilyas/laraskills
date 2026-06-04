# 5-3 Database Per Tenant - Decision Trees

## Database-Per-Tenant Isolation: When Compliance Requires Full Separation

---

## Decision Context

Choosing database-per-tenant architecture when compliance (HIPAA, SOC2), billing alignment, or operational requirements demand strongest data isolation.

---

## Decision Criteria

* performance: N tenants × connections per tenant; pooling is essential
* architectural: strongest isolation, clearest billing, highest operational cost
* security: tenant data never coexists in same database — zero cross-tenant query risk
* maintainability: N databases to manage, monitor, backup, migrate

---

## Decision Tree

Should you use database-per-tenant?

↓

Compliance requires full data isolation (HIPAA, SOC2, PCI)?

YES → Database-per-tenant is REQUIRED

    ↓
    Each tenant gets independent database
    Independent backup/restore per tenant
    Independent encryption keys (if required)
    
    ↓
    Cost: N × (storage + connections + backup storage)
    Connection pooling essential — use PgBouncer/ProxySQL
    Provision tenants in groups, not individually

NO → High-value tenants willing to pay for isolation?

    YES → Database-per-tenant is OPTIONAL but recommended
    
        ↓
    Alignment: tenant billing = database costs
    Tenant can have dedicated resources
    Premium tier in tiered pricing model

NO → Standard SaaS with many small tenants?

    → Use shared-table or schema-per-tenant
    Database-per-tenant too expensive for small tenants
    N databases × 1000 tenants = unmanageable

---

## Recommended Default

**Default:** Database-per-tenant only for compliance-required or high-value tenants; shared-table/schema for standard tiers
**Reason:** The operational cost of N databases scales with tenant count. Reserve database-per-tenant for cases where isolation or billing justifies the expense.

---

## Connection Management: Pooled vs Per-Tenant Pools

---

## Decision Context

Managing database connections for N tenant databases — choosing between a single shared pool with dynamic database selection and per-tenant connection pools.

---

## Decision Criteria

* performance: per-tenant pools reserve connections even for idle tenants
* architectural: shared pool is simpler; per-tenant pools provide isolation
* maintainability: shared pool single config; per-tenant pools need dynamic provisioning
* security: per-tenant pools prevent cross-tenant connection contention

---

## Decision Tree

How to manage connections for database-per-tenant?

↓

Fewer than 50 tenants?

YES → Per-tenant connection pools

    ↓
    Each tenant has dedicated pool in PgBouncer
    Isolation: Tenant A cannot exhaust Tenant B's connections
    Billing: connection usage tracks to tenant
    
    ↓
    Config: PgBouncer per-database pool sections
    Monitor: per-tenant pool utilization

NO → More than 50 tenants?

    YES → Shared pool with dynamic switching
    
        ↓
    Single PgBouncer pool for all tenants
    config()->set() database name per request
    DB::purge() + reconnect on each request
    
    ↓
    Pro: Efficient — connections shared across tenants
    Con: One noisy tenant can exhaust the shared pool
    Solution: per-tenant connection limits in PgBouncer

NO → Hybrid approach?

    → Shared pool for small tenants, dedicated for large
    Tiered architecture based on tenant size/value
    More complex but most resource-efficient

---

## Recommended Default

**Default:** Shared pool with dynamic switching for most tenants; per-tenant pools for high-value tenants
**Reason:** Shared pools scale better for many tenants. Per-tenant pools provide isolation for tenants that need guaranteed resources.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Database-Per-Tenant Multi-Tenancy
* Configure Dynamic Connection Configuration
