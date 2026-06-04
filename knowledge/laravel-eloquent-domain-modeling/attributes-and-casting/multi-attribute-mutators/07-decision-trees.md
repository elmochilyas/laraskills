# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Multi-Attribute Mutators
**Generated:** 2026-06-03

---

# Decision Inventory

* Single vs multi-attribute mutator
* Array return vs side-effect assignment
* Mutator vs explicit model method

---

# Architecture-Level Decision Trees

---

## Single vs Multi-Attribute Mutator

---

## Decision Context

Choosing whether a mutator should update one column or multiple columns when a single property is assigned.

---

## Decision Criteria

* maintainability
* architectural
* reliability

---

## Decision Tree

Does assigning one logical value require updating multiple columns?
↓
YES → Are the columns on the same model?
    YES → Multi-attribute mutator (return array)
    NO → Use model events or explicit action class
NO → Single-attribute mutator (return scalar)

---

## Rationale

Multi-attribute mutators keep coupled column updates atomic and consistent when the columns belong to the same model. If columns span models, the implicit coupling is too hidden — use events or explicit service/action classes instead.

---

## Recommended Default

**Default:** Single-attribute mutator
**Reason:** Multi-attribute mutators introduce implicit behavior that can surprise developers; only use when the attribute-column relationship is genuinely coupled (e.g., password + password_changed_at).

---

## Risks Of Wrong Choice

Using a single mutator for coupled columns risks stale or inconsistent data (e.g., updating password without resetting password_changed_at). Using multi-attribute across models creates invisible side effects that violate the principle of least surprise.

---

## Related Rules

* Document multi-attribute relationships in code comments
* Return explicit key-value arrays from set closures
* Ensure array keys correspond to fillable attributes

---

## Related Skills

* Define a Multi-Attribute Mutator for Coupled Columns

---

## Array Return vs Side-Effect Assignment

---

## Decision Context

Choosing between returning an associative array from the set closure or using `$this->attribute = value` inside it to update multiple columns.

---

## Decision Criteria

* maintainability
* framework usage

---

## Decision Tree

How should the mutator update multiple columns?
↓
Return an associative array from the set closure?
YES → Correct approach — Eloquent handles multi-attribute updates
NO → Using `$this->attribute = value` inside the closure?
    YES → WRONG — circumvents Eloquent's attribute handling, risks inconsistent state
    NO → Return a scalar — only updates the primary attribute

---

## Rationale

The array return contract is the documented mechanism. Internal assignments bypass Eloquent's dirty tracking, change detection, and event system, leading to subtle bugs where not all intended columns are persisted.

---

## Recommended Default

**Default:** Return associative array from set closure
**Reason:** It's the documented, supported mechanism and ensures all columns are tracked correctly.

---

## Risks Of Wrong Choice

Silent data loss — columns set via `$this->attribute =` inside a closure may not be persisted, or may cause infinite loops if the setter re-triggers the mutator.

---

## Related Rules

* Return explicit key-value arrays from multi-attribute set closures

---

## Related Skills

* Define a Multi-Attribute Mutator for Coupled Columns

---

## Mutator vs Explicit Model Method

---

## Decision Context

Choosing between a multi-attribute mutator and an explicit model method like `changePassword()` for operations that update multiple columns.

---

## Decision Criteria

* maintainability
* architectural
* security

---

## Decision Tree

Does the operation involve business validation, authorization, or side effects?
↓
YES → Use explicit model method (e.g., `$user->changePassword(...)`)
NO → Is it a simple mapping of one logical value to multiple columns?
    YES → Multi-attribute mutator is appropriate
    NO → Use explicit model method

---

## Rationale

Multi-attribute mutators are a mapping convenience — they handle format transformations (hashing, timestamping). When logic like "current password must match", "new password meets policy", or "send notification" is needed, an explicit method provides a clear, testable, discoverable API.

---

## Recommended Default

**Default:** Explicit model method for business logic; multi-attribute mutator for simple mapping
**Reason:** Mutators are transparent (they run on property assignment). Business logic should be explicit and callable.

---

## Risks Of Wrong Choice

Hidden business logic in mutators leads to untestable code, unexpected behavior during mass-assignment, and difficulty tracing why a simple property set triggers complex operations.

---

## Related Rules

* Do not use multi-attribute mutators as business logic substitutes

---

## Related Skills

* Define a Multi-Attribute Mutator for Coupled Columns
