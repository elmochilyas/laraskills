# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Initialize Trait Convention
**Generated:** 2026-06-03

---

# Decision Inventory

* initialize{TraitName} vs boot{TraitName} for defaults
* Heavy vs lightweight initialization logic
* Cast registration in initialize methods

---

# Architecture-Level Decision Trees

---

## initialize{TraitName} vs boot{TraitName} for Defaults

---

## Decision Context

Choosing between `initialize{TraitName}` (per-instance) and `boot{TraitName}` (per-class) for setting default values.

---

## Decision Criteria

* reliability

---

## Decision Tree

Should the default be set on every new model instance?
↓
YES → Use `initialize{TraitName}` — runs per instance during construction
NO → Is the default set once and shared across all instances?
    YES → Use `boot{TraitName}` — runs once per class
    NO → `initialize{TraitName}` is correct for per-instance defaults

---

## Recommended Default

**Default:** `initialize{TraitName}` for per-instance default values
**Reason:** Defaults like `deleted_at = null`, `status = 'pending'` must be set on every new instance, not once per class.

---

## Risks Of Wrong Choice

Using `boot{TraitName}` for defaults sets them once per class load, meaning subsequently constructed instances won't have the default values.

---

## Related Rules

* Use initialize{TraitName} for attribute defaults

---

## Related Skills

* Implement the Initialize Trait Convention

---

## Heavy vs Lightweight Initialization Logic

---

## Decision Context

Determining what operations are appropriate inside `initialize{TraitName}`.

---

## Decision Criteria

* performance

---

## Decision Tree

Does the initialization involve database queries, external API calls, or heavy computation?
↓
YES → WRONG — `initialize{TraitName}` runs on every construction; defer to lazy loading or `creating` event
NO → Is it simple property assignment or cast registration?
    YES → Appropriate for `initialize{TraitName}` — fast and lightweight
    NO → Keep it lightweight — simple assignments only

---

## Recommended Default

**Default:** Only simple property assignments and cast registrations in `initialize{TraitName}`
**Reason:** Initialize runs on every model instantiation — heavy logic slows down every `new Model()` or `Model::find()`.

---

## Risks Of Wrong Choice

Database queries in `initialize{TraitName}` cause N+1 problems on every model access (listing, finding, creating).

---

## Related Rules

* Don't perform heavy operations in initialize

---

## Related Skills

* Implement the Initialize Trait Convention

---

## Cast Registration in Initialize Methods

---

## Decision Context

Registering trait-managed column casts in `initialize{TraitName}`.

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the model already define a cast for this attribute?
↓
YES → Check `isset()` before adding — don't override explicit model casts
NO → Add the cast in `initialize{TraitName}` — ensures consistent casting

---

## Recommended Default

**Default:** Register trait column casts in `initialize{TraitName}` with `isset()` guard
**Reason:** Ensures the trait's columns are properly cast without overriding explicit model definitions.

---

## Risks Of Wrong Choice

Not registering casts in the initialize method means trait columns may not be cast correctly. Overriding explicit model casts (without `isset()` check) silently changes behavior defined on the model.

---

## Related Rules

* Check isset() before modifying casts

---

## Related Skills

* Implement the Initialize Trait Convention
