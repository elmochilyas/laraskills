# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Attribute Registration
**Generated:** 2026-06-03

---

# Decision Inventory

* Attribute vs boot() registration
* Multiple attributes stacking strategy
* Conditional registration approach

---

# Architecture-Level Decision Trees

---

## Attribute vs boot() Registration

---

## Decision Context

Choosing between PHP 8 attributes and manual `boot()` / service provider registration for observers, scopes, collections, and builders.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the registration depend on runtime conditions (env, auth, feature flags)?
↓
YES → Use `boot()` / service provider — supports conditional logic
NO → Use PHP 8 attributes — more discoverable, declarative, colocated

---

## Recommended Default

**Default:** PHP 8 attributes (`#[ObservedBy]`, `#[ScopedBy]`, `#[CollectedBy]`, `#[UseEloquentBuilder]`)
**Reason:** Colocated with the model, declarative, and eliminates scattered registration in service providers.

---

## Risks Of Wrong Choice

Using attributes for conditional registrations fails silently (attribute always fires). Using boot() for unconditional registration scatters configuration and reduces discoverability.

---

## Related Rules

* Prefer Attributes Over Boot Method Registration

---

## Related Skills

* Register Model Observers with #[ObservedBy]

---

## Multiple Attributes Stacking Strategy

---

## Decision Context

Deciding how to register multiple observers or scopes on a single model.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are there multiple registrations of the same type (e.g., 2+ observers)?
↓
YES → Stack separate attributes — `#[ObservedBy(A)] #[ObservedBy(B)]`
NO → Single attribute is sufficient

---

## Recommended Default

**Default:** Separate stacked attributes per registration
**Reason:** Each is independently readable, testable, and removable.

---

## Risks Of Wrong Choice

Combining multiple registrations into a single attribute with an array is non-standard and may not be supported by tooling.

---

## Related Rules

* Stack Multiple Attributes for Multiple Registrations

---

## Related Skills

* Register Model Observers with #[ObservedBy]

---

## Conditional Registration Approach

---

## Decision Context

Handling observer/scope registration that should only apply under certain runtime conditions.

---

## Decision Criteria

* architectural

---

## Decision Tree

Does the registration need environment detection, feature flags, or user context?
↓
YES → Use `boot()` method in model or service provider — supports runtime conditions
NO → Use attributes — simpler, declarative

---

## Recommended Default

**Default:** Attributes for unconditional registration; boot() for conditional
**Reason:** Each tool fits its use case — attributes for always-on, boot() for dynamic.

---

## Risks Of Wrong Choice

Using attributes for conditional registrations provides no way to skip registration. Using boot() for always-on registrations scatters configuration.

---

## Related Rules

* Prefer Attributes Over Boot Method Registration

---

## Related Skills

* Register Model Observers with #[ObservedBy]
