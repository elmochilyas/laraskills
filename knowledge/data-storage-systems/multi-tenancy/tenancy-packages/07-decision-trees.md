# 5-24 Tenancy Packages - Decision Trees

## stancl/tenancy vs spatie/laravel-multitenancy

---

## Decision Context

Choosing between stancl/tenancy (full-featured, supports all isolation models) and spatie/laravel-multitenancy (lightweight, shared-table only).

---

## Decision Criteria

* performance: both add minimal overhead (<5ms per request)
* architectural: stancl supports schema/DB-per-tenant; spatie is shared-table only
* maintainability: spatie is simpler; stancl has more configuration
* security: both handle tenant isolation correctly when configured properly

---

## Decision Tree

Which tenancy package?

↓

Need schema-per-tenant or database-per-tenant isolation?

YES → stancl/tenancy

    ↓
    Supports: shared-table, schema-per-tenant, database-per-tenant
    Includes: middleware, commands, queue tenant-awareness
    Migration orchestration built-in
    Per-tenant Redis and filesystem isolation
    
    ↓
    Steeper learning curve
    More configuration needed
    Test: use with your specific database driver

NO → Simple shared-table with global scopes?

    YES → spatie/laravel-multitenancy
        
        ↓
        Shared-table only — tenant_id column + global scopes
        Tenant resolved from authenticated user
        Minimal configuration — works out of box
        
        ↓
        Best for: Simple SaaS where each user belongs to one tenant
        Best for: Teams new to multi-tenancy

NO → Custom implementation?

    → Build your own
    Full control over isolation model
    No package dependency
    Required: custom middleware, scope trait, connection management

---

## Recommended Default

**Default:** stancl/tenancy for complex isolation; spatie/laravel-multitenancy for simple shared-table
**Reason:** stancl handles the complexity of schema/DB-per-tenant that would be error-prone to build custom. spatie is perfect when shared-table is sufficient.

---

## Package Selection Based on Team Experience

---

## Decision Context

Considering team familiarity with multi-tenancy concepts when choosing between packages — spatie has a gentler learning curve but less flexibility.

---

## Decision Criteria

* performance: both packages have similar overhead
* architectural: team must understand the chosen package's internals
* maintainability: spatie has fewer config options (less to go wrong)
* security: understanding package internals is essential for debugging leaks

---

## Decision Tree

Team experience with multi-tenancy?

↓

Experienced with multi-tenancy concepts?

YES → stancl/tenancy or custom implementation

    ↓
    Team understands: tenant resolution, connection switching, global scope isolation
    Can leverage stancl's full feature set
    Or build custom solution for complete control

NO → New to multi-tenancy?

    YES → Start with spatie/laravel-multitenancy
    
        ↓
        Simpler mental model — one database, tenant_id column
        Less can go wrong
        Easy to migrate to stancl later if needed
        
    NO → Learning while building a complex product?
    
        → Start with spatie for MVP
        Migrate to stancl when schema/DB-per-tenant is needed
        Don't start with stancl if team doesn't understand the internals

---

## Recommended Default

**Default:** Experienced team → stancl/tenancy; new team → spatie/laravel-multitenancy
**Reason:** A package that the team doesn't understand is a liability. Spatie's simplicity is an asset for teams learning multi-tenancy.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Multi-Tenancy Using Packages
* Implement Custom Tenant Isolation
