# immutability-patterns

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Knowledge Unit:** immutability-patterns
- **Last Updated:** 2026-06-02

---

## Executive Summary

Immutability patterns are the specific PHP coding techniques that enforce value object immutability — preventing state changes after construction and providing controlled mutation through new instance creation. In the context of Eloquent casting, understanding these patterns is essential because casted value objects on model attributes must remain immutable to prevent accidental data corruption during request lifecycle. This KU covers `readonly` properties, `with*` methods, defensive copying, and immutability-by-convention patterns in PHP.

---

## Core Concepts

- **Readonly properties (PHP 8.1+)**: Language-level enforcement that a property can only be assigned once, either in the constructor or via an `init` setter. `readonly` prevents both external and internal mutation after construction.
- **`with*` methods**: Immutable "setters" that return a new instance with one property changed. `$money->withAmount(200)` returns a new `Money` with `200` and the same currency.
- **Defensive copying**: Copying mutable objects (arrays, DateTime, collections) received or returned by the value object to prevent external mutation.
- **Constructor-only initialization**: All state is set through the constructor. There are no `set*` methods, no public properties (unless `readonly`), and no `public` without `readonly`.
- **Immutability by convention**: In codebases without PHP 8.1, immutability must be enforced by convention — no setters, documentation, and code review.
- **Clone safety**: Overriding `__clone()` to ensure cloned value objects do not share mutable references with the original.

---

## Mental Models

- **Chisel vs clay**: Value objects are like stone sculptures (chisel) — once carved, they cannot be reshaped. Ordinary objects are like clay — they can be reshaped at any time. Immutability means choosing chisel over clay.
- **Copy-on-write (COW)**: Like a COW file system, modifying a value object does not change the original — it creates a new copy with the modification applied.
- **Functional programming value**: Immutability brings FP guarantees to OOP — no side effects, referential transparency, safe sharing across threads/requests.
- **Sealed envelope**: Once sealed (constructed), the contents cannot be changed. To change the contents, you create a new envelope with the new contents.

---

## Internal Mechanics

- **Readonly property enforcement**: PHP throws a `Error` if a `readonly` property is modified after construction. Unlike `private` setters, this is enforced at the engine level, not by convention.
- **`with*` method implementation**: Each `with*` method clones the current instance, sets the new value (via a private constructor or reflection in PHP 8.0-, or direct `readonly` init in PHP 8.1), and returns the new instance.
- **`__clone` implementation**: Defensively deep-copies mutable properties. Example: `$this->lines = array_map(fn($l) => clone $l, $this->lines)`.
- **Constructor-initialized readonly in PHP 8.1**: `readonly` properties can only be set in the constructor (or `__init` hooks). Once the constructor exits, the property is frozen.
- **PHP 8.1 readonly promotion**: `public function __construct(readonly int $amount, readonly string $currency)` combines declaration and initialization.
- **Immutability with arrays**: Arrays in PHP are value types for assignment but reference types for internal mutation (e.g., `$arr[] = 'x'`). `with*` methods must return a new array, not mutate the internal one.

---

## Patterns

### `with*` Method Pattern

**Purpose**: Provide controlled mutation that returns a new instance with a single changed property.

**Benefits**: Explicit, discoverable, chainable.

**Tradeoffs**: Requires one method per property; property additions require new `with*` methods.

### Fluent Factory Pattern

**Purpose**: Use a builder or named constructor to create modified instances with multiple changes.

**Benefits**: Avoids multiple `with*` calls for complex modifications.

**Tradeoffs**: Introduces a separate class (the builder); more code.

### Defensive Copy Constructor Pattern

**Purpose**: Accept mutable parameters but immediately copy them so the value object's internal state is isolated.

**Benefits**: Protects against external mutation of arrays, DateTime, collections.

**Tradeoffs**: Copying is O(n) for collections; increases construction cost.

### Readonly Promotion Pattern (PHP 8.1+)

**Purpose**: Use constructor property promotion with `readonly` for concise, enforced immutability.

**Benefits**: Minimal boilerplate; language-enforced immutability.

**Tradeoffs**: No support for computed or derived properties before `readonly` assignment.

### Immutable Collection Pattern

**Purpose**: Use immutable collections (e.g., `Ramsey\Collection`, `Doctrine\Collections\ArrayCollection`) instead of native arrays.

**Benefits**: Collections enforce immutability at the collection level.

**Tradeoffs**: Adds dependency; collection interface differs from native arrays.

---

## Architectural Decisions

- **When to use `readonly` properties**: Always, when PHP 8.1+ is available. There is no reason to use non-readonly for value object properties.
- **When to use `with*` methods instead of constructor**: When clients need to change a single property without knowing or specifying others.
- **When to use named constructors**: When the value object has multiple construction paths (e.g., `Money::fromFloat(10.5)` vs `Money::fromCents(1050)`).
- **When to break immutability**: Never for value objects. If a class needs mutation, it is likely an entity, not a value object.
- **When to use `spatie/immutable` or similar**: When the team cannot upgrade to PHP 8.1 and needs library-enforced immutability.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Language-enforced immutability (readonly) | PHP 8.1+ requirement | Older codebases must use convention-based immutability |
| Safe sharing across scopes | Object churn — more GC pressure | In tight loops, object allocation overhead may be measurable |
| Predictable, side-effect-free code | Requires `with*` methods for every change | More methods to write and maintain per value object |
| Defensive copying prevents reference leaks | Copying is O(n) for collections | Large collections in value objects are expensive to copy |

