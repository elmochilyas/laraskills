# Mutator Patterns

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Last Updated:** 2026-06-02

## Executive Summary
Mutators transform values at the point of assignment — before they are stored in the model's `$attributes` array and ultimately persisted to the database. Laravel 11's `Attribute::make(set: ...)` closure replaces the legacy `set{Attribute}Attribute()` convention. Mutators normalize input, enforce domain invariants, and translate presentation-layer values into storage-layer values. They are the write-side counterpart to accessors and are critical for ensuring data integrity at the model boundary.

## Core Concepts
- **Attribute::make with set closure:** `protected function title(): Attribute { return Attribute::make(set: fn (string $value) => trim($value)); }` — the `set` closure receives the value being assigned and must return the value to store.
- **Input normalization:** Mutators handle trimming, lowercasing, null-coalescing, and format conversion at assignment time.
- **Pre-persist transformation:** Mutators run when `$model->attribute = $value;` is called, before `save()` or `update()`.
- **Legacy convention:** `set{StudlyCase}Attribute($value)` — still supported but superseded.

## Mental Models
- **Input Filter:** A mutator is a filter that every value passes through before entering the model's internal state. Invalid input is rejected or normalized at the boundary.
- **Write-Through Cache:** The mutator intercepts the write operation, transforms the value, and passes it to the underlying `$attributes` array.
- **Guard Clause in Closure:** The set closure acts as a single-method guard — validate, transform, return.

## Internal Mechanics
1. `Model::__set($key, $value)` intercepts property assignment `$model->attribute = $value`.
2. If the attribute has a mutator defined via `Attribute::make()`, the set closure is resolved from the model's `Attribute` registry.
3. The closure is invoked with `$value` (the assigned value), plus the model instance as `$this`.
4. The return value of the closure is stored in `$this->attributes[$key]`.
5. If the attribute also has a cast, the cast's `set` method runs after the mutator, transforming the mutator's output into the storage format.
6. For legacy mutators, `hasSetMutator()` checks for `set{Attribute}Attribute($value)` via `method_exists()`.

## Patterns
- **Normalization Mutator:** `set: fn (string $value) => strtolower(trim($value))` — ensures consistent casing and whitespace.
- **Default on Null Mutator:** `set: fn ($value) => $value ?? $this->defaultValue` — applies fallback when null is assigned.
- **Hashing Mutator (pre-hash-cast):** `set: fn (string $value) => Hash::make($value)` — hashes passwords on assignment. (Legacy pattern; use `hashed` cast instead.)
- **Value Object to Primitive:** `set: fn (Money $value) => $value->cents()` — accepts a value object but stores a primitive.
- **Isolated Void Set:** `set: fn (string $value) => $this->attributes['searchable'] = json_encode(['title' => $value])` — modifies multiple raw attribute entries directly (see multi-attribute-mutators).

## Architectural Decisions
- **Decision:** Mutators run before casts on set.
  - **Rationale:** The mutator normalizes the input into a format the cast can handle. If the cast expects `int` but the input is `string`, the mutator converts first.
- **Decision:** Set closures must return a value.
  - **Rationale:** The return value replaces the original assigned value in `$attributes`. Returning `null` stores `null`. To skip storage, the closure must explicitly not set `$attributes`.
- **Decision:** Legacy and new mutators cannot coexist for the same attribute.
  - **Rationale:** `Attribute::make()` takes precedence. Defining both causes the legacy method to be ignored silently. The model only checks for `Attribute` definitions first.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Input validation at the model boundary | Mutators bypassed on mass-assignment if attribute is `$guarded` | Use `$fillable` to ensure mass-assignment goes through mutators |
| Normalization logic lives with the model | Mutators scatter transformation logic across models | Extract common normalizations into a Cast or Value Object |
| Legacy mutators are widely understood | Method name collisions with real model methods | Migrate to `Attribute::make()` to keep public API clean |
| Set closures can inspect model state | Closure binding couples the mutator to the model instance | Test mutators by assigning values and asserting `$attributes` |

## Performance Considerations
- Mutators incur ~1-2µs overhead per assignment for closure resolution and invocation.
- Mutators are invoked eagerly on every `$model->attribute = $value` call, even if the model is never saved.
- In batch operations, mutators run for each individual assignment. For bulk inserts, use `Model::insert()` which bypasses mutators entirely.
- Mutators that run external API calls or heavy computation on assignment should be replaced with explicit service-layer methods.

## Production Considerations
- Always validate input before the mutator if the mutator expects a specific type. A mutator receiving a wrong type (expecting `string`, receiving `array`) will throw a TypeError unless the closure is untyped.
- Mutators are bypassed on `Model::query()->update(['attribute' => $value])` because the query builder does not instantiate models.
- In queues, reconstructed models via `Model::find()` do not re-run mutators — the value is already stored in `$attributes`.
- Be explicit about nullable set closures: `set: fn (?string $value) => $value ?? $this->defaultValue` handles null assignment cleanly.

## Common Mistakes
- **Mutator that does not return a value:** The set closure must return the value to store. If it returns nothing, `null` is stored.
- **Relying on mutator for validation:** Mutators normalize but do not prevent persistence. Use Form Requests or validation rules for hard validation failures.
- **Mutator accessing `$this->attribute` (recursion):** `$this->attribute = $value` inside a set closure triggers the mutator again. Use `$this->attributes['attribute']` for direct assignment.
- **Assuming mutators run on first-party `attributes` array modification:** `$model->attributes['name'] = 'foo'` bypasses the mutator entirely.

## Failure Modes
- **TypeError in set closure:** If the set closure is typed (e.g., `fn (string $value)`) and an array is passed, PHP throws a `TypeError`. Use `mixed` or untyped parameters for flexible input.
- **Silent nullification:** A set closure that throws an exception without returning a value leaves `$attributes` in an undefined state.
- **Mutator bypass on hydration:** When `Model::hydrate()` or `Model::find()` populates attributes, no mutators run. The database values are assigned directly to `$attributes`.

## Ecosystem Usage
- **Laravel Nova:** Nova fields can set attributes through mutators. Ensure Nova field types match the expected mutator input type.
- **LiveWire:** Mutators run when LiveWire hydrates model properties. A mutator that modifies `$this->attributes` during LiveWire hydration shows stale data on re-render.
- **Filament:** Uses mutators for form field normalization. Filament's `mutateDehydratedState()` is an alternative that avoids model mutators.

## Related Knowledge Units

### Prerequisites
- [Accessor Patterns](../accessor-patterns/02-knowledge-unit.md) — the read-side counterpart, same `Attribute::make()` API.
- [Primitive Casts](../primitive-casts/02-knowledge-unit.md) — casts run after mutators on set.

### Related Topics
- [Multi-Attribute Mutators](../multi-attribute-mutators/02-knowledge-unit.md) — setting multiple attributes from a single set closure.
- [Hashed Cast](../hashed-cast/02-knowledge-unit.md) — the dedicated cast for password hashing, replacing the hashing mutator pattern.
- [Value Object Casts](../../domain-modeling-patterns/value-objects/02-knowledge-unit.md) — two-way value object transformation that includes both get and set.

### Advanced Follow-up Topics
- [Encrypted Casts](../encrypted-casts/02-knowledge-unit.md) — encryption/decryption as a specialized input/output transformation.
- [Custom Casts](../../domain-modeling-patterns/custom-casts/02-knowledge-unit.md) — creating reusable two-way attribute transformers.

## Research Notes
- Laravel's `Attribute::make()` with a `set` closure stores the closure in the `Attribute` object, resolved via `Model::inspectAttribute()` on first access.
- The set closure receives the second parameter `$attributes` (the model's current attributes array) in Laravel 11+, enabling context-aware mutators: `set: fn ($value, $attributes) => $value ?? $attributes['default']`.
- Legacy `set{Attribute}Attribute` uses `str_replace('set', '', $method)` and `Str::snake()` to derive the attribute key. This string manipulation adds ~0.5µs overhead per mutator.
