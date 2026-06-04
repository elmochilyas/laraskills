# to-array-to-json — Decomposition

## Implementation Patterns

| Pattern | When to Use | Complexity |
|---|---|---|
| Override `toArray()` | Need custom shape (rename keys, flatten, compute) | Medium |
| Override `serializeDate()` | Change default date format globally | Low |
| Override `jsonSerialize()` | Different array vs JSON output | Medium |
| Custom Caster `transform()` | Attribute-level transform during serialization | Medium |
| Macro on Model | Add `toArrayWithMeta()` or similar helper | Low |

## Production Checklist

- [ ] All sensitive attributes are in `$hidden`.
- [ ] `toArray()` is tested in feature tests for every model exposed via API.
- [ ] Date format is consistent across all models (set via parent `serializeDate()`).
- [ ] Appended accessors do not trigger N+1 queries.
- [ ] Relationship serialization tests verify nested output structure.
- [ ] `json_encode` errors are logged (use `JSON_THROW_ON_ERROR` in critical paths).
- [ ] Circular relation detection is in place for custom `toArray()` overrides.

## Configuration Surface

| Setting | Location | Default |
|---|---|---|
| `$dateFormat` | `Model` property | `'Y-m-d H:i:s'` |
| `$casts` | `Model` property | `[]` |
| `$appends` | `Model` property | `[]` |
| `$hidden` | `Model` property | `[]` |
| `$visible` | `Model` property | `[]` |
| `serializeDate()` | `Model` method | Carbon `toDateTimeString()` |

## Related Tests

- `Illuminate\Tests\Database\DatabaseEloquentModelTest::testToArray`
- `Illuminate\Tests\Database\DatabaseEloquentModelTest::testToJson`
- `Illuminate\Tests\Database\DatabaseEloquentModelTest::testJsonSerialize`
- Feature test: assert serialization output structure for API endpoints

## Edge Cases

1. **Empty model** — `toArray()` on a new unsaved model returns only the attributes explicitly set.
2. **Model with no relations loaded** — `relationsToArray()` returns `[]`, no relation keys in output.
3. **Soft-deleted model** — `deleted_at` is included in array if cast as a date.
4. **Multi-word attributes** — Snake_case keys are preserved in `toArray()` unless overridden.
5. **Enum-backed casts** — Enum `value` is used in array output, not the full enum instance.

## Error Scenarios

1. `json_encode` returns `false` → response body becomes `null` without warning.
2. Circular `belongsToMany` → infinite recursion in `relationsToArray()`.
3. Accessor in `$appends` throws exception → entire `toArray()` fails.
4. Non-serializable attribute (e.g., resource stream) → `json_encode` fails silently.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization