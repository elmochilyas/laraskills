# casts-attributes-interface

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Knowledge Unit:** casts-attributes-interface
- **Last Updated:** 2026-06-02

---

## Executive Summary

The `CastsAttributes` interface is the foundational primitive for custom attribute casting in Laravel Eloquent. It defines a bidirectional transformation contract (`get`/`set`) between raw database values and PHP types. Understanding this interface is prerequisite to every other custom casting concept — value objects, inbound-only casts, castable objects, and serialization control all build on its contract. Engineers reaching for domain-driven attribute modeling must internalize its lifecycle, signature contracts, and timing within the Eloquent hydration pipeline.

---

## Core Concepts

- **Bidirectional transformation**: `CastsAttributes` operates in both directions — `get` transforms stored values into PHP representations; `set` transforms PHP values back into database-safe formats.
- **Model instance awareness**: Both `get` and `set` receive the Eloquent model instance, giving the cast access to sibling attributes, relationships, or model state during transformation.
- **Key separation**: The `get` method receives the raw value from storage; the `set` method receives the user-assigned value and returns an array of key-value pairs for the database.
- **Null passthrough**: If the raw value is `null`, `get` receives `null` and should return `null` unless a non-null default is explicitly intended — casts do not auto-coerce null.
- **Attribute mutability boundary**: The `set` method determines not only what is stored but whether the attribute mutates other columns via the returned array.

---

## Mental Models

- **Serializer / Deserializer pair**: Think of `get` as a deserializer (database → PHP) and `set` as a serializer (PHP → database). They are not inverses in strict mathematical terms — `get` operates on raw database values, `set` operates on PHP values assigned by user code.
- **Bidirectional adapter**: The cast sits between two type systems — the SQL column type system and the PHP type system. It adapts both directions without either system knowing about the other.
- **Pipeline position**: Custom casts run after Eloquent's native type coercion (`int`, `bool`, `float`) and after date casting, but before JSON serialization. The cast operates on the already-coerced value from native casting.
- **Ownership model**: The model owns the cast, not the other way around. Casts are stateless services attached to model properties, not properties themselves.

---

## Internal Mechanics

- **Registration**: Custom casts are registered via the `$casts` property with the syntax `'attribute_name' => CastClass::class` or `'attribute_name' => 'cast_class'`.
- **Instantiation**: Laravel resolves the cast class from the container once per model instance. The cast is then reused for all attribute accesses on that instance.
- **`get` invocation timing**: Called during property access (`$model->attribute`) when the attribute is listed in `$casts` and the cast class implements `CastsAttributes`. The raw value is retrieved from the model's `$attributes` array.
- **`set` invocation timing**: Called during property assignment (`$model->attribute = $value`) before the value is written to `$attributes`. The return value replaces the attribute entry in `$attributes`.
- **Return contract of `set`**: Must return an array where keys are column names and values are the raw database-safe values. Most commonly `[$attribute => $value]`, but can include additional columns for composite casting.
- **Fresh model hydration**: When a model is freshly hydrated from the database (via `newInstance()->setRawAttributes()`), `get` is called for each casted attribute during attribute access, not during hydration.
- **Cached raw values**: The model retains raw values in `$attributes`; the casted (PHP) value is cached in the model's `$casts` resolution cache to avoid re-casting on repeated access.

---

## Patterns

### Simple Value Transformation

**Purpose**: Transform a stored scalar into a richer PHP type on read, and flatten it back on write.

**Benefits**: Encapsulates a single conversion concern, testable independently of the model.

**Tradeoffs**: Adds indirection — developers must open the cast class to understand the attribute's behavior.

### Null-Conscious Cast

**Purpose**: Handle `null` database values explicitly without silently coercing to a default.

**Benefits**: Prevents subtle bugs where null dates, null enums, or null monetary values become zero-values in PHP.

**Tradeoffs**: Requires explicit null checks in every `get` call, adding boilerplate.

### Composite Cast (Multi-Column)

**Purpose**: Store one logical value across multiple database columns (e.g., `amount` + `currency` for Money).

**Benefits**: Enforces domain invariants across columns atomically.

**Tradeoffs**: The `set` method must return an array of multiple keys; the model must have all those columns in `$fillable` or `$guarded`; partial updates become complex.

---

## Architectural Decisions

- **When to use `CastsAttributes`**: Any attribute requiring bidirectional transformation that cannot be expressed by Laravel's native casts (`int`, `bool`, `json`, `object`, `array`).
- **When to avoid**: Simple type coercion that native casts handle (e.g., `'count' => 'int'`). Over-engineering a custom cast for what `'array'` or `'object'` already provides.
- **When to consider alternatives**: For read-only transformations, prefer accessors (mutators). For write-only transformations, prefer `CastsInboundAttributes`. For self-defining value objects, prefer the `Castable` interface.
- **Stateless constraint**: Never store instance state on the cast class itself. The same cast instance may be reused across multiple models and attributes. Use the model instance parameter for contextual logic.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Encapsulates transformation logic | Adds indirection vs inline accessors | Developers must navigate to cast class to understand behavior |
| Bidirectional ensures consistency | Both directions must be maintained in sync | If `get` and `set` logic diverge, silent data corruption occurs |
| Model-instance awareness gives context | Cast cannot be easily reused across unrelated models | Cast becomes coupled to model shape or conventions |
| Container-resolved (DI support) | Cast constructor resolution runs per instance | Expensive DI dependencies in cast constructors affect performance |

---

## Performance Considerations

- **Instantiation cost**: Each model instance resolves its cast classes from the container. If a cast has multiple constructor dependencies (e.g., repositories, services), every model hydration pays that cost.
- **Repeated `get` calls**: The casted value is cached after first access on a model instance. However, `get` is called each time the model is serialized to array/JSON unless the cast implements `SerializesCastableAttributes`.
- **Composite casts and write amplification**: Returning multiple columns from `set` triggers `$model->setAttribute()` for each column, which may fire multiple attribute events.
- **Memory overhead**: The cast instance and its resolved dependencies remain in memory for the model's lifetime. Stateless, light cast classes minimize this.

---

## Production Considerations

- **Serialization mismatch**: Casts implementing `CastsAttributes` but not `SerializesCastableAttributes` will have `get` called during `toArray()`. This can produce unexpected types in API responses if `get` returns a non-scalar value.
- **Validation isolation**: Casts should not perform validation — that belongs in FormRequest, custom rules, or model validation. A cast that throws on invalid input couples persistence to validation.
- **Database column compatibility**: Ensure the data type returned from `set` matches the column type. Returning a string for an integer column causes silent truncation or errors depending on the DB driver.
- **Lazy loading interaction**: If `get` accesses a relationship, it may trigger lazy loading. This is a common source of N+1 queries inside cast logic.

---

## Common Mistakes

- **Storing state on the cast class**: Casts are singletons per model instance. Storing per-attribute state on `$this` causes cross-attribute contamination when the same cast is used for multiple attributes.
- **Returning the wrong type from `set`**: The `set` method must return an array, not a scalar. Forgetting the array wrapper causes an `array_key_exists` error.
- **Forgetting null handling**: `get` receives `null` for nullable columns. Failing to return `null` stores a default value (e.g., empty string, zero) back to the database.
- **Mutating unrelated columns in `set`**: Returning additional columns from `set` silently modifies other model attributes. This surprises developers who expect single-attribute assignment.
- **Assuming `get` runs on hydration**: `get` runs on attribute access, not hydration. Expressions like `dd($model->getAttributes())` show raw values, not casted ones.

---

## Failure Modes

- **Circular cast resolution**: A `get` method that accesses the same attribute (`$model->attribute`) triggers infinite recursion because the accessor calls `get` again.
- **Data corruption on `set` mutation**: Returning an incorrect value type from `set` corrupts the database silently if the DB driver coerces the value (e.g., MySQL truncating integers in strict mode disabled).
- **Cast constructor failure**: If the cast constructor depends on a service that is not bound in the container, model hydration fails with a binding resolution exception that is hard to trace.
- **Serialization infinite loop**: If `get` returns the model instance (or an object that references the model), serialization enters infinite recursion.

---

## Ecosystem Usage

- **Laravel Framework**: Uses `CastsAttributes` internally for `encrypted`, `collection`, and `object` casts in `Illuminate\Database\Eloquent\Casts\`.
- **Spatie Laravel Media Library**: Uses custom casts to transform media collection attributes.
- **Spatie Laravel Translatable**: Uses casts to handle JSON translation columns.
- **Laravel Cashier**: Uses custom casts for billable model attributes like `trial_ends_at`.
- **Archtech Enum Eloquent**: Leverages `CastsAttributes` for bidirectional enum casting in the `casts` array integration.

---

## Related Knowledge Units

### Prerequisites
- Accessors & Mutators — read/write transformations on Eloquent model attributes
- Native Attribute Casting (int, bool, json, object) — built-in Eloquent casting types
- Eloquent Model Hydration Lifecycle — how models are populated from database results

### Related Topics
- casts-inbound-interface
- castable-interface
- serializes-castable-attributes
- value-object-casting

### Advanced Follow-up Topics
- runtime-casting
- cast-parameters

---

## Research Notes

- `CastsAttributes` was introduced in Laravel 7 to replace the old `$casts` → accessor pattern for complex types.
- The interface is located at `Illuminate\Contracts\Database\Eloquent\CastsAttributes`.
- Laravel's own `AsEnumCollection` and `AsStringable` casts implement this interface.
- The `$casts` array cache in the model's `mutatedAttributes` cache means dynamically adding casts after model hydration may not take effect unless `syncCastableAttributes()` is called.
- Container resolution of casts means constructor injection works, but it also means casts cannot be serialized — they are resolved fresh on each model instance construction.
