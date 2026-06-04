# Resource Collections

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource Collections
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

`ResourceCollection` transforms a collection of models (paginated or not) into a JSON array response. It extends `JsonResource` by applying the individual resource's `toArray` to each item in the collection, then wrapping the result in a standardized structure with `data`, pagination `links`, and `meta` keys.

The engineering value is consistent collection responses. Every list endpoint returns the same envelope structure. Clients can rely on `response.data` containing the results, `response.meta.current_page` for pagination, and `response.links.next` for navigation — regardless of the resource type.

---

## Core Concepts

### AnonymousResourceCollection

Using `Resource::collection()` directly creates an `AnonymousResourceCollection` — a generic collection resource based on the individual resource:

```php
return UserResource::collection(User::all());
// Returns: { "data": [ { "id": 1, ... }, { "id": 2, ... } ] }
```

The collection class is inferred from the individual resource. No dedicated collection class is needed.

### Custom ResourceCollection

For collection-specific behavior (custom metadata, pagination overrides), extend `ResourceCollection`:

```php
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;

    public function toArray($request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total_users' => $this->collection->count(),
            ],
        ];
    }
}
```

### Pagination Detection

`ResourceCollection` automatically detects whether the underlying collection is a `LengthAwarePaginator` or `Paginator`. If paginated, it adds `links` and `meta` to the response.

---

## Mental Models

### The Grid

A resource collection is like a display grid: individual items (resources) are placed in cells, and the grid adds headers and footers (metadata, navigation links). The grid structure is consistent across all pages; only the cell contents change.

### The Envelope

The collection is the envelope around individual items. The envelope has standard fields (`data`, `links`, `meta`) that clients parse first. Specialized collections can add custom envelope fields.

---

## Internal Mechanics

### Collection Resolution

When `Resource::collection()` is called:

1. Individual resource created for each collection item
2. Each item's `toArray($request)` is called
3. Results are merged into the collection's `toArray($request)`
4. Pagination metadata auto-appended if detected

The `$this->collection` property inside a `ResourceCollection` holds the resolved array of individual resource arrays.

### PaginationMetadata Injection

`ResourceCollection` checks if `$this->resource` is a `Paginator` or `LengthAwarePaginator`. If so, it injects:

```php
'links' => $this->paginationLinks(),
'meta' => $this->paginationMeta(),
```

These are extracted from `PaginatedResourceResponse::paginationInformation()`.

### $collects Property

The `$collects` property tells the collection which resource class to use for each item:

```php
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;
}
```

If not specified, Laravel attempts to derive the resource class from the collection namespace (e.g., `UserCollection` → `UserResource`).

---

## Patterns

### Simple Collection Response

The most common pattern — return paginated results with built-in metadata:

```php
class UserController
{
    public function index(): AnonymousResourceCollection
    {
        $users = User::paginate(20);
        return UserResource::collection($users);
    }
}
// Response:
// {
//   "data": [ ... ],
//   "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
//   "meta": { "current_page": 1, "from": 1, "last_page": 5, "path": "...", "per_page": 20, "to": 20, "total": 100 }
// }
```

### Custom Collection with Extra Metadata

