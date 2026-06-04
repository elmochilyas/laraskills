# resource-collection — Decomposition

## Implementation Patterns

| Pattern | When to Use | Complexity |
|---|---|---|
| `Resource::collection()` | Simple list endpoints, no custom metadata | Low |
| Custom `ResourceCollection` subclass | Need custom meta, aggregates, or pagination shape | Medium |
| Override `paginationInformation()` | API spec requires custom pagination format | Medium |
| `with()` for collection meta | Add aggregates, counts, version info | Low |
| `$collects` property | Reuse collection class with different item resources | Low |
| `$preserveKeys = true` | Non-sequential collections (map with IDs as keys) | Low |

## Production Checklist

- [ ] All collection endpoints are paginated (either length-aware or cursor).
- [ ] Custom `ResourceCollection` classes declare `$collects` explicitly.
- [ ] Pagination metadata format matches API documentation.
- [ ] Collection tests cover both empty and populated states.
- [ ] Test that paginated response includes `links` and `meta`.
- [ ] Test that non-paginated response does not include pagination keys.
- [ ] No un-paginated collection of unbounded size is exposed via API.

## Configuration Surface

| Element | Location | Purpose |
|---|---|---|
| `$collects` | `ResourceCollection` property | Resource class for items |
| `$preserveKeys` | `ResourceCollection` property | Preserve original keys |
| `toArray($request)` | `ResourceCollection` method | Collection-level array structure |
| `paginationInformation($request)` | `ResourceCollection` method | Pagination metadata shape |
| `with($request)` | `ResourceCollection` method | Additional top-level data |
| `$this->collection` | `ResourceCollection` context | Access items inside collection |

## Related Tests

- Feature test: `assertJsonStructure(['data' => [...], 'links' => [...], 'meta' => [...]])`
- Feature test: `assertJsonCount($perPage, 'data')` for paginated results
- Feature test: empty collection returns `{'data': []}`
- Unit test: custom `ResourceCollection` resolve output

## Edge Cases

1. **Empty paginated collection** — `data` is `[]`, `links` and `meta` still present with zero totals.
2. **Single-item collection** — Still wrapped in `data` array with one element.
3. **Keyed collection** — `['user_1' => $user]` — by default re-indexed to `[0, 1, ...]` unless `$preserveKeys = true`.
4. **Paginator with custom page name** — Pagination links use the custom page query parameter.
5. **Cursor paginator** — `meta` includes `next_cursor`, `prev_cursor`, `per_page` instead of `current_page`, `last_page`.

## Error Scenarios

1. Passing `null` to `Resource::collection()` — throws error trying to map over null.
2. Passing plain array without wrapping in `collect()` — method `map` doesn't exist on array; throws error.
3. Paginator detection fails — no `links`/`meta` in response, confusing client.
4. `$collects` pointing to non-existent class — throws class not found error on serialization.
5. Modifying `$this->collection` — affects shared state; subsequent serialization uses modified collection.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization