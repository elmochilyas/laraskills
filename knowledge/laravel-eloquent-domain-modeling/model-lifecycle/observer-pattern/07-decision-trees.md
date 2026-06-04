## Observer vs Closure vs Domain Event

Choosing between an observer class, a closure in `booted()`, and a domain event for lifecycle reactions.

---

## Decision Context

When reacting to model lifecycle events, you must decide whether to create an observer class, use a closure, or dispatch a domain event.

---

## Decision Criteria

* number of lifecycle methods needed (1 = closure, 2+ = observer)
* whether the logic is infrastructure (cache, audit) or business (domain event)
* reusability across models
* testability requirements

---

## Decision Tree

Need to react to a model lifecycle event?

↓

Is the logic a single, simple reaction?

YES → Use a closure in `booted()` (simpler than a full observer class)

NO → Do you need 2+ lifecycle methods?

    YES → Use an Observer class

        Is the reaction infrastructure concern (cache, audit, sync)?

        YES → Observer is appropriate

        NO → Is the reaction business logic (state transition, validation)?

            YES → Consider Domain Event instead (decoupled from Eloquent)

---

## Rationale

Observers group related lifecycle reactions. Closures are for single-event reactions. Domain events decouple business logic from Eloquent lifecycle, making it testable without model hydration. Observers handle infrastructure; domain events handle business reactions.

---

## Recommended Default

**Default:** Observer for infrastructure reactions, domain event for business logic reactions
**Reason:** Observers are simple for infrastructure concerns; domain events provide better separation for business logic

---

## Risks Of Wrong Choice

Business logic in observers coupling domain to Eloquent lifecycle; unnecessary observer class for a single closure reaction.

---

## Related Rules

- Observer single-responsibility (from observer-pattern standardized knowledge)

---

## Related Skills

- Observer registration and creation (model-lifecycle/06-skills.md)

---

## Observer Registration (Attribute vs ServiceProvider)

Choosing between `#[ObservedBy]` attribute and manual registration in a service provider.

---

## Decision Context

When registering observers, you must choose between the `#[ObservedBy]` attribute and traditional `Model::observe()` in a service provider.

---

## Decision Criteria

* Laravel version
* visibility preference (attribute on model vs registration in provider)
* whether the observer needs constructor injection

---

## Decision Tree

Registering an observer?

↓

Are you using Laravel 11+?

YES → Use `#[ObservedBy(Observer::class)]` attribute on the model

    Does the observer need constructor injection?

    YES → Register in service provider with `Model::observe()` for container resolution

    NO → Attribute syntax is cleaner and visible on the model

NO (Laravel <11) → Use `Model::observe()` in `AppServiceProvider::boot()`

---

## Rationale

`#[ObservedBy]` makes observer registration visible on the model class itself, improving discoverability. ServiceProvider registration is needed when the observer requires dependency injection through the container.

---

## Recommended Default

**Default:** `#[ObservedBy]` attribute for Laravel 11+, `Model::observe()` for older versions
**Reason:** Visibility on the model improves discoverability; provider is fallback for DI

---

## Risks Of Wrong Choice

Hidden observer registration in service provider (less discoverable); broken observer if dependency injection is needed but attribute is used.
