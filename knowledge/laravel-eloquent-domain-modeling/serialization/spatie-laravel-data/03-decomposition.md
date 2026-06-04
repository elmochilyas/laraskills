# spatie-laravel-data — Decomposition

## Implementation Patterns

| Pattern | When to Use | Complexity |
|---|---|---|
| `Data` class with typed properties | Structured data transfer at any boundary | Low |
| `Data::from()` with validation | Input DTO with inline validation | Low |
| `Data::fromModel()` | Create DTO from Eloquent model | Low |
| `Data::collection()` | Typed collection of data objects | Low |
| `Optional` for partial data | Update endpoints (PATCH) | Medium |
| Custom caster | Custom value objects (Money, Address) | Medium |
| Custom transformer | Output formatting (dates, numbers, URLs) | Medium |
| `only()` / `except()` on output | Selective field inclusion | Low |
| Nested Data objects | Complex hierarchies (order + items) | Low |
| Data + API Resource hybrid | HTTP + channel-agnostic serialization | Medium |

## Production Checklist

- [ ] Custom casters and transformers are registered in a ServiceProvider.
- [ ] `rules()` method is defined on all Data classes used for input.
- [ ] `Optional` is used for PATCH/update endpoints.
- [ ] Data classes contain no business logic (strictly data).
- [ ] Reflection cache is cleared on deploy.
- [ ] Nested Data relationships are tested for circular references.
- [ ] `DataCollection` is used consistently for list endpoints.
- [ ] snake_case vs camelCase convention is documented and followed.

## Configuration Surface

| Element | Location | Purpose |
|---|---|---|
| Data class | `App\Data\*` | Data structure definition |
| `rules()` | Data class method | Input validation rules |
| Custom caster | `App\Casters\*` | Custom input casting |
| Custom transformer | `App\Transformers\*` | Custom output formatting |
| `DataCollection` | Generated/Manual | Typed collection wrapper |
| Config | `config/data.php` | Global package configuration |
| ServiceProvider | `AppServiceProvider` | Register casters/transformers |

## Related Tests

- Unit test: Data creation via `from()` with valid data
- Unit test: Data creation via `from()` with invalid data (validation error)
- Unit test: `fromModel()` mapping correctness
- Unit test: `toArray()` output format
- Unit test: `Optional` handling for partial updates
- Unit test: Custom caster/transformer behavior
- Feature test: Endpoint using Data → Action → Data flow

## Edge Cases

1. **Empty `from([])`** — All non-optional properties raise validation errors or type errors.
2. **Optional nested Data** — Nested Data property with `Optional` — handled gracefully.
3. **Enum property** — Automatically cast from string/int to backed enum.
4. **`null` vs `Optional`** — `null` explicitly sets null; `Optional` means "not provided."
5. **Mapped collection with different keys** — `Data::collection($array)` expects sequential arrays; use `map()` for associative.
6. **Circular nested Data** — Requires manual break (lazy resolution or reference by ID).

## Error Scenarios

1. **Uncastable type in `from()`** — Throws `Spatie\LaravelData\Exceptions\CannotCast`.
2. **Validation failure** — Throws `Spatie\LaravelData\Exceptions\ValidationException`.
3. **Missing `rules()` for input** — Invalid data passes through silently.
4. **Reflection error on undeclared property** — PHP error if dynamic property is assigned.
5. **Circular reference** — PHP `Maximum function nesting level` error.
6. **Data class serialization in queue** — Must ensure Data class is serializable (no Closures).
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization