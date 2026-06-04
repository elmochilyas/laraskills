# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-13 Destructive Operations
**Generated:** 2026-06-03

---

# Decision Inventory

* Deprecated Suffix vs Direct DROP for Column Removal
* DROP vs Archive (RENAME to _old) for Table Removal
* Immediate DROP vs Phased DROP via Expand-Contract

---

# Architecture-Level Decision Trees

---

## Deprecated Suffix vs Direct DROP for Column Removal

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer removing a column must decide whether to rename it with a deprecated suffix first or drop it directly.

---

## Decision Criteria

* performance considerations: additional migration steps
* architectural considerations: code reference uncertainty, application coverage
* security considerations: data loss prevention (primary concern)
* maintainability considerations: waiting period, cleanup

---

## Decision Tree

Are you certain no code path references this column?
↓
YES → Use direct DROP (faster, but only if 100% certain)
NO → Use deprecated suffix rename first, wait 1-2 weeks, then DROP

---

## Rationale

The deprecated suffix approach is the safety net for uncertainty. Renaming `status` to `status_deprecated` immediately breaks any code that still references the old name — the errors tell you exactly which code paths need updating. After 1-2 weeks with zero errors, the DROP is safe. Direct DROP is acceptable only when you have exhaustive reference tracking (static analysis, runtime monitoring) proving zero references.

---

## Recommended Default

**Default:** Deprecated suffix + wait period
**Reason:** The cost of accidentally dropping a column that's still in use is permanent data loss. A 1-2 week deprecated suffix period is cheap insurance. Direct DROP is a risk that rarely pays off.

---

## Risks Of Wrong Choice

Direct DROP of a column still referenced by a queue job or cron task causes application errors and permanent data loss. Deprecated suffix rename on every removal slows down schema cleanup.

---

## Related Rules

Never destroy data without a backup. Use deprecated suffix + wait period before DROP.

---

## Related Skills

Execute Destructive Schema Operations Safely

---

## DROP vs Archive (RENAME to _old) for Table Removal

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer removing a table must decide between dropping it immediately or archiving it first with a rename.

---

## Decision Criteria

* performance considerations: storage space reclamation
* architectural considerations: recovery window, queryability
* security considerations: data retention requirements
* maintainability considerations: cleanup scheduling, disk monitoring

---

## Decision Tree

Is disk space critically low and the table large?
↓
YES → DROP directly (reclaim space immediately, accept risk)
NO → RENAME to `_archive` first, wait 30 days, then DROP

---

## Rationale

The archive approach renames the table to `orders_archive` instead of dropping it. This provides a 30-day safety net: if any code path still references the table, you can rename it back without data loss. The archive table is still queryable for investigations. Only skip the archive period when disk space is urgently needed and you have a verified backup.

---

## Recommended Default

**Default:** RENAME to _archive, wait 30 days, then DROP
**Reason:** Archive tables are cheap insurance. They consume disk space but provide a recovery window and remain queryable. The 30-day period covers most deployment cycles and catch missed references.

---

## Risks Of Wrong Choice

Direct DROP of a still-referenced table causes application crashes and requires backup restore. Archive on a disk-full server may fail if there isn't space for the renamed table.

---

## Related Rules

Never destroy data without a backup. Verify zero code references before removal.

---

## Related Skills

Execute Destructive Schema Operations Safely

---

## Immediate DROP vs Phased DROP via Expand-Contract

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer removing a schema element must decide whether to drop it in a single migration or use the full expand-contract pattern over multiple deploys.

---

## Decision Criteria

* performance considerations: deployment overhead, time to completion
* architectural considerations: risk tolerance, rollback capability
* security considerations: data preservation
* maintainability considerations: deploy coordination

---

## Decision Tree

Is the column/table still referenced in application code (even legacy code)?
↓
YES → Use expand-contract (phased: stop writing → wait → DROP)
NO → Use direct DROP with deprecated suffix (safe if no references)

---

## Rationale

The expand-contract pattern for removal is: Phase 1 — stop writing to the old structure but keep reading from it; Phase 2 — verify reads are also gone; Phase 3 — DROP. This is the safest approach for active columns/tables. Direct DROP with deprecated suffix is suitable when the structure is already known to be unused by code.

---

## Recommended Default

**Default:** Phased DROP via expand-contract for active columns, deprecated suffix for known-unused
**Reason:** The expand-contract approach provides rollback at every phase and is worth the extra deploys for structures that might still be in use. For proven-unused structures, the deprecated suffix approach is sufficient.

---

## Risks Of Wrong Choice

Immediate DROP of an active column loses production data. Full expand-contract for a known-unused column wastes deploy cycles unnecessarily.

---

## Related Rules

Never destroy data without a backup. Use deprecated suffix + wait period before DROP.

---

## Related Skills

Execute Destructive Schema Operations Safely
