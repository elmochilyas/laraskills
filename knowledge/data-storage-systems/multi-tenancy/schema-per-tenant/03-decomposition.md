# Decomposition: 5.2 Schema-per-tenant (single DB, separate schemas/prefixes per tenant)

## Topic Overview
Schema-per-tenant uses a single database server with separate schemas (PostgreSQL) or table prefixes (MySQL) per tenant. All tenants share the same connection pool but their data is physically separated at the schema level. Medium isolation, moderate operational complexity.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-2-schema-per-tenant/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.2 Schema-per-tenant (single DB, separate schemas/prefixes per tenant)
- **Purpose:** Schema-per-tenant uses a single database server with separate schemas (PostgreSQL) or table prefixes (MySQL) per tenant. All tenants share the same connection pool but their data is physically separated at the schema level.
- **Difficulty:** Advanced
- **Dependencies:** 5.1 Shared-table, 5.3 Database-per-tenant, 5.9 Migration orchestration

## Dependency Graph
**Depends on:** "5.1 Shared-table", "5.3 Database-per-tenant", "5.9 Migration orchestration"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **PostgreSQL schemas**: `CREATE SCHEMA tenant_123;` Each tenant's tables are created inside their schema. `SET search_path TO tenant_123;` isolates queries.; - **MySQL table prefixes**: `tenant_123_orders` vs `tenant_456_orders`. Same database, different table names. Less elegant than PostgreSQL schemas.; - **Connection switching**: Laravel `config(['database.connections.tenant.database' => 'tenant_'.$id])` — rebind connection on the fly..
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