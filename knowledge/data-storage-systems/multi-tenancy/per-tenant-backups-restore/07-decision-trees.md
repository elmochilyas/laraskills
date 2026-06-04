# 5-27 Per Tenant Backups Restore - Decision Trees

## Backup Strategy by Isolation Model

---

## Decision Context

Choosing the backup approach based on isolation model — per-tenant dumps for DB-per-tenant, shared snapshots for shared-table, with individual tenant export for GDPR.

---

## Decision Criteria

* performance: per-tenant dumps add overhead proportional to tenant count
* architectural: DB-per-tenant enables independent backup/restore
* maintainability: automated per-tenant dump scheduling
* security: backups must be encrypted per tenant for compliance

---

## Decision Tree

Backup strategy by isolation model?

↓

Database-per-tenant?

YES → Per-tenant automated dumps

    ↓
    Schedule: pg_dump per database (hourly for enterprise, daily for standard)
    Each tenant's backup is independent file
    Restore one tenant without affecting others
    
    ↓
    Storage: s3://backups/{tenant_id}/{timestamp}.sql.gz
    Retention: enterprise 30 days, standard 7 days
    Test: periodic restore verification

NO → Schema-per-tenant?

    YES → Per-schema dump within shared database
        
        ↓
        pg_dump --schema=tenant_123
        Individual schema backup, independent restore
        More complex than per-database dump

NO → Shared-table?

    → Shared database snapshot + per-tenant export
    Database snapshot: disaster recovery
    Per-tenant export: GDPR deletion/compliance
    
    ↓
    Per-tenant export: mysqldump --where="tenant_id = 123"
    Or: application-level export (JSON/CSV)

---

## Recommended Default

**Default:** Per-tenant dumps for DB/schema-per-tenant; shared snapshot + per-tenant export for shared-table
**Reason:** Per-tenant dumps enable independent restore. Shared-table needs a snapshot for DR and export for tenant-specific operations.

---

## GDPR Compliance: Right to Deletion

---

## Decision Context

Implementing per-tenant data deletion for GDPR compliance, with the ability to delete all data for a specific tenant without affecting others.

---

## Decision Criteria

* performance: deletion may cascade across many tables
* architectural: DB-per-tenant makes deletion trivial (DROP DATABASE)
* maintainability: shared-table deletion requires careful table-by-table approach
* security: deletion must be complete and verified

---

## Decision Tree

Tenant requests data deletion (GDPR)?

↓

Database-per-tenant?

YES → DROP DATABASE tenant_db_name

    ↓
    Single command: DROP DATABASE IF EXISTS tenant_123
    All tenant data removed instantly
    Backup may still exist — delete backup files too
    
    ↓
    Confirm: tenant_id removed from central registry
    Audit: log deletion event

NO → Shared-table or schema-per-tenant?

    YES → Delete across all tenant-scoped tables
        
        ↓
        DB::transaction(function () {
            DB::table('orders')->where('tenant_id', $tenantId)->delete();
            DB::table('users')->where('tenant_id', $tenantId)->delete();
            // ... all tenant-scoped tables
        });
        
        ↓
        Risk: forgetting a table = data leak
        Mitigation: maintain list of all tenant-scoped tables
        Verify: count remaining rows per table = 0

NO → File storage also?

    → Delete S3 prefix: s3://bucket/tenants/{id}/
    Delete files recursively
    Remove cache keys with tenant prefix

---

## Recommended Default

**Default:** DB-per-tenant → DROP DATABASE; shared-table → transaction deleting from all scoped tables
**Reason:** DB-per-tenant makes GDPR deletion trivial. Shared-table requires careful orchestration and a tracked table list.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Per-Tenant Backups and Restore
* Implement Compliance-Driven Isolation
