# 5-11 Cross Tenant Data Leak Prevention - Decision Trees

## Isolation Testing Strategy: Unit vs Integration vs Penetration

---

## Decision Context

Building a multi-layered testing strategy to detect and prevent cross-tenant data leaks across all data access paths.

---

## Decision Criteria

* performance: tests run in CI — execution time determines feedback speed
* architectural: tests must cover all data access paths (Eloquent, QB, raw SQL)
* maintainability: TenantPair test helper reduces boilerplate
* security: penetration tests simulate real attack vectors

---

## Decision Tree

How to test tenant isolation?

↓

CI pipeline stage?

YES → Add TenantPair isolation tests

    ↓
    Create Tenant A and Tenant B with overlapping data
    Same names, dates, email patterns
    Every endpoint: assert Tenant A cannot see Tenant B's data
    
    ↓
    Test ALL access paths:
    - Eloquent queries (scoped)
    - Query Builder (may bypass scope)
    - Raw SQL (never scoped)
    - Relationship lazy loading
    - API resource responses

NO → Code review stage?

    YES → Review every withoutGlobalScope()
    
        ↓
        Each bypass tagged with issue number
        Reviewer verifies:
        - Operation is admin-only
        - Reason is legitimate
        - No user-facing endpoint uses it

NO → Production monitoring?

    → Log and alert on withoutGlobalScope usage
    Track frequency — sudden increase may indicate leak
    Monthly isolation audit reports

---

## Recommended Default

**Default:** CI isolation tests + code review guardrails + production monitoring
**Reason:** No single layer catches all leaks. CI catches code issues, review catches design issues, monitoring catches runtime issues.

---

## Raw SQL and Query Builder Isolation

---

## Decision Context

Ensuring tenant isolation when using raw SQL or Query Builder — paths that bypass Eloquent global scopes.

---

## Decision Criteria

* performance: manual tenant_id filtering adds WHERE clause overhead
* architectural: raw SQL and QB do NOT automatically apply global scopes
* maintainability: all raw queries must explicitly include tenant_id filter
* security: forgetting the filter = immediate data leak

---

## Decision Tree

Using raw SQL or Query Builder?

↓

Can the query be converted to Eloquent with global scope?

YES → Use Eloquent — global scope applies automatically

    ↓
    Model::where('status', 'active')->get();
    → SELECT * FROM orders WHERE tenant_id = ? AND status = 'active'
    Scope applied automatically

NO → Must use raw SQL or QB?

    YES → Explicitly add tenant condition
        
        ↓
        DB::table('orders')
            ->where('tenant_id', tenant()->id)  // MUST INCLUDE
            ->where('status', 'active')
            ->get();
        
        ↓
        OR use a macro: DB::table('orders')->forTenant()->where(...)
        Custom macro wraps the tenant condition
        
    NO → Creating a reusable raw query?
    
        → Abstract into a scoped query class
        Class includes tenant check that cannot be forgotten
        Test: raw query without tenant filter fails CI

---

## Recommended Default

**Default:** Use Eloquent for all tenant-scoped queries; add forTenant() macro for QB; add explicit WHERE tenant_id for raw SQL
**Reason:** Eloquent scopes are the safest path. QB and raw require manual filtering. Macros reduce the risk of forgetting.

---

## Related Rules

* Rule 5-12-1: Use withoutGlobalScope Guardrails
* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Cross-Tenant Data Leak Prevention
* Implement Eloquent Global Scopes for Tenant Isolation
