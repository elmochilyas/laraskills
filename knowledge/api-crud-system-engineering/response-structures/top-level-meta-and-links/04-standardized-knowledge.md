# top-level-meta-and-links

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: top-level-meta-and-links
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Top-level `meta` and `links` objects enrich API responses with operational context (timestamps, request IDs, feature flags) and navigational hyperlinks (self, pagination, related resources) alongside primary resource data. They provide extensibility points in the response envelope without modifying the resource structure.

`meta` carries non-resource metadata that clients need for processing — timing, permissions, application state. `links` provides discoverable URLs that enable client navigation without hardcoded endpoint paths. Both are implemented via `with()`, `additional()`, and paginator integration.

## Core Concepts
- **`meta` Object**: Non-resource metadata at the envelope top level (timestamps, request ID, feature flags, permissions).
- **`links` Object**: Hypermedia links at the envelope top level (self, pagination URLs, related resources).
- **`with()` Method**: Returns meta array from Resource class — merged into `meta` key.
- **`additional()` Method**: Merges at the top level of the entire response — can add keys at any level (use with caution).
- **Merge Order**: `with()` → pagination metadata → `additional()` (last has highest priority).
- **`PaginatedResourceResponse`**: Auto-injects pagination metadata into `meta` and navigation URLs into `links`.
- **Self Link Pattern**: Every resource should include `links.self` pointing to its canonical URL.

## When To Use
- Envelope-format APIs that need to communicate operational context alongside resource data.
- APIs where clients need request-level correlation (request ID in every response).
- Paginated endpoints that require navigation links (`first`, `prev`, `next`, `last`).
- Multi-tenant or permissioned APIs where `meta.can.update`, `meta.can.delete` communicate authorization.
- APIs using feature flags that clients must respect.

## When NOT To Use
- Bare-body APIs (metadata moves to HTTP headers instead).
- Extremely high-throughput endpoints where every byte of `meta` counts.
- Endpoints where `meta` generation requires expensive computation (complex permission checks).
- APIs where all metadata can be expressed via HTTP headers (`X-Request-ID`, `Link`, `X-RateLimit-*`).

## Best Practices (WHY)
- **Always include request ID in `meta`**: Enables client-side to server-side log correlation for debugging.
- **Use `self` link on every resource**: Provides canonical URL for cache invalidation and HATEOAS navigation.
- **Never use `data` key in `additional()`**: `additional()` merges at the top level — `['data' => '...']` overwrites the resource payload.
- **Keep meta fields stable**: Adding meta fields is backward-compatible; removing them is breaking.
- **Handle exceptions inside `with()`**: An exception in meta generation should not crash the resource response.

## Architecture Guidelines
- Decide whether meta is flat (`meta.generated_at`) or nested (`meta.timing.generated_at`) — flat is easier for clients.
- Standardize link relations using IANA-registered names (`self`, `next`, `prev`) rather than custom names.
- Pagination links are auto-injected by `PaginatedResourceResponse`. Do not manually override `links` in `additional()`.
- For non-paginated collections, add links manually via `with()` if navigation context is needed.
- Separate dynamic meta (request ID, server time) from stable meta (pagination counts) to improve cacheability.

## Performance
- Adding 10 meta fields adds negligible serialization time (~0.01ms).
- Permission checks for `meta.can.*` add cost — cache at the user-role level.
- Absolute URL generation for `links` requires scheme/host resolution — use `url()` helper or named routes.
- Dynamic meta (request ID, server time) prevents response caching — separate from cacheable meta.

## Security
- Never include session tokens, internal IDs, or debugging output in `meta`.
- Permission meta fields (`can.update`, `can.delete`) must match server-side authorization policies.
- Exposing feature flags in `meta` reveals internal state — ensure flags don't leak sensitive information.
- `additional()` can overwrite any response key — audit uses to prevent accidental data exposure.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Confusing `with()` and `additional()` | Using `additional()` for meta instead of `with()` | API similarity | Keys merged at wrong level break response structure | Use `with()` for meta, `additional()` only for top-level overrides |
| Storing sensitive data in meta | Session tokens, internal IDs in meta fields | Convenience during development | Exposed internals to all clients | Audit meta fields before deployment |
| Non-serializable meta values | Objects or resources returned from `with()` | Forgetting `toArray()` requirement | JSON encoding fails | Always return plain arrays from `with()` |
| Duplicate links in collections | Overriding `links` via `additional()` on paginated responses | Not knowing paginator auto-injects links | Broken or duplicate navigation URLs | Let paginator generate links; only add custom links via `with()` |
| Missing self link | No `links.self` on resources | Overlooking HATEOAS contract | Clients cannot construct canonical URLs | Always include `links.self` in `toArray()` |

## Anti-Patterns
- **Meta Bloat**: Adding every possible metadata field without review. Establish a meta field review process.
- **Dynamic Meta That Prevents Caching**: Including `server_time` or `request_id` in responses that could otherwise be cached.
- **Meta Key Collision**: `with()` returning keys that conflict with response-level keys (`data`, `errors`).
- **Hardcoded URLs in Links**: Using string concatenation instead of `route()` helper for link URLs.
- **Exception Propagation from `with()`**: An uncaught exception in `with()` crashes the entire response.

## Examples
```php
// Adding meta via with()
class UserResource extends JsonResource
{
    public function with($request)
    {
        return [
            'request_id' => (string) Str::uuid(),
            'generated_at' => now()->toIso8601String(),
            'can' => [
                'update' => $request->user()?->can('update', $this->resource),
                'delete' => $request->user()?->can('delete', $this->resource),
            ],
        ];
    }
}

// Self link in toArray()
public function toArray($request)
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        '_links' => [
            'self' => ['href' => route('users.show', $this), 'method' => 'GET'],
        ],
    ];
}
```

## Related Topics
- **Prerequisites**: envelope-response-design
- **Related**: pagination-metadata-design, pagination-information-customization
- **Advanced**: json-api-resource-structure, response-versioning

## AI Agent Notes
- Use `with()` for meta fields, never `additional()` unless overriding at the top level.
- Always include `links.self` using `route()` helper.
- Wrap `with()` content in try-catch to prevent meta exceptions from crashing responses.
- For paginated collections, let `PaginatedResourceResponse` handle links — don't manually override.
- Use `request_id` in meta for every response to enable log correlation.

## Verification
- Every resource response includes a `self` link in `links`.
- `with()` returns only plain arrays — no objects, resources, or non-serializable values.
- Paginated collections have `first`, `prev`, `next`, `last` links.
- No `data` key is returned from `additional()` on any resource.
- Integration tests verify meta field presence and correct link URL generation behind proxies.
