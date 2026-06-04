# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** BelongsToMany Factories
**Generated:** 2026-06-03

---

# Decision Inventory

* Pivot attribute assignment (array vs closure)
* Factory vs existing instances for related models
* hasAttached() vs manual pivot insert

---

# Architecture-Level Decision Trees

---

## Pivot Attribute Assignment

---

## Decision Context

Choosing between a plain array and a closure for pivot attribute values in `hasAttached()`.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are pivot attribute values identical for every attachment?
↓
YES → Use plain array as second argument to `hasAttached()`
NO → Do pivot values vary per attachment (e.g., different team_id per role)?
    YES → Use closure — receives the related model, returns varying values
    NO → Plain array is sufficient

---

## Recommended Default

**Default:** Plain array for uniform pivot values
**Reason:** Simpler, more readable. Only use closure when values vary per attachment.

---

## Risks Of Wrong Choice

Using closure for uniform values adds unnecessary complexity. Using array for varying values assigns the same value to every pivot row.

---

## Related Rules

* Use Closures for Varying Pivot Attributes

---

## Related Skills

* Set Up BelongsToMany Factory Relationship with hasAttached()

---

## Factory vs Existing Instances

---

## Decision Context

Choosing between creating related models via factory or reusing existing model instances in `hasAttached()`.

---

## Decision Criteria

* performance

---

## Decision Tree

Are the related models a known reference dataset (e.g., roles, permissions)?
↓
YES → Pass existing instances — no unnecessary creation
NO → Does each parent need a unique set of related models?
    YES → Use factory — creates fresh related models per parent
    NO → Use existing instances — reuse reference data

---

## Recommended Default

**Default:** Factory for dynamic test data; existing instances for reference data
**Reason:** Reference data doesn't need to be recreated; factory for unique data ensures completeness.

---

## Risks Of Wrong Choice

Using factories for reference data creates duplicate reference records on every test run. Using existing instances for unique data makes tests dependent on shared state.

---

## Related Rules

* Pass Existing Models for Known Reference Datasets

---

## Related Skills

* Set Up BelongsToMany Factory Relationship with hasAttached()

---

## hasAttached() vs Manual Pivot Insert

---

## Decision Context

Choosing between the `hasAttached()` factory method and manually inserting pivot table rows.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the relationship a standard BelongsToMany with a pivot table?
↓
YES → Use `hasAttached()` — handles foreign key resolution automatically
NO → Are you handling non-standard pivot setup?
    YES → Manual pivot insert may be necessary — document why
    NO → Use `hasAttached()` — always prefer the factory method

---

## Recommended Default

**Default:** `hasAttached()` for all BelongsToMany factory relationships
**Reason:** Automatic FK resolution, pivot attribute support, and clean fluent API.

---

## Risks Of Wrong Choice

Manual pivot inserts bypass factory conventions, create maintenance burden when schemas change, and require manual FK management.

---

## Related Rules

* Use hasAttached() for All BelongsToMany Factory Relationships

---

## Related Skills

* Set Up BelongsToMany Factory Relationship with hasAttached()
