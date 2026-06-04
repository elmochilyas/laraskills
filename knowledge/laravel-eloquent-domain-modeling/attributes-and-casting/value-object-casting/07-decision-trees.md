# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Value Object Casting
**Generated:** 2026-06-03

---

# Decision Inventory

* Value object cast vs primitive cast
* Cast class vs Castable interface
* Value object casting vs accessor/mutator pair

---

# Architecture-Level Decision Trees

---

## Value Object Cast vs Primitive Cast

---

## Decision Context

Choosing between a custom value object cast that returns a typed object and a primitive cast that returns a scalar.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Does the attribute carry domain logic beyond simple storage?
↓
YES → Is the same value object concept used across multiple models?
    YES → Create a custom value object cast — reusable, type-safe
    NO → Consider if a simpler approach suffices (accessor for single use)
NO → Is the value a simple scalar with no validation or computation?
    YES → Use primitive cast — `int`, `bool`, `float`, `string`
    NO → Evaluate if domain meaning warrants a value object (Email, Money, etc.)

---

## Rationale

Value object casts provide type safety, constructor validation, and domain semantics. Primitive casts are sufficient for plain scalar attributes with no domain rules. The overhead of a custom cast class is justified when the attribute has business meaning.

---

## Recommended Default

**Default:** Primitive cast
**Reason:** Simpler, faster, and sufficient for most attributes. Only introduce value object casting when the attribute carries domain logic or validation.

---

## Risks Of Wrong Choice

Using primitive casts for domain-valued attributes loses type safety — every consumer must validate the value. Using value object casts for simple scalars adds unnecessary class overhead and object allocation.

---

## Related Rules

* Handle null explicitly in both get and set
* Keep the cast focused on serialization, not validation

---

## Related Skills

* Cast an Attribute to a Value Object

---

## Cast Class vs Castable Interface

---

## Decision Context

Deciding whether to register a value object cast via a separate cast class or via the `Castable` interface on the value object itself.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the value object used on multiple models?
↓
YES → Implement `Castable` interface — eliminates duplicate cast registration
NO → Is the value object from a third-party package?
    YES → Implement `Castable` — keeps the cast logic with the value object
    NO → Use a separate cast class — simpler for single-model use

---

## Rationale

The `Castable` interface lets the value object declare its own cast via `castUsing()`, making it self-serializing. This eliminates the need to reference a cast class in every model's `$casts` array. For single-model value objects, a separate cast class is simpler.

---

## Recommended Default

**Default:** Separate cast class for single-model use; `Castable` for cross-model value objects
**Reason:** `Castable` provides better reuse and discoverability. Separate cast classes are simpler for isolated cases.

---

## Risks Of Wrong Choice

Registering a cast class on every model for a value object used in 10 models creates 10 duplicate references that must all be updated if the cast changes. Using `Castable` for a single-model value object adds unnecessary coupling between the value object and its persistence.

---

## Related Rules

* Use Castable for multi-model value objects

---

## Related Skills

* Cast an Attribute to a Value Object

---

## Value Object Casting vs Accessor/Mutator Pair

---

## Decision Context

Choosing between a custom value object cast and a traditional accessor/mutator pair for attribute transformation.

---

## Decision Criteria

* maintainability
* performance
* architectural

---

## Decision Tree

Is the transformation needed across multiple models?
↓
YES → Use custom value object cast — reusable, DRY
NO → Is it a simple read+write transformation?
    YES → Accessor/mutator pair works — but consider if cast is cleaner
    NO → Does the transformation involve complex hydration/serialization?
        YES → Custom cast provides cleaner separation of get/set
        NO → Accessor/mutator with `Attribute::make()` is sufficient

---

## Rationale

Custom casts encapsulate both directions (get and set) in a single class with a clear contract. Accessor/mutator pairs are model-specific and defined inline, which is simpler for one-off transformations but harder to reuse.

---

## Recommended Default

**Default:** Accessor/mutator pair for model-specific transformations
**Reason:** Defined inline, visible in the model, and simpler for one-off cases. Promote to a custom cast when the same transformation is needed on multiple models.

---

## Risks Of Wrong Choice

Duplicating accessor/mutator patterns across models for the same value object type violates DRY. Using custom casts for trivial transformations that only appear on one model adds unnecessary indirection.

---

## Related Rules

* Accept both scalar and value object instances in set
* Handle null explicitly in both get and set

---

## Related Skills

* Cast an Attribute to a Value Object
