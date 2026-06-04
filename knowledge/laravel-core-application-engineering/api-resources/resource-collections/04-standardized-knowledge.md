# Resource Collections

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource Collections
- **Difficulty:** Foundation
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
`ResourceCollection` transforms a collection of models (paginated or not) into a JSON array response. It extends `JsonResource` by applying the individual resource's `toArray` to each item, then wrapping the result in a standardized structure with `data`, pagination `links`, and `meta` keys.

The engineering value is consistent collection responses. Every list endpoint returns the same envelope structure. Clients can rely on `response.data` containing results, `response.meta.current_page` for pagination state, and `response.links.next` for navigation — regardless of the resource type.

## Core Concepts
- **AnonymousResourceCollection:** Using `Resource::collection()` directly creates an anonymous collection — no dedicated class needed.
- **Custom ResourceCollection:** Extend `ResourceCollection` for collection-specific behavior: custom metadata, pagination overrides, key preservation.
- **`$collects` property:** Tells the collection which resource class to use for each item. Laravel attempts to derive it from namespace if not set.
- **Pagination detection:** Automatically detects `LengthAwarePaginator` vs `Paginator` (simple) vs `CursorPaginator` and injects appropriate `links` and `meta`.
- **`paginationInformation()`:** Customization hook for pagination links and meta structure.
- **`$preserveKeys`:** Set to `true` to keep original collection keys instead of re-indexing.

## When To Use
- Any list endpoint returning multiple resources.
- Paginated responses where automatic `links` and `meta` injection is desired.
- Collection responses that need custom metadata (totals, aggregates, applied filters).
- When response consistency across all list endpoints is required.

## When NOT To Use
- Single-resource responses (use resource directly).
- Non-HTTP outputs (CLI, queue) where array formatting is fine.
- Extremely simple list endpoints where a manual `->map()` in the controller suffices and no pagination is needed.
- When the collection is empty and a bare `[]` is the expected response format.

## Best Practices (WHY)
- **Always paginate list endpoints that could exceed 50 items.** Non-paginated collections risk memory exhaustion and produce slow responses.
- **Standardize the collection envelope via a base class.** A `BaseCollection` that all collections extends ensures consistent `data`, `links`, and `meta` keys across the entire API.
- **Set `$collects` explicitly.** Never rely on namespace derivation — it breaks when resource and collection names diverge.
- **Keep pagination logic in the controller, not the collection.** The controller decides page size and paginator type; the collection only formats whatever it receives.
- **Test pagination metadata in integration tests.** Assert `links` and `meta` structure, count items, and verify page boundaries.

## Architecture Guidelines
- Prefer `AnonymousResourceCollection` (`Resource::collection()`) for simple endpoints. Introduce named `ResourceCollection` when custom metadata or pagination overrides are needed.
- Paginated collections execute two queries (count + data) via `LengthAwarePaginator` — this cost is inherent, not caused by resource usage.
- For collections >1000 items, consider cursor pagination, chunked responses, or streaming JSON to avoid memory issues.
- Non-paginated collections return a bare array when unwrapped — always wrap to avoid breaking changes when pagination is added later.

## Performance
- Collection resolution iterates once, calling `toArray()` per item. Memory usage is proportional to collection size.
- A collection of 100 resources adds ~1ms overhead. This is negligible compared to database query time.
- **Warning:** When a collection resource accesses relationships on each model without eager loading, N+1 queries occur. For 100 items accessing `$this->posts`, expect 101 queries.
- `LengthAwarePaginator` runs `COUNT(*)` — on large tables (millions of rows), consider `CursorPaginator` to skip the count query.

## Security
- Collection responses expose field sets defined by the individual resource. If relationships are conditionally loaded, ensure authorization checks exist at the controller level.
- Custom metadata added via `paginationInformation()` or `toArray()` is visible to all consumers. Do not include internal state, server paths, or unauthenticated data.
- Preserving collection keys (`$preserveKeys = true`) with non-sequential keys returns a JSON object instead of an array — some clients may misinterpret this.

## Common Mistakes

### Forgetting Pagination Metadata (desc)
Passing a plain `Collection` or array to a `ResourceCollection` expecting pagination.
- **Cause:** Using `User::all()` instead of `User::paginate()`.
- **Consequence:** No `links` or `meta` keys in the response — client pagination fails.
- **Better:** Always pass a paginator instance to collections that should be paginated.

### Preserving Keys Unintentionally (desc)
Setting `$preserveKeys = true` without understanding the effect.
- **Cause:** Copy-pasting from another resource or assuming keys are always sequential.
- **Consequence:** After filtering, the JSON response uses object keys instead of array indices, confusing clients expecting an array.
- **Better:** Only preserve keys when the client relies on them (e.g., ID-keyed maps).

### Mixing Resource Types in a Collection (desc)
Passing mixed model types to a collection with a fixed `$collects`.
- **Cause:** Assuming the collection can handle any object type.
- **Consequence:** Errors or unexpected output when `toArray()` receives the wrong model type.
- **Better:** Keep collection types homogeneous or use polymorphic resource resolution.

## Anti-Patterns
- **Collection-as-controller:** Putting pagination logic (page size, sorting) inside the collection resource. Controllers handle request parameters; resources format data.
- **Over-customized metadata:** Every collection defining different `paginationInformation()` shapes, preventing clients from writing generic pagination handlers.
- **Raw collection with sensitive data:** Passing `User::all()` to a collection without a resource, exposing all model attributes.

## Examples

### Simple Paginated Response
```php
class UserController
{
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::paginate(20));
    }
}
// Response: { "data": [...], "links": {...}, "meta": {...} }
```

### Custom Collection with Extra Metadata
```php
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;

    public function toArray($request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total_users' => $this->total(),
                'active_users' => $this->activeCount(),
            ],
        ];
    }

    private function total(): int
    {
        return $this->resource instanceof LengthAwarePaginator
            ? $this->resource->total()
            : $this->collection->count();
    }

    private function activeCount(): int
    {
        return $this->collection->filter(fn($u) => $u->is_active)->count();
    }
}
```

### PaginationInformation Override
```php
class UserCollection extends ResourceCollection
{
    public function paginationInformation($request, $paginated, $default): array
    {
        return [
            'links' => $default['links'],
            'meta' => array_merge($default['meta'], [
                'filters' => $request->only(['status', 'role']),
            ]),
        ];
    }
}
```

## Related Topics
- Resource Fundamentals — individual resource patterns
- Pagination Metadata — customizing pagination links and meta
- Data Wrapping — `data` key wrapping behavior in collections
- Conditional Relationships — eager loading in collection resources

## AI Agent Notes
- **Generate:** `php artisan make:resource UserCollection --collection` for named collection classes.
- **Key constraint:** Always set `$collects` explicitly on custom collections.
- **Validation:** Paginated responses should always include `data`, `links`, and `meta` keys.
- **Common fix:** If pagination metadata is missing, verify the collection receives a paginator (not a plain Collection).
- **Testing pattern:** Assert `$response->assertJsonStructure(['data', 'links', 'meta'])` for paginated endpoints.

## Verification
- [ ] Collection responses consistently include `data` key.
- [ ] Paginated collections include `links` and `meta` with correct structure.
- [ ] `$collects` is explicitly set on all custom resource collections.
- [ ] Controller decides pagination parameters; collection only formats.
- [ ] Relationships accessed in the collection's items are eager-loaded in the controller.
- [ ] No sensitive data exposed in custom metadata fields.
