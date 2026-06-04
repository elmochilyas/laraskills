# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Trait Decomposition
**Generated:** 2026-06-03

---

# Decision Inventory

* Trait vs observer for cross-cutting concerns
* boot{TraitName} vs initialize{TraitName} usage
* Trait naming convention

---

# Architecture-Level Decision Trees

---

## Trait vs Observer for Cross-Cutting Concerns

---

## Decision Context

Choosing between a PHP trait and a dedicated observer class for cross-cutting model behavior.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the behavior add instance-level capabilities (attributes, methods) to the model?
↓
YES → Use trait — adds properties and methods directly to the model
NO → Does the behavior only react to model events (created, saved)?
    YES → Use observer — separates event handling from model definition
    NO → Does the behavior need model constructor hooks (initialize)?
        YES → Use trait — observer cannot hook into construction
        NO → Observer is likely sufficient

---

## Recommended Default

**Default:** Observer for event-only behavior; trait when the model needs added capabilities
**Reason:** Observers are single-responsibility; traits are needed when the model itself must be extended.

---

## Risks Of Wrong Choice

Traits for event-only behavior use a heavyweight mechanism (trait inclusion) for a lightweight need (event hook). Observers that need instance-level state force workarounds.

---

## Related Rules

* Use boot{TraitName} for event and scope registration
* Use initialize{TraitName} for default attribute values

---

## Related Skills

* Decompose Cross-Cutting Concerns with Traits

---

## boot{TraitName} vs initialize{TraitName} Usage

---

## Decision Context

Choosing between `boot{TraitName}()` (class-level, runs once) and `initialize{TraitName}()` (instance-level, runs per new instance).

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the logic need to run once per class (registering events, scopes)?
↓
YES → `boot{TraitName}()` — runs once at class load time
NO → Does the logic need to run per new instance (setting defaults)?
    YES → `initialize{TraitName}()` — runs on every new model instance
    NO → Is the logic already handled by model events?
        YES → Use `boot{TraitName}()` to register event listeners
        NO → Determine the correct hook

---

## Recommended Default

**Default:** `boot{TraitName}()` for class-level setup; `initialize{TraitName}()` for instance defaults
**Reason:** Each hook has a specific purpose; using the wrong one causes incorrect behavior.

---

## Risks Of Wrong Choice

Using `boot{TraitName}()` for instance defaults sets them only once per class load, not per instance. Using `initialize{TraitName}()` for event registration doesn't work (runs per instance, not at class load).

---

## Related Rules

* Use boot{TraitName} for event and scope registration
* Use initialize{TraitName} for default attribute values

---

## Related Skills

* Decompose Cross-Cutting Concerns with Traits

---

## Trait Naming Convention

---

## Decision Context

Choosing an appropriate naming convention for model traits.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the trait add capabilities to the model?
↓
YES → Prefix with `Has` (HasRoles), `InteractsWith` (InteractsWithMedia), or `Is` (IsOwnedByTeam)
NO → Is the trait a base type definition?
    YES → Consider if a base class or interface is more appropriate
    NO → Use capability-prefix naming

---

## Recommended Default

**Default:** `Has*` / `InteractsWith*` / `Is*` prefix convention
**Reason:** Immediately signals that the trait adds capabilities, following Laravel and package conventions.

---

## Risks Of Wrong Choice

Non-prefixed trait names make it unclear what the trait does without reading its body. Inconsistent naming confuses developers.

---

## Related Rules

* Name traits with Has, InteractsWith, or Is prefixes

---

## Related Skills

* Decompose Cross-Cutting Concerns with Traits
