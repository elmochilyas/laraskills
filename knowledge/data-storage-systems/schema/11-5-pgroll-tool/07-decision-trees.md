# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-5 Pgroll Tool
**Generated:** 2026-06-03

---

# Decision Inventory

* pgroll vs Manual Expand-Contract for PostgreSQL
* pgroll Mode Selection: Read-Write vs Read-Write-New
* pgroll vs pgroll-Free Native PostgreSQL DDL

---

# Architecture-Level Decision Trees

---

## pgroll vs Manual Expand-Contract for PostgreSQL

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer needs to run a complex PostgreSQL migration and must choose between pgroll (automated view-based tool) and manually implementing the expand-contract pattern.

---

## Decision Criteria

* performance considerations: view overhead, backfill performance
* architectural considerations: migration complexity, automation needs
* security considerations: schema isolation, rollback capability
* maintainability considerations: setup overhead, team training

---

## Decision Tree

Is the migration complex (column rename, type change, multi-table)?
↓
YES → Use pgroll (automated view management, built-in reversibility)
NO → Is the change a simple additive column or index?
    YES → Use native PostgreSQL DDL (simpler, no tool needed)
    NO → Use pgroll

---

## Rationale

pgroll automates the view-based dual-write pattern, providing built-in rollback capability at any phase without manual schema management. For complex migrations like column renames or type changes, this automation is valuable. For simple additive changes, the native PostgreSQL DDL approach is simpler and doesn't require pgroll setup. The view overhead from pgroll is negligible.

---

## Recommended Default

**Default:** pgroll for complex migrations, native DDL for simple changes
**Reason:** pgroll's automation is valuable for the complex multi-phase migrations where manual expand-contract is error-prone. For simple changes, native DDL is faster and simpler.

---

## Risks Of Wrong Choice

Manual expand-contract for complex migrations risks inconsistent state between phases and difficult rollbacks. pgroll for simple additive changes adds unnecessary tooling overhead.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute pgroll Migrations on PostgreSQL with Full Reversibility

---

## pgroll Mode Selection: Read-Write vs Read-Write-New

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer running a pgroll migration must choose the appropriate mode for each phase of the migration lifecycle.

---

## Decision Criteria

* performance considerations: dual-write overhead during each mode
* architectural considerations: schema versioning, application compatibility
* security considerations: data consistency during cutover
* maintainability considerations: monitoring windows between mode switches

---

## Decision Tree

Is this the initial phase of the migration?
↓
YES → Use read-write mode (writes to both, reads from old)
NO → Has the backfill completed and been verified?
    YES → Use read-write-new mode (reads from new, writes to both)
    NO → Stay in read-write mode until backfill is verified

---

## Rationale

The read-write phase is the expand step: the application writes to both schema versions, reads from the old one. This ensures old data is always available for reads. After backfill verification, the read-write-new phase switches reads to the new schema while still writing to both for rollback safety. The final complete phase removes the backward-compatibility layer.

---

## Recommended Default

**Default:** Start in read-write, advance to read-write-new after backfill verification
**Reason:** This is the canonical pgroll workflow. Each phase has a clear purpose and can be rolled back independently. Rush to read-write-new before verifying backfill risks serving incorrect data.

---

## Risks Of Wrong Choice

Skipping directly to read-write-new without a dual-write period prevents rollback without re-backfill. Staying in read-write mode too long means the new schema is written but never read, delaying value delivery.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute pgroll Migrations on PostgreSQL with Full Reversibility

---

## pgroll vs Native PostgreSQL DDL

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer planning a PostgreSQL migration must decide between pgroll's automated approach and PostgreSQL's native DDL capabilities for online schema changes.

---

## Decision Criteria

* performance considerations: lock duration, table rebuild needs
* architectural considerations: PostgreSQL version, feature support
* security considerations: no direct impact
* maintainability considerations: operational complexity

---

## Decision Tree

Does the migration need to add a column with a default value?
↓
YES → Use PostgreSQL native DDL (no full table rewrite in PG 11+)
NO → Does the migration add a NOT NULL constraint?
    YES → Use PostgreSQL native NOT VALID approach (fast, no scan)
    NO → Does the migration rename or change a column type?
        YES → Use pgroll (handles renames and type changes gracefully)
        NO → Use PostgreSQL native DDL

---

## Rationale

PostgreSQL's native DDL handles many common operations without locking, especially in PG 11+ (ADD COLUMN with default no longer rewrites the table). For operations PostgreSQL handles natively, native DDL is simpler and faster. pgroll excels at operations that PostgreSQL cannot do online: column renames, type changes, and complex multi-table migrations that require application-level dual-write.

---

## Recommended Default

**Default:** Native PostgreSQL DDL for supported operations, pgroll for complex changes
**Reason:** PostgreSQL's native capabilities are underrated — many common migrations are already online. Use pgroll for the remaining cases where native DDL would lock.

---

## Risks Of Wrong Choice

Using pgroll for a simple ADD COLUMN with default adds unnecessary tooling overhead. Using native DDL for a column rename on a 100GB table causes extended write locks.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute pgroll Migrations on PostgreSQL with Full Reversibility
