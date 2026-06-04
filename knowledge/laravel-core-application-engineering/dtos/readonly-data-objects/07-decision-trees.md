# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** Readonly Data Objects
**Generated:** 2026-06-03

---

# Decision Inventory

* Readonly Class vs Individual Readonly Properties
* With-Pattern vs Clone + Mutation for Modified Copies
* PHP Serialization vs JsonSerializable for Serialization

---

# Architecture-Level Decision Trees

---

## Decision 1: Readonly Class vs Individual Readonly Properties

---

## Decision Context

How to enforce language-level immutability on DTOs — class-level `readonly class` (PHP 8.2+) or individual `public readonly` on each property (PHP 8.1+).

---

## Decision Criteria

* PHP version target
* Whether the DTO must extend a non-readonly class
* Whether lazy initialization is needed
* Whether using spatie/laravel-data `#[Lazy]` properties

---

## Decision Tree

Is PHP 8.2+ the project target?
↓
YES → Use `readonly class` for all DTOs
NO → PHP 8.1?
    YES → Use `public readonly` on every promoted constructor property
NO → Does the DTO need to extend a non-readonly class?
    YES → Individual `public readonly` properties (PHP 8.2 restriction on readonly classes)
NO → Does the DTO need lazy initialization or spatie `#[Lazy]`?
    YES → Individual `public readonly` properties with private non-readonly memoization property
    NO → `readonly class` is always preferred

---

## Rationale

`readonly class` enforces consistency across all properties with a single keyword — no risk of forgetting `readonly` on one property. Individual `readonly` is more verbose but necessary for PHP 8.1 compatibility or when extending non-readonly classes. Lazy initialization requires individual control because a readonly property cannot be set after construction.

---

## Recommended Default

**Default:** `readonly class` for all DTOs when targeting PHP 8.2+; individual `public readonly` for PHP 8.1 compatibility
**Reason:** Class-level enforcement is more consistent and prevents accidental mutation through developer oversight.

---

## Risks Of Wrong Choice

* No readonly: Accidental mutation by intermediate layers, runtime bugs
* Readonly class with lazy init: Cannot compute on first access — property must be set in constructor
* Individual readonly with oversight: One missed `readonly` creates a mutation backdoor

---

## Related Rules

* Declare Every DTO as a `readonly class` (PHP 8.2+) or Use `public readonly` on All Properties (PHP 8.1) (05-rules.md)
* Always Use Constructor Promotion — Never Manually Assign Properties (05-rules.md)

---

## Related Skills

* Skill: Apply Readonly Enforcement to a DTO

---

## Decision 2: With-Pattern vs Clone + Mutation for Modified Copies

---

## Decision Context

How to produce a modified copy of a readonly DTO — using explicit `with*()` methods or cloning and attempting mutation.

---

## Decision Criteria

* Whether the DTO has readonly enforcement
* Number of properties that may need modification
* Whether the team understands readonly semantics

---

## Decision Tree

Is the DTO declared as `readonly class` or with `public readonly` properties?
↓
YES → Can properties be modified after construction?
    NO → Readonly prevents post-construction mutation — must use `with*()` pattern
NO → How many properties need modified copies?
    1-3 → Individual `with*()` methods (e.g., `withName()`, `withEmail()`)
    4-10 → Individual `with*()` methods or a single `with(array $changes)` method
    10+ → `with(array $changes)` method or evaluate if DTO scope is too broad
NO → Is cloning an alternative?
    YES → Cloned readonly objects are still readonly — `$clone->name = 'new'` still errors
    NO → Use `with*()` pattern exclusively

---

## Rationale

Readonly DTOs cannot be modified after construction — attempting to modify a property or a cloned instance produces a runtime `\Error`. The `with*()` pattern provides controlled, explicit methods for producing modified copies while maintaining immutability. Each `with*()` method is a factory that documents which properties can be changed.

---

## Recommended Default

**Default:** Implement individual `with*()` methods for 1-10 commonly changed properties; use `with(array $changes)` for bulk modifications
**Reason:** Individual methods are explicit and type-safe. A bulk `with()` method reduces ceremony for DTOs with many modifiable properties.

---

## Risks Of Wrong Choice

* Clone + mutate: Fatal `\Error` at runtime — readonly properties cannot be set after construction
* No `with*()` methods: Callers resort to reflection or other hacks to work around readonly
* `with*()` for 10+ properties: Excessive method proliferation — use bulk `with()` instead

---

## Related Rules

* Use the "with" Pattern for Modified Copies Instead of Mutation (05-rules.md)
* Never Add `__set` or `__get` Magic Methods to Readonly DTOs (05-rules.md)

---

## Related Skills

* Skill: Apply Readonly Enforcement to a DTO

---

## Decision 3: PHP Serialization vs JsonSerializable for Serialization

---

## Decision Context

How to serialize and deserialize readonly DTOs for caching, queues, or session storage.

---

## Decision Criteria

* Whether the DTO is used in serialization contexts (cache, queues, sessions)
* Whether round-trip integrity is required
* Whether the serialization format needs to be human-readable
* Whether security of deserialization is a concern

---

## Decision Tree

Is the DTO used in serialization contexts (cache, queues, sessions)?
↓
YES → Is human-readability of serialized data required?
    YES → Use `JsonSerializable` + manual `fromArray()` deserialization
    NO → Is PHP's default `serialize()`/`unserialize()` safe?
        NO → Does `unserialize()` bypass the constructor?
            YES — `unserialize()` creates objects without calling `__construct`
            NO → Implement `__serialize()`/`__unserialize()` to control the surface
        YES → PHP default serialization is acceptable but `JsonSerializable` is still preferred
NO → No serialization needed — skip serialization methods entirely
NO → Is the DTO a spatie/laravel-data object?
    YES → The package handles serialization — rely on its built-in `toArray()`/`from()`

---

## Rationale

PHP's `unserialize()` creates objects without calling the constructor, bypassing readonly assignment guarantees and validation. `JsonSerializable` + manual `fromArray()` deserialization is the safest approach because it always goes through the constructor. For readonly DTOs, explicit serialization control is essential.

---

## Recommended Default

**Default:** Use `JsonSerializable` (delegating to `toArray()`) for output, and `fromArray()` (going through constructor) for input — avoid PHP's native `serialize()`/`unserialize()`
**Reason:** JSON serialization always goes through the constructor, preserving readonly assignment and validation guarantees. PHP unserialize bypasses both.

---

## Risks Of Wrong Choice

* PHP default serialize/unserialize: `unserialize()` bypasses constructor, readonly assignment, and validation
* No serialization control: Queue jobs silently corrupt data on deserialization
* Reflection-based serialization: Subverts readonly guarantees entirely

---

## Related Rules

* Control Serialization via `__serialize()`/`__unserialize()` to Prevent Unserialize Bypass (05-rules.md)
* Run Static Analysis at PHPStan Level 6+ to Catch Uninitialized Readonly Properties (05-rules.md)

---

## Related Skills

* Skill: Apply Readonly Enforcement to a DTO

