# value-object-fundamentals

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Knowledge Unit:** value-object-fundamentals
- **Last Updated:** 2026-06-02

---

## Executive Summary

Value objects are immutable, self-validating domain primitives that model concepts as more than bare scalars (strings, ints, floats). They are foundational to domain-driven design and directly relevant to Eloquent attribute casting because custom casts often transform database scalars into value objects and back. Understanding value object fundamentals — identity by value, immutability, self-validation, and behavioral richness — is prerequisite to building domain-encapsulating cast systems that prevent primitive obsession across the entire Laravel codebase.

---

## Core Concepts

- **Identity by value**: Two value objects are equal if all their properties are equal, not by reference or ID. `new Money(100, 'USD') == new Money(100, 'USD')` is true.
- **Immutability**: Once created, a value object cannot change. "Modification" produces a new instance. `$money->add($other)` returns a new `Money`, mutating neither original.
- **Self-validation**: Value objects validate themselves at construction time. An invalid `Email('not-an-email')` throws at creation, not on save.
- **Behavior over getters**: Value objects encapsulate domain logic. `$money->isPositive()` is better than `$money->amount() > 0`.
- **No identity field**: Unlike entities, value objects have no `id`, no persistence lifecycle, and no tracking.
- **Primitive obsession anti-pattern**: Using scalars to model domain concepts (e.g., `string $email` instead of `Email $email`) loses type safety, validation, and behavior.

---

## Mental Models

- **Scalar replacement**: Every time a method signature uses `string` or `int` for a domain concept, that is a candidate for a value object.
- **Self-validating passport**: A value object is like a passport — it is created at a border crossing (construction) and only valid passports exist. Once issued, its data never changes. You get a new passport if your data changes.
- **Mathematical value**: Like integers in math — the number 5 is the number 5, regardless of where it appears. `5 == 5`. Value objects follow the same equality semantics.
- **Tiny domain service**: A value object is the smallest possible domain service — it encapsulates a concept, its validation, and its behaviors in a single class.

---

## Internal Mechanics

- **Constructor enforcement**: All validation and normalization happens in the constructor. If the constructor succeeds, the object is guaranteed valid for its entire lifetime.
- **No setters**: Public `set*` methods are absent. All state is assigned via the constructor and remains unchanged.
- **Readonly properties (PHP 8.1+)**: Native `readonly` modifiers enforce immutability at the language level — preventing both external and internal mutation.
- **Equality methods**: Custom `equals()` or `isEqualTo()` methods compare structural equality. PHP 8 `==` with `__toString` is unreliable for complex value objects.
- **`__toString` for serialization**: Value objects commonly implement `__toString()` to produce a primitive representation (e.g., `'100 USD'`), useful for Eloquent casting and debugging.

---

## Patterns

### Simple Wrapper Pattern

**Purpose**: Wrap a single scalar with validation and type safety (e.g., `Email`, `PhoneNumber`, `Url`).

**Benefits**: Eliminates primitive obsession for common domain types; validates at construction.

**Tradeoffs**: Adds class overhead for simple types that could be strings.

### Composite Value Object Pattern

**Purpose**: Model concepts that require multiple properties (e.g., `Money(amount, currency)`, `Address(street, city, zip)`).

**Benefits**: Enforces invariants that span multiple values (e.g., currency always has an amount).

**Tradeoffs**: More complex serialization; must handle partial updates carefully.

### Enum-Like Value Object Pattern

**Purpose**: Model a fixed set of values with behavior (e.g., `Status`, `OrderState`, `PaymentMethod`).

**Benefits**: More flexible than PHP enums; can hold additional data.

**Tradeoffs**: PHP 8.1+ native enums often replace this pattern for simple cases.

### Self-Validation with Exception Pattern

**Purpose**: Throw domain-specific exceptions on invalid construction.

**Benefits**: Invalid states are impossible to represent; errors surface immediately.

**Tradeoffs**: Increases exception handling surface; callers must catch construction exceptions.

---

## Architectural Decisions

- **When to use value objects**: Any domain concept with validation rules, behavior, or formatting that appears in multiple places.
- **When to avoid**: Simple data transfer with no validation or behavior; primitive types are sufficient and simpler.
- **When to prefer PHP native enums**: For a fixed set of string or integer values without additional data or methods. PHP 8.1 enums are lighter and have built-in serialization.
- **When to prefer Eloquent accessors**: For one-off formatting that does not warrant a reusable class. Value objects add unnecessary abstraction for model-specific formatting.
- **Value object as type system**: Using value objects as parameter types and return types in service classes enforces domain constraints at the code level.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Eliminates primitive obsession | Class proliferation — many small classes | Larger codebase; requires discipline to keep classes focused |
| Self-validating prevents invalid state | Validation runs on every construction | Performance impact in hot paths (e.g., loops) |
| Behavior is encapsulated with data | Serialization complexity | Must integrate with Eloquent casts, JSON, and database storage |
| Type safety at method boundaries | Learning curve for team | Team may bypass value objects and use primitives in services |
| Immutability prevents shared-state bugs | Object churn — new instances for every change | Increased GC pressure in tight loops |

---

## Performance Considerations

- **Construction cost**: Value objects are created on every attribute read (if not cached by the cast). Construction with validation adds overhead compared to raw primitives.
- **GC pressure**: Immutable value objects produce many short-lived objects, especially in collection iteration. PHP 8.x generational GC mitigates this, but it is still a factor.
- **Memory overhead**: Each value object instance carries its class overhead. 10,000 model instances with a `Money` value object each means 10,000 `Money` objects in memory.
- **Serialization cost**: Round-trip serialization (database → PHP value object → JSON) converts the value object twice, adding conversion overhead.
- **Comparison with primitives**: A `string` costs nothing beyond its bytes. A `value object` costs class loading, construction, validation, and method dispatch.

---

## Production Considerations

- **Serialization boundary**: Value objects must survive serialization (database, cache, queue). Ensure the value object can be reconstructed from stored data.
- **Nullable columns**: Decide whether the value object represents `null` via a `NullObject` pattern or by returning `null` from the cast. Mixing both is confusing.
- **Migration path**: Introducing value objects to an existing codebase requires updating all usages of the primitive throughout the codebase, which is a large refactor.
- **Library vs custom**: Consider using established value object libraries (e.g., `brick/money`, `brick/math`) instead of building custom implementations.
- **Error handling**: Validation exceptions from value object constructors must be caught and presented to users as validation errors, not 500 exceptions.

---

## Common Mistakes

- **Mutable value objects**: Adding setters defeats the purpose. Developers add setters "for convenience" and lose all guarantees.
- **Missing equality methods**: Without `equals()`, PHP `==` comparison of value objects may not work as expected (object operator `==` compares all properties, which often works but is unintentional and fragile).
- **Value objects as entities**: Giving a value object an `$id` property or persisting it in a separate table mixes entity and value semantics.
- **Over-validation**: Throwing exceptions for edge cases that are valid in some contexts (e.g., throwing on a leading zero in a phone number when the number might be a test fixture).
- **Missing `__toString`**: Without `__toString()`, echoing or logging the value object shows a useless object hash.
- **Not handling null**: A nullable value object attribute is often modeled as `?Email` but the cast may return `null` or an empty value object. Inconsistent null handling causes bugs.

---

## Failure Modes

- **Construction failure in hot path**: If a value object validates against an external source (e.g., database lookup to verify currency exists), construction fails and the error propagates unexpectedly.
- **Equality inconsistency**: If `__toString` and `equals()` disagree on equality, serialization and comparison produce inconsistent results.
- **Breaking immutability via references**: If a value object holds an array or object (e.g., `Address` with an `AddressLines` collection), the array can be mutated externally. Defensive copying is required.
- **Serialization circular reference**: If a value object holds a reference to an entity (e.g., a `User`), serialization enters infinite recursion.

---

## Ecosystem Usage

- **brick/money**: Industry-standard money value object for PHP. Immutable, ISO currency support, arithmetic operations.
- **brick/math**: Arbitrary-precision arithmetic value objects (`BigInteger`, `BigDecimal`, `BigRational`).
- **ramsey/uuid**: UUID value object. Immutable, self-validating, `__toString` for serialization.
- **Spatie Laravel Data**: Data transfer objects that behave like value objects with serialization, validation, and Eloquent cast integration.
- **MyCLabs PHP Enums**: Enum value objects (pre-PHP 8.1) that provided the pattern now adopted by native enums.
- **Laravel Framework**: Uses `Stringable` (value object for strings), `Flux` (immutable date-like objects in later versions).
- **Laravel Cashier**: Uses money value objects for billing amounts.

---

## Related Knowledge Units

### Prerequisites
- OOP Fundamentals — classes, objects, encapsulation, and polymorphism
- PHP 8+ Typed Properties — property types, readonly, and constructor promotion

### Related Topics
- value-object-casting
- immutability-patterns

### Advanced Follow-up Topics
- money-email-address
- Domain-Driven Design Entities vs Value Objects

---

## Research Notes

- Value objects predate DDD and are a general OOP concept formalized by Eric Evans in Domain-Driven Design (2003).
- PHP 8.1 `readonly` properties make value object immutability enforceable at the language level.
- PHP 8.1 `enums` reduce the need for enum-like value objects but do not replace value objects with data.
- The primitive obsession anti-pattern is one of the most common code quality issues in Laravel codebases.
- Value objects require explicit serialization handling for databases. Eloquent custom casts are the bridge between value objects and storage.
- Libraries like `spatie/data-transfer-object` and `spatie/laravel-data` blur the line between value objects and DTOs, but the core concepts (immutability, self-validation, equality by value) remain the same.
