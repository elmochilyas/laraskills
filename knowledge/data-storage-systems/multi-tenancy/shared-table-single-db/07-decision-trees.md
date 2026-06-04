# 5-1 Shared Table Single DB - Decision Trees

## Multi-Tenancy Isolation Strategy Selection

---

## Decision Context

Choosing between shared-table, schema-per-tenant, and database-per-tenant for multi-tenant applications.

---

## Decision Criteria

* performance: shared-table is simplest; database-per-tenant has connection overhead
* architectural: isolation level vs operational complexity
* security: cross-tenant data leak risk
* maintainability: migrations are simpler with shared-table

---

## Decision Tree

Which multi-tenancy strategy?

↓

Is compliance/security isolation required (HIPAA, SOC2)?

YES → Database-per-tenant

    ↓
    Complete data isolation
    Independent backup/restore per tenant
    Highest operational complexity
    
    ↓
    Cost: N databases, N connections
    Connection pooling essential

NO → Are tenants trusted with shared infrastructure?

    YES → Schema-per-tenant (PostgreSQL)
    
        ↓
        Each tenant has own schema in shared database
        Medium isolation
        Single connection
        Schema management complexity
    
    NO → Shared-table approach (simplest)
        
        ↓
        All tenants in same tables
        tenant_id column + global scope
        
        ↓
        Pros: Simplest, lowest cost, easy migrations
        Cons: Highest risk of data leaks, requires tenat_id indexing
        
        ↓
        Default for early-stage SaaS

---

## Recommended Default

**Default:** Start with shared-table; migrate to higher isolation as needed
**Reason:** Shared-table is simplest and cheapest. Upgrade isolation when compliance or noise levels justify the cost.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Shared-Table Multi-Tenancy with Global Scopes
