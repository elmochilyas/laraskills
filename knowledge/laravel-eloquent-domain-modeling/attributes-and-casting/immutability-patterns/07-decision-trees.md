# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Immutability Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Immutable Value Object vs Mutable Entity-Like Object
* Decision 2: Readonly Properties vs Private Setters for Encapsulation
* Decision 3: New Instance on Modification vs In-Place Mutation

---

# Architecture-Level Decision Trees

---

## Decision 1: Immutable Value Object vs Mutable Entity-Like Object

---

## Decision Context

Choose whether a domain object should be an immutable value object (readonly properties, no setters) or a mutable entity-like object.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the object identified by its value (all properties define identity)?
↓
YES → Is the object shared across multiple contexts?
    YES → Immutable Value Object (prevents shared-reference mutation bugs)
    NO → Does the object have a short lifespan with no sharing?
        YES → Mutable Entity (immutability overhead not justified)
        NO → Immutable Value Object (defensive against future sharing)
NO → Does the object have a persistent identity (ID) separate from its properties?
    YES → Mutable Entity (identity persists across state changes)
    NO → Immutable Value Object (value equality semantics)

---

## Rationale

Value objects represent values, not entities. They should be immutable to preserve referential transparency and prevent shared-reference mutation bugs. Entities have persistent identity and can safely mutate state over time.

---

## Recommended Default

**Default:** Immutable value objects for all value-type objects (Money, Email, Address). Mutable entities for domain entities with persistent identity.
**Reason:** Value semantics demand immutability. Entity semantics allow mutation. Mixing the two causes bugs.

---

## Risks Of Wrong Choice

* Mutable value objects: shared-reference mutation bugs, unpredictable behavior, debugging difficulty
* Immutable entities: cumbersome state transitions, unnecessary object churn, verbose code

---

## Related Rules

* Mark all value object properties as `readonly` (`05-rules.md`)
* Do not expose setters on value objects (`05-rules.md`)

---

## Related Skills

* Design an Immutable Value Object With Readonly Properties (`06-skills.md` Skill 1)

---

## Decision 2: Readonly Properties vs Private Setters for Encapsulation

---

## Decision Context

Choose between PHP 8.1 `readonly` properties and private setters for enforcing immutability on value objects.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the project using PHP 8.1 or newer?
↓
YES → `readonly` properties (language-enforced, no runtime overhead)
NO → Private setters with no public mutation API (PHP < 8.1 fallback)
→ In both cases: do you need lazy initialization or computed properties?
    YES → Private setters (readonly properties cannot be lazy)
    NO → `readonly` properties (simpler, compiler-enforced)

---

## Rationale

`readonly` properties provide compile-time guarantees against mutation with no runtime overhead. Private setters are a convention-based alternative for PHP < 8.1 or when lazy initialization is needed.

---

## Recommended Default

**Default:** `readonly` properties for all value objects on PHP 8.1+. Private setters only as a PHP < 8.1 fallback or when lazy initialization is required.
**Reason:** Language-level enforcement is stronger and simpler than convention-based patterns.

---

## Risks Of Wrong Choice

* Private setters on PHP 8.1+: missed opportunity for compiler enforcement, more boilerplate
* `readonly` with lazy init needed: not supported, must use different pattern

---

## Related Rules

* Mark all value object properties as `readonly` (`05-rules.md`)

---

## Related Skills

* Design an Immutable Value Object With Readonly Properties (`06-skills.md` Skill 1)

---

## Decision 3: New Instance on Modification vs In-Place Mutation

---

## Decision Context

Choose whether operations on a value object should return a new instance or modify the existing object in place.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the object a value object (identified by its value)?
↓
YES → Return new instance on modification (immutability contract)
NO → Is the object an entity (identified by persistent ID)?
    YES → In-place mutation is acceptable (entity lifecycle)
    NO → Return new instance (value semantics by default)

---

## Rationale

Value objects must return new instances on modification to preserve referential transparency. In-place mutation of value objects destroys their identity-by-value semantics and causes shared-reference bugs. Entities, which have persistent identity, can safely mutate in place.

---

## Recommended Default

**Default:** Return new instances from all value object operations. Use `with*()` naming convention for clarity.
**Reason:** New instances preserve immutability guarantees. The naming convention makes the behavior explicit at the call site.

---

## Risks Of Wrong Choice

* In-place mutation of value objects: shared references corrupted, intermittent bugs, debugging difficulty
* New instance for entities: unnecessary allocations, verbose code, unnatural domain model

---

## Related Rules

* Return new instances from modification operations (`05-rules.md`)
* Use named constructors for modified copies (`05-rules.md`)

---

## Related Skills

* Design an Immutable Value Object With Readonly Properties (`06-skills.md` Skill 1)
