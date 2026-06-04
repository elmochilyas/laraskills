# conditional-attributes — Decomposition

## Implementation Patterns

| Pattern | When to Use | Complexity |
|---|---|---|
| `when()` | General boolean conditions | Low |
| `whenHas()` | Attribute existence check | Low |
| `whenNotNull()` | Nullable field inclusion | Low |
| `whenLoaded()` | Eager-loaded relation data | Medium |
| `whenCounted()` | `withCount` aggregates | Medium |
| `whenAggregated()` | `withAggregate` (min/max/avg/sum) | Medium |
| `whenPivotLoaded()` | Pivot data on many-to-many | Medium |
| `mergeWhen()` | Conditional multi-field merge | Medium |
| `unless()` | Inverse condition | Low |
| `$this->when($cond)->method()` | Higher-order chaining | Medium |

## Production Checklist

- [ ] All nested resource relationships use `whenLoaded()`.
- [ ] All `withCount` fields use `whenCounted()`.
- [ ] All nullable fields use `whenNotNull()` instead of manual null checks.
- [ ] Closure values are used for expensive computations (not inline expressions).
- [ ] Tests verify both present and absent conditions for each conditional field.
- [ ] No sensitive data exposed through incorrect conditional logic.
- [ ] `mergeWhen()` is not used to merge user-controlled data.

## Configuration Surface

| Method | Parameters | Returns |
|---|---|---|
| `when($condition, $value, $default)` | bool/Closure, mixed/Closure, mixed | `Conditional` |
| `whenHas($attribute, $value, $default)` | string, mixed/Closure, mixed | `Conditional` |
| `whenNotNull($value, $default)` | mixed, mixed | `Conditional` |
| `whenLoaded($relation, $value, $default)` | string, mixed/Closure, mixed | `Conditional` |
| `whenCounted($relation, $value, $default)` | string, mixed/Closure, mixed | `Conditional` |
| `whenAggregated($relation, $column, $function, $value)` | string, string, string, mixed | `Conditional` |
| `whenPivotLoaded($table, $value, $default)` | string, mixed, mixed | `Conditional` |
| `mergeWhen($condition, $array)` | bool, array | `Conditional` |

## Related Tests

- `Illuminate\Tests\Http\Resources\ConditionallyLoadsAttributesTest`
- Feature test: assert conditional field present on resource
- Feature test: assert conditional field absent from resource
- Feature test: `assertJsonMissing('nested.relation_field')` for unloaded relation

## Edge Cases

1. **Relation loaded but null** — `whenLoaded('relation')` returns value even if the relation resolved to null. Use `whenNotNull($this->relation)` instead.
2. **Multiple conditionals on same key** — Later key overwrites earlier; only last conditional is evaluated.
3. **Nested `when()` inside value Closure** — Works, but readability suffers; extract to separate method.
4. **`whenHas('id')` on a new model** — `id` is null until saved, so `whenHas('id')` returns false for unsaved models.
5. **`whenLoaded` with morphMany** — Works identically to regular relations; checks `relationLoaded()`.

## Error Scenarios

1. Typo in relation name — `whenLoaded` silently returns false, field absent with no error.
2. `whenCounted` on unloaded count — field absent, no error.
3. `mergeWhen` keys overwrite existing keys — use `mergeWhen` for new keys, not for overriding.
4. Exception in `$value` Closure — exception bubbles up; condition is not caught.
5. Passing non-boolean condition — JavaScript truthiness differs from PHP; 0, '', '0' are falsy in PHP.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization