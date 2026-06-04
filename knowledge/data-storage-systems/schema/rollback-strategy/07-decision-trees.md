# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-25 Rollback Strategy
**Generated:** 2026-06-03

---

# Decision Inventory

* Immediate vs delayed rollback by operation type
* Additive vs destructive operation handling
* Compatibility window management

---

# Architecture-Level Decision Trees

---

## Rollback Safety Assessment

---

## Decision Context

Determining whether a migration can be safely rolled back immediately or requires a delayed compatibility window.

---

## Decision Criteria

* performance: rollback of destructive operations requires data backfill
* architectural: destructive rollbacks require code compatibility window
* maintainability: delayed rollback requires coordination with deploy process
* security: data loss from premature destructive rollback

---

## Decision Tree

Need to roll back a migration?
↓
Is it an ADDITIVE operation (CREATE TABLE, ADD COLUMN, ADD INDEX)?
YES → Rollback is SAFE immediately
    → Column/index/table is removed
    → No data loss (if table wasn't populated)
    → No code will break (nothing references the removed structure yet)
NO → Is it a DESTRUCTIVE operation (DROP TABLE, DROP COLUMN, DROP INDEX)?
    YES → CANNOT roll back immediately
        ↓
        Has all code stopped referencing the removed structure?
        YES → Wait 24-48 hours after code deploy
            → Rollback requires re-adding and re-backfilling data
        NO → Code will crash — do NOT roll back yet
NO → Is it a RENAME operation?
    → Both risky — new name code references vs old name references
    → Use expand-contract (add new, dual-write, drop old) instead

---

## Rationale

Additive operations are safe because no existing code references the new structures. Destructive operations remove structures that code may still reference. The compatibility window ensures all running code paths (including delayed queue jobs) have stopped using the removed structure.

---

## Recommended Default

**Default:** Immediate rollback for additive, 24-48 hour window for destructive
**Reason:** Additive rollbacks carry zero risk. Destructive rollbacks require assurance that all code paths have migrated away from the removed structure.

---

## Risks Of Wrong Choice

* Immediate destructive rollback: queue jobs referencing dropped columns fail
* Assuming rollback restores data: DROP TABLE rollback requires backup restore
* Partial batch rollback: if one migration's down() fails, database is in partial state

---

## Related Rules

* Use --step for per-migration rollback granularity
* Never roll back destructive operations without a compatibility window

---

## Related Skills

* Execute safe migration rollbacks
