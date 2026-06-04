# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Model Configuration Properties
**Generated:** 2026-06-03

---

# Decision Inventory

* Explicit property vs convention-based default
* $casts property vs casts() method
* $with usage decision

---

# Architecture-Level Decision Trees

---

## Explicit Property vs Convention-Based Default

---

## Decision Context

Deciding whether to explicitly set a configuration property or rely on Laravel's convention.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the convention match your schema exactly?
↓
YES → Do NOT set the property — rely on convention (less code)
NO → Set the property explicitly — override the convention
NO → Is the model shared across multiple environments with different conventions?
    YES → Set explicitly for clarity
    NO → Rely on convention

---

## Recommended Default

**Default:** Rely on Laravel conventions; only override when they don't match
**Reason:** Less code, fewer maintenance points, faster onboarding for Laravel developers.

---

## Risks Of Wrong Choice

Setting properties to their default values is noise. Not setting overrides when conventions don't match causes silent misbehavior (wrong table, wrong PK).

---

## Related Rules

* Set only what differs from defaults

---

## Related Skills

* Configure Eloquent Model Properties

---

## $casts Property vs casts() Method

---

## Decision Context

Choosing between the `$casts` property and the `casts()` method for defining attribute casts.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are you using Laravel 11+?
↓
YES → Use `casts()` method — supports runtime conditions and inheritance
NO → Use `$casts` property — the only option in older Laravel versions

---

## Recommended Default

**Default:** `casts()` method in Laravel 11+
**Reason:** More flexible (runtime conditions, inheritance), consistent with modern Laravel patterns.

---

## Risks Of Wrong Choice

Using `$casts` property in Laravel 11+ loses flexibility for runtime cast conditions and inheritance.

---

## Related Rules

* Use casts() method over $casts property

---

## Related Skills

* Configure Eloquent Model Properties

---

## $with Usage Decision

---

## Decision Context

Choosing whether to use `$with` for automatic eager loading.

---

## Decision Criteria

* performance

---

## Decision Tree

Is the relationship needed on EVERY query (including listing, index, admin views)?
↓
YES → Consider `$with` — but justify the decision; it adds query cost to ALL queries
NO → Is the relationship needed on most queries?
    YES → Is the relationship universally required for the model to function?
        NO → Do NOT use `$with` — eager load explicitly per query
        YES → Document the justification
    NO → Explicit eager loading is always preferred

---

## Recommended Default

**Default:** Explicit eager loading via `with()` — never use `$with`
**Reason:** `$with` eagerly loads on every query, including count/list operations where the relation may not be needed. Explicit loading is predictable and testable.

---

## Risks Of Wrong Choice

Using `$with` causes unnecessary JOINs on every query, slowing down list endpoints and increasing memory usage.

---

## Related Rules

* Avoid $with — eager load explicitly per query

---

## Related Skills

* Configure Eloquent Model Properties
