# Decomposition: 5.6 Tenant-aware middleware (IdentifyTenant, SetTenantConnection)

## Topic Overview
Tenant-aware middleware runs early in the request lifecycle to resolve the tenant, set the current tenant context, and configure the database connection. Middleware is the correct place for tenant initialization — before controllers, services, or models run.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-6-tenant-aware-middleware/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.6 Tenant-aware middleware (IdentifyTenant, SetTenantConnection)
- **Purpose:** Tenant-aware middleware runs early in the request lifecycle to resolve the tenant, set the current tenant context, and configure the database connection. Middleware is the correct place for tenant initialization — before controllers, services, or models run.
- **Difficulty:** Intermediate
- **Dependencies:** 5.4 Tenant resolution, 5.5 Global scopes, 5.13 Connection caching

## Dependency Graph
**Depends on:** "5.4 Tenant resolution", "5.5 Global scopes", "5.13 Connection caching"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **IdentifyTenant middleware**: Extracts tenant identifier from subdomain/domain/header. Looks up tenant in central database. Sets `app(CurrentTenant::class)`.; - **SetTenantConnection middleware**: For schema-per-tenant or DB-per-tenant: updates database config (`config(['database.connections.tenant.database' => ...])`), clears connection (`DB::purge('tenant')`), reconnects.; - **Middleware order**: `IdentifyTenant` runs before `SetTenantConnection`, which runs before `StartSession` and `Authenticate`..
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