# Resource Wrapping — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Resource Wrapping
- **ECC Version:** 1.0

## Overview
Resource wrapping in Laravel API Resources controls whether serialized data is nested under a top-level key (typically `data`) or returned flat. By default, single resources are not wrapped and collection resources are wrapped in a `data` key. The `withoutWrapping()` method on the resource base class disables wrapping globally, and the `$wrap` property customizes the wrapping key. Understanding wrapping is essential for API design consistency, particularly when conforming to specifications like JSON:API.

## Core Concepts
- `$wrap` — static property on `JsonResource` defining the wrapping key for single resources (default `null` — no wrapping)
- `withoutWrapping()` — static method that sets `$wrap = null`, disabling all wrapping globally
- `data` key — the default wrapping key for collection resources (`ResourceCollection`)
- Default behavior — single resources are NOT wrapped; collections ARE wrapped in `data`
- Custom wrapping key — override `$wrap` on a per-resource basis to use a different key (e.g., `'user'`)
- Collection wrapping is hardcoded in `ResourceCollection::resolve()` — `$wrap` does not affect it
- Pagination metadata merges at the same level as `data`, not inside it

## When To Use
- Default behavior (single flat, collection wrapped) for most Laravel API projects
- `withoutWrapping()` globally for SPAs and frontend frameworks that expect flat responses
- `$wrap = 'data'` for consistent wrapping on both single and collection resources
- Custom `$wrap` key per resource type when API consumers need a named envelope
- Version-dependent wrapping to evolve API shape across versions

## When NOT To Use
- Do NOT use `withoutWrapping()` if API consumers depend on the `data` key for collection responses
- Do NOT set `$wrap` on a resource that also returns manual wrapping in `toArray()` — causes double-wrapping
- Do NOT assume `$wrap` affects collection resources — collection wrapping uses `data` hardcoded in `ResourceCollection`
- Do NOT change wrapping strategy after public release without version negotiation — it's a breaking change

## Best Practices (WHY)
- Decide on a wrapping strategy early in the project — changing from wrapped to flat is a breaking change
- Call `JsonResource::withoutWrapping()` in `AppServiceProvider::boot()` for application-wide configuration
- Document the wrapping strategy in API documentation so consumers know the response shape
- Test serialization shape for both single and collection responses in feature tests
- Consider frontend requirements — some frontends expect unwrapped responses, others rely on `data`

## Architecture Guidelines
- Establish a consistent wrapping convention across the entire API — avoid mixing wrapped and unwrapped endpoints
- Use `withoutWrapping()` at the application level, not per-resource, for consistency
- For JSON:API compliance, customize both wrapping and pagination metadata
- If a model has an attribute named `data`, avoid wrapping collections in `data` to prevent naming collision
- Version your wrapping strategy with your API version (v1: wrapped, v2: flat)

## Performance
- Wrapping is a simple array merge operation — negligible performance cost
- `withoutWrapping()` removes one array level — slight reduction in response size
- For deeply nested resources, each level's wrapping behavior adds minor overhead
- No database or computation impact — purely an output format concern

## Security
- Wrapping does not affect data visibility — it only changes the response structure
- Ensure the wrapping key (`data`, `user`, etc.) does not collide with attribute names that could shadow data
- `withoutWrapping()` does not bypass any security controls — it only changes JSON structure

## Common Mistakes
- Expecting `withoutWrapping()` to only affect collections — it affects all resources
- Setting `$wrap` on a resource but also calling `withoutWrapping()` — `withoutWrapping()` nullifies the custom wrap
- Overriding `toArray()` and returning wrapped data manually — double-wrapping occurs if `$wrap` is also set
- Assuming collection wrapping key can be changed via `$wrap` — collection wrapping uses `data` hardcoded
- Forgetting that paginated responses still include wrapping even with custom `toArray()`

## Anti-Patterns
- **Inconsistent wrapping across endpoints**: some resources have custom `$wrap`, others don't, creating an inconsistent API
- **Double wrapping**: resource returns `['data' => ['data' => [...]]]` when manual wrapping meets automatic wrapping
- **Changing wrapping strategy without versioning**: breaking all existing API consumers when switching from wrapped to flat
- **Per-instance `$wrap` mutation**: modifying the static `$wrap` property at runtime, which affects all subsequent requests

## Examples
```php
// Disable wrapping globally in AppServiceProvider
public function boot(): void
{
    JsonResource::withoutWrapping();
}

// Custom wrapping per resource
class UserResource extends JsonResource
{
    public static $wrap = 'user';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
// Response: { "user": { "id": 1, "name": "John" } }

// Default collection wrapping
UserResource::collection(User::all());
// Response: { "data": [ { "id": 1, "name": "John" } ] }

// After withoutWrapping():
// Response: [ { "id": 1, "name": "John" } ]

// Wrapped single resource with data
class DataResource extends JsonResource
{
    public static $wrap = 'data';
}
```

## Related Topics
- json-resource — the resource class where wrapping is configured
- resource-collection — collections have their own wrapping behavior in `data`
- pagination — pagination metadata merges at the same level as `data`
- json-api — JSON:API specification wrapping requirements

## AI Agent Notes
- Default: single resources are flat; collections are wrapped in `data`
- Call `JsonResource::withoutWrapping()` in `AppServiceProvider` to disable all wrapping
- `$wrap` only affects single resources, not collections — collections always use `data`
- Changing wrapping strategy is a breaking API change — decide early
- Test both single and collection response shapes in feature tests
- Avoid modifying `$wrap` at runtime — it's a static property affecting all requests

## Verification
- [ ] Wrapping strategy is documented and coded as a project standard
- [ ] Single and collection responses are consistent in their wrapping
- [ ] No resource has both `$wrap` and manual wrapping in `toArray()`
- [ ] Frontend team is aligned on the wrapping strategy
- [ ] Feature tests verify wrapping structure for all endpoint types
- [ ] `withoutWrapping()` is called in a service provider (documented location)
- [ ] API versioning strategy accounts for wrapping changes
