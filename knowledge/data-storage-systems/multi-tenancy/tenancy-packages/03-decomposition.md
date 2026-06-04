# Decomposition: 5.24 Packages: stancl/tenancy, spatie/laravel-multitenancy

## Topic Overview
stancl/tenancy is the most mature multi-tenancy package for Laravel (6K+ stars). Supports all isolation models, queue tenant-awareness, Redis tenant isolation, filesystem isolation. spatie/laravel-multitenancy is simpler, more opinionated, focused on shared-table with global scopes.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-24-tenancy-packages/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.24 Packages: stancl/tenancy, spatie/laravel-multitenancy
- **Purpose:** stancl/tenancy is the most mature multi-tenancy package for Laravel (6K+ stars). Supports all isolation models, queue tenant-awareness, Redis tenant isolation, filesystem isolation.
- **Difficulty:** Advanced
- **Dependencies:** 5.1 Shared-table, 5.2 Schema-per-tenant, 5.3 DB-per-tenant

## Dependency Graph
**Depends on:** "5.1 Shared-table", "5.2 Schema-per-tenant", "5.3 DB-per-tenant"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **stancl/tenancy**: Full-featured. Supports single DB, schema, DB-per-tenant. Built-in tenant middleware, commands, queue awareness. Central database for tenant management. Customizable identification via domain, subdomain, path, header, or UUID.; - **spatie/laravel-multitenancy**: Lightweight. Shared-table model with global scopes. Tenant via authenticated user. Minimal configuration. Good for simple SaaS where every user belongs to a tenant..
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