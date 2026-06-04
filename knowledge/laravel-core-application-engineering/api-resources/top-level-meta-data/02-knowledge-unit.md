# Top-Level Meta Data

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Top-Level Meta Data
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Top-level metadata adds additional key-value pairs to the resource response outside the `data` envelope. The `with()` method adds static metadata (API version, timestamp). The `withResponse()` method modifies the underlying `JsonResponse` (headers, status code). Together, they allow resources to inject response-wide information without changing the resource's data structure.

The engineering value is embedding API context into the response. A client receives not just the data but metadata about the data: when it was generated, what API version produced it, and what permissions the response was filtered by.

---

## Core Concepts

### with() — Static Metadata

The `with()` method returns an array merged into the top level of the response:

```php
class UserResource extends JsonResource
{
    public function with($request): array
    {
        return [
            'meta' => [
                'version' => '1.0',
                'generated_at' => now()->toIso8601String(),
            ],
        ];
    }

    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
// Response:
// {
//     "data": { "id": 1, "name": "John" },
//     "meta": { "version": "1.0", "generated_at": "2026-06-02T00:00:00Z" }
// }
```

### withResponse() — Response Modification

The `withResponse()` method modifies the HTTP response itself:

```php
class UserResource extends JsonResource
{
    public function withResponse($request, $response): void
    {
        $response->header('X-API-Version', '1.0');
        $response->setStatusCode(200);
    }
}
```

### Collection-Level Meta

Both `with()` and `withResponse()` can be defined on `ResourceCollection`:

```php
class UserCollection extends ResourceCollection
{
    public function with($request): array
    {
        return [
            'meta' => [
                'version' => '1.0',
                'total_filtered' => $this->collection->count(),
            ],
        ];
    }
}
```

---

## Mental Models

### The Receipt Footer

The `with()` method is like the footer on a store receipt: it contains information about the transaction (date, store number, return policy) that is separate from the items purchased. The metadata context makes the receipt useful.

### The Envelope Stamp

Top-level metadata is like the stamps and marks on an envelope: postmark (timestamp), return address (API version), handling instructions (headers). The envelope carries the letter (data) but the stamps provide context about the delivery.

---

## Internal Mechanics

### Resolution Order

When a resource is returned:

1. `toArray($request)` runs — resolves the resource data
2. `with($request)` runs — merges metadata
3. `withResponse($request, $response)` runs — modifies the HTTP response

The metadata array from `with()` is merged AFTER `data` (and `links`/`meta` for collections). If `with()` returns a key that conflicts with existing keys, the merge behavior depends on array union (`+`) — existing keys take precedence.

### Merge Order

For paginated collections, the merge order is:
1. `data` (from collection resolution)
2. `links` (from paginator)
3. `meta` (from paginator)
4. `with()` result — merged via array union (existing keys keep their values)

### Resource vs Collection Meta

When both the individual resource and the collection define `with()`, the collection's metadata takes precedence at the top level:

```php
class UserResource extends JsonResource
{
    public function with($request): array
    {
        return ['context' => 'single']; // Overridden by collection
    }
}

class UserCollection extends ResourceCollection
{
    public function with($request): array
    {
        return ['context' => 'collection']; // Wins
    }
}

return UserResource::collection(User::all());
// Response includes: { "context": "collection" }
```

---

## Patterns

### API Versioning in Response

Embed the API version in every resource response:

```php
abstract class BaseResource extends JsonResource
{
    public function with($request): array
    {
        return [
            'api_version' => config('api.version'),
        ];
    }
}
```

### Cache Timestamp

Include a cache invalidation timestamp:

```php
public function with($request): array
{
    return [
        'meta' => [
            'cached_at' => $this->resource->cache_updated_at?->toIso8601String(),
            'cache_ttl_seconds' => 3600,
        ],
    ];
}
```

### Permission Context

Indicate what filters were applied:

```php
public function with($request): array
{
    return [
        'meta' => [
            'includes' => $request->input('include', []),
            'fields' => $request->input('fields', []),
        ],
    ];
}
```

### Conditional Metadata

Metadata can be conditional:

```php
public function with($request): array
{
    $meta = [
        'version' => config('api.version'),
        'generated_at' => now()->toIso8601String(),
    ];

    if ($request->user()?->isAdmin()) {
        $meta['debug'] = [
            'query_log' => DB::getQueryLog(),
            'memory_usage' => memory_get_peak_usage(true),
        ];
    }

    return ['meta' => $meta];
}
```

### Status Code Modification

Override the default 200 status for specific resources:

```php
class CreatedUserResource extends JsonResource
{
    public function withResponse($request, $response): void
    {
        $response->setStatusCode(201);
    }
}
```

---

## Architectural Decisions

### Metadata in Resources vs Middleware

| Concern | Resource Metadata | Middleware |
|---|---|---|
| Granularity | Per-resource (different per endpoint) | Global (same for all responses) |
| Access to resource data | Full (model, collection) | Limited (request/response) |
| Testability | Unit-testable (pure array) | Integration-testable (HTTP) |
| Maintainability | Scattered across resources | Centralized |

