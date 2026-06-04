# Resource Collection — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Resource Collection
- **ECC Version:** 1.0

## Overview
Resource collections in Laravel API Resources handle serialization of multiple models (collections, paginators) into JSON array responses. A `ResourceCollection` wraps a set of items and controls the top-level structure — the `data` key, pagination metadata, and custom collection-level attributes. While `Resource::collection()` generates a default collection, custom `ResourceCollection` classes allow overriding collection-wide behavior including item serialization and metadata.

## Core Concepts
- `ResourceCollection` — base class for custom collection resources; extends `JsonResource`
- `Resource::collection()` — static method returning an anonymous `ResourceCollection` wrapping the given items
- `$this->collection` — the underlying items/paginator instance inside the collection resource
- `$collects` — property specifying the resource class for individual items (defaults to calling resource)
- `paginationInformation()` — returns pagination metadata (`links`, `meta` blocks)
- `toArray($request)` — override to customize collection-level array structure
- `with($request)` — add top-level metadata alongside the data collection
- Auto-detection — collections detect paginators and include pagination metadata automatically

## When To Use
- Any listing endpoint returning a collection of models wrapped in resources
- When you need pagination metadata (`links`, `meta`) alongside the data array
- When you need collection-level computed fields (aggregates, totals, counts)
- When you need custom pagination structure that differs from the default
- When you need to preserve original collection keys (`$preserveKeys = true`)

## When NOT To Use
- Do NOT use for single-item responses — use `Resource::make()` or `new Resource()`
- Do NOT use when you need different resource classes per-item within the same collection
- Do NOT use anonymous `Resource::collection()` if you need custom metadata — create a named collection class
- Do NOT use for non-HTT`P serialization — use DTO collections or array mapping instead

## Best Practices (WHY)
- Always paginate collection endpoints — plain collections serialized as resources consume unbounded memory
- Set `$collects` explicitly in custom collection classes to avoid ambiguity
- Override `paginationInformation()` when the default structure doesn't match your API specification
- Test both paginated and non-paginated response structures in feature tests
- Use named `ResourceCollection` subclasses once you need custom metadata beyond the defaults

## Architecture Guidelines
- Place custom collection classes alongside their item resources (`UserCollection` next to `UserResource`)
- Use `Resource::collection()` for simple lists; graduate to named collection classes when metadata needs grow
- Keep collection-level `toArray()` focused on structural wrapping — don't add business logic there
- Collection metadata belongs in `with()`, not in the item serialization
- Decide on a pagination metadata format early and apply it consistently across all collections

## Performance
- Collection resources map each item individually — for 10k items, 10k resource objects are created
- `paginationInformation()` calls `$paginator->toArray()` which includes overhead — cache if rendering the same paginator multiple times
- `$preserveKeys = true` prevents array re-indexing but may surprise JSON consumers expecting sequential indices
- Custom `toArray()` logic runs once at the collection level, not per-item — negligible overhead

## Security
- Collection-level metadata in `with()` may leak internal information (total count with sensitive filters)
- `paginationInformation()` exposes the current page and total count — ensure this doesn't violate data access policies
- Empty collections return `{"data": []}` — ensure this doesn't reveal the existence of a resource type to unauthorized users
- Key preservation (`$preserveKeys`) may expose internal database IDs if keys are not sanitized

## Common Mistakes
- Expecting `Resource::collection($paginator)` to return a different structure from `new ResourceCollection($paginator)` — they are identical
- Overriding `toArray()` but forgetting to map items with `$this->collection->map->toArray($request)`
- Not using `when()` for optional collection-level meta fields that should not always appear
- Passing a plain array instead of a Collection or Paginator instance — causes method-not-found errors
- Modifying `$this->collection` inside `toArray()` — it's the wrapped resource, not a mutable copy

## Anti-Patterns
- **Anonymous collection with custom needs**: using `Resource::collection()` when you need custom metadata, forcing workarounds outside the resource
- **Missing `$collects`**: relying on convention-based naming that silently resolves to the wrong resource class
- **Unpaginated collections**: exposing unbounded data arrays that grow indefinitely with the database
- **Per-item logic in collection `toArray()`**: running item-level transformations at the collection level instead of in the item resource

## Examples
```php
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total_active' => $this->collection->sum('is_active'),
                'version' => '1.0',
            ],
        ];
    }

    public function with(Request $request): array
    {
        return [
            'status' => 'success',
        ];
    }
}

// In controller:
return new UserCollection(User::paginate());
// Or simpler:
return UserResource::collection(User::paginate());
```

## Related Topics
- json-resource — the item-level resource that collections wrap
- pagination — paginated resource response mechanics
- resource-wrapping — data key wrapping behavior on collections
- conditional-attributes — conditional field inclusion within collection items

## AI Agent Notes
- Use `Resource::collection($paginator)` for simple paginated listings; create named `ResourceCollection` for custom needs
- Always set `$collects` explicitly in custom collection classes
- Pagination metadata is auto-included when passing a paginator — test that it appears correctly
- Empty collections return `{"data": []}` — a valid response, not an error
- For un-paginated collections, the response is just `{"data": [...]}` without `links`/`meta`

## Verification
- [ ] All collection endpoints are paginated (length-aware or cursor)
- [ ] Custom `ResourceCollection` classes declare `$collects` explicitly
- [ ] Pagination metadata format matches API documentation
- [ ] Collection tests cover both empty and populated states
- [ ] Paginated response includes `links` and `meta` keys
- [ ] Non-paginated response does not include pagination keys
- [ ] No un-paginated collection of unbounded size is exposed via API
