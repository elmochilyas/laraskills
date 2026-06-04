# castable-interface

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Knowledge Unit:** castable-interface
- **Last Updated:** 2026-06-02

---

## Executive Summary

The `Castable` interface inverts the casting architecture — instead of defining a separate cast class and referencing it from the model, the value object itself declares how it should be cast. By implementing `Castable`, a value object provides a static `castUsing()` method that returns the cast class responsible for transforming it. This enables self-contained value objects that carry their own serialization logic, reducing duplication and enforcing consistency across every model that uses them.

---

## Core Concepts

- **Self-defining casts**: The value object knows how to cast itself. The `castUsing()` method returns the fully qualified cast class or a factory closure.
- **Architectural inversion**: The model no longer needs to know which cast class to use — it only needs to know the value object class. The value object provides the cast.
- **Static resolution**: `castUsing()` is a static method. The value object is not instantiated during cast registration — the cast class is resolved from the container.
- **Decoupling from cast implementation**: The cast class returned by `castUsing()` can be internal to the value object or a separate class. The model sees only the value object.
- **Attribute cast registration**: In the model's `$casts` array, the value object class is used instead of a cast class: `'attribute' => ValueObject::class`.

---

## Mental Models

- **Self-serializing message**: Think of the value object as a message that knows how to encode itself for transport (database) and decode itself for use (PHP).
- **Contract carrier**: Instead of a separate translator class (the cast), the value object carries its translation rules with it — like JSON carrying its own parser instructions.
- **Dependency inversion applied**: High-level model code does not depend on low-level cast classes. Both depend on the value object abstraction via the `Castable` interface.
- **Middleware for attributes**: The cast acts as middleware between the model and the database. The `Castable` interface allows the value object to configure that middleware itself.

---

## Internal Mechanics

- **`castUsing()` signature**: `public static function castUsing(array $arguments): string` — returns the cast class name or an invocable class that acts as a factory.
- **Resolution timing**: `castUsing()` is called during model boot (when `$casts` is parsed), not during attribute access. The returned cast class is cached.
- **Return types**: Can return a class string (e.g., `MoneyCast::class`) or a closure/anonymous class that implements `CastsAttributes`.
- **No trait required**: The interface alone is sufficient. There is no `Castable` trait — just the contract.
- **Pass-through arguments**: If `castUsing()` accepts arguments, they are derived from the `$casts` array definition. For `'attribute' => ValueObject::class`, no arguments are passed; for `'attribute' => ValueObject::class:param`, the argument is forwarded.
- **Resolution in `HasAttributes`**: In `Illuminate\Database\Eloquent\Concerns\HasAttributes`, the cast resolution logic checks if the cast class implements `Castable` and calls `castUsing()` to get the actual cast class.

---

## Patterns

### Embedded Cast Class Pattern

**Purpose**: Define the cast class as an inner class or private class within the value object's namespace, returned from `castUsing()`.

**Benefits**: Encapsulation — the cast implementation is invisible outside the value object.

**Tradeoffs**: Cannot reuse the cast class outside the value object context.

### Factory Closure Pattern

**Purpose**: Return a closure from `castUsing()` that builds the cast instance with custom dependencies.

**Benefits**: Allows dependency injection into the cast without requiring the cast class itself to be resolved from the container.

**Tradeoffs**: More verbose than returning a class string; testing the closure separately is harder.

### Castable with Arguments Pattern

**Purpose**: Accept arguments in `castUsing()` to parameterize the cast behavior (e.g., column length, serialization format).

**Benefits**: Reuses a single value object across multiple attributes with different configurations.

**Tradeoffs**: Adds complexity to the `castUsing()` signature; argument parsing must be consistent.

---

## Architectural Decisions

- **When to use `Castable`**: The value object is used across multiple models. Defining the cast once on the value object prevents duplication and ensures consistent storage.
- **When to avoid**: The value object is used in only one model attribute. A inline custom cast class is simpler and has fewer indirections.
- **When to prefer separate cast class**: The cast logic is complex and depends on external services that should not be part of the value object's domain.
- **When to use both**: The value object implements `Castable` but `castUsing()` delegates to a shared cast class. This provides the architectural clarity of self-definition while keeping cast logic reusable.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Self-contained value objects | Cast logic is coupled to the value object | Changing serialization format requires changing the value object, affecting all models |
| Eliminates cast registration duplication | Increases value object complexity | Simple value objects now carry cast infrastructure |
| Enforces consistent serialization across models | Less flexibility to customize serialization per model | A model cannot override how a value object serializes without breaking the pattern |
| Clean `$casts` array syntax | Requires knowing the `Castable` pattern exists | Teams unfamiliar with the pattern may not discover it and write separate casts |

