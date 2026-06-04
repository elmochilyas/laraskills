# Decomposition: 5.9 Migration orchestration across tenants (single DB, per-schema, per-DB)

## Topic Overview
Running migrations across tenants is the primary operational challenge of multi-tenant systems. For shared-table: run once. For schema-per-tenant: loop schemas, run per schema.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-9-migration-orchestration-across-tenants/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.9 Migration orchestration across tenants (single DB, per-schema, per-DB)
- **Purpose:** Running migrations across tenants is the primary operational challenge of multi-tenant systems. For shared-table: run once.
- **Difficulty:** Advanced
- **Dependencies:** 5.2 Schema-per-tenant, 5.3 Database-per-tenant, 11.14 Multi-DB migration strategies

## Dependency Graph
**Depends on:** "5.2 Schema-per-tenant", "5.3 Database-per-tenant", "11.14 Multi-DB migration strategies"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Shared-table**: Standard migrations. Run once. Central `migrations` table. No orchestration required.; - **Schema-per-tenant**: N migration runs per deployment. Each schema has its own `migrations` table. Loop all schemas; run `migrate` for each.; - **Database-per-tenant**: N database connections. Each database has its own `migrations` table. Largest orchestration overhead..
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