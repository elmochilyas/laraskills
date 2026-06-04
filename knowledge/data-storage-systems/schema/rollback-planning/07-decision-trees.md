# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-11 Rollback Planning
**Generated:** 2026-06-03

---

# Decision Inventory

* Additive vs Destructive Migration Rollback Strategy
* Immediate Rollback vs Phased Rollback
* Backup vs Snapshot for Pre-Destructive Backup

---

# Architecture-Level Decision Trees

---

## Additive vs Destructive Migration Rollback Strategy

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer writing a migration must determine the rollback strategy based on whether the migration is additive or destructive.

---

## Decision Criteria

* performance considerations: rollback execution time
* architectural considerations: data preservation requirements
* security considerations: data loss prevention
* maintainability considerations: down() method complexity

---

## Decision Tree

Is the migration additive (CREATE TABLE, ADD COLUMN)?
↓
YES → Rollback is safe and immediate (DROP/ALTER REVERSE in down())
NO → Is the migration destructive (DROP TABLE, DROP COLUMN)?
    YES → Rollback requires pre-migration backup (data cannot be recovered from schema alone)
    NO → Is it a rename or type change?
        YES → Rollback requires dual-schema preservation (expand-contract style)
        NO → Standard rollback via down() method

---

## Rationale

Additive migrations are trivially rollback-safe: the down() method simply reverses the addition (DROP TABLE, DROP COLUMN). Destructive migrations require a pre-migration backup because data is lost when the DDL executes. Renames and type changes need an expand-contract approach for safe rollback because old data may need to be preserved.

---

## Recommended Default

**Default:** Write down() method for every migration; backup before destructive operations
**Reason:** Every migration should have a down() method even if it's just `Schema::dropIfExists()`. Destructive operations need an additional backup step because down() alone cannot restore data.

---

## Risks Of Wrong Choice

No down() method means rollback requires manual schema editing. Dropping a column without backup means the data is permanently lost.

---

## Related Rules

Always write a down() method. Backup before destructive operations.

---

## Related Skills

Plan and Execute Safe Migration Rollbacks

---

## Immediate Rollback vs Phased Rollback

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

When a migration fails, the engineer must decide whether to roll back immediately or execute a phased rollback over multiple deploy cycles.

---

## Decision Criteria

* performance considerations: rollback speed, data re-backfill time
* architectural considerations: deploy pipeline, application compatibility
* security considerations: data integrity during rollback
* maintainability considerations: coordination across services

---

## Decision Tree

Is the migration additive and recently deployed?
↓
YES → Roll back immediately (migrate:rollback, then revert application code)
NO → Is the migration in the contract phase (old structure being removed)?
    YES → Phased rollback required (revert app code first, restore old structure, wait)
    NO → Immediate rollback is safe

---

## Rationale

Additive migrations can be rolled back immediately by running `migrate:rollback --step=1` and reverting the application deploy. For destructive or contract-phase migrations, immediate rollback may cause data loss or leave the application incompatible with the database schema. Phased rollback re-adds the old structure in a new deploy, then switches traffic — similar to expand-contract but in reverse.

---

## Recommended Default

**Default:** Immediate rollback for additive changes, phased rollback for destructive/contract changes
**Reason:** Additive changes have no data loss risk and can be rolled back instantly. Destructive changes need careful phased rollback to avoid data loss or application errors.

---

## Risks Of Wrong Choice

Immediate rollback of a destructive migration loses data permanently. Phased rollback of a simple additive change wastes time and deploy cycles.

---

## Related Rules

Always write a down() method. Test rollback before deployment.

---

## Related Skills

Plan and Execute Safe Migration Rollbacks

---

## Backup vs Snapshot for Pre-Destructive Backup

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Before a destructive migration (DROP TABLE, DROP COLUMN), the engineer must choose the backup method.

---

## Decision Criteria

* performance considerations: backup time, restore time
* architectural considerations: backup infrastructure, storage
* security considerations: backup encryption, access controls
* maintainability considerations: restoration complexity

---

## Decision Tree

Is this a full table drop?
↓
YES → Use full table backup (CREATE TABLE ... AS SELECT, or mysqldump/pg_dump for single table)
NO → Is this a single column drop?
    YES → Use logical snapshot (export column data with primary key for re-insertion)
    NO → Use full table backup

---

## Rationale

Full table drops require a complete backup of the table's data and schema. Single column drops need only the column data with the primary key — enough to re-insert if the column needs to be restored. The backup method should match the granularity of the destructive operation: smaller backups are faster but insufficient if more data is lost than expected.

---

## Recommended Default

**Default:** Full table backup before any destructive operation
**Reason:** A full table backup is comprehensive and can restore any degree of data loss. Column-only snapshots are faster but assume only that column was affected. When in doubt, take the full backup.

---

## Risks Of Wrong Choice

Column-only snapshot for a table drop loses all other columns. Full backup for every operation may be impractical for very large tables — use logical snapshots for DROP COLUMN on large tables.

---

## Related Rules

Backup before destructive operations. Test rollback before deployment.

---

## Related Skills

Plan and Execute Safe Migration Rollbacks