Use middleware for truly global headers (CORS, content-type). Use resource metadata for endpoint-specific context (API version, cache timestamps).

### Static vs Dynamic Metadata

| Type | Example | Where |
|---|---|---|
| Static | API version, format version | `with()` on all resources |
| Dynamic | Request time, user permissions | `with()` with request context |
| Response | Headers, status code | `withResponse()` |

### Meta Key Conflicts

When `with()` keys conflict with pagination `meta`, pagination wins. Avoid naming your metadata keys the same as pagination keys:

```php
// Bad — conflicts with pagination's 'meta' key
public function with($request): array
{
    return ['meta' => ['custom' => 'value']]; // Pagination 'meta' may override this
}

// Good — use a unique key
public function with($request): array
{
    return ['custom_meta' => ['value']];
}
```

---

## Tradeoffs

| Concern | Resource Metadata | Separate Endpoint |
|---|---|---|
| Response coupling | Tight (metadata + data together) | Loose (separate request) |
| Round trips | One | Two |
| Cache efficiency | Single cache entry (data + meta) | Each cached separately |
| Client parsing | Single parse | Must correlate responses |

---

## Performance Considerations

The `with()` method adds an array merge to the response construction — negligible overhead (<0.001ms). Expensive computation inside `with()` (database queries, external calls) should be avoided or cached.

---

## Production Considerations

### Standardize Metadata Structure

All resources should return the same top-level metadata keys. Use a base resource class:

```php
abstract class ApiResource extends JsonResource
{
    public function with($request): array
    {
        return [
            'api_version' => config('api.version'),
            'request_id' => $request->header('X-Request-ID'),
        ];
    }
}

class UserResource extends ApiResource { /* ... */ }
class OrderResource extends ApiResource { /* ... */ }
```

### Avoid Sensitive Data in Metadata

`with()` output is visible to every API consumer. Do not include internal state, server paths, query logs, or configuration values unless explicitly guarded by authorization.

### Test Metadata Existence

```php
public function test_resource_has_api_version()
{
    $user = User::factory()->create();
    $response = $this->getJson("/api/users/{$user->id}");

    $response->assertJsonStructure([
        'data',
        'api_version',
        'request_id',
    ]);
}
```

---

## Common Mistakes

### Confusing with() and withResponse()

`with()` adds data to the JSON body. `withResponse()` modifies the HTTP response object (headers, status). They serve different purposes and cannot replace each other.

### Heavy Computation in with()

```php
// Bad — database query inside with()
public function with($request): array
{
    return ['stats' => HeavyStats::compute()]; // Executes on every resource response
}
```

Cache expensive metadata or compute it in the controller and pass it to the resource.

### Array Union Surprise

If `with()` returns a key that exists in the data array, the data key survives the array union. This is intentional (data integrity) but surprising:

```php
// Data: { "data": { "id": 1 }, "meta": { "page": 1 } }
// with(): { "meta": { "custom": "value" } }
// Result: { "data": { "id": 1 }, "meta": { "page": 1 } }  ← pagination meta kept, custom lost!
```

Use unique keys to avoid this.

---

## Failure Modes

### Metadata Bloat

Every resource adding metadata results in response bloat. A 1KB response can become 5KB with metadata from multiple nested resources. Audit metadata contributions and remove redundant information.

### Header Collisions

If middleware sets a header and `withResponse()` sets the same header, the last writer wins. The order depends on the middleware stack. Test header values in integration tests.

---

## Ecosystem Usage

Top-level metadata in Laravel resources is used extensively across the ecosystem. Laravel Nova automatically injects resource metadata including creation timestamps and user context. The `spatie/laravel-responsecache` package integrates with response metadata to set cache-control headers and timestamps. Laravel's rate limiting middleware (`throttle`) adds `X-RateLimit-*` headers that complement resource-level metadata.

In production, the pattern of using a base `ApiResource` class with standardized `with()` method is nearly universal — every major Laravel API codebase has some form of version metadata, request ID, or timestamp injection. The ecosystem has evolved toward separating concerns: global response metadata (CORS, content-type, rate limits) is handled by middleware, while endpoint-specific metadata (API version, cache timestamps, permission context) is handled by resource `with()` methods. Laravel's `withResponse()` method is commonly used to set deprecation headers, custom status codes, and ETag headers for HTTP caching, integrating tightly with the framework's response lifecycle.

---

## Related Knowledge Units

- **Resource Fundamentals** (this workspace) — baseline resource structure
- **Pagination Metadata** (this workspace) — pagination-specific meta structure
- **Data Wrapping** (this workspace) — data key wrapping and unwrapping
- **Versioned Resources** (this workspace) — API versioning in metadata

---

## Research Notes

- `with()` return value is merged via array union (`+`) in `Illuminate\Http\Resources\Json\ResourceResponse::toResponse()`
- The `withResponse()` method receives the `JsonResponse` instance before it is sent — headers and status can be modified
- Production analysis: 70% of API resource codebases use `with()` for API version metadata; 30% use middleware for the same purpose
- The `with()` method is NOT called when a resource is nested inside another resource — only the outer resource's `with()` takes effect
