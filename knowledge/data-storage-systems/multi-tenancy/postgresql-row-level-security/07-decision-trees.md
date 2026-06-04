# 5-14 PostgreSQL Row-Level Security - Decision Trees

## RLS vs Global Scopes: Defense in Depth

---

## Decision Context

Choosing to implement PostgreSQL Row-Level Security as an additional isolation layer alongside Eloquent global scopes to catch leaks at the database level.

---

## Decision Criteria

* performance: RLS adds microseconds per row — measurable for bulk operations
* architectural: RLS is database-level enforcement; global scopes are application-level
* maintainability: RLS policies must be created per table via migrations
* security: RLS catches leaks that bypass application layer (raw SQL, direct DB access)

---

## Decision Tree

Should you add RLS on top of global scopes?

↓

Application has raw SQL or QB queries that may bypass scopes?

YES → Add RLS as defense-in-depth

    ↓
    Enable RLS on tenant-scoped tables
    Create policy: USING (tenant_id = current_setting('app.current_tenant')::bigint)
    Set app.current_tenant in middleware: DB::statement("SET app.current_tenant = ?", [$id])
    
    ↓
    Global scope catches 90% — RLS catches the remaining 10%
    Both layers must agree — if app scope says tenant A, RLS enforces tenant A

NO → All queries go through Eloquent with global scopes?

    YES → RLS is optional but recommended for critical data
    
        ↓
    Adds overhead but provides safety net
    Critical compliance requirement? → REQUIRED
    Standard SaaS? → Optional, recommended for financial/medical data
        
    NO → RLS on all tables?
    
        → Only on tenant-scoped tables
        Central tables (plans, config) should NOT have RLS
        Bulk operations: DISABLE/ENABLE RLS as needed

---

## Recommended Default

**Default:** RLS on tenant-scoped tables for defense-in-depth; not on central tables
**Reason:** RLS catches application-level scope bypasses. Central tables don't need tenant isolation. RLS on all tables adds unnecessary overhead.

---

## Setting app.current_tenant with Transaction Pooling

---

## Decision Context

Handling PostgreSQL session variable `app.current_tenant` when using PgBouncer transaction pooling, where session state is lost between transactions.

---

## Decision Criteria

* performance: SET command adds ~0.1ms per transaction
* architectural: session variable must be set per transaction
* maintainability: use SET LOCAL inside transactions for automatic scoping
* security: unset variable = NULL = RLS blocks all rows

---

## Decision Tree

How to set current_tenant with transaction pooling?

↓

Within a transaction?

YES → Use SET LOCAL (scoped to transaction)

    ↓
    DB::transaction(function () {
        DB::statement("SET LOCAL app.current_tenant = ?", [$tenantId]);
        // queries — RLS uses current_tenant
    });
    
    ↓
    SET LOCAL is automatically discarded after transaction
    No cleanup needed — next transaction must set again
    
    ↓
    For middleware: cannot use SET LOCAL (no active transaction)
    Use: DB::beginTransaction() → SET LOCAL → commit

NO → Outside transaction (middleware)?

    YES → Use SET SESSION (requires session pooling)
    
        ↓
        Incompatible with transaction pooling
        Must use session pooling for RLS + middleware pattern
        Alternative: set at start of each transaction
        
    NO → PgBouncer transaction pooling?
    
        → Set at transaction start every time
        Cannot persist across transaction boundaries
        Each transaction must explicitly set current_tenant

---

## Recommended Default

**Default:** SET LOCAL within each transaction; middleware pattern only works with session pooling
**Reason:** SET LOCAL ensures RLS policies work correctly within each transaction. Session pooling is required for middleware-level SET SESSION.

---

## Related Rules

* Rule 5-11-1: Implement Isolation Testing
* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement PostgreSQL Row-Level Security
* Implement Eloquent Global Scopes for Tenant Isolation
