# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-10 Verification During Migrations
**Generated:** 2026-06-03

---

# Decision Inventory

* Full Verification vs Sample Verification
* Automated vs Manual Verification
* Verification Timing: Before vs After Traffic Switch

---

# Architecture-Level Decision Trees

---

## Full Verification vs Sample Verification

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer verifying a migration must decide between checking all rows (full count + checksum) or only a sample.

---

## Decision Criteria

* performance considerations: read load from verification queries
* architectural considerations: table size, verification window
* security considerations: data exposure from verification output
* maintainability considerations: script complexity, run time

---

## Decision Tree

Is the table small enough (< 1M rows) for a full checksum scan?
↓
YES → Run full verification (row count + checksum + sample)
NO → Run row count (index-only, fast) + sample comparison (1000 random rows)

---

## Rationale

Full checksum verification on a large table reads every row and can take significant time and IO. Row count verification is fast (index-only scan) and catches missing rows. Sample comparison catches data corruption in a representative subset. Together, row count + sample provide high confidence without the IO cost of a full checksum. For smaller tables, full checksum is feasible and provides complete coverage.

---

## Recommended Default

**Default:** Full row count + sample comparison for large tables, full checksum for small tables
**Reason:** Row count + sample balances thoroughness with production impact. Full checksum is the gold standard but is only practical for tables under 1M rows.

---

## Risks Of Wrong Choice

Full checksum on a 100M row table adds significant load during a critical window. Sample-only verification misses corruption in unsampled rows.

---

## Related Rules

Always verify before switching traffic. Include content checks, not just row counts.

---

## Related Skills

Verify Data Integrity After Schema Migrations

---

## Automated vs Manual Verification

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer designing the migration pipeline must decide between automated verification (CI/CD) and manual verification (runbook steps).

---

## Decision Criteria

* performance considerations: verification execution time in pipeline
* architectural considerations: CI/CD integration, database access from CI
* security considerations: credential management, audit trail
* maintainability considerations: script maintenance, failure handling

---

## Decision Tree

Is this a standard migration executed through CI/CD?
↓
YES → Use automated verification (part of deployment pipeline)
NO → Is this an emergency hotfix bypassing normal CI/CD?
    YES → Use manual verification (runbook with documented steps)
    NO → Use automated verification

---

## Rationale

Automated verification runs as part of the deployment pipeline, ensuring every migration passes integrity checks before traffic is switched. Manual verification is error-prone and often skipped under pressure. Reserve manual verification for emergency hotfixes where CI/CD was bypassed. Even then, the manual steps should be documented in a runbook.

---

## Recommended Default

**Default:** Automated verification in CI/CD
**Reason:** Automated verification catches issues every time without relying on human discipline. It provides a consistent, auditable check that scales across all migrations.

---

## Risks Of Wrong Choice

Manual-only verification is frequently skipped, delayed, or performed incorrectly under deployment pressure. Automated verification that is too slow may be disabled by teams.

---

## Related Rules

Always verify before switching traffic. Automate verification in CI/CD.

---

## Related Skills

Verify Data Integrity After Schema Migrations

---

## Verification Timing: Before vs After Traffic Switch

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer managing an expand-contract migration must decide when to run verification relative to switching production traffic.

---

## Decision Criteria

* performance considerations: dual-write data consistency window
* architectural considerations: verification runtime, deployment pipeline
* security considerations: data integrity guarantee
* maintainability considerations: rollback complexity

---

## Decision Tree

Is the migration adding a new structure (expand phase)?
↓
YES → Verify BEFORE switching traffic (backfill must be complete and correct)
NO → Is the migration removing an old structure (contract phase)?
    YES → Verify BEFORE contract (verify old structure is no longer needed)
    NO → Verify before switching traffic

---

## Rationale

Verification must always happen before the traffic switch (expand→switch transition) and before the destructive phase (contract). Verification after the switch catches issues too late — data may already be served incorrectly. The verification step is the gate that prevents serving corrupt data. In the expand-contract pattern, verification between backfill completion and read-switch is the critical safety checkpoint.

---

## Recommended Default

**Default:** Verify before switching traffic, never after
**Reason:** Verification after switching is not verification — it's damage detection. The purpose of verification is to prevent serving incorrect data, not to discover it was incorrect.

---

## Risks Of Wrong Choice

Verifying after traffic switch means corrupt data is already served to users. Skipping verification entirely risks permanent data loss when the old structure is dropped.

---

## Related Rules

Always verify before switching traffic. Include content checks, not just row counts.

---

## Related Skills

Verify Data Integrity After Schema Migrations
