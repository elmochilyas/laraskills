# appends

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Last Updated:** 2026-06-02

## Executive Summary

The `$appends` property on Eloquent models injects computed attribute values (accessors) into the model's array/JSON output. When a model is serialized via `toArray()` or `toJson()`, any attribute listed in `$appends` that has a matching accessor (`get{Name}Attribute`) is evaluated and included in the output. The `append()` method provides runtime appending, and `setAppends()` replaces the entire appends list. This mechanism bridges computed values (domain logic) into serialization output without requiring custom `toArray()` overrides.

## Core Concepts

- **`$appends`** — Array of accessor names to include in model serialization output. Defined at the class level.
- **`append()`** — Dynamically add an attribute to the appends list for a single model instance.
- **`setAppends()`** — Replace the entire appends array at runtime.
- **`getAppends()`** — Retrieve the current appends array.
- **Accessor requirement** — An appended attribute must have a corresponding `get{Name}Attribute` method (or a fluent accessor via `Attribute::make()->get()`).
- **Serialization-only** — Appended attributes are available in array/JSON output but are not stored in the database or available as model properties until accessed (which triggers the accessor).
- **Casting appends** — Appended attributes can also be cast via `$casts` for type transformation.

## Mental Models

1. **Virtual columns** — `$appends` adds columns to the serialized "view" of a model that don't exist in the database table.
2. **Computed property injection** — Think of appends as a way to say "when serializing, also compute and include these values."
3. **Late binding** — Appended values are computed at serialization time, not at model hydration. The accessor runs on every serialization call, so its value reflects current state.

## Internal Mechanics

```php
// Illuminate\Database\Eloquent\Model
protected function attributesToArray(): array
{
    $attributes = $this->getArrayableAttributes();
    
    foreach ($this->getArrayableAppends() as $key) {
        if (! array_key_exists($key, $attributes)) {
            $attributes[$key] = $this->getAttribute($key);
        }
    }
    
    return $attributes;
}
```

`getArrayableAppends()` returns the current appends list, filtered against `$hidden`/`$visible`. For each appended key not already present as an attribute, `getAttribute()` is called, which triggers the accessor (and any cast defined for that key).

## Patterns

- **Computed display values** — `getFullNameAttribute()` appended for name concatenation.
- **Derived booleans** — `getIsActiveAttribute()` returning `$this->status === 'active'`.
- **Cached computed values** — Cache expensive accessor results inside the accessor to avoid recomputation on repeated serialization.
- **Conditional appends** — Use `->append('expensive_computation')->toArray()` only on endpoints that need it; don't pollute the base `$appends`.
- **Trait-based appends** — Use traits to share common appends (e.g., `HasFullName`) across models.
- **Append with casts** — Combine `$appends` with `$casts` to type the appended value (e.g., `'score' => 'float'`).

## Architectural Decisions

- Appends are injected in `attributesToArray()` rather than `toArray()` to ensure they're visible in both attribute and relation serialization contexts.
- The system checks `array_key_exists` to prevent overwriting real attributes with appends.
- Fluent accessors (`Attribute::make()->get(...)`) are the modern (Laravel 9+) way to define accessors and work identically with `$appends`.
- No eager-loading relationship exists for appends — expensive computations must be cached or moved to resource classes.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Declarative inclusion of computed values | Accessor runs on every serialization | Cache inside accessor or use API Resources for computed fields |
| Simple syntax (just add to array) | No built-in dependency tracking between appends | Manually manage ordering if appends depend on each other |
| Works with any accessor (old or fluent) | Appended values look like real attributes in output | API consumers may expect them as DB columns; document them |
| Runtime `append()` enables context-aware output | Instance mutation risk shared across code paths | Clone model before appending conditionally |

## Performance Considerations

- Every call to `toArray()` on a model with appends invokes all accessor methods — each one may run queries.
- Cache expensive accessor results: `$this->cached_value ??= $this->computeExpensiveValue()`.
- For bulk serialization (collections), appends are evaluated per model; N models × M appends = N×M accessor calls.
- Consider API Resources with computed fields instead of appends for hot paths.

## Production Considerations

- Use `$appends` sparingly on models returned in listing endpoints (collections). Prefer `->append(...)` on the specific path that needs it.
- Document appended attributes in API documentation to distinguish from DB columns.
- Test that appended accessors do not throw exceptions with null/empty data.
- If an appended attribute requires a relationship, ensure the relationship is eager-loaded to avoid N+1.
- `->setAppends([])` can disable all appends momentarily for a serialization call that doesn't need them.

## Common Mistakes

- Defining `$appends` but forgetting to create the accessor method — throws `BadMethodCallException`.
- Appending an attribute that queries a relation without eager-loading that relation — N+1 on serialization.
- Expecting `$appends` to work on non-serialization access — `$model->appended_value` works (triggers accessor) but `$model->getAttribute('appended_value')` also works.
- Using `$appends` for heavy computation on a frequently serialized model (dashboard endpoint).
- Appending the same name as a real column — the real column is not overwritten; the accessor is not called.

## Failure Modes

- **Accessor exception** — If a `get{Name}Attribute` method throws, the entire `toArray()` call fails.
- **N+1 on serialization** — Appended attribute calls `$this->relation()->value` on each model; relationship not eager-loaded.
- **Memory bloat** — Appended computed values that build large strings or arrays consume memory per model on collection serialization.
- **Circular append** — Append A calls append B, append B calls append A — stack overflow.

## Ecosystem Usage

- **Laravel API Resources** — Resources can override `toArray()` to compute fields directly rather than relying on model `$appends`.
- **Laravel Nova** — Nova fields can use `displayUsing` to show computed values without `$appends`.
- **Laravel Sanctum** — Token abilities/appends used to include `abilities` in serialized output.

## Related Knowledge Units

### Prerequisites

- **to-array-to-json** — The serialization pipeline where appends are injected.

### Related Topics

- **hidden-visible** — Appended attributes are also subject to `$hidden`/`$visible`.
- **json-resource** — Alternative approach for computed fields in serialization.

### Advanced Follow-up Topics

None specific — these topics cover the complete appends system.

## Research Notes

- `$appends` was introduced in Laravel 4.1 as part of the accessor/mutator system.
- Fluent accessors (Laravel 9+) made `$appends` cleaner by removing the need for the verbose `get{Name}Attribute` naming convention.
- There is no built-in mechanism for "conditional append" (e.g., only append for specific API versions). Handle this via resource classes or `append()` calls in middleware.
