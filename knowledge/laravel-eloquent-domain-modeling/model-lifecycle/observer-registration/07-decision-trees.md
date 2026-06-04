# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Observer Registration
**Generated:** 2026-06-03

---

# Decision Inventory

* #[ObservedBy] vs Model::observe() registration
* Conditional observer registration
* Registration grouping

---

# Architecture-Level Decision Trees

---

## #[ObservedBy] vs Model::observe() Registration

---

## Decision Context

Choosing between PHP 8 attribute and programmatic `observe()` call for observer registration.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the observer registration unconditional (always applies)?
↓
YES → Use `#[ObservedBy(Observer::class)]` — declarative, visible on model
NO → Does registration depend on runtime conditions (env, config)?
    YES → Use `Model::observe()` in service provider — supports conditionals
    NO → `#[ObservedBy]` is preferred

---

## Recommended Default

**Default:** `#[ObservedBy]` attribute
**Reason:** Colocated with the model, discoverable, declarative.

---

## Risks Of Wrong Choice

Using `observe()` in a service provider for unconditional registration scatters configuration and makes it harder to see which observers are attached to which models.

---

## Related Rules

* Prefer #[ObservedBy] over observe() calls

---

## Related Skills

* Register Model Observers with #[ObservedBy]

---

## Conditional Observer Registration

---

## Decision Context

Registering observers only when certain conditions are met.

---

## Decision Criteria

* architectural

---

## Decision Tree

Does the observer only apply in certain environments or configurations?
↓
YES → Use `Model::observe(Observer::class)` in a service provider's `boot()` method
NO → Is the registration based on feature flags?
    YES → `Model::observe()` with condition check
    NO → `#[ObservedBy]` is sufficient

---

## Recommended Default

**Default:** `Model::observe()` in service provider for conditional registration
**Reason:** `#[ObservedBy]` cannot be conditionally applied; `observe()` supports any condition.

---

## Risks Of Wrong Choice

Using `#[ObservedBy]` for observers that should only apply in certain environments causes unintended side effects.

---

## Related Rules

* Use observe() for conditional registration

---

## Related Skills

* Register Model Observers with #[ObservedBy]

---

## Registration Grouping

---

## Decision Context

Organizing `Model::observe()` calls when conditional registration is needed.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are there multiple `observe()` calls for conditional observers?
↓
YES → Group them in a dedicated service provider (`ObserverServiceProvider`) — one place to look
NO → Single observer? Keep the `observe()` call in `AppServiceProvider`

---

## Recommended Default

**Default:** Group conditional observer registrations in a dedicated service provider
**Reason:** Centralized location for discovery; keeps `AppServiceProvider` focused on other boot logic.

---

## Risks Of Wrong Choice

Scattering `observe()` calls across multiple service providers makes it hard to find which observers are registered for which models.

---

## Related Rules

* Group observe() calls in one place for maintainability

---

## Related Skills

* Register Model Observers with #[ObservedBy]
