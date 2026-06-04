# Decomposition: 5.25 Tenant bootstrapper pattern (central vs. tenant connections)

## Topic Overview
The tenant bootstrapper pattern separates two database connection configurations: a central connection (for the tenants registry, plans, global config) and a tenant connection (for per-tenant data). The bootstrapper initializes the tenant connection after resolving the current tenant. This pattern is the foundation of all isolation models.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-25-tenant-bootstrapper-pattern/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.25 Tenant bootstrapper pattern (central vs. tenant connections)
- **Purpose:** The tenant bootstrapper pattern separates two database connection configurations: a central connection (for the tenants registry, plans, global config) and a tenant connection (for per-tenant data). The bootstrapper initializes the tenant connection after resolving the current tenant.
- **Difficulty:** Advanced
- **Dependencies:** 5.4 Tenant resolution, 5.6 Tenant middleware, 5.13 Connection caching

## Dependency Graph
**Depends on:** "5.4 Tenant resolution", "5.6 Tenant middleware", "5.13 Connection caching"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Central connection**: `config('database.connections.central')` — stores tenant registry (`tenants` table), global settings. Always available.; - **Tenant connection**: `config('database.connections.tenant')` — dynamically configured per request. Database/schema/connection string comes from the tenant record.; - **Bootstrapper class**: `TenantBootstrapper` — takes resolved tenant, configures tenant connection, purges stale connections, sets session variables (RLS)..
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