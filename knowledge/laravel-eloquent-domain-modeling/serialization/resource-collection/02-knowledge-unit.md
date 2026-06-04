# resource-collection

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Last Updated:** 2026-06-02

## Executive Summary

Resource collections in Laravel API Resources handle the serialization of multiple models (collections, paginators) into a JSON array response. A `ResourceCollection` wraps a collection of resources and controls the top-level structure — the `data` key, pagination metadata, and custom collection-level attributes. While `Resource::collection()` generates a default collection, custom `ResourceCollection` classes allow overriding the collection-wide behavior, including how individual items are serialized and what metadata is included.

## Core Concepts

- **`ResourceCollection`** — Base class for custom collection resources. Extends `JsonResource`.
- **`Resource::collection()`** — Static method on `JsonResource` that returns an anonymous `ResourceCollection` wrapping the given items.
- **`$this->collection`** — The underlying collection/paginator instance inside the collection resource.
- **`collects`** — Property on `ResourceCollection` that specifies the resource class for individual items (defaults to the calling resource).
- **`paginationInformation()`** — Method that returns pagination metadata (`links`, `meta` blocks).
- **`toArray($request)`** — Override to customize the collection-level array structure.
- **`with($request)`** — Add top-level metadata alongside the data collection.
- **`paginated` vs `non-paginated`** — Resource collections auto-detect paginators and include pagination metadata.

## Mental Models

1. **Container with metadata** — A resource collection is a container for individual resources, adding top-level keys like pagination links and totals.
2. **Templated wrapper** — The collection wraps each item in the resource class, like a map transformation with smart defaults.
3. **Pagination auto-detection** — Pass a paginator, and the collection automatically adds meta/links; pass a plain collection, and it's just the data array.

## Internal Mechanics

```php
// Illuminate\Http\Resources\Json\ResourceCollection
class ResourceCollection extends JsonResource
{
    public $collects; // The resource class for each item
    
    public function toArray($request): array
    {
        return $this->collection->map->toArray($request)->all();
    }
    
    public function resolve($request = null): array
    {
        $data = $this->toArray($request);
        
        if ($this->resource instanceof Paginator) {
            $pagination = $this->paginationInformation($request);
            // Merge pagination data with collection data
        }
        
        return $data;
    }
    
    public function paginationInformation($request): array
    {
        $paginated = $this->resource->toArray();
        // Returns ['links' => [...], 'meta' => [...]]
    }
}
```

When `Resource::collection()` is called, it creates an instance of `ResourceCollection`. If a custom `ResourceCollection` class exists with the matching convention (`{Model}Collection`), it uses that; otherwise, it uses the base `ResourceCollection`. The collection auto-detects paginators via `instanceof Paginator`.

## Patterns

- **Custom collection classes** — Create explicit `UserCollection` extending `ResourceCollection` for collection-specific logic.
- **Custom pagination structure** — Override `paginationInformation()` to change the format of links/meta.
- **Collection-level computed fields** — Add aggregates like `total_revenue` or `count` via `with()`.
- **Merge pagination with data** — Control whether pagination is wrapped inside `data` or at the same level.
- **Non-paginated collections** — Use `Resource::collection()` directly for simple list endpoints.
- **Key preservation** — Set `$preserveKeys = true` on the collection if the original collection keys must be kept.

## Architectural Decisions

- Collections auto-detect paginators, distinguishing between `LengthAwarePaginator`, `CursorPaginator`, and plain collections.
- The `collects` property enables a custom collection to reference any resource class, not just the conventionally paired one.
- Laravel chose to make `ResourceCollection` extend `JsonResource` (rather than a separate base class) for simplicity, even though a collection is conceptually different from a single resource.
- Pagination information is appended at the top level alongside `data`, following JSON:API conventions loosely.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Auto-detects pagination, adds correct metadata | Paginator detection can be confused by custom paginator implementations | Ensure custom paginators extend Laravel's base classes |
| `collects` property enables resource reuse | Convention-based naming can be opaque — use explicit `$collects` | Always declare `$collects` in custom collection classes for clarity |
| `with()` merges arbitrary top-level data | No built-in key conflict detection with pagination keys | Use namespaced keys like `meta: { ... }` to avoid collisions |
| Zero-config for simple lists | Anonymous base collections lack customization hooks | Create named collection classes once complex metadata is needed |

## Performance Considerations

- Collection resources map each item individually — for 10,000 items, 10,000 resource objects are created.
- `paginationInformation()` calls `$paginator->toArray()` internally, which includes some overhead. Cache the result if rendering the same paginator multiple times.
- Preserving keys (`$preserveKeys = true`) prevents array re-indexing but may surprise JSON consumers expecting sequential indices.
- Custom `toArray()` logic runs once at the collection level, not per item, so it's free relative to per-item transforms.

## Production Considerations

- Always paginate collection endpoints for large datasets — plain collections serialized as resources consume unbounded memory.
- Override `paginationInformation()` if the default structure doesn't match your API spec.
- Use `ResourceCollection` subclasses rather than anonymous ones once you need custom metadata.
- Test both paginated and non-paginated response structures in feature tests.
- Set `$collects` explicitly in custom collection classes to avoid ambiguity.

## Common Mistakes

- Expecting `Resource::collection($paginator)` to return the same structure as `new ResourceCollection($paginator)` — they behave identically.
- Overriding `toArray()` but forgetting to call `$this->collection->map->toArray($request)` — results in no item data.
- Not using `when()` conditions for optional collection-level meta fields.
- Passing a plain array instead of a Collection or Paginator instance — causes errors.
- Modifying `$this->collection` inside `toArray()` — it's the wrapped resource, not a mutable copy.

## Failure Modes

- **Wrong resource class** — Collection wraps items with the wrong resource if `$collects` is not set and convention fails.
- **Paginator detection failure** — Custom paginator not extending Laravel's base classes results in missing pagination metadata.
- **Memory blowout** — Serializing an un-paginated collection of 50,000 models as a resource collection.
- **Key conflict** — Both `with()` and `paginationInformation()` return a `meta` key; one overwrites the other.

## Ecosystem Usage

- **Laravel API conventions** — All listing endpoints should return paginated resource collections.
- **Laravel Nova** — Custom `Lens` and card responses use collection-like patterns (not resource collections directly).
- **spatie/laravel-query-builder** — Integrates with API Resources for paginated JSON responses via `AllowedFilter` and pagination.

## Related Knowledge Units

### Prerequisites

- **json-resource** — The item-level resource that collections wrap.

### Related Topics

- **pagination** — Paginated resource response mechanics.
- **resource-wrapping** — Data key wrapping behavior on collections.
- **conditional-attributes** — Conditional field inclusion within collection items.

### Advanced Follow-up Topics

None specific — these topics cover the complete resource collection system.

## Research Notes

- `ResourceCollection` was introduced in Laravel 5.5 alongside API Resources.
- The `$collects` property defaults to the calling resource's class name by stripping "Collection" if present.
- Cursor pagination support was added to resource collections in Laravel 8.x.
- Custom pagination information was improved in Laravel 9.x with more flexible `paginationInformation()` override support.
