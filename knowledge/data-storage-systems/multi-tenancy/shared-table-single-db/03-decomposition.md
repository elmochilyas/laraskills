# Decomposition: 5.1 Shared-table (single DB, tenant_id column with global scope)

## Topic Overview
The shared-table model stores all tenants' data in the same database tables, distinguished by a `tenant_id` column. A global scope automatically filters by tenant on every query. Lowest operational cost but highest risk of cross-tenant data leaks.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-1-shared-table-single-db/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.1 Shared-table (single DB, tenant_id column with global scope)
- **Purpose:** The shared-table model stores all tenants' data in the same database tables, distinguished by a `tenant_id` column. A global scope automatically filters by tenant on every query.
- **Difficulty:** Intermediate
- **Dependencies:** 5.2 Schema-per-tenant, 5.3 Database-per-tenant, 5.5 Eloquent global scopes

## Dependency Graph
**Depends on:** "5.2 Schema-per-tenant", "5.3 Database-per-tenant", "5.5 Eloquent global scopes"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Single database, shared tables**: Every row has a `tenant_id`. Queries must always filter by it.; - **Global scope**: Eloquent `addGlobalScope` automatically adds `WHERE tenant_id = ?` to all queries.; - **Index requirement**: Composite index on `(tenant_id, ...)` for filtered columns. Without it, every query scans all tenants' data..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization