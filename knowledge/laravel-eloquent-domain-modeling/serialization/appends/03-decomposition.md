# appends — Decomposition

## Implementation Patterns

| Pattern | When to Use | Complexity |
|---|---|---|
| Static `$appends` array | Always-needed computed values | Low |
| Runtime `append()` | Endpoint-specific computed values | Low |
| `setAppends([])` before serialization | Temporarily disable all appends | Low |
| Appends with casts | Type-force appended values (e.g., float) | Low |
| Trait-based shared appends | Common computed values across models | Low |
| Accessor caching via `??=` | Expensive accessor computation | Medium |
| Resource class computed fields | Alternative to appends for API layer | Medium |

## Production Checklist

- [ ] All accessors referenced in `$appends` are defined (no broken references).
- [ ] Expensive accessors use instance caching (`$this->cached ??= ...`).
- [ ] Accessors requiring relationships have those relationships eager-loaded.
- [ ] Listing endpoints are not serializing heavy `$appends` on every model.
- [ ] Appended attributes are documented in API specs.
- [ ] Tests cover accessor behavior with null/empty/missing relationship data.
- [ ] No circular append dependencies exist.

## Configuration Surface

| Setting | Location | Default |
|---|---|---|
| `$appends` | `Model` property (array) | `[]` |
| `append()` | Runtime instance method | N/A |
| `setAppends()` | Runtime instance method | N/A |
| `getAppends()` | Runtime instance method | `[]` |
| Accessor definition | `Model` method | N/A |

## Related Tests

- `Illuminate\Tests\Database\DatabaseEloquentModelTest::testAppends`
- `Illuminate\Tests\Database\DatabaseEloquentModelTest::testAppendsWithCasts`
- Feature test: assert appended attribute exists in serialized output

## Edge Cases

1. **Append name matches real column** — Real column takes precedence; accessor is never called.
2. **Appended attribute also in `$hidden`** — The attribute is hidden and excluded from serialization.
3. **Appended attribute with `$visible` active** — Must be in `$visible` array or it's excluded.
4. **Null accessor return** — The appended key appears in output with `null` value.
5. **Appended attribute calling relation in a loop** — Causes N+1 if relation not eager-loaded.
6. **Append accessed before serialization** — `$model->appended_value` works identically; no double computation.

## Error Scenarios

1. Missing accessor method → `BadMethodCallException` during `toArray()`.
2. Accessor throws exception → entire serialization fails.
3. Circular appends → infinite recursion / PHP max call stack.
4. Accessor returns non-serializable value → `json_encode` fails silently.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization