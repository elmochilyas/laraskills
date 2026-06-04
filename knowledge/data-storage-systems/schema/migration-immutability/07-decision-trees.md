# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-20 Migration Immutability
**Generated:** 2026-06-03

---

# Decision Inventory

* Edit deployed migration vs create corrective migration
* Local rollback + edit vs new migration
* Team coordination for migration changes

---

# Architecture-Level Decision Trees

---

## Handling Migration Errors After Deployment

---

## Decision Context

Choosing the correct approach when a deployed migration contains an error that needs correction.

---

## Decision Criteria

* performance: no direct impact
* architectural: immutability is a fundamental constraint of the migration system
* maintainability: corrective migrations add file count but preserve audit trail
* security: edited migrations can silently bypass security constraints

---

## Decision Tree

Migration contains an error after deployment?
↓
Has the migration been deployed to ANY shared environment?
YES → The migration is IMMUTABLE — never edit
    ↓
    Is the error in up() (schema not applied as intended)?
    YES → Create a new corrective migration
        → php artisan make:migration fix_[description]
        → Explicitly correct the schema state
    NO → Is the error in down() (rollback path broken)?
        → Create a corrective migration with a functioning down()
        → The original down() will fail on rollback — document this
NO → Is the migration only on local/unpushed branch?
    YES → Rollback, edit, re-run (safe)
    → Once pushed = immutable

---

## Rationale

The migrations table tracks filenames, not file content. Editing a deployed migration is silently ignored — Laravel sees the filename as "already run" and skips it. Only corrective migrations actually execute. Local, unpushed migrations are the only exception.

---

## Recommended Default

**Default:** Always create a new migration to correct deployed errors
**Reason:** Guarantees the correction is actually executed. Preserves the audit trail of what was changed and why.

---

## Risks Of Wrong Choice

* Editing a deployed migration: change is silently ignored — developer thinks fix is applied but it isn't
* Editing down() only: rollback uses the edited down() which may not match the original up()
* Environment drift: different environments have different migration states

---

## Related Rules

* Never edit a deployed migration
* Always create a new migration for corrections

---

## Related Skills

* Correct migration errors with new migrations
