# json-api-resource-structure

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: json-api-resource-structure
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
JSON:API resource structure defines a strict, standardized format for representing resources. Every resource object contains mandatory `type` and `id` members, with optional `attributes`, `relationships`, `links`, and `meta` objects. This format decouples resource identity from representation, enables client-side normalization by `type:id`, and provides the foundation for compound documents and sparse fieldsets.

Laravel doesn't natively support JSON:API — packages like `laravel-json-api` or manual implementation via Resource classes are required. The specification requires significant boilerplate (relationship objects for every relation, resource linkage, self links) but provides a rich client ecosystem (Ember Data, Orbit.js).

## Core Concepts
- **Resource Identifier**: Every resource must have `type` (string, pluralized kebab-case) and `id` (string — even integer IDs must be cast).
- **Attributes Object**: Resource-specific data — NOT containing relationships, meta, or links.
- **Relationships Object**: Links to related resources with `links` (self, related) and `data` (resource linkage).
- **Resource Links**: Optional `self` link for canonical URL.
- **Top-Level `data` Key**: Primary resource(s) always under `data` — object for single, array for collection.
- **`included` Key**: Array of related resources in compound documents.
- **Member Names**: Restricted to a-z, A-Z, 0-9, hyphen, underscore, space — camelCase or kebab-case.
- **ID as String**: Must be serialized as string — `(string) $this->id`.

## When To Use
- APIs where client-side normalization by `type:id` is valuable (Redux, Ember Data, Apollo).
- APIs requiring a strict, self-describing contract for many consumers.
- APIs serving Ember.js or Orbit.js frontends that expect JSON:API natively.
- APIs that benefit from compound documents (including related resources in a single response).
- Public APIs where specification compliance provides documentation and tooling benefits.

## When NOT To Use
- Simple CRUD APIs with a single consumer — JSON:API boilerplate adds unnecessary complexity.
- APIs where payload size is critical — JSON:API responses are 20-40% larger than envelope responses.
- Teams unfamiliar with the JSON:API specification — learning curve is steep.
- APIs that need non-standard response structures — JSON:API is rigid.
- When client tooling doesn't support JSON:API — the format has no benefit without compatible clients.

## Best Practices (WHY)
- **Always include `type` and `id`**: They are mandatory per the spec — omitting them breaks compliance and client normalization.
- **Serialize IDs as strings**: `(string) $this->id` — integer IDs break the spec requirement for string type.
- **Keep attributes clean of relationships**: Attributes should only contain scalar data — relationships belong in the `relationships` object.
- **Include `data` in relationship objects**: Resource linkage (`type:id`) enables clients to build complete resource graphs without fetching.
- **Use pluralized kebab-case for type names**: `blog-posts`, `user-accounts` — consistent, readable, follows the spec convention.

## Architecture Guidelines
- Decide full compliance vs pragmatic subset. Full compliance requires relationship objects for every relation — determine if this is justified.
- Type naming must be consistent across the entire API — changing a type name is breaking.
- ID strategy must produce unique strings — UUIDs are ideal for JSON:API since they're naturally strings.
- Pagination uses `links` objects (`first`, `last`, `prev`, `next`) with `meta` for pagination metadata.
- Include depth limit (typically 3 levels) to prevent runaway response sizes.

## Performance
- JSON:API responses are 20-40% larger than envelope responses due to structural keys (`type`, `id`, `relationships`, `links`).
- Serializing relationship objects for every relation adds CPU time proportional to the number of relationships.
- Compound documents serialize each included resource through its own resource class — cost multiplies with inclusion depth.
- Client-side JSON:API normalization (Redux, Ember Data) is CPU-intensive but enables efficient local queries.

## Security
- `type` names should not leak internal model names — use domain types, not database table names.
- IDs as strings prevent ID type confusion but can still be enumerated if sequential.
- Relationship objects may reveal existence of related resources even when the client can't access them — ensure authorization checks are in place.
- Self links should use HTTPS URLs and be generated via `route()` helper, never hardcoded.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Missing `type` or `id` | Resource object without either field | Not understanding spec requirements | Non-compliant response — client normalization breaks | Always include both in every resource |
| Numeric IDs | `"id": 1` instead of `"id": "1"` | Not casting integer to string | Spec violation — clients may treat as number | Always cast: `'id' => (string) $this->id` |
| Inconsistent type names | `user` in one endpoint, `users` in another | No type naming convention | Clients can't reliably normalize by type | Document and enforce consistent type naming |
| Attributes containing relationships | Related data inside `attributes` instead of `relationships` | Convenience or habit | Spec violation breaks relationship traversal | Always use `relationships` object |
| Missing resource linkage | Omitting `data` from relationship objects | Thinking links are sufficient | Clients must fetch relationship endpoint to get IDs | Always include `data` (type+id) when possible |

## Anti-Patterns
- **Partial Compliance**: Claiming JSON:API but omitting required fields (`type`, `id`).
- **Included Without Resource Linkage**: Adding resources to `included` but not providing `data` in the relationship.
- **Type Collision**: Two different models mapping to the same `type` string.
- **Server Without Self Links**: Every resource should have `links.self` — omitting it breaks HATEOAS.
- **Non-Standard Member Names**: Using characters outside the spec's allowed set.

## Examples
```json
// JSON:API single resource
{
    "data": {
        "type": "articles",
        "id": "1",
        "attributes": {
            "title": "JSON:API Basics",
            "body": "This article covers JSON:API..."
        },
        "relationships": {
            "author": {
                "links": {
                    "self": "/articles/1/relationships/author",
                    "related": "/articles/1/author"
                },
                "data": { "type": "people", "id": "9" }
            }
        },
        "links": {
            "self": "/articles/1"
        }
    }
}
```

## Related Topics
- **Prerequisites**: envelope-response-design, data-wrapping-configuration
- **Related**: json-api-compound-documents, sparse-fieldset-design
- **Advanced**: rfc-9457-problem-details, response-versioning

## AI Agent Notes
- Always cast `id` to string with `(string) $this->id`.
- Use `$wrap = 'data'` for JSON:API resources — custom wrapper keys violate the spec.
- Separate attributes from relationships in `toArray()` — never mix them.
- Use pluralized kebab-case for `type` values (e.g., `blog-posts`, not `BlogPost` or `blog_posts`).
- When implementing relationships, always include `data` (type+id) for resource linkage.

## Verification
- Every resource object includes `type` and `id` with correct formatting.
- `id` values are strings, not integers.
- Attributes never contain relationship data.
- Relationship objects include `data` (resource linkage) wherever possible.
- JSON:API compliance test suite passes for all endpoints.
