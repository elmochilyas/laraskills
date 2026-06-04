# resource-wrapping

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Last Updated:** 2026-06-02

## Executive Summary

Resource wrapping in Laravel API Resources controls whether serialized data is nested under a top-level key (typically `data`) or returned flat. By default, single resources are not wrapped, and collection resources are wrapped in a `data` key. The `withoutWrapping()` method on the resource base class disables this behavior for collections, and `$wrap` property customization changes the wrapping key from `data` to a custom name. Understanding wrapping is essential for API design consistency, particularly when conforming to specifications like JSON:API or when integrating with frontend consumers that expect a specific envelope format.

## Core Concepts

- **`$wrap`** — Static property on `JsonResource` that defines the wrapping key for single resources (default `null` — no wrapping).
- **`withoutWrapping()`** — Static method that sets `$wrap = null`, disabling all wrapping globally.
- **`data` key** — The default wrapping key for collection resources (`ResourceCollection`).
- **Default behavior** — Single resources are NOT wrapped. Collections ARE wrapped in `data`.
- **`Response::withoutWrapping()`** — Call in `AppServiceProvider` to disable wrapping for the entire application.
- **Custom wrapping key** — Override `$wrap` on a per-resource basis to use a different key (e.g., `'user'` instead of `'data'`).
- **Nested wrapping** — Resources returned inside other resources respect the wrapping configuration of the outer resource.
- **`::collection()` wrapping** — Collection responses always use the `data` wrapping key unless overridden.

## Mental Models

1. **Envelope pattern** — Wrapping is the envelope around your letter (the data). Some APIs require envelopes, others deliver the letter directly.
2. **Default convention** — Single items: no envelope. Collections: envelope with `data` label.
3. **Global switch** — `withoutWrapping()` is a light switch for the entire building — turns off wrapping everywhere at once.

## Internal Mechanics

```php
// Illuminate\Http\Resources\Json\JsonResource
protected static $wrap = null; // Single resources

public static function withoutWrapping(): void
{
    static::$wrap = null;
}

public function resolve($request = null): array
{
    $data = $this->toArray($request);
    
    if (static::$wrap) {
        return [static::$wrap => $data];
    }
    
    return $data;
}

// ResourceCollection
public function resolve($request = null): array
{
    $data = $this->collection->map->toArray($request)->values()->all();
    
    $wrapped = ['data' => $data];
    
    if ($this->resource instanceof Paginator) {
        $wrapped = array_merge($wrapped, $this->paginationInformation($request));
    }
    
    return $wrapped;
}
```

Single resources wrap if `$wrap` is set (default: `null`, no wrap). Collection resources always wrap in `data` unless `$wrap` is globally set to `null` via `withoutWrapping()`. Pagination metadata is merged at the same level as `data`, not inside it.

## Patterns

- **Global wrapping removal** — Call `JsonResource::withoutWrapping()` in `AppServiceProvider` for flat responses.
- **Per-resource wrapping** — Override `$wrap = 'user'` on `UserResource` to wrap single user in `{'user': {...}}`.
- **Consistent API envelope** — Use a custom base resource class with `$wrap = 'data'` for both single and collection resources.
- **JSON:API compliance** — Set wrapping to `data` and customize pagination metadata to match spec.
- **No wrapping for SPAs** — Flat responses are easier for frontend frameworks like Vue/React to consume.
- **Version-dependent wrapping** — Use API version middleware to call `withoutWrapping()` conditionally for specific versions.

## Architectural Decisions

- Laravel distinguishes single vs collection wrapping by default, reflecting common REST API conventions (single resources are often returned flat in modern APIs).
- `withoutWrapping()` is a static method that sets a class-level property — it's not per-instance, avoiding confusion in concurrent requests.
- The wrapping key is static rather than instance-based to maintain consistency across all serializations of that resource type.
- Collection wrapping defaults to `data` as a sensible middle ground between JSON:API and flat responses.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Sensible defaults (single flat, collection wrapped) | Inconsistency between single and collection response shapes | Must decide global strategy: always wrap or never wrap |
| `withoutWrapping()` is dead simple to use | Global static — affects entire application | Use middleware for route-specific wrapping |
| `$wrap` property enables per-resource customization | Static property — not request-aware | Use resource factory if per-request wrapping is needed |
| Pagination meta sits alongside `data` | Conflict risk if a model has an attribute named `data` or `meta` | Rare, but wrap in unique key if conflicts arise |

## Performance Considerations

- Wrapping is a simple array merge operation — negligible performance cost.
- `withoutWrapping()` removes one array level — slight reduction in response size.
- For deeply nested resources, each level's wrapping behavior adds minor overhead.

## Production Considerations

- Decide on a wrapping strategy early in the project — changing from wrapped to flat in v2 is a breaking change for API consumers.
- Document the wrapping strategy in API documentation.
- Test serialization shape for both single and collection responses.
- If using wrapping, ensure the wrapping key (`data`) does not conflict with attribute names.
- Consider frontend requirements — some frontends expect unwrapped responses; others rely on the top-level key for data access patterns.

## Common Mistakes

- Expecting `withoutWrapping()` to only affect collections — it affects all resources.
- Setting `$wrap` on a resource but also calling `withoutWrapping()` — `withoutWrapping()` nullifies the custom wrap.
- Overriding `toArray()` and returning wrapped data manually — double-wrapping occurs if `$wrap` is also set.
- Assuming collection wrapping key can be changed via `$wrap` — collection wrapping uses `data` hardcoded in `ResourceCollection::resolve()`.
- Forgetting that paginated responses still include wrapping even with custom `toArray()`.

## Failure Modes

- **Inconsistent wrapping across endpoints** — Some resources have `$wrap` set, others don't, creating an inconsistent API.
- **Double wrapping** — Resource returns `['data' => ['data' => [...]]]` when manual wrapping meets automatic wrapping.
- **Wrapping key collision** — Attribute named `data` in the model conflicts with the wrapping key — results in overwritten data.
- **Breaking change in wrapping strategy** — Removing wrapping in v2 without version negotiation breaks existing clients.

## Ecosystem Usage

- **Laravel API conventions** — Default behavior (single: flat, collection: wrapped) is the most common pattern in community packages.
- **JSON:API** — The JSON:API spec requires a `data` key, making wrapped responses mandatory. Use `$wrap = 'data'` and customize pagination.
- **Laravel Sanctum SPA** — Typically uses unwrapped responses for simplicity with Axios interceptors.
- **Laravel Nova** — Uses wrapped responses internally for its CRUD API.
- **Third-party packages** — `spatie/laravel-json-api-paginate` integrates with resource wrapping to produce correct JSON:API pagination links.

## Related Knowledge Units

### Prerequisites

- **json-resource** — The resource class where wrapping is configured.

### Related Topics

- **resource-collection** — Collections have their own wrapping behavior.
- **pagination** — Pagination metadata merges at the same level as `data`.

### Advanced Follow-up Topics

None specific — these topics cover the complete resource wrapping system.

## Research Notes

- `withoutWrapping()` was introduced in Laravel 5.5 alongside API Resources.
- The `$wrap` property was originally `'data'` for all resources in early Laravel 5.5 betas but was changed to `null` for single resources before release.
- JSON:API's `data` key requirement influenced Laravel's default collection wrapping behavior.
- Community feedback continues to request per-instance wrapping control, but Laravel has maintained the static approach for simplicity.
