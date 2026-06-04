# Decomposition: 5.14 PostgreSQL Row-Level Security as defense-in-depth (RLS policies, app.current_tenant)

## Topic Overview
PostgreSQL Row-Level Security (RLS) enforces tenant isolation at the database level. Even if an application bug bypasses the global scope, RLS policies block access to other tenants' rows. Enabled via `CREATE POLICY ...

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-14-postgresql-row-level-security/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.14 PostgreSQL Row-Level Security as defense-in-depth (RLS policies, app.current_tenant)
- **Purpose:** PostgreSQL Row-Level Security (RLS) enforces tenant isolation at the database level. Even if an application bug bypasses the global scope, RLS policies block access to other tenants' rows.
- **Difficulty:** Advanced
- **Dependencies:** 5.5 Global scopes, 5.11 Cross-tenant leak prevention, 12.19 RLS policies

## Dependency Graph
**Depends on:** "5.5 Global scopes", "5.11 Cross-tenant leak prevention", "12.19 RLS policies"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **RLS policy**: `CREATE POLICY tenant_isolation ON orders FOR ALL USING (tenant_id = current_setting('app.current_tenant')::bigint)`. Applied to every row access.; - **app.current_tenant**: PostgreSQL session variable set per connection. Laravel sets it after connection: `DB::statement("SET app.current_tenant = ?", [$tenantId])`.; - **RLS impact on performance**: Each row access checks the policy. Overhead is small (microseconds per row) but measurable for bulk operations..
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