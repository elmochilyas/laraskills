# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** ku-04-contextual-binding-timing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Registration Phase: `register()` vs `boot()` for contextual bindings
2. Resolution Strategy: Contextual binding vs factory pattern vs global binding
3. Consumer Identification: Concrete class vs interface in `when()`

---

# Architecture-Level Decision Trees

---

## Decision Name: Contextual Binding Registration Phase

---

## Decision Context

Choosing whether to register contextual bindings in a provider's `register()` or `boot()` method.

---

## Decision Criteria

* performance — no meaningful difference
* architectural — contextual bindings must be registered before the consumer is first resolved
* security — late registration on already-resolved singletons has no effect
* maintainability — `register()` is the correct phase for all binding operations

---

## Decision Tree

Is the contextual binding registering before any consumer resolution occurs?
↓
YES → Register in `register()` — the correct and safe phase
NO → Is the consumer already resolved (e.g., a singleton resolved in another provider's `boot()`)?
↓
YES → Registration in `register()` of an earlier provider is REQUIRED — `boot()` is too late for already-resolved singletons
NO → Register in `register()` — always use `register()` for contextual bindings

---

## Rationale

Contextual bindings must be registered in `register()` — before any resolution of the consumer class. If registered in `boot()`, there is a risk that the consumer was already resolved in another provider's `boot()` (which runs before yours if your provider is listed later). Once a singleton consumer is resolved, subsequent contextual bindings have no effect on that existing instance.

---

## Recommended Default

**Default:** Always register contextual bindings in a provider's `register()` method.
**Reason:** Guarantees registration before any consumer resolution occurs.

---

## Risks Of Wrong Choice

- Registration in `boot()`: consumer may already be resolved — binding silently has no effect.
- Registration after singleton resolution: the singleton instance was created with the default binding; contextual binding is ignored.
- Missing consumer class in `when()`: binding applies to wrong consumer or silently has no effect.

---

## Related Rules

- Register contextual bindings in provider `register()` methods (05-rules.md, Rule 1)
- Keep contextual bindings with consumer registration (05-rules.md, Rule 2)

---

## Related Skills

- Manage Contextual Binding Timing (06-skills.md)

---

## Decision Name: Resolution Strategy Selection

---

## Decision Context

Choosing between contextual binding, a factory pattern, or a global binding when different consumers need different implementations of the same interface.

---

## Decision Criteria

* performance — contextual binding lookup is O(n) per consumer; negligible for <100 entries
* architectural — contextual bindings are per-consumer; global bindings are one-size-fits-all
* security — contextual bindings can override global bindings silently
* maintainability — contextual binding is declarative; factory pattern requires new classes

---

## Decision Tree

Do all consumers of the interface need the same implementation?
↓
YES → Use global `$app->bind()` or `$app->singleton()` — simplest approach
NO → Do only a few consumers need different implementations?
↓
YES → Use contextual binding: `$app->when(Consumer::class)->needs(Interface::class)->give(Concrete::class)`
NO → Do MANY consumers each need different implementations?
↓
YES → Consider whether the interface is correctly factored — every consumer needing a different implementation suggests the interface is too broad
NO → Is the implementation choice runtime-variable (changes per request)?
↓
YES → Use middleware or request-scoped singleton instead of contextual binding
NO → Use contextual binding — it is the declarative, container-integrated approach

---

## Rationale

Contextual binding is the declarative approach for per-consumer specialization — it keeps the override logic in the container configuration rather than in factory classes. If every consumer needs a different implementation, the interface likely needs to be split into separate, more specific interfaces. For runtime-variable choices (e.g., payment gateway based on user location), middleware or request-scoped singletons are more appropriate.

---

## Recommended Default

**Default:** Global binding for shared implementations; contextual binding for per-consumer specializations.
**Reason:** Contextual binding is declarative and container-integrated, avoiding factory boilerplate.

---

## Risks Of Wrong Choice

- Over-using contextual binding: hundreds of entries make the container configuration hard to understand and maintain.
- Using factory pattern instead of contextual binding: adds unnecessary boilerplate classes for what the container can handle declaratively.
- Using contextual binding for runtime-variable choices: binding is fixed at registration time; use request-scoped logic for runtime variation.

---

## Related Rules

- Avoid over-abstraction — if every consumer needs a different implementation, refactor the interface (05-rules.md, Rule 4)

---

## Related Skills

- Manage Contextual Binding Timing (06-skills.md)
