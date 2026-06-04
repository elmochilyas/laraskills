# 3-30 RLS-Compatible Partial Indexes - Decision Trees

## RLS-Aligned Partial Index vs Standard Composite Index

---

## Decision Context

Choosing between a partial index aligned with RLS policy and a standard composite index for multi-tenant queries in PostgreSQL with Row-Level Security enabled.

---

## Decision Criteria

* performance: RLS-aligned partial index pre-filters rows for policy evaluation
* architectural: PostgreSQL-only, requires exact predicate match
* maintainability: policy changes require index rebuild
* security: partial index must match policy to prevent data leak

---

## Decision Tree

PostgreSQL table has RLS enabled with tenant isolation?

↓

Does the RLS policy filter by tenant_id?

YES → Create partial index matching the policy expression

    ↓
    Policy: `USING (tenant_id = current_setting('app.tenant_id')::bigint)`
    
    Partial index: `CREATE INDEX ON orders (status, created_at) WHERE tenant_id = current_setting('app.tenant_id')::bigint`
    
    ↓
    Benefits:
    - Policy evaluation is index-assisted (not sequential scan)
    - Each tenant only sees their subset through the partial index
    - Smaller index than a full (tenant_id, status, created_at) composite
    
    ↓
    Critical: expression must EXACTLY match the policy's USING clause
    - Same function, same casting, same operators
    - Any difference → index not used for policy evaluation

NO → RLS policy filters differently?

    → Create partial index matching the actual policy expression

---

## Rationale

When RLS evaluates `USING (tenant_id = current_setting(...))`, it must check every row unless an index can help. A partial index with the exact same WHERE clause as the USING expression allows the planner to use it for policy evaluation — only rows matching the policy are even considered, and the index eliminates the scan entirely.

---

## Recommended Default

**Default:** Create partial indexes matching RLS policy expressions for tenant-isolated access
**Reason:** Without matching indexes, RLS policy evaluation degrades to sequential scans on every query.

---

## Risks Of Wrong Choice

Mismatched index/policy: index not used for policy evaluation → full table scan for every query. Index without matching policy: same performance as no index. Wrong index type: partial index doesn't match policy expression precisely → planner ignores it.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Apply Partial Indexes for Targeted Data Subsets
