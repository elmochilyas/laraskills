# hidden-visible — Decomposition

## Implementation Patterns

| Pattern | When to Use | Complexity |
|---|---|---|
| Static `$hidden` array | Always-on exclusion (passwords, tokens) | Low |
| Static `$visible` array | Strict API contract (only what's in array is output) | Low |
| `makeHidden()` at runtime | Per-request exclusions (public vs admin responses) | Low |
| `makeVisible()` at runtime | Per-instance overrides (rare access to hidden fields) | Low |
| `$pivotHidden` array | Filter pivot table columns (e.g., `created_at`, `role`) | Low |
| Resource class filtering | Complex visibility logic per attribute/role | Medium |

## Production Checklist

- [ ] All sensitive columns are in `$hidden` on base models.
- [ ] `$pivotHidden` defined for every `BelongsToMany` pivot with extra columns.
- [ ] No model uses both `$hidden` and `$visible` (mutually exclusive).
- [ ] Runtime `makeHidden`/`makeVisible` calls are scoped to cloned or fresh instances.
- [ ] New columns added to models are reviewed for inclusion in `$hidden`.
- [ ] Feature tests assert hidden fields are absent from API responses.
- [ ] Feature tests assert visible-only fields are absent from API responses.

## Configuration Surface

| Setting | Location | Default |
|---|---|---|
| `$hidden` | `Model` property (array) | `[]` |
| `$visible` | `Model` property (array) | `[]` |
| `$pivotHidden` | `Model` property (array) | `[]` |
| `makeHidden()` | Runtime instance method | N/A |
| `makeVisible()` | Runtime instance method | N/A |
| `setHidden()` | Runtime instance method | N/A |
| `setVisible()` | Runtime instance method | N/A |

## Related Tests

- `Illuminate\Tests\Database\DatabaseEloquentModelTest::testHiddenAreRemovedFromArray`
- `Illuminate\Tests\Database\DatabaseEloquentModelTest::testVisible`
- `Illuminate\Tests\Database\DatabaseEloquentModelTest::testMakeVisible`
- Feature tests: assertJsonPath for hidden field absence

## Edge Cases

1. **Both `$hidden` and `$visible` set** — `$visible` wins, `$hidden` is ignored.
2. **Accessor key in `$hidden`** — The accessor value is hidden even though it's computed.
3. **Appended attribute in `$hidden`** — If an append is added to `$appends` and also `$hidden`, it will not appear in output.
4. **`$visible` with no matching attributes** — Returns an empty array, which may break API consumers expecting certain keys.
5. **Pivot data without `$pivotHidden`** — All pivot extra columns are serialized, including potentially sensitive meta-data.

## Error Scenarios

1. Typo in `$hidden` attribute name — attribute is not hidden (silently still exposed).
2. `makeVisible` called on a model in a global scope — leaks into other request handlers sharing the same instance.
3. `$visible` set to `['id']` only — all other attributes (including `created_at`, `updated_at`) are stripped from output.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization