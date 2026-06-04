# Accessor Patterns

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Last Updated:** 2026-06-02

## Executive Summary
Accessors transform raw model attribute values when accessed via the model instance. Laravel 11 introduced the `Attribute::make()` pattern with a `get` closure, replacing the legacy `get{Attribute}Attribute()` method convention. Accessors decouple stored representation from application-facing representation — a database column storing cents as an integer can expose a `Money` value object or a formatted dollar string on access. The new closure-based API is composable, testable, and marks accessed attributes as computed when combined with caching.

## Core Concepts
- **Attribute::make with get closure:** `protected function name(): Attribute { return Attribute::make(get: fn ($value) => ucfirst($value)); }` — the `get` closure receives the raw stored value and returns the transformed value.
- **Native type transformation:** Accessors are invoked when reading `$model->attribute`. The `$value` parameter passed to the get closure is the value after database-native type conversion (e.g., integer columns arrive as PHP ints).
- **No storage side effects:** Accessors are read-only transforms. They never write to the database or modify the model's internal `$attributes` array.
- **Legacy convention:** `get{StudlyCase}Attribute()` — still functional but deprecated in favor of `Attribute::make()`.

## Mental Models
- **Decorator Pattern:** An accessor decorates the raw attribute value with transformation logic. The caller sees the decorated value; the database sees the undecorated value.
- **View Transformer:** Think of accessors as view-level transformations — they convert storage format to presentation format but should not contain business logic that influences persistence.
- **Read-Only Pipeline:** Raw `$value` → Accessor Closure → Returned Value. The pipeline runs on every read unless caching is enabled.

## Internal Mechanics
1. `Model::__get($key)` intercepts property access via `$model->attribute`.
2. If the attribute has an accessor defined via `Attribute::make()`, the get closure is resolved from the model's `Attribute` registry.
3. The closure is invoked with `$value` (the raw value from `$attributes[$key]` or the casted value if a cast exists), plus the model instance as `$this`.
4. The returned value is cached in the model's `$accessors` array if `shouldCache` is enabled on the `Attribute` definition.
5. If no accessor exists, normal attribute/relationship resolution proceeds.
6. For legacy accessors, `hasGetMutator()` checks for the `get{Attribute}Attribute()` method via `method_exists()` and calls it with the raw value.

## Patterns
- **Value Object Return:** Accessors often return value objects instead of primitives — e.g., `Attribute::make(get: fn (string $value) => new Money($value, new Currency('USD')))`.
- **Computed Fallback:** Accessors can return a computed default when the underlying attribute is null — `get: fn ($value) => $value ?? $this->generateDefault()`.
- **Relationship-Aware Accessor:** Accessors can reference other model attributes via `$this` within the closure — but this ties the accessor to the model's state.
- **Accessor + Cast Stacking:** When both a cast and an accessor are defined, the cast runs first (transforming raw DB value), then the accessor transforms the casted value.

## Architectural Decisions
- **Decision:** Use `Attribute::make()` over legacy `get{Attribute}Attribute()`.
  - **Rationale:** Closures are composable, can be cached declaratively, and avoid method name collisions. Legacy methods pollute the model's public API and cannot be combined with mutators in the same method.
- **Decision:** Accessors receive post-cast values.
  - **Rationale:** Ensures type consistency — the accessor works with the typed PHP value, not the raw database string. Casts normalize the storage format before the accessor applies domain transformation.
- **Decision:** Accessors do not automatically cache results.
  - **Rationale:** Caching adds memory overhead. Explicit opt-in via `shouldCache` forces the developer to consider whether the accessor result is idempotent and lightweight.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clean separation of storage vs. presentation | Accessors run on every read (unless cached) | High-traffic models benefit from attribute caching |
| Attribute::make is explicit and testable | More verbose than simple `$casts` array for trivial transforms | Use casts for type coercion; accessors for business transforms |
| Closures are isolated and don't pollute model API | Cannot be called directly like regular methods for testing | Test via model instantiation or extract logic to dedicated classes |
| Accessors can return value objects | Value objects must be serializable for queue/response | Implement `JsonSerializable` or use `Stringable` contracts |