---

## Performance Considerations

- **Object allocation overhead**: Every `with*` call creates a new object. In hot paths (e.g., processing 10,000 items), this adds allocation and GC pressure.
- **Defensive copy cost**: Copying arrays or collections on every construction multiplies the allocation cost. For value objects with large collections, consider lazy copying or immutable collection libraries.
- **Readonly property access**: `readonly` properties are accessed via `__get` if not typed as `public readonly`. Typed `public readonly` is fastest. Use promoted readonly properties for optimal performance.
- **Clone overhead**: `clone` creates a shallow copy. If the value object holds only immutable primitives and `readonly` properties, `clone` is cheap.
- **Comparison with mutation**: A mutable object updates in-place (no allocation). An immutable object allocates on every change. The allocation overhead is the cost of immutability.

---

## Production Considerations

- **Serialization of readonly objects**: `readonly` properties are serialized and unserialized correctly by PHP's `serialize`, but external formats (JSON, database) do not preserve immutability — the reconstructed object is still immutable.
- **Caching value objects**: Caching immutable value objects is safe because they cannot be corrupted. Cache invalidation is the only concern.
- **Equality after immutability**: Ensure `equals()` methods compare property values, not references. Cloned or `with*` objects must compare equal to the original if property values are equal.
- **Error handling for readonly violation**: PHP throws `\Error`, not `\Exception`, for readonly property modification. Code that catches `\Exception` will not catch readonly violations.
- **Testing immutable objects**: Test that `with*` methods return new instances and do not modify the original. Test that `equals()` works correctly after cloning.

---

## Common Mistakes

- **Returning the same instance from `with*`**: `public function withAmount($amount) { $this->amount = $amount; return $this; }` mutates the original and returns it. Breaks immutability completely.
- **Forgetting `clone` in `with*`**: `public function withAmount($amount) { return new self($amount, $this->currency); }` creates a new instance correctly. `public function withAmount($amount) { $this->amount = $amount; return $this; }` does not.
- **Sharing mutable references**: Storing a `DateTime` object received from outside and returning it via a getter. External code can modify the DateTime, "mutating" the value object's state.
- **Readonly with non-scalar defaults**: `public readonly array $items = [];` — the array can be mutated via `$obj->items[] = 'x'` because `readonly` prevents reassignment, not array mutation (PHP 8.1 limitation).
- **Not implementing `__clone`**: After cloning a value object, internal mutable references (DateTime, collections) are shared between the original and the clone.
- **Using `var` or `public` without `readonly`**: Declaring properties as `public` without `readonly` allows external mutation at any time.

---

## Failure Modes

- **Readonly violation in PHP 8.1 `__construct`**: If the constructor calls a method that sets a readonly property, the method is executed in the constructor context and succeeds. But if the same method is called outside the constructor, it throws an `\Error`.
- **`unserialize` of readonly objects**: PHP's `unserialize` bypasses the constructor. A malicious or malformed serialized value object can represent an invalid state.
- **Clone not deep enough**: `clone` is shallow. Nested value objects (e.g., `Address` containing a `PostalCode` value object) are not deep-copied by default. Use `__clone` for deep cloning.
- **Forgetting readonly in PHP 8.1 promotes**: `public function __construct(int $amount, string $currency)` without `readonly` creates mutable public properties. Adding `readonly` later is a breaking change if external code mutates the properties.

---

## Ecosystem Usage

- **brick/money**: Immutable money value object with `with*` methods (`withAmount()`, `withCurrency()`), `readonly` properties (PHP 8.1+), defensive copying, and `__toString`.
- **brick/math**: Immutable arithmetic value objects with `withScale()` and arithmetic methods returning new instances.
- **ramsey/uuid**: Immutable UUID value object. No `with*` methods (UUIDs are never modified), but immutability is enforced.
- **Spatie Laravel Data**: Data transfer objects enforce immutability through `readonly` properties (PHP 8.1+) and `with*` pattern.
- **Laravel Framework**: `Stringable` uses immutable string operations (each method returns a new `Stringable`).
- **PHP itself**: `DateTimeImmutable` is the canonical PHP immutable object. Its `modify()`, `setDate()`, etc. all return new instances.

---

## Related Knowledge Units

### Prerequisites
- value-object-fundamentals — why immutability matters in domain modeling

### Related Topics
- value-object-casting
- money-email-address

### Advanced Follow-up Topics
- PHP 8.1 Readonly Properties
- Clone Semantics
- Functional PHP Patterns

---

## Research Notes

- PHP 8.1 `readonly` was a game-changer for value objects in PHP. Before 8.1, immutability was enforced by convention and required more boilerplate.
- PHP 8.2 allowed `readonly` classes (`readonly class Foo`), making all properties implicitly readonly. This reduces boilerplate further.
- `DateTimeImmutable` was added in PHP 5.5 and set the pattern for immutable objects in PHP. Its API (returning new instances) is the model for `with*` methods.
- Arrays in PHP are value types for `=` but reference types for `[]` syntax. This hybrid behavior causes confusion in immutable value objects holding arrays.
- The `with*` naming convention is not a PHP native feature — it is a community convention popularized by immutable value objects and the `with` prefix method naming.
- `spatie/phpunit-watcher` and similar tools help enforce immutability in tests by checking that methods do not modify `$this`.
