# Skill: Build a JSON:API-Compliant Resource

## Purpose

Create API resources that conform to the JSON:API specification with proper `type`, `id`, `attributes`, `relationships`, and `links` structure, including support for includes and sparse fieldsets.

## When To Use

- Public API consumed by third parties requiring standardized responses
- API consumed by multiple client types (web, mobile, desktop)
- Large API with many related resources where compound documents simplify client data fetching
- When JSON:API tooling ecosystem is desired (validators, documentation generators, client libraries)

## When NOT To Use

- Internal API with a single mobile client — the specification overhead adds little value
- BFF (Backend for Frontend) API tailored to a single application
- Simple CRUD with fewer than 10 resources
- Team unfamiliar with the JSON:API specification — the learning curve is steep

## Prerequisites

- Laravel 11+ (or appropriate package for older Laravel versions)
- `Illuminate\Http\Resources\Json\JsonApiResource` available in the framework
- Eloquent models with defined relationships

## Inputs

- Resource class extending `JsonApiResource`
- Controller that handles include parameters and eager loading
- Request handler for `include` and sparse fieldset parsing

## Workflow

1. Generate the resource: `php artisan make:resource UserResource --json-api`.
2. Set the `$type` property explicitly if the resource wraps a non-Eloquent source: `protected string $type = 'users'`.
3. Implement `toAttributes($request)` returning the resource's data fields (equivalent to `toArray` in regular resources).
4. Implement `toRelationships($request)` returning relationships as **closures** — never resolved values: `'posts' => fn() => PostResource::collection($this->whenLoaded('posts'))`.
5. Implement `toLinks($request)` returning resource-specific links (e.g., `self`).
6. Set the `Content-Type` header to `application/vnd.api+json` via `withResponse()`.
7. In the controller, parse and validate `include` parameters against a whitelist of allowed includes.
8. Map allowed includes to eager loads in the controller: `$user->load($includes)`.
9. Implement include depth and count limits (max 3 levels, max 5 relationships).
10. Detect and prevent circular includes (same relationship appearing at multiple nested levels).
11. Write tests that assert JSON:API structure: `$response->assertJsonStructure(['data' => ['type', 'id', 'attributes']])`.

## Validation Checklist

- [ ] All JSON:API resources have explicit `$type` or valid table-derived type
- [ ] `toRelationships()` returns closures, not resolved values
- [ ] Include parameters are validated against a whitelist
- [ ] Circular includes are detected and prevented
- [ ] Responses use `application/vnd.api+json` content type
- [ ] IDs are strings in the response
- [ ] Sparse fieldsets correctly filter `toAttributes()` output
- [ ] Include depth is limited (max 3 levels)
- [ ] Include count is limited (max 5 relationships)

## Common Failures

- Forgetting relationship closures — returning resolved values from `toRelationships()` causes eager evaluation on every request
- Non-string IDs — using integer IDs without casting; `JsonApiResource` auto-casts but verify the response output
- Missing resource type — using `JsonApiResource` without setting `$type` for non-Eloquent resources causes type derivation failures
- Unvalidated includes — allowing clients to load arbitrary relationships creates a DoS vector and data exposure risk
- Circular include chains — resources that include each other without circular detection cause infinite serialization loops

## Decision Points

- **JsonApiResource vs JsonResource**: Use `JsonApiResource` for JSON:API compliance. It enforces the required structure and provides built-in include handling and sparse fieldsets. Do not manually build JSON:API structure inside regular `JsonResource::toArray()`.
- **Closure vs resolved value in toRelationships**: Always use closures. Eagerly resolved values always compute, wasting resources when the relationship is not included.
- **URL-based vs header-based versioning**: URL-based is more discoverable and testable for JSON:API.

## Performance Considerations

- Include parameters trigger additional eager loading — each included relationship adds queries proportional to the relationship type
- Sparse fieldsets reduce response size proportionally to the number of omitted fields (e.g., 3 fields instead of 50 → ~94% reduction)
- Closures in `toRelationships()` prevent unnecessary relationship resolution — the closure only runs when the relationship is included
- Compound documents with deeply nested includes can produce very large responses — a user with 1000 posts included produces a 1001-resource response

## Security Considerations

- Whitelist allowed includes — unvalidated `include` parameters allow clients to load arbitrary relationships, potentially exposing non-public data
- Sparse fieldsets are client-controlled — ensure sensitive fields are not exposed regardless of field selection
- Content type `application/vnd.api+json` helps API gateways and firewalls apply appropriate rules
- Circular includes can cause memory exhaustion — implement depth limits and cycle detection

## Related Rules

- Always Return Closures from toRelationships (Performance)
- Validate Include Parameters Against a Whitelist (Security)
- Ensure Every JSON:API Resource Has a Valid type and String id (Framework Usage)
- Set application/vnd.api+json Content Type (Framework Usage)
- Detect and Prevent Circular Includes (Reliability)
- Map Include Parameters to Eager Loads in the Controller (Architecture)
- Expose Resource Type via $type Property for Non-Eloquent Sources (Framework Usage)
- Limit Include Depth and Count (Scalability)
- Use JsonApiResource for JSON:API Compliance (Framework Usage)

## Related Skills

- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Conditional Relationships](../conditional-relationships/06-skills.md)
- [Sparse Fieldsets](../sparse-fieldsets/06-skills.md)
- [Data Wrapping](../data-wrapping/06-skills.md)

## Success Criteria

- Every JSON:API resource produces valid `{ type, id, attributes, relationships, links }` structure
- Include parameters are validated, whitelisted, depth-limited, and cycle-free
- All relationships use closures for lazy evaluation
- Content-Type header is correctly set to `application/vnd.api+json`
- Tests verify JSON:API compliance for every resource endpoint