## Performance Considerations
- Accessor closures are resolved from the model's `Attribute` registry via reflection on first access, then cached in an instance-level static array for the duration of the request.
- Each accessor invocation adds ~1-2µs overhead. With caching (`shouldCache`), subsequent reads are near-zero cost array lookups.
- In Octane, accessor closures persist in model instances across requests. Ensure closures do not retain state that becomes stale.
- Accessors that perform database queries or API calls must be cached explicitly or extracted to a service.

## Production Considerations
- Keep accessors idempotent and free of side effects. An accessor that logs, dispatches events, or modifies external state will cause subtle bugs when accessed in unexpected contexts (serialization, blade views, API resources).
- Avoid heavy computation in accessors. If transformation is expensive, use `shouldCache` or precompute the value during a lifecycle hook and store it in a separate database column.
- Serialization frameworks (API Resources, Eloquent serialization) invoke accessors during `toArray()`. If the accessor returns a non-serializable object, override `serializeDate` or implement `JsonSerializable`.

## Common Mistakes
- **Defining both a legacy accessor and Attribute::make for the same attribute:** Attribute::make takes precedence. Remove legacy methods when migrating.
- **Expecting the accessor to run on null values:** The get closure receives `null` and must handle it. Accessors are invoked even when the underlying attribute is null unless the model overrides `hasGetMutator`.
- **Using accessors for write transformations:** Accessors are read-only. Use a mutator or a cast for input normalization.
- **Accessing `$this->attribute` inside the accessor (recursion):** `$this->attribute` calls the accessor again. Access the raw value via `$this->getRawOriginal('attribute')` or use `$value` parameter.

## Failure Modes
- **Recursive accessor crash:** An accessor that reads `$this->{$key}` instead of using the `$value` parameter causes infinite recursion until PHP stack overflow.
- **Non-serializable accessor result:** If an accessor returns a `Carbon` instance that has not been serialized before queue dispatch, the job fails with a serialization error.
- **Stale cached accessor value:** With `shouldCache`, manually modifying `$model->attributes` directly does not invalidate the cache. Use `$model->setAttribute()` to trigger cache reset.

## Ecosystem Usage
- **Laravel Nova:** Accessors are honored in Nova fields. If an accessor returns a formatted name, Nova displays the formatted value. Resource fields using `Text::make('Name')` use the accessor if defined.
- **Laravel API Resources:** Accessors are called during `toArray()` on the model. Wrap the model in a resource class to control which accessors are serialized.
- **Laravel LiveWire:** Accessors are evaluated during render. Use `shouldCache` to avoid re-executing accessors on every LiveWire update cycle.
- **Laravel Data (Spatie):** DTOs generated from models may or may not apply accessors — depends on how the model is mapped to the DTO.

## Related Knowledge Units

### Prerequisites
- [Attribute Caching](./attribute-caching/02-knowledge-unit.md) — caching accessor results for performance.
- [Primitive Casts](../primitive-casts/02-knowledge-unit.md) — casts that run before accessor transformations.

### Related Topics
- [Mutator Patterns](../mutator-patterns/02-knowledge-unit.md) — the write-side counterpart to accessors.
- [Multi-Attribute Mutators](../multi-attribute-mutators/02-knowledge-unit.md) — returning arrays from set closures.

### Advanced Follow-up Topics
- [Value Object Casts](../../domain-modeling-patterns/value-objects/02-knowledge-unit.md) — replacing accessors with value object casts.
- [Eloquent Serialization](../../serialization/model-serialization/02-knowledge-unit.md) — controlling how accessor results are serialized.

## Research Notes
- Laravel 11 introduced `Attribute::make()` as the primary accessor API. The `get` closure is stored in `Illuminate\Database\Eloquent\Casts\Attribute` and resolved via `Model::newInstance()` reflection.
- Accessor closures are bound to the model instance at definition time. PHP's closure `$this` binding means the closure retains a reference to the model, preventing garbage collection if the closure escapes.
- The legacy `get{Attribute}Attribute()` pattern performs a `method_exists()` check on every access, adding ~0.3µs overhead. Migrating to `Attribute::make()` avoids this check.