Add endpoint-specific metadata to collection responses:

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
                'roles' => RoleResource::collection($this->availableRoles()),
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
        return $this->collection->filter(fn($user) => $user->is_active)->count();
    }

    private function availableRoles(): Collection
    {
        return Role::all();
    }
}
```

### Preserving Collection Keys

By default, resources re-index collections from 0. To preserve original keys:

```php
class UserCollection extends ResourceCollection
{
    public $preserveKeys = true;
}
```

### PaginationInformation Override

Customize the pagination links and meta structure:

```php
class UserCollection extends ResourceCollection
{
    public function paginationInformation($request, $paginated, $default): array
    {
        return [
            'links' => $default['links'],
            'meta' => array_merge($default['meta'], [
                'custom_meta' => 'value',
            ]),
        ];
    }
}
```

---

## Architectural Decisions

### Anonymous vs Named Collection

| Approach | Pros | Cons |
|---|---|---|
| `AnonymousResourceCollection` | Zero extra classes, works for simple lists | No customization of metadata or pagination |
| Named `ResourceCollection` | Custom metadata, pagination overrides, testable | Extra class per collection |

Use anonymous collections for simple endpoints. Introduce named collections when custom metadata or pagination formatting is needed.

### Paginated vs Non-Paginated Collections

| Scenario | Collection Type |
|---|---|
| List endpoint (user index) | Paginated via `LengthAwarePaginator` |
| Sub-resource (user's roles) | Non-paginated via `Collection` |
| Nested relation (order.items) | Non-paginated (items belong to single parent) |
| Search results | Paginated |
| Export endpoint | Non-paginated (full set) |

### Collection in Controller vs Resource

The decision to paginate and the pagination size belong in the controller. The collection resource simply formats whatever collection it receives:

```php
// Controller decides pagination
$users = User::paginate(perPage: $request->input('per_page', 20));
return UserCollection::make($users);
```

---

## Tradeoffs

| Concern | ResourceCollection | Manual Collection Mapping |
|---|---|---|
| Consistency | Enforced across all endpoints | Per-endpoint responsibility |
| Pagination metadata | Automatic | Manual construction |
| Customization | Via `paginationInformation()` | Full control |
| Boilerplate | Minimal (one method) | Variable |
| Readability | Declarative | Procedural |

---

## Performance Considerations

Collection resource resolution iterates the collection once, calling `toArray()` per item. Memory usage is proportional to collection size — each item's resolved array exists in memory simultaneously.

### Large Collection Warning

For collections over 1000 items, consider:
- Chunked responses (cursor pagination, keyset pagination)
- Streaming JSON response (`JsonResponse::stream()`)
- Limiting field selection per item

### Pagination Query

Paginated collections execute two queries (count + data) via `LengthAwarePaginator`. This is the same cost regardless of collection resource usage.

---

## Production Considerations

### Always Paginate List Endpoints

Every list endpoint that could return more than 50 items should use pagination. Non-paginated collections can exhaust memory and produce slow responses.

### Standardize Collection Envelope

All collection endpoints should return the same top-level structure. Use a base collection class that defines the standard envelope:

```php
abstract class BaseCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'data' => $this->collection,
            'links' => $this->paginationLinks() ?? [],
            'meta' => $this->paginationMeta() ?? [],
        ];
    }
}
```

### Test Pagination Metadata

Assert that paginated collection responses include correct `links` and `meta`:

```php
public function test_user_index_returns_paginated_response()
{
    User::factory()->count(25)->create();
    $response = $this->getJson('/api/users?per_page=10');

    $response->assertJsonStructure([
        'data' => [/* user fields */],
        'links' => ['first', 'last', 'prev', 'next'],
        'meta' => ['current_page', 'last_page', 'per_page', 'total'],
    ]);

    $this->assertCount(10, $response['data']);
    $this->assertEquals(3, $response['meta']['last_page']);
}
```

---

## Common Mistakes

### Forgetting PaginationMetadata

When using `ResourceCollection`, the resource must be constructed from a `Paginator` or `LengthAwarePaginator` instance. Passing a plain `Collection` or array bypasses pagination metadata injection:

```php
// Wrong — no pagination metadata
return new UserCollection(User::all());

// Correct — pagination metadata included
return new UserCollection(User::paginate());
```

### Mixing Resources in a Collection

A `UserCollection` that sets `$collects = UserResource::class` must receive only User models. Passing mixed types produces unexpected behavior or errors.

### Preserving Keys Unintentionally

Setting `$preserveKeys = true` without understanding the behavior: if the collection keys are not sequential (e.g., after filtering), the JSON response has object keys instead of array indices, which may confuse API clients expecting an array.

---

## Failure Modes

### Collection Resource Without Eager Loading

When a collection resource accesses relationships on each model, and the relationships are not eager-loaded, N+1 queries occur. For a 100-item collection, `$this->relation` in the resource produces 101 queries:

```php
// In controller — eager load
$users = User::with('posts')->paginate();

// In resource — safe, 'posts' is already loaded
public function toArray($request): array
{
    return [
        'posts' => PostResource::collection($this->posts), // No N+1
    ];
}
```

### Large Collection Memory Exhaustion

Returning 10,000 resources in a single collection (non-paginated) resolves all 10,000 items into memory simultaneously, producing a 50-200MB response. Always paginate or use cursor pagination for large datasets.

---

## Ecosystem Usage

Resource collections are a cornerstone of Laravel's API ecosystem. Laravel Nova's resource index views internally use collection-like patterns to format and paginate data. The `spatie/laravel-query-builder` package integrates directly with `ResourceCollection` to provide filtered, sorted, and paginated collection responses with minimal boilerplate code.

In production, many teams extend `ResourceCollection` with a base class that adds standard metadata, caching headers, and permission-based field filtering across all collection endpoints. API documentation generators like Scribe and Scramble introspect collection resource classes to generate accurate response schemas for list endpoints. The pattern of using `AnonymousResourceCollection` for simple endpoints and named `ResourceCollection` classes for complex endpoints has become a standard Laravel convention, with most production codebases maintaining a balance between the two approaches to avoid unnecessary class proliferation while retaining customization power where needed.

---

## Related Knowledge Units

- **Resource Fundamentals** (this workspace) — individual resource patterns
- **Pagination Metadata** (this workspace) — customizing pagination links and meta
- **Data Wrapping** (this workspace) — wrapping the data key
- **Conditional Relationships** (this workspace) — relation loading in collection resources

---

## Research Notes

- `AnonymousResourceCollection` is a concrete class in `Illuminate\Http\Resources\Json\AnonymousResourceCollection`
- Pagination information is resolved via `PaginatedResourceResponse::paginationInformation()`, which extracts `links` and `meta` from the paginator
- Laravel detects paginator type via `instanceof` checks: `LengthAwarePaginator → full metadata`, `Paginator → limited metadata (no last_page/total)`
- The `$collects` property default value is `JsonResource::class`, meaning any collection without `$collects` wraps items in the base resource class — always set `$collects` explicitly
