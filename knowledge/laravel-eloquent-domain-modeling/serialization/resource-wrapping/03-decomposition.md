# resource-wrapping — Decomposition

## Implementation Patterns

| Pattern | When to Use | Complexity |
|---|---|---|
| Default (single flat, collection wrapped) | Most Laravel API projects | Low |
| `withoutWrapping()` globally | SPA/JSON:API without envelope | Low |
| `$wrap = 'data'` on single resources | Consistent wrapping for all responses | Low |
| `$wrap = 'user'` per resource | Named envelope per resource type | Low |
| Version-dependent wrapping | API versioning with different response styles | Medium |
| Custom base class with wrapping | Enforce wrapping convention across app | Medium |
| Conditional wrapping middleware | Route/group-specific wrapping behavior | Medium |

## Production Checklist

- [ ] Wrapping strategy is documented and coded as a project standard (not ad-hoc).
- [ ] Single and collection responses are consistent in their wrapping.
- [ ] No resource has both `$wrap` and manual wrapping in `toArray()`.
- [ ] Frontend team is aligned on the wrapping strategy.
- [ ] Feature tests verify wrapping structure for all endpoint types.
- [ ] `withoutWrapping()` is called in a service provider (documented location).
- [ ] API versioning strategy accounts for wrapping changes.

## Configuration Surface

| Setting | Location | Default |
|---|---|---|
| `$wrap` (static) | `JsonResource` property | `null` for single |
| `data` key | `ResourceCollection::resolve()` | Always for collections |
| `withoutWrapping()` | Static method | N/A |
| Call location | `AppServiceProvider::boot()` | N/A |

## Related Tests

- Feature test: single resource response is NOT wrapped in `data` (default).
- Feature test: collection resource response IS wrapped in `data` (default).
- Feature test: after `withoutWrapping()`, collections are not wrapped.
- Feature test: custom `$wrap` key appears in response.
- Feature test: paginated response has `data`, `links`, `meta` at top level.

## Edge Cases

1. **`withoutWrapping()` after individual `$wrap`** — Global override wins.
2. **Resource returning other resources** — Inner resource's wrapping applies independently.
3. **Paginated withoutWrapping** — `links` and `meta` appear at top level without `data` wrapper.
4. **Empty collection with withoutWrapping** — Returns `[]` directly (no `data` key).
5. **`$wrap = ''`** — Empty string wrap key results in `{ "": {...} }` — invalid.

## Error Scenarios

1. **Double wrapping** — `toArray()` returns `['data' => [...]]` and resource has `$wrap = 'data'` — results in `{'data': {'data': [...]}}`.
2. **Static property mutation in concurrent requests** — `JsonResource::$wrap = 'user'` in one request affects subsequent requests. Use `withoutWrapping()` at boot only.
3. **`$wrap` conflict with pagination meta key** — If `$wrap = 'meta'`, it clashes with pagination meta key.
4. **Frontend expects wrapped, gets flat** — Breaking change without versioning.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization