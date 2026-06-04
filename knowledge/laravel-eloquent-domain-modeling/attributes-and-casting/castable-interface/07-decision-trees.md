# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Castable Interface
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Castable Value Object vs Separate Cast Class Registration
* Decision 2: Class Name String vs Factory Closure in `castUsing()`
* Decision 3: Co-located Cast Class vs Separate Casts Directory

---

# Architecture-Level Decision Trees

---

## Decision 1: Castable Value Object vs Separate Cast Class Registration

---

## Decision Context

Choose between implementing `Castable` on a value object (making it self-casting) or registering a separate cast class directly in the model's `$casts` array.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the value object used across multiple models?
↓
YES → Does the cast logic depend on the model context?
    YES → Separate cast class registration (model-specific logic)
    NO → Castable (value object carries its own serialization)
NO → Is the value object used in only one model?
    YES → Separate cast class registration (simpler, less indirection)
    NO → Evaluate based on team conventions

---

## Rationale

`Castable` eliminates duplicate cast class references across models by letting the value object declare its own cast. It adds indirection (model → value object → cast class) that is justified only for multi-model value objects. For single-use value objects, direct registration is simpler.

---

## Recommended Default

**Default:** `Castable` for value objects used across 2+ models. Direct cast class registration for single-model value objects.
**Reason:** The indirection of `Castable` pays off when it eliminates duplication. For single use, the indirection adds complexity without benefit.

---

## Risks Of Wrong Choice

* Castable for single use: unnecessary indirection, extra classes loaded, YAGNI violation
* Direct registration for multi-model: duplicate cast class references across models, harder to update consistently

---

## Related Rules

* Only implement `Castable` for multi-model value objects (`05-rules.md`)
* One cast class per value object (`05-rules.md`)

---

## Related Skills

* Implement `Castable` on a Value Object (`06-skills.md` Skill 1)

---

## Decision 2: Class Name String vs Factory Closure in `castUsing()`

---

## Decision Context

Choose whether `castUsing()` should return a class name string or a factory closure when implementing `Castable`.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the cast class require constructor parameters (currency, locale, format)?
↓
YES → Factory Closure: `return fn () => new MoneyCast(currency: 'USD')`
NO → Is the cast configuration dependent on the value object's type?
    YES → Factory Closure (captures configuration at cast resolution)
    NO → Class Name String: `return MoneyCast::class` (simpler, faster)

---

## Rationale

A class name string is simpler and adds no runtime overhead. A factory closure is necessary when the cast class requires constructor parameters that depend on the value object's context. Using a closure when not needed adds unnecessary complexity.

---

## Recommended Default

**Default:** Class name string when the cast has no constructor parameters. Factory closure when parameters are needed.
**Reason:** Class name strings are simpler, faster to resolve, and easier to test. Closures should only be used when necessary to pass configuration.

---

## Risks Of Wrong Choice

* Closure without parameters: unnecessary complexity, harder to test, marginally slower
* Class name when parameters needed: hardcoded cast behavior, no configuration variation, duplicated cast classes

---

## Related Rules

* Keep `castUsing()` simple (`05-rules.md`)
* Use factory closures for parameterized castable classes (`05-rules.md`)

---

## Related Skills

* Implement `Castable` on a Value Object (`06-skills.md` Skill 1)

---

## Decision 3: Co-located Cast Class vs Separate Casts Directory

---

## Decision Context

Choose whether to place the cast class in the same directory as the value object or in a dedicated `App\Casts\` directory.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the cast class tightly coupled to its value object (one-to-one relationship)?
↓
YES → Co-located (same file or same directory)
NO → Is the cast class shared across multiple value objects or models?
    YES → `App\Casts\` directory (single authoritative location)
    NO → Evaluate — if only one model uses it, either location works

---

## Rationale

Co-location keeps tightly coupled serialization logic with the domain object, making the relationship explicit. A dedicated `App\Casts\` directory provides a single authoritative location for all custom casts, improving discoverability in larger codebases.

---

## Recommended Default

**Default:** Co-locate one-to-one cast/value-object pairs. Use `App\Casts\` for shared or model-specific casts.
**Reason:** Co-location signals tight coupling. `App\Casts\` signals reuse. The convention should be documented and consistent.

---

## Risks Of Wrong Choice

* Scattered cast classes: time wasted searching, inconsistent project structure, onboarding difficulty
* Forced co-location for shared casts: infrastructure concern in domain directory, namespace pollution

---

## Related Rules

* Place cast classes alongside value objects or in `App\Casts` (`05-rules.md`)

---

## Related Skills

* Implement `Castable` on a Value Object (`06-skills.md` Skill 1)
