# Decomposition: 5.19 Schema version ledger per tenant

## Topic Overview
In multi-tenant systems (especially schema-per-tenant and DB-per-tenant), tenants may be at different migration versions. A schema version ledger tracks which migration batch each tenant has applied. Essential for differential migrations, rollback targeting, and auditing.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-19-schema-version-ledger/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.19 Schema version ledger per tenant
- **Purpose:** In multi-tenant systems (especially schema-per-tenant and DB-per-tenant), tenants may be at different migration versions. A schema version ledger tracks which migration batch each tenant has applied.
- **Difficulty:** Advanced
- **Dependencies:** 5.9 Migration orchestration, 5.29 Tenant migration canary

## Dependency Graph
**Depends on:** "5.9 Migration orchestration", "5.29 Tenant migration canary"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Central ledger table**: `tenant_schema_versions(tenant_id, batch, migration_name, applied_at)`. One row per applied migration per tenant.; - **Differential migration**: Compare tenant's applied version against current schema version. Apply missing migrations only.; - **Canary migration**: Apply migrations to a subset of tenants first. Monitor for errors. Then roll to remaining tenants..
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