# serializes-castable-attributes

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Knowledge Unit:** serializes-castable-attributes
- **Last Updated:** 2026-06-02

---

## Executive Summary

`SerializesCastableAttributes` extends the custom cast contract with control over JSON serialization. Without this interface, custom casts that return non-scalar values (objects, arrays, collections) are serialized by recursively calling the cast's `get` method during `toArray()` and `toJson()`, which produces incorrect or unexpected output. This interface gives the cast explicit control over how the casted value appears in API responses, array exports, and JSON output — decoupling the in-memory representation from the wire format.

---

## Core Concepts

- **Serialization decoupling**: The in-memory PHP representation (produced by `get`) can differ from the serialized representation (produced by `serialize`) — an object in PHP can become a scalar or array in JSON.
- **`serialize` method signature**: `public function serialize($model, string $key, mixed $value, array $attributes): mixed` — receives the model, the attribute key, the already-casted value, and all model attributes.
- **`$value` is the post-`get` value**: The `serialize` method receives the value already transformed by `get`, not the raw database value. This avoids re-applying the `get` transformation during serialization.
- **Fallback behavior**: Without the interface, Eloquent's serialization calls `get` on the casted attribute, which may return an object that PHP's `json_encode` cannot handle (e.g., an object without `JsonSerializable`).
- **Optional interface**: Implementing `SerializesCastableAttributes` is optional — a cast that returns scalars or `JsonSerializable` objects does not need it.

---

## Mental Models

- **Wire format contract**: Think of `get` as the internal API (PHP representation) and `serialize` as the external API (JSON representation). They serve different consumers: PHP code vs HTTP clients.
- **View model separation**: Similar to how a view model transforms domain objects for presentation, `serialize` transforms casted values for serialization without altering the domain object.
- **Output boundary**: This interface marks the boundary between the model's internal state and its external representation. It decides what the outside world sees.
- **Idempotent serialization guarantee**: Because `serialize` is called instead of `get` during `toArray()`, the serialized output is consistent even if `get` has side effects or depends on mutable state.

---

## Internal Mechanics

- **Interface detection during serialization**: In `Illuminate\Database\Eloquent\Concerns\HasAttributes`, during `toArray()`, Laravel checks if the cast implements `SerializesCastableAttributes`. If it does, `serialize` is called instead of `get`.
- **`toArray()` integration**: When `toArray()` builds the attribute array, it passes the attribute value through serialization logic. For casted attributes, it calls `serialize` if available; otherwise it calls `get`.
- **`get` is still the cached value**: The `get` method remains the authoritative in-memory representation. `serialize` is an additional method that transforms the `get` output for serialization.
- **`attributes` parameter access**: The `serialize` method receives the full `$attributes` array (raw), giving access to other column values for context-aware serialization.
- **Recursive safety**: Because `serialize` replaces `get` during serialization, it prevents infinite recursion when `get` returns an object whose serialization triggers the model's `toArray()` again.

---

## Patterns

### Scalar Projection Pattern

**Purpose**: Return a complex value object in PHP but serialize it as a scalar or simple array.

**Benefits**: Hides implementation details from API consumers; reduces payload size.

**Tradeoffs**: API consumers cannot access value object methods; requires separate documentation for the API format.

### Contextual Serialization Pattern

**Purpose**: Include related data or computed values in the serialized output based on other model attributes.

**Benefits**: Enriched API responses without eager loading or appends.

**Tradeoffs**: Tight coupling between serialization and model state; can inadvertently expose sensitive data.

### Format Conversion Pattern

**Purpose**: Change the serialization format based on the consumer (e.g., converting a Money value object to `{'amount': 1000, 'currency': 'USD'}` instead of the raw integer).

**Benefits**: API-friendly output without changing the domain representation.

**Tradeoffs**: Requires maintaining both the in-memory representation and the wire format, increasing surface area.

### Null Coercion Pattern

**Purpose**: Ensure nullable casted attributes always serialize as `null` rather than producing an error or empty object.

**Benefits**: Reliable JSON output for nullable fields.

**Tradeoffs**: The serialized null may hide the distinction between "not set" and "empty value."

---

## Architectural Decisions

- **When to use `SerializesCastableAttributes`**: The cast returns a non-scalar PHP type (value object, collection, custom class) that does not naturally serialize to JSON/array.
- **When to avoid**: The cast returns scalars, arrays, or classes implementing `JsonSerializable`. There is no serialization benefit.
- **When to prefer `JsonSerializable` on the value object**: If the value object itself can implement `JsonSerializable`, it is more self-contained than adding serialization logic to the cast.
- **When to prefer this over model `$appends`**: This interface controls serialization at the cast level, affecting every model using the cast. `$appends` is model-specific and requires per-model maintenance.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clean JSON output for complex value objects | Additional interface method to maintain | In-memory and wire representations can diverge intentionally or accidentally |
| Decouples serialization from `get` | `serialize` is called on every `toArray()` invocation | Non-trivial `serialize` logic affects serialization performance |
| Prevents `json_encode` errors for non-serializable objects | Not implementing the interface when needed causes silent data loss | Objects become `{}` or `null` in JSON without warning |
| Access to full model state for context-aware output | Cast becomes coupled to model structure | Changing model structure requires updating all cast serialization methods |

---

## Performance Considerations

- **Method call overhead**: `serialize` is called once per attribute per `toArray()` call. For large collections, this adds method call overhead.
- **Caching serialized values**: Unlike `get` (which is cached on the model instance), `serialize` is called fresh each time `toArray()` is called. Repeated serialization of the same model instance does not cache.
- **Expensive serialization logic**: If `serialize` performs heavy computation (e.g., formatting, external API calls), it degrades serialization performance for collections and API responses.
- **Comparison with `get` caching**: `get` results are cached per model instance. `serialize` results are not. This asymmetry can surprise developers who optimize `get` and forget `serialize`.

---

## Production Considerations

- **API response consistency**: If a cast does not implement `SerializesCastableAttributes` but returns objects, the API response may change between development (where objects might `__toString` or get special handling) and production (strict `json_encode`).
- **Queue jobs**: If the model is passed to a queue job, the serialized attributes in the queue payload use the `serialize` output. The in-memory value is not preserved.
- **Versioning**: Changing the `serialize` output format affects all API consumers. It is a breaking change. Versioned endpoints may need different cast configurations or separate serialization logic.
- **Debugging**: `var_dump` or `dd()` on a model shows the in-memory PHP representation. The API response may show a different serialized form. This mismatch can confuse developers debugging API issues.

---

## Common Mistakes

- **Forgetting to implement the interface**: The cast returns a value object. `toArray()` produces `{}` or an error. The developer debugs for hours before realizing the serialization interface is missing.
- **Returning an incompatible type from `serialize`**: The `serialize` method can return any type, but returning an object that `json_encode` cannot handle defeats the purpose.
- **Mutating model state in `serialize`**: Because `serialize` accesses the model instance, it is tempting to modify model state. This causes side effects during serialization, which should be a pure read operation.
- **Assuming `serialize` is called always**: `serialize` is only called during `toArray()` and `toJson()`. Direct property access (`$model->attribute`) calls `get`, not `serialize`. Developers sometimes add logic to `serialize` that belongs in `get`.
- **Inconsistent null handling**: If `serialize` returns `null` for null values but the API expects an empty object or a default, the response contract is broken.

---

## Failure Modes

- **Serialization recursion**: If `serialize` accesses another attribute that triggers `toArray()` again, infinite recursion occurs.
- **Sensitive data exposure**: Because `serialize` has access to all model attributes via the `$attributes` parameter, it is easy to accidentally include sensitive data in the serialized output.
- **Breaking serialized format on cast refactor**: Changing the cast's internal representation without updating `serialize` produces a mismatch between the in-memory value and the wire format.
- **Performance degradation in collections**: Iterating 1000 models and calling `toArray()` on each invokes `serialize` 1000 times. Expensive `serialize` logic can cause N+1-like performance issues.

---

## Ecosystem Usage

- **Laravel Framework**: The `AsStringable` cast implements `SerializesCastableAttributes` to cast `Stringable` objects back to strings during serialization.
- **Spatie Laravel Data**: The Spatie data package implements serialization-aware casting for data transfer objects.
- **Laravel Money ecosystem**: Money value object casts commonly implement this interface to serialize amounts as integers and currencies as strings rather than Money objects.
- **Enum casts**: Enum casts typically implement this interface to serialize backed enums as their scalar values rather than enum instances.
- **Community value object packages**: Most Laravel value object packages implement `SerializesCastableAttributes` to ensure they integrate cleanly with API resources.

---

## Related Knowledge Units

### Prerequisites
- casts-attributes-interface — bidirectional custom casting contract
- Laravel Serialization — toArray/toJson lifecycle and model serialization

### Related Topics
- castable-interface
- value-object-casting
- Eloquent API Resources

### Advanced Follow-up Topics
- runtime-casting

---

## Research Notes

- `SerializesCastableAttributes` is located at `Illuminate\Contracts\Database\Eloquent\SerializesCastableAttributes`.
- Introduced in Laravel 8 alongside other custom cast interfaces.
- The interface is often forgotten because the cast works perfectly in normal PHP code — it only fails during serialization.
- Laravel's own error handling during serialization of non-serializable casted values is silent: `json_encode` returns `false` or produces `{}` without a clear error message.
- The interface is most commonly needed for value objects that wrap primitives (e.g., `Money`, `Email`, `PhoneNumber`).
- The `serialize` method signature changed between Laravel versions — older versions included the attribute value as a separate parameter.
