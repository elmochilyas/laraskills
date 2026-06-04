# Decomposition: 5.27 Per-tenant database backups and restore

## Topic Overview
Per-tenant backup/restore is essential for DB-per-tenant isolation model and compliance (GDPR right to deletion, customer data export). Each tenant's database is backed up independently. Restore for one tenant doesn't affect others.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-27-per-tenant-backups-restore/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.27 Per-tenant database backups and restore
- **Purpose:** Per-tenant backup/restore is essential for DB-per-tenant isolation model and compliance (GDPR right to deletion, customer data export). Each tenant's database is backed up independently.
- **Difficulty:** Advanced
- **Dependencies:** 5.3 DB-per-tenant, 5.10 Tenant lifecycle, 5.22 Compliance-driven isolation

## Dependency Graph
**Depends on:** "5.3 DB-per-tenant", "5.10 Tenant lifecycle", "5.22 Compliance-driven isolation"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Snapshot per database**: RDS automated snapshots per DB instance. For multi-tenant (shared DB), this backs up all tenants together — not per-tenant.; - **Per-tenant dump**: `pg_dump -d tenant_db_name` or `mysqldump tenant_db_name`. Individual backup files. Restorable independently.; - **GDPR delete**: For shared-table, deleting tenant data means `DELETE FROM orders WHERE tenant_id = ?` across all tables. For DB-per-tenant, drop the entire database..
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