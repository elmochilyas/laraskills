# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Entity vs Value Object
**Generated:** 2026-06-03

---

# Decision Inventory

* Entity vs value object classification
* Implementation approach (Eloquent model vs plain PHP)
* Value object comparison strategy

---

# Architecture-Level Decision Trees

---

## Entity vs Value Object Classification

---

## Decision Context

Determining whether a domain concept should be modeled as an entity (with identity) or a value object (defined by attributes).

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the concept have its own identity and lifecycle?
↓
YES → Can the concept change over time while retaining identity?
    YES → Entity — identity persists through state changes
    NO → Value object — identity is the attribute values themselves
NO → Are two instances with the same properties interchangeable?
    YES → Value object — equality is value-based, not identity-based
    NO → Entity — even if attributes match, different instances matter

---

## Rationale

Entities are about identity and continuity through change. Value objects are about the attributes themselves — two identical value objects are the same thing.

---

## Recommended Default

**Default:** Entity if it has a primary key; value object if it doesn't
**Reason:** In Eloquent, the presence of a database identity (id column) strongly suggests an entity.

---

## Risks Of Wrong Choice

Modeling concepts as entities when they're really value objects creates unnecessary database tables and persistence complexity. Modeling value objects as entities when they have no independent lifecycle creates identity confusion.

---

## Related Rules

* Entities have independent identity and lifecycle
* Value objects are defined by their attributes

---

## Related Skills

* Distinguish Entity from Value Object in the Domain

---

## Implementation Approach

---

## Decision Context

Choosing how to implement the concept in Laravel — Eloquent model or plain PHP class.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the concept an entity with a persistent identity and lifecycle?
↓
YES → Implement as Eloquent model with domain methods
NO → Is the concept a value object embedded in an entity?
    YES → Implement as plain PHP class with readonly properties and custom cast
    NO → Is it a transient value (not persisted)?
        YES → Plain PHP class, no cast needed

---

## Rationale

Eloquent models are designed for persistent entities with identity. Plain PHP classes with readonly properties are the correct implement for value objects — they're lightweight, immutable, and can be integrated via custom casts.

---

## Recommended Default

**Default:** Eloquent model for entities; readonly PHP class for value objects
**Reason:** Each tool fits its purpose — Eloquent for persistence identity, plain classes for value semantics.

---

## Risks Of Wrong Choice

Using Eloquent models for value objects creates unnecessary database baggage and mutability. Using plain PHP classes for entities forces manual identity tracking and persistence.

---

## Related Rules

* Embed VOs in entities via casting
* Value objects are immutable

---

## Related Skills

* Distinguish Entity from Value Object in the Domain

---

## Value Object Comparison Strategy

---

## Decision Context

Determining how value objects should be compared for equality.

---

## Decision Criteria

* reliability

---

## Decision Tree

Do two value objects represent the same concept if all properties match?
↓
YES → Implement `equals()` or use `readonly` + property comparison
NO → This might not be a value object — reconsider classification

---

## Rationale

Value objects are defined by their attributes. Two Email value objects with the same address are the same email. An `equals()` method provides explicit value-based comparison.

---

## Recommended Default

**Default:** Compare by all properties using `==` (PHP default for readonly classes) or explicit `equals()` method
**Reason:** Value equality is the defining characteristic of value objects.

---

## Risks Of Wrong Choice

Using identity-based comparison (`===`, object identity) for value objects breaks the substitutability — two identical value objects would be considered different, defeating the purpose.

---

## Related Rules

* Compare VOs by value, entities by identity

---

## Related Skills

* Distinguish Entity from Value Object in the Domain
