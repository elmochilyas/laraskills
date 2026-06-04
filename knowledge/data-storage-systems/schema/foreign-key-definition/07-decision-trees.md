# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-4 Foreign Key Definition
**Generated:** 2026-06-03

---

# Decision Inventory

* Referential action: CASCADE vs RESTRICT vs SET NULL
* constrained() helper vs manual FK definition
* FK index requirements

---

# Architecture-Level Decision Trees

---

## Referential Action Selection

---

## Decision Context

Choosing the correct referential action (onDelete/onUpdate) based on the relationship semantics and data integrity requirements.

---

## Decision Criteria

* performance: CASCADE operations are transactional — cascading deletes are not free
* architectural: action determines data lifecycle on parent deletion
* maintainability: CASCADE can hide data loss; RESTRICT can block legitimate operations
* security: financial/compliance data must never use CASCADE

---

## Decision Tree

Defining a foreign key constraint?
↓
Is the child record OWNED by the parent (e.g., post → comments)?
YES → Use CASCADE
    ↓
    Is this financial, audit, or compliance data?
    YES → Use RESTRICT (never auto-delete financial records)
    NO → CASCADE is appropriate (orphan cleanup)
NO → Is the relationship optional (child can exist without parent)?
    YES → Use SET NULL
        ↓
        Is the FK column nullable?
        YES → SET NULL is safe
        NO → Make column nullable first, then SET NULL
    NO → Is the relationship mandatory?
        → Use RESTRICT (block parent deletion if children exist)
        → Or CASCADE if business logic requires it

---

## Rationale

CASCADE is correct for ownership relationships but dangerous for financial/compliance data. RESTRICT prevents accidental data loss but may cause application errors if deletion isn't handled. SET NULL preserves child records when the parent is removed but creates nullable FK accumulation.

---

## Recommended Default

**Default:** CASCADE for owned relationships, RESTRICT for financial data
**Reason:** CASCADE prevents orphaned records. RESTRICT prevents accidental data deletion in regulated contexts.

---

## Risks Of Wrong Choice

* CASCADE on financial data: accidental mass deletion of transaction records
* Missing index on FK column: every FK check triggers a full table scan
* unsigned mismatch: FK constraint fails at migration time if types don't match

---

## Related Rules

* Always use constrained() instead of manual FK definitions
* Never cascade on financial or compliance data

---

## Related Skills

* Define foreign key constraints with constrained() helper
