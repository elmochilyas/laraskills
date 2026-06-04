# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Eloquent ORM / Query Builder
**Knowledge Unit:** 2-24 Replicate / Fill / ForceFill
**Generated:** 2026-06-03

---

# Decision Inventory

* replicate vs manual clone
* fill vs forceFill vs forceCreate
* Mass-assignment safety vs convenience

---

# Architecture-Level Decision Trees

---

## Choosing Model Population Method

---

## Decision Context

Selecting the correct method to populate or duplicate model attributes while respecting mass-assignment protection.

---

## Decision Criteria

* performance: negligible difference
* architectural: mass-assignment protection boundary
* maintainability: forceFill bypasses guardrails
* security: forceFill with user input is a vulnerability

---

## Decision Tree

Need to populate a model with data?
↓
Is this a duplication of an existing record?
YES → Use replicate()
    ↓
    Need to exclude certain attributes (timestamps, relations)?
    YES → replicate(['timestamps', 'relation_count'])
    NO → replicate()
NO → Is the data source user-provided (request input)?
    YES → Is the attribute in $fillable?
        YES → Use fill() or create()
        NO → Do NOT use forceFill — add to $fillable or handle explicitly
    NO → Is the data from a trusted internal source (admin, system)?
        YES → Use forceFill() for convenience, but still prefer fill()
        NO → Use fill() with explicit $fillable configuration

---

## Rationale

replicate creates a clean copy without side effects on the original. fill enforces the mass-assignment boundary defined by $fillable. forceFill bypasses this boundary and should be reserved for trusted internal operations only.

---

## Recommended Default

**Default:** fill() for mass-assignment, replicate() for duplication
**Reason:** fill() respects $fillable guardrails. replicate() creates copies without affecting the original record.

---

## Risks Of Wrong Choice

* forceFill with user input: mass-assignment vulnerability, any model attribute can be set
* replicate doesn't copy relationships: related records must be replicated separately
* Omitting timestamps in replicate: duplicate records get original timestamps

---

## Related Rules

* Never use forceFill with user-supplied data
* Always define $fillable for user-facing models

---

## Related Skills

* Duplicate models with replicate
* Mass-assign attributes safely with fill