---

## Performance Considerations

- **No additional per-request cost**: `castUsing()` is called once during class boot (metadata caching), not per attribute access.
- **Opcode caching benefit**: Because `castUsing()` is a static method called during boot, its result is cached in `opcache` and the resolved cast class is cached by the model.
- **Closure in castUsing**: Returning a closure from `castUsing()` prevents serialization of the cast definition (closures cannot be serialized). This is irrelevant at runtime but affects queue job serialization if the cast is inspected.
- **Anonymous cast classes**: Returning anonymous classes from `castUsing()` creates a new class definition on every boot, which is less opcache-friendly than returning a named class string.

---

## Production Considerations

- **Opcode cache warmup**: If `castUsing()` returns a closure, opcache warmup scripts must trigger autoloading of the value object before caching.
- **Queue serialization**: The value object's cast class is resolved at runtime. If the value object itself is serialized (e.g., in queue payloads), the cast definition is not included — only the raw attribute value is.
- **Testing cast isolation**: Testing the value object's cast behavior requires testing through the model's cast system. Unit-testing the cast class independently (if it is embedded) is more difficult.
- **Package distribution**: If distributing the value object as a package, the `Castable` interface makes installation simpler — consumers just register the value object class in their `$casts` array without additional configuration.

---

## Common Mistakes

- **Returning a non-cast class from `castUsing()`**: The return value must implement `CastsAttributes` or `CastsInboundAttributes`. Returning an unrelated class causes a `CastsAttributes` runtime error.
- **Forgetting the `static` keyword**: `castUsing()` must be static — Laravel calls it without an instance. Non-static methods cause a `Non-static method cannot be called statically` error.
- **Instantiating the value object in `castUsing()`**: `castUsing()` runs during boot, not attribute access. The value object should not be instantiated in `castUsing()` — only the cast class should be configured.
- **Assuming `castUsing()` receives model context**: The method receives only arguments from the `$casts` definition. It has no access to the model or attribute name.
- **Overlooking namespace resolution**: The `$casts` array value is resolved through the container. If the value object is not autoloadable (e.g., missing import), the error surfaces during model boot.

---

## Failure Modes

- **Circular boot dependency**: If `castUsing()` requires autoloading a class that triggers model boot, Laravel enters a boot loop that manifests as a white screen or memory exhaustion.
- **Serialization mismatch after value object change**: Changing the value object's internal structure without awareness of the cast class can break both read and write paths simultaneously.
- **Static method cannot access instance state**: If a developer adds instance-dependent logic to `castUsing()` (e.g., using `$this`), it causes a runtime error because the method is called statically.
- **Missing interface implementation**: The value object class is registered in `$casts` but does not implement `Castable`. Laravel treats it as a native cast name (like `'array'`) and resolves it through the container, often failing with unclear errors.

---

## Ecosystem Usage

- **Laravel Framework**: Laravel's `Illuminate\Database\Eloquent\Casts\AsEnumCollection` cast pattern is conceptually similar but uses a dedicated class rather than `Castable`.
- **Spatie Laravel Data**: The `Spatie\LaravelData\Data` class implements castable-like patterns for data transfer objects.
- **Value object packages**: Packages like `brick/money`, `myclabs/php-enum`, and community Laravel value object packages leverage `Castable` to make value objects self-casting.
- **Archtech Enum Eloquent**: Uses `Castable` pattern for PHP enum casting with `BackedEnum` support.
- **Laravel ModelStates**: The state pattern model uses cast-like behavior for state transitions, though it does not directly implement `Castable`.

---

## Related Knowledge Units

### Prerequisites
- casts-attributes-interface — the bidirectional custom casting contract
- value-object-fundamentals — principles of value objects and self-validation

### Related Topics
- casts-inbound-interface
- value-object-casting
- cast-parameters

### Advanced Follow-up Topics
- serializes-castable-attributes
- runtime-casting

---

## Research Notes

- `Castable` is located at `Illuminate\Contracts\Database\Eloquent\Castable`.
- Introduced in Laravel 8 alongside the broader custom cast refactoring.
- The interface is intentionally minimal — a single static method. This makes it easy to implement but also easy to misuse.
- Laravel's own casting system rarely uses `Castable`; most internal casts are registered as dedicated classes. The pattern is more common in third-party packages and value object libraries.
- The argument forwarding mechanism (`$arguments` parameter) is poorly documented in the Laravel docs but is the primary mechanism for parameterizing castables.
- `castUsing()` can return an invocable class (a class with `__invoke`), allowing factory-style cast creation without closures.
