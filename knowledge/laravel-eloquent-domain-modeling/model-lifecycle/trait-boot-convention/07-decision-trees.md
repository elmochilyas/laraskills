# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Trait Boot Convention
**Generated:** 2026-06-03

---

# Decision Inventory

* boot{TraitName} vs manual model boot() override
* boot{TraitName} vs initialize{TraitName} responsibility
* Trait self-configuration vs external registration

---

# Architecture-Level Decision Trees

---

## boot{TraitName} vs Manual model boot() Override

---

## Decision Context

Choosing between the automatic trait boot convention and overriding the model's `boot()` method.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the initialization logic come from a trait?
↓
YES → Use `boot{TraitName}` — Eloquent calls it automatically
NO → Is the logic for the model itself (not a reusable concern)?
    YES → Override `boot()` → the model's own boot logic
    NO → Extract to a trait with boot convention

---

## Recommended Default

**Default:** `boot{TraitName}` for trait initialization; `boot()` for model-specific logic
**Reason:** The trait boot convention is self-contained and doesn't require modifying the model's `boot()` method.

---

## Risks Of Wrong Choice

Overriding `boot()` in a trait causes conflicts when multiple traits override it. Using `boot{TraitName}` avoids this entirely.

---

## Related Rules

* Use boot{TraitName} for event/scope registration

---

## Related Skills

* Implement the Trait Boot Convention

---

## boot{TraitName} vs initialize{TraitName} Responsibility

---

## Decision Context

Choosing whether logic belongs in `boot{TraitName}` (class-level) or `initialize{TraitName}` (instance-level).

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the logic need to run once per class (registering events, adding scopes)?
↓
YES → `boot{TraitName}` — static initialization, runs once
NO → Does the logic need to run per new model instance (setting defaults)?
    YES → `initialize{TraitName}` — runs during construction
    NO → Is it a simple helper method? Don't use either — just a regular method

---

## Recommended Default

**Default:** `boot{TraitName}` for static setup; `initialize{TraitName}` for instance defaults
**Reason:** Each targets the correct lifecycle phase.

---

## Risks Of Wrong Choice

Using `boot{TraitName}` for instance defaults sets them only once per class load, meaning subsequent instances don't get the defaults. Using `initialize{TraitName}` for event registration doesn't work (runs per instance, not class load).

---

## Related Rules

* Use boot{TraitName} for event/scope registration
* Use initialize{TraitName} for default values

---

## Related Skills

* Implement the Trait Boot Convention

---

## Trait Self-Configuration vs External Registration

---

## Decision Context

Choosing whether a trait should self-configure via boot convention or rely on external registration.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the configuration always needed when the trait is used?
↓
YES → Self-configure via `boot{TraitName}` — no external setup needed
NO → Is the configuration conditional on the model's context?
    YES → Document in the trait — caller must manually register
    NO → Self-configure via boot convention

---

## Recommended Default

**Default:** Self-configure via `boot{TraitName}`
**Reason:** Using a trait should be enough to activate its functionality — no additional registration steps.

---

## Risks Of Wrong Choice

Traits that require external registration are error-prone (forgotten registration steps). Self-configuring traits that should be conditional run setup that may not always be desired.

---

## Related Rules

* Use boot{TraitName} for event/scope registration

---

## Related Skills

* Implement the Trait Boot Convention
