# 5-25 Tenant Bootstrapper Pattern - Decision Trees

## Central vs Tenant Connection Separation

---

## Decision Context

Designing the tenant bootstrapper pattern with two distinct database connections — central (for tenant registry, global config) and tenant (for per-tenant data).

---

## Decision Criteria

* performance: two connections per request — minimal overhead
* architectural: central connection is always available; tenant connection is dynamic
* maintainability: clear separation of concerns
* security: tenant connection should never access central data

---

## Decision Tree

Two-connection architecture?

↓

Need to query global data (tenant list, plans) alongside tenant data?

YES → Implement central + tenant connections

    ↓
    Central connection (always available):
    - tenants table
    - global config, plans, feature flags
    - Not tenant-scoped
    
    Tenant connection (dynamically configured):
    - Per-tenant tables
    - Tenant-scoped queries
    - Database/schema configured per request
    
    ↓
    Boot sequence:
    1. IdentifyTenant middleware resolves tenant from request
    2. TenantBootstrapper reads tenant record from CENTRAL DB
    3. Bootstrapper configures TENANT connection
    4. App ready — controllers use TENANT, admin uses CENTRAL

NO → Single shared-table database?

    → Single connection with global scopes
    No need for bootstrapper
    Same database, tenant_id column isolates rows

NO → Using a tenancy package?

    → Package handles bootstrapping internally
    Understand the pattern even if package abstracts it

---

## Recommended Default

**Default:** Two-connection bootstrapper for schema/DB-per-tenant; single connection for shared-table
**Reason:** Two connections provide clear separation. Central holds tenant config; tenant holds tenant data. This pattern is the foundation of all isolation models.

---

## Bootstrapper Sequence for Different Isolation Models

---

## Decision Context

Adapting the bootstrapper sequence to different isolation models — shared-table needs no bootstrapper; schema-per-tenant sets search_path; DB-per-tenant switches database.

---

## Decision Criteria

* performance: DB-per-tenant has highest overhead (connection + context switch)
* architectural: bootstrapper encapsulates isolation-specific logic
* maintainability: single bootstrapper class with strategy pattern
* security: bootstrapper must clear previous tenant state

---

## Decision Tree

Which isolation model for bootstrapper?

↓

Shared-table?

YES → No bootstrapper needed

    ↓
    Global scope handles tenant filtering
    No connection switching
    Single database, tenant_id column

NO → Schema-per-tenant?

    YES → Bootstrapper: SET search_path
        
        ↓
        $schema = "tenant_{$tenant->id}";
        DB::statement("SET search_path TO {$schema}");
        No connection switch — same database
        
        ↓
        Fast — no new connection needed
        Requires: schema exists for this tenant

NO → Database-per-tenant?

    → Bootstrapper: switch database connection
    config(['database.connections.tenant.database' => "tenant_{$tenant->id}"]);
    DB::purge('tenant');
    DB::reconnect('tenant');
    
    ↓
    Slower — new connection required
    Connection pooling essential
    Tag connection with tenant ID for monitoring

---

## Recommended Default

**Default:** Shared-table → global scope; schema-per-tenant → SET search_path; DB-per-tenant → config switch + purge + reconnect
**Reason:** Each isolation model needs a different bootstrapper strategy. The bootstrapper pattern encapsulates the difference behind a consistent interface.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Tenant Bootstrapper Pattern
* Implement Tenant Resolution Strategies
