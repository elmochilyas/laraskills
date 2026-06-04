# Data Wrapping

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Data Wrapping
- **Difficulty:** Intermediate
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Data wrapping is the convention of wrapping resource response data under a `data` key. By default, Laravel wraps individual resources in `data` and collection resources in `data` with pagination metadata. The wrapping can be customized via `withoutWrapping()`, the `$wrap` property, or by overriding the `Response` class.

The engineering decision is whether to wrap responses. Wrapping provides a consistent envelope — clients always parse `response.data` to find the payload. Not wrapping provides a cleaner response — clients access fields directly. The choice depends on API design conventions and whether top-level metadata is needed.

## Core Concepts
- **Default behavior:** Single resources wrapped in `data`, paginated collections get `data` + `links` + `meta`, non-paginated collections get `data`.
- **`JsonResource::withoutWrapping()`:** Static call to disable the `data` wrapper globally.
- **`$wrap` property:** Per-resource custom wrapper key. Set on the individual resource class.
- **`toResponse()` override:** Customize the entire response rendering for complete control.
- **Nested resources:** Only the top-level resource's wrapping applies — nested sub-resources lose their `$wrap`.
- **`withoutWrapping()` effect:** Sets `JsonResource::$wrap = null` globally — affects all resource instances.

## When To Use
- **Wrapping:** When top-level metadata (version, timestamps) is needed alongside data. When JSON:API compliance is required. When collection responses include pagination.
- **Unwrapping:** Simple REST APIs with no metadata needs. BFF (Backend for Frontend) APIs. Mobile applications that parse directly to models. Single-resource endpoints (show, store, update).

## When NOT To Use
- Do not mix wrapped and unwrapped responses in the same API version — clients need to know the format before parsing.
- Do not use bare JSON arrays as top-level responses for non-collection endpoints — they cannot be extended with metadata.
- Do not use custom `$wrap` keys inconsistently across resources — clients must guess the wrapper key.

## Best Practices (WHY)
- **Document the wrapping choice clearly.** API documentation should state whether responses are wrapped and under what key.
- **Be consistent across all endpoints in the same API version.** Inconsistent wrapping produces client parsing errors.
- **Always wrap collection responses from the start.** An unwrapped collection returns a bare array — adding metadata later requires a breaking change to `{ "data": [...], "meta": {...} }`.
- **Prefer global `withoutWrapping()` for unwrapped APIs** over per-resource `$wrap` overrides for consistency.
- **Match production wrapping in test configuration.** If using `withoutWrapping()`, call it in test base class `setUp()`.

## Architecture Guidelines
- Global scope: `withoutWrapping()` is a static call — typically in `AppServiceProvider::boot()`.
- Version-based wrapping: Conditionally call `withoutWrapping()` based on request prefix for mixed-version support.
- `$wrap` on a `ResourceCollection` changes the collection wrapper key, not the individual item wrapping. Individual resource `$wrap` controls per-item wrapping.
- When a resource with custom `$wrap` is nested inside another resource, the wrapping is lost. Only top-level resources apply wrapping.
- Unwrapped paginated collections still get `links` and `meta` at the top level (these are not wrapped in `data`).

## Performance
- Wrapping adds ~20 bytes per response (`"data":`). For 100 items, ~2KB — negligible.
- The wrap check is a single static property read — zero measurable overhead.
- `withoutWrapping()` and `$wrap` have no impact on serialization performance.

## Security
- Wrapping does not add security — it is a structural format decision.
- Custom `$wrap` keys must not leak internal naming conventions. Using `$wrap = 'admin_secret_data'` hints at the nature of the data.
- An unwrapped response that is a bare JSON array can be confused with other array responses (error lists, etc.). Always distinguish response types clearly.

## Common Mistakes

### Forgetting withoutWrapping() in Tests (desc)
Tests check for `data` key but production uses `withoutWrapping()`.
- **Cause:** Production configuration not mirrored in test environment.
- **Consequence:** Tests fail because the response structure differs.
- **Better:** Use a base test class that calls `JsonResource::withoutWrapping()` in `setUp()`.

### Collection Without Pagination (desc)
An unwrapped non-paginated collection returns a bare array.
- **Cause:** Initially returning `UserResource::collection(User::all())` without pagination, then adding pagination later.
- **Consequence:** Response format changes from array to object with `data`/`meta` keys — a breaking change for clients.
- **Better:** Always wrap collection responses from the start to allow future pagination without breaking changes.

### $wrap on Nested Resources (desc)
Expecting a nested resource's custom `$wrap` to apply.
- **Cause:** Setting `$wrap = 'user'` on `UserResource` and expecting it to wrap when nested inside another resource.
- **Consequence:** Nested resource data appears without the custom wrapper — only top-level wrapping applies.
- **Better:** Only rely on `$wrap` for top-level resource responses.

## Anti-Patterns
- **Inconsistent wrapping:** Some endpoints wrapped, some not, within the same API version.
- **Bare arrays as list responses:** Returning `[ {...}, {...} ]` as a collection response that may later need metadata.
- **Per-resource wrapping without convention:** Each developer choosing a different `$wrap` key, creating an unpredictable API surface.

## Examples

### Global Unwrapped API
```php
// AppServiceProvider::boot()
JsonResource::withoutWrapping();

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return ['id' => $this->id, 'name' => $this->name];
    }
}
// GET /users/1 → { "id": 1, "name": "John" }
// GET /users → [ { "id": 1, "name": "John" } ]
```

### Per-Resource Custom Wrapper
```php
class UserResource extends JsonResource
{
    public $wrap = 'user';
}

class OrderResource extends JsonResource
{
    public $wrap = 'order';
}
// GET /users/1 → { "user": { "id": 1, ... } }
// GET /orders/1 → { "order": { "id": 1, ... } }
```

### Wrapping in Tests
```php
abstract class ApiTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        JsonResource::withoutWrapping(); // Match production
    }
}
```

## Related Topics
- Resource Fundamentals — baseline resource structure
- Resource Collections — collection wrapping behavior
- Pagination Metadata — pagination alongside data wrapping
- Top-Level Meta Data — metadata coexistence with data wrapper
- JSON:API Resources — JSON:API-specific wrapping requirements

## AI Agent Notes
- **Generate:** Use `JsonResource::withoutWrapping()` in `AppServiceProvider` for global unwrapping.
- **Key constraint:** Nested resources ignore their `$wrap` — only top-level wrapping applies.
- **Validation:** Test that the response structure matches wrapping configuration (wrapped vs unwrapped).
- **Common fix:** If a response has unexpected wrapping, check for `withoutWrapping()` calls and `$wrap` property settings.
- **Testing pattern:** Align test wrapping configuration with production via a base test class.

## Verification
- [ ] Wrapping choice is consistent across all endpoints in the same API version.
- [ ] Collection responses are wrapped from the start (even without pagination) to avoid future breaking changes.
- [ ] Test configuration mirrors production wrapping behavior.
- [ ] No bare JSON arrays are used as top-level responses for list endpoints.
- [ ] `$wrap` is not relied upon for nested resource formatting.
- [ ] Wrapping behavior is documented in API docs.
