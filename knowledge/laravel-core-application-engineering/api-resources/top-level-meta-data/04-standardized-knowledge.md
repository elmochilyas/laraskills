# Top-Level Meta Data

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Top-Level Meta Data
- **Difficulty:** Advanced
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Top-level metadata adds additional key-value pairs to the resource response outside the `data` envelope. The `with()` method adds static metadata (API version, timestamp). The `withResponse()` method modifies the underlying `JsonResponse` (headers, status code). Together, they allow resources to inject response-wide information without changing the resource's data structure.

The engineering value is embedding API context into the response. A client receives not just the data but metadata about the data: when it was generated, what API version produced it, and what permissions the response was filtered by.

## Core Concepts
- **`with($request)`:** Returns an array merged into the top level of the JSON response. Called after `toArray()`.
- **`withResponse($request, $response)`:** Modifies the `JsonResponse` instance — headers, status code. Called after `with()`.
- **Merge order (paginated):** `data` → `links` → `meta` → `with()` result (array union — existing keys take precedence).
- **Collection vs resource:** When both define `with()`, the collection's metadata takes precedence at the top level.
- **Nested resources:** `with()` is only called on the outer (top-level) resource, not on nested sub-resources.

## When To Use
- Embedding API version information in every response.
- Adding cache timestamps or invalidation markers.
- Indicating applied filters or permission context.
- Setting custom HTTP headers (deprecation notices, custom status codes).
- Adding request IDs for request tracing.

## When NOT To Use
- For global headers that apply to all responses (CORS, content-type) — use middleware instead.
- For pagination metadata — that is handled by `PaginatedResourceResponse`.
- When the metadata is large or computed from heavy operations — compute in controller and pass to resource.
- For sensitive data visible to all consumers — `with()` output is seen by every API consumer.

## Best Practices (WHY)
- **Standardize metadata structure via a base resource class.** All resources extending a shared `ApiResource` base class ensure consistent top-level keys.
- **Use middleware for global metadata; use `with()` for endpoint-specific metadata.** Middleware handles CORS, content-type, global headers. `with()` handles per-resource context.
- **Avoid key conflicts with pagination metadata.** Use unique keys (e.g., `api_version`, `request_id`) instead of `meta` which collides with pagination's `meta` key.
- **Keep `with()` computation light.** Expensive operations inside `with()` (DB queries, external calls) run on every resource response — cache them or pre-compute.
- **Avoid sensitive data in metadata.** `with()` output is visible to every consumer — no internal state, server paths, query logs, or config values.

## Architecture Guidelines
- Static metadata (API version, format version) belongs in `with()` on a base class.
- Dynamic metadata (request time, applied filters, user context) belongs in `with()` with request access.
- Response modifications (headers, status codes) belong in `withResponse()`.
- `withResponse()` is useful for deprecation headers, custom status codes (201 Created), and ETag headers.
- Collection metadata overrides individual resource metadata when both define `with()`.

## Performance
- `with()` adds a single array merge operation — <0.001ms overhead.
- Expensive computation inside `with()` should be avoided. Cache or pre-compute in the controller.
- `withResponse()` modifies the response object before serialization — zero serialization overhead.
- Metadata bloat across many endpoints can accumulate. Audit total metadata size if responses exceed expectations.

## Security
- **No sensitive data in metadata.** `with()` output reaches every consumer. Never include internal state, configuration values, server paths, or debug information unless guarded by authorization.
- Header collisions: if middleware sets a header and `withResponse()` sets the same header, the last writer wins. Test header values in integration tests to ensure the expected value survives.
- Request IDs in headers can be used for tracing by clients. Ensure the ID format does not leak internal system information (e.g., server hostname).

## Common Mistakes

### Confusing with() and withResponse() (desc)
Mixing up data metadata and response modification.
- **Cause:** Both methods affect the response but in different ways.
- **Consequence:** Metadata intended for the JSON body ends up as an HTTP header, or vice versa.
- **Better:** `with()` → JSON body data. `withResponse()` → HTTP headers, status code.

### Heavy Computation in with() (desc)
Running expensive operations inside `with()`.
- **Cause:** Convenience — the data is available, so why not compute it here?
- **Consequence:** Every response incurs the cost, even when the metadata is not consumed.
- **Better:** Pre-compute in the controller, pass to the resource, or cache the result.

### Array Union Surprise (desc)
Expecting `with()` to override existing keys.
- **Cause:** Assuming merge overwrites, when it's array union (`+`).
- **Consequence:** Metadata keys that match existing keys (like `meta`) silently disappear.
- **Better:** Use unique key names. Test that metadata keys actually appear in the response.

## Anti-Patterns
- **Metadata as debug endpoint:** Using `with()` to dump debug data (query logs, memory usage) for admin users. Use a dedicated debug endpoint instead.
- **Nested resource metadata expectation:** Assuming `with()` on sub-resources adds metadata to the top-level response. Only the outer resource's `with()` takes effect.
- **Overloaded metadata:** Adding every possible context (user agent, IP, session data) to metadata. Include only what clients need for processing the response.

## Examples

### API Version in Base Resource
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

class UserResource extends ApiResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
// Response: { "data": {...}, "api_version": "1.0", "request_id": "abc-123" }
```

### Cache Timestamp in Metadata
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

### Status Code via withResponse
```php
class CreatedUserResource extends JsonResource
{
    public function withResponse($request, $response): void
    {
        $response->setStatusCode(201);
    }
}
```

## Related Topics
- Resource Fundamentals — baseline resource structure
- Pagination Metadata — pagination-specific meta structure
- Data Wrapping — data key wrapping and unwrapping
- Versioned Resources — API versioning in metadata
- Middleware System — global response headers

## AI Agent Notes
- **Generate:** Override `with()` in any resource class; override `withResponse()` for header/status changes.
- **Key constraint:** `with()` is only called on the outer resource, not nested ones.
- **Validation:** Test that metadata keys actually appear in the response (array union can silently drop keys).
- **Common fix:** If metadata is missing, check for key conflicts with pagination `meta`/`links`.
- **Testing pattern:** `$resource->response()->getData(true)` assertions for metadata keys; `$resource->response()->headers` for header assertions.

## Verification
- [ ] All resources use a shared base class with standardized `with()` structure.
- [ ] No sensitive data (internal state, server paths, config values) in metadata.
- [ ] `with()` does not contain expensive database queries or external calls.
- [ ] Metadata keys do not conflict with pagination keys (`data`, `links`, `meta`).
- [ ] `withResponse()` headers are integration-tested to confirm no collisions with middleware.
- [ ] `with()` on sub-resources is not expected to appear at the top level.
