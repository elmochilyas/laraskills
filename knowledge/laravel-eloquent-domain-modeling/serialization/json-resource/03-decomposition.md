# json-resource — Decomposition

## Implementation Patterns

| Pattern | When to Use | Complexity |
|---|---|---|
| Attribute mapping | Rename snake_case DB to camelCase API | Low |
| Computed fields | Derived values without model appends | Low |
| Nested resources | Include relation data in response | Medium |
| Conditional inclusion | `when()`, `whenLoaded()`, `whenHas()` | Medium |
| Sparse fieldsets | Consumer-specified field inclusion | High |
| API versioning via classes | v1/UserResource vs v2/UserResource | Medium |
| `with()` metadata | Top-level meta (version, timestamps) | Low |
| `withResponse()` headers | Custom response headers per resource | Low |

## Production Checklist

- [ ] Relationships used in nested resources are always eager-loaded.
- [ ] Resources contain no SQL queries or business logic.
- [ ] `whenLoaded()` guards all nested relationship resources.
- [ ] Sensitive fields are excluded (rely on model `$hidden` as fallback).
- [ ] Resource structure is tested via `assertJsonStructure`.
- [ ] Paginated collection resources use `ResourceCollection` correctly.
- [ ] API versioning strategy is documented (namespace or directory-based).
- [ ] No circular resource references exist.

## Configuration Surface

| Element | Location | Purpose |
|---|---|---|
| `toArray($request)` | Resource class | Define output shape |
| `with($request)` | Resource class | Top-level metadata |
| `withResponse($request, $response)` | Resource class | Response manipulation |
| `Resource::make()` | Controller | Wrap single model |
| `Resource::collection()` | Controller | Wrap collection |
| `$this->resource` | Resource class | Access underlying model |
| `$this->preserveKeys` | Resource class | Preserve collection keys |

## Related Tests

- Feature test: `assertJsonStructure` matching resource structure
- Feature test: `assertJsonMissing` for conditionally-excluded fields
- Feature test: `assertJsonPath` for specific nested values
- Resource unit tests: instantiate resource and assert `resolve()` output

## Edge Cases

1. **Null resource** — `new UserResource(null)` returns empty response — handle optional relationships with `whenLoaded()`.
2. **Empty collection** — `UserResource::collection(collect())` returns `{"data": []}` wrapped in data key.
3. **Paginator vs collection** — `Resource::collection($paginator)` detects `LengthAwarePaginator` and adds meta.
4. **Resource wrapping disabled** — `withoutWrapping()` on route removes `data` key.
5. **Multiple resources per model** — Different contexts (admin vs public) use different resource classes.

## Error Scenarios

1. Missing `toArray()` override — defaults to `$this->resource->toArray()` (model serialization).
2. Resource without `$this->resource` — throws error on null resource access.
3. Nested resource with unloaded relation — `Call to undefined method` on null.
4. Resource in queue — `JsonSerializable` is used; verify `resolve()` output matches expectations.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization