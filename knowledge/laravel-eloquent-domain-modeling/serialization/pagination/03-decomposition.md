# pagination — Decomposition

## Implementation Patterns

| Pattern | When to Use | Complexity |
|---|---|---|
| `paginate()` | Standard numbered pagination, need total count | Low |
| `simplePaginate()` | Infinite scroll, don't need total count | Low |
| `cursorPaginate()` | Large datasets, no offset, no total count | Medium |
| Custom `paginationInformation()` | Custom pagination metadata format | Medium |
| Paginator resource collection | Any paginated API listing | Low |
| `per_page` capping | Prevent abuse (max page size) | Low |
| Cursor on non-ID column | Custom sort order pagination | Medium |

## Production Checklist

- [ ] Pagination strategy chosen based on dataset size (cursor for >100k rows).
- [ ] `per_page` parameter is capped (e.g., `min($request->per_page, 100)`).
- [ ] Order-by column is stable (unique, indexed) for cursor pagination.
- [ ] Paginated response structure is documented and tested.
- [ ] Empty paginated response returns correct structure (`data: []`, `meta` with zeros).
- [ ] Count query performance is monitored for length-aware pagination.
- [ ] Cursor parameter validation prevents injection of malformed cursor values.
- [ ] API versioning accounts for pagination format changes.

## Configuration Surface

| Setting | Location | Default |
|---|---|---|
| `per_page` default | `Paginator` config or request | `15` |
| `per_page` max | Controller validation | App-specific |
| Paginator type | Controller return | App-specific |
| `paginationInformation()` | `ResourceCollection` override | Default links/meta |
| Page name | `paginate($perPage, $columns, $pageName)` | `'page'` |
| Cursor name | `cursorPaginate($perPage, $columns, $cursorName)` | `'cursor'` |

## Related Tests

- Feature test: paginated response structure (`data`, `links`, `meta`)
- Feature test: `assertJsonCount($perPage, 'data')`
- Feature test: cursor pagination response contains `next_cursor`
- Feature test: empty page returns `data: []` with valid meta/links
- Feature test: invalid page parameter returns 404 or first page

## Edge Cases

1. **Page 0 or negative** — `LengthAwarePaginator` normalizes to page 1.
2. **Page exceeding last_page** — Returns empty `data` array with valid meta/links.
3. **Single page of results** — No `next` link; `last` equals `first` URL.
4. **Cursor deleted** — If cursor record is deleted, paginator returns results from beginning.
5. **Empty table** — `paginate()` returns `current_page = 1`, `last_page = 1`, `total = 0`, `data = []`.
6. **High per_page value** — Memory exhaustion if not capped.

## Error Scenarios

1. **Malformed cursor** — Exception from base64_decode failure; catch and return validation error.
2. **Offset pagination on unordered query** — Duplicate/skewed results across pages.
3. **Heavy count query** — Timeout on large tables with complex WHERE clauses.
4. **`per_page` as non-integer** — Type error or invalid paginator state.
5. **Paginator passed as plain collection** — No pagination metadata in response (silent failure).
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization