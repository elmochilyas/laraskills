# dto-patterns — Decomposition

## Implementation Patterns

| Pattern | When to Use | Complexity |
|---|---|---|
| Manual DTO with readonly properties | Any PHP 8.1+ project, no extra dependencies | Low |
| `fromModel()` named constructor | Convert Eloquent model to DTO | Low |
| `fromRequest()` named constructor | Convert validated request to DTO | Low |
| `toArray()` / `toJson()` on DTO | Serialize DTO to output format | Low |
| Nested DTOs | Complex hierarchical data (order + items) | Medium |
| DTO Collection class | Multiple DTOs with aggregate operations | Medium |
| Data Mapper (separate class) | Complex model→DTO mapping, keeps DTOs clean | Medium |
| DTO as Event payload | Versioned event data across services | Medium |
| Input DTO for Actions | Type-safe command object for service layer | Medium |

## Production Checklist

- [ ] DTOs are used at all application boundaries (controllers, queue, events).
- [ ] DTOs have no business logic — strictly data transfer.
- [ ] `fromModel()` is tested and updated when model columns change.
- [ ] DTO properties use `readonly` for immutability.
- [ ] DTO constructor uses promoted properties (PHP 8.1+).
- [ ] Relationships used in DTO mapping are eager-loaded.
- [ ] DTO serialization is tested (round-trip: model → DTO → array → JSON).
- [ ] DTOs DO NOT extend Eloquent Model or use Eloquent traits.

## Configuration Surface

| Element | Responsibility |
|---|---|
| DTO class properties | Define data contract |
| Constructor | Enforce required/optional data |
| `fromModel()` | Map Eloquent model → DTO |
| `fromArray()` | Map raw array → DTO |
| `toArray()` | Serialize DTO → output array |
| DTO Collection | Group operations on multiple DTOs |

## Related Tests

- Unit test: DTO creation with valid data
- Unit test: DTO creation with invalid data (type errors)
- Unit test: `fromModel()` produces correct DTO data
- Unit test: `toArray()` produces correct output format
- Feature test: controller action returning DTO-based response

## Edge Cases

1. **Null model** — `fromModel(null)` should return null or throw; decide convention.
2. **Missing optional field in `fromArray()`** — Default to null; document which fields are optional.
3. **Deeply nested DTOs** — Each level handles its own mapping and serialization.
4. **DTO with enum** — `toArray()` returns enum `->value` for JSON serialization.
5. **Large DTO collections (10k+)** — Use lazy collections or chunked mapping to manage memory.
6. **Backward compatibility** — Add optional fields rather than changing required ones.

## Error Scenarios

1. **Type error on construction** — PHP TypeError when passing string for int property. Catch at boundary and convert to validation response.
2. **`fromModel()` accessing unloaded relation** — N+1 or null error if relation not loaded.
3. **Serialization of non-serializable property** — DTO contains resource/closure → `toArray()` fails.
4. **Missing `fromModel()` update** — New model column silently omitted from DTO output.
5. **Circular nested DTO** — Infinite recursion on serialization.
6. **Mutable reference in DTO** — External code mutates a Carbon instance inside the DTO (use `CarbonImmutable`).
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization