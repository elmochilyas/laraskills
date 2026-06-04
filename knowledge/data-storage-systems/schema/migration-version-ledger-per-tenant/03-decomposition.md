# Decomposition: 1.22 Migration version ledger per tenant (schema_version tracking)

## Topic Overview
In multi-tenant environments with per-tenant databases, each tenant's schema version must be tracked independently. A central `schema_versions` table (or equivalent) in the control database records which migrations have been applied to which tenant. This enables per-tenant rollbacks, staggered rollouts, canary testing, and schema drift detection.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-22-migration-version-ledger-per-tenant/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.22 Migration version ledger per tenant (schema_version tracking)
- **Purpose:** In multi-tenant environments with per-tenant databases, each tenant's schema version must be tracked independently. A central `schema_versions` table (or equivalent) in the control database records which migrations have been applied to which tenant.
- **Difficulty:** Advanced
- **Dependencies:** 1.21 Multi-tenant migration orchestration, 5.19 Schema version ledger per tenant, 5.9 Migration orchestration across tenants

## Dependency Graph
**Depends on:** "1.21 Multi-tenant migration orchestration", "5.19 Schema version ledger per tenant", "5.9 Migration orchestration across tenants"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Schema version ledger**: A table in the central database with columns: `tenant_id`, `migration_name`, `batch`, `applied_at`, `status`.; - **Per-tenant migration state**: Each tenant database has its own `migrations` table. The central ledger aggregates this into a unified view.; - **Drift detection**: Comparing the central ledger with each tenant's actual applied migrations reveals environments where migrations were applied manually or skipped.; - **Version pinning**: A specific schema version can be pinned per tenant, allowing some tenants to stay on an older schema while others advance..
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