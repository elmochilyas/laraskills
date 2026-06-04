# JSON:API Resources

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** JSON:API Resources
- **Difficulty:** Advanced
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Laravel provides `JsonApiResource` for building responses that conform to the JSON:API specification (jsonapi.org). JSON:API standardizes how resources are identified (type + id), structured (attributes, relationships, links), and linked (resource linkage, compound documents with includes). The `JsonApiResource` base class enforces this structure, while the `relationship()` method maps Eloquent relations to JSON:API relationships.

The engineering value is API consumer interoperability. A JSON:API-compliant endpoint is consumable by any JSON:API client library without custom parsing. The cost is stricter response structure — every resource must declare a `type`, provide an `id`, and structure relationships explicitly.

## Core Concepts
- **`JsonApiResource`:** Extends `JsonResource`, overrides `toArray()` to enforce `{ type, id, attributes, relationships, links }` structure.
- **`toAttributes($request)`:** Returns the resource's data fields (equivalent to `toArray` in regular resources).
- **`toRelationships($request)`:** Returns relationships as closures — closures are lazily evaluated only when the relationship should be included.
- **`toLinks($request)`:** Returns resource-specific links (e.g., `self`).
- **`$type` property:** Override the resource type (default: derived from model table name).
- **`include` parameter:** Client-requested includes produce compound documents with an `included` array.
- **Sparse fieldsets:** Built-in support via `fields[type]` query parameter.
- **Type resolution:** Type derived from model's table name by default (`User` → `users`).

## When To Use
- Public API consumed by third parties requiring standardized responses.
- API consumed by multiple client types (web, mobile, desktop).
- Large API with many related resources where compound documents simplify client data fetching.
- When JSON:API tooling ecosystem is desired (validators, documentation generators, client libraries).

## When NOT To Use
- Internal API with a single mobile client — the specification overhead adds little value.
- BFF (Backend for Frontend) API tailored to a single application.
- Simple CRUD with fewer than 10 resources.
- Team unfamiliar with the JSON:API specification — the learning curve is steep.
- When full JSON:API compliance is needed (error objects, pagination, filtering) — Laravel's native support covers only resource objects, requires additional packages for complete spec coverage.

## Best Practices (WHY)
- **Use closures in `toRelationships()`** — closures are lazily evaluated only when the relationship is included. Eagerly resolved values always compute, wasting resources.
- **Validate `include` parameters** — only allow a whitelist of safe includes. Arbitrary includes can trigger N+1 queries or expose non-public relations.
- **Cast `id` to string** — JSON:API requires `id` to be a string. `JsonApiResource` auto-casts, but custom IDs need explicit casting.
- **Set content type to `application/vnd.api+json`** via `withResponse()` for proper JSON:API compliance.
- **Document allowed includes and sparse fieldsets** so clients know what is available.

## Architecture Guidelines
- Map `include` parameters to eager loads in the controller, not the resource. The resource only formats what is loaded.
- Set limits on include depth and count — a single request with `?include=posts.comments.author.profile` can produce huge compound documents.
- Detect and prevent circular includes (e.g., `PostResource` includes `user`, `UserResource` includes `posts` → infinite recursion with `include=posts.user.posts`).
- JSON:API error formatting (errors array) must be handled in the exception handler, not in resources.
- Use `JsonApiResource` for new JSON:API projects on Laravel 11+; for older Laravel versions, use community packages (`laravel-json-api`).

## Performance
- Include parameters trigger additional eager loading. Each included relationship adds queries proportional to the relationship type (one query for `belongsTo`, potentially N for `hasMany` without proper eager loading).
- Sparse fieldsets reduce response size proportionally to the number of omitted fields (e.g., 3 fields instead of 50 → ~94% reduction).
- Closures in `toRelationships()` prevent unnecessary relationship resolution — the closure only runs when the relationship is included or explicitly requested.
- Compound documents with deeply nested includes can produce very large responses. A user with 1000 posts included produces a 1001-resource response.

## Security
- **Whitelist allowed includes.** Unvalidated `include` parameters allow clients to load arbitrary relationships, potentially exposing non-public data or causing performance degradation.
- Sparse fieldsets are client-controlled — ensure sensitive fields are not exposed regardless of field selection. The whitelist of available fields is defined by `toAttributes()`; sparse fieldsets only filter further.
- Content type `application/vnd.api+json` can help API gateways and firewalls apply appropriate rules for JSON:API traffic.

## Common Mistakes

### Forgetting Relationship Closures (desc)
Returning resolved values from `toRelationships()` instead of closures.
- **Cause:** Treating `toRelationships()` like `toArray()` where direct values are returned.
- **Consequence:** Relationships are resolved even when not included, wasting resources.
- **Better:** Always wrap relationship values in closures: `'posts' => fn() => PostResource::collection(...)`.

### Non-String IDs (desc)
Using integer IDs without casting to string.
- **Cause:** Eloquent models use auto-increment integer IDs by default.
- **Consequence:** JSON:API spec requires string `id` — clients may fail validation.
- **Better:** `JsonApiResource` auto-casts, but verify by checking response output.

### Missing Resource Type (desc)
Using `JsonApiResource` without setting `$type` for non-Eloquent resources.
- **Cause:** Assuming type derivation works for all data sources.
- **Consequence:** Error or incorrect type if the resource wraps an array or DTO.
- **Better:** Explicitly set `$type` on all `JsonApiResource` classes that do not wrap Eloquent models.

## Anti-Patterns
- **JSON:API for everything:** Forcing JSON:API compliance on simple internal APIs where the overhead of spec compliance outweighs the benefits.
- **Unbounded includes:** Allowing `include=*` or not validating include parameters, creating a DoS vector and data exposure risk.
- **Circular include chains:** Resources that include each other without circular detection, causing infinite serialization loops.

## Examples

### Basic JSON:API Resource
```php
class UserResource extends JsonApiResource
{
    public function toAttributes($request): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at,
        ];
    }
}
// Response:
// {
//   "data": {
//     "type": "users",
//     "id": "1",
//     "attributes": { "name": "John", "email": "john@test.com" }
//   }
// }
```

### Relationships with Includes
```php
class UserResource extends JsonApiResource
{
    public function toRelationships($request): array
    {
        return [
            'posts' => fn() => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
// GET /api/users/1?include=posts
```

### Resource Links
```php
class UserResource extends JsonApiResource
{
    public function toLinks($request): array
    {
        return [
            'self' => route('api.users.show', $this->id),
        ];
    }
}
```

### Include Validation in Controller
```php
class UserController
{
    protected $allowedIncludes = ['posts', 'profile'];

    public function show(User $user): UserResource
    {
        $includes = $this->parseIncludes(request());
        $user->load($includes);
        return new UserResource($user);
    }

    protected function parseIncludes(Request $request): array
    {
        $requested = explode(',', $request->input('include', ''));
        return array_intersect($requested, $this->allowedIncludes);
    }
}
```

## Related Topics
- Resource Fundamentals — baseline resource concepts
- Conditional Relationships — `whenLoaded()` with JSON:API
- Sparse Fieldsets — field filtering in JSON:API
- Versioned Resources — JSON:API versioning
- Data Wrapping — JSON:API requires `data` wrapper

## AI Agent Notes
- **Generate:** `php artisan make:resource UserResource --json-api` for JSON:API resource scaffolding.
- **Key constraint:** `toRelationships()` must return closures, not resolved values.
- **Validation:** Every JSON:API resource must have a `type` and string `id`.
- **Common fix:** If relationships are missing from the response, check that the controller is eager-loading them and that `include` parameters are correctly parsed.
- **Testing pattern:** Assert JSON:API structure: `$response->assertJsonStructure(['data' => ['type', 'id', 'attributes']])`.

## Verification
- [ ] All JSON:API resources have explicit `$type` or valid table-derived type.
- [ ] `toRelationships()` returns closures, not resolved values.
- [ ] Include parameters are validated against a whitelist.
- [ ] Circular includes are detected and prevented.
- [ ] Responses use `application/vnd.api+json` content type.
- [ ] IDs are strings in the response.
- [ ] Sparse fieldsets correctly filter `toAttributes()` output.
