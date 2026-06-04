# json-api-compound-documents

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: json-api-compound-documents
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
JSON:API compound documents deliver a primary resource along with related resources in a single response via the `included` top-level key. This reduces client HTTP requests by embedding a complete resource graph. Compound documents require resource linkage (`type:id` references in relationship objects) and deduplication (each unique resource appears once in `included` even if referenced multiple times).

Compound documents are server-driven inclusion. The client requests which relationships to include via the `include` query parameter (`?include=author,comments`). The server defines allowable include paths, enforces depth limits, and handles deduplication.

## Core Concepts
- **`included` Key**: Top-level array of related resource objects alongside `data`.
- **Resource Linkage**: Relationship objects contain `data` with `{ type, id }` — links `included` entries to relationships.
- **Deduplication**: A `type:id` registry ensures each resource appears only once in `included`.
- **Inclusion Request**: Client uses `?include=author,comments` to request related resources.
- **Dot-Notation Nested Includes**: `?include=author.organization` — each dot traverses a relationship.
- **Depth Limit**: Prevents infinite recursion from circular references (typically 3-5 levels).
- **Eager Loading Required**: Controller must `->with()` all included relationships to prevent N+1.

## When To Use
- APIs consuming JSON:API spec where compound documents are required.
- Frontends using normalized client stores (Redux, Ember Data, Orbit.js) that benefit from resource graphs.
- Endpoints where clients always need related data alongside the primary resource.
- Mobile APIs where reducing HTTP round-trips is critical for performance.
- Complex resource graphs with shared relationships (deduplication saves bandwidth).

## When NOT To Use
- Simple APIs where clients need one resource at a time.
- Endpoints where response size must be minimized — compound documents can be 10-100x larger.
- When the cost of eager-loading and serializing included resources outweighs the round-trip savings.
- For collections with thousands of related records — paginating includes is not standardized.
- When the API doesn't implement JSON:API format — compound documents are a JSON:API concept.

## Best Practices (WHY)
- **Enforce include allowlist**: Not every relationship should be includable. Define `allowedIncludes` per resource.
- **Limit include depth**: 3 levels max — deeper includes multiply query and serialization cost exponentially.
- **Map includes to eager loads**: Parse the `include` parameter and call `->with()` in the controller — never lazy-load in the resource.
- **Deduplicate by `type:id`**: Maintain a set of already-included `type:id` strings to prevent duplicates.
- **Validate includes early**: Return 400 Bad Request for invalid or too-deep includes before processing the query.

## Architecture Guidelines
- Include parsing belongs in the controller or a dedicated service — it maps to eager loading.
- The resource serialization layer handles deduplication and structure — it does NOT trigger queries.
- Default includes (always included) increase baseline response size — consider if they're truly always needed.
- For HasMany relationships with large collections, limit included records or paginate them separately.
- Compound documents with sparse fieldsets: apply `fields[type]` to included resources too.

## Performance
- Serialization cost multiplies with inclusion count — 10 articles each including 20 comments = 200 included resources.
- Each included relationship adds a JOIN or separate query — deep inclusion chains multiply query count.
- Compound documents can be 10-100x larger than primary-only responses — set size thresholds.
- Memory usage grows with the `type:id` deduplication set — significant for large compound documents.

## Security
- Include allowlist prevents clients from requesting arbitrary relationship chains that may expose sensitive data.
- Authorization checks on included resources must match the authenticated user's permissions.
- Deep inclusion can be used for denial-of-service — enforce depth and count limits.
- Cached compound documents may serve stale included data — consider cache invalidation strategies.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| No resource deduplication | Same resource appears multiple times in `included` | Not tracking `type:id` keys | Bandwidth waste; breaks client normalization | Maintain a `type:id` set during serialization |
| Included without resource linkage | Resources in `included` but no `data` in relationship | Missing relationship serialization | Client cannot map includes to relationships | Always include `data` (type+id) in relationship objects |
| Missing eager loading | Forgetting `->with()` for included relationships | Controller-resource communication gap | N+1 queries during resource serialization | Map includes to eager loads in the controller |
| Circular reference infinite loop | A includes B includes A without depth limit | No guard against graph cycles | Infinite serialization | Implement depth limits and circular detection |
| Included at wrong level | Putting included resources inside `data` instead of top-level `included` | Misunderstanding spec structure | Non-compliant response | `included` is a separate top-level key |

## Anti-Patterns
- **Unlimited Include Depth**: Allowing `?include=a.b.c.d.e.f` without enforcement — DoS vector.
- **All Relationships Includable**: Every relationship exposed via `include` — increases attack surface and complexity.
- **No Default Include Limit**: Compound documents with thousands of included resources due to client mistakes.
- **Server-Side Include Decisions Without Client Request**: Automatically including unrelated resources.
- **Included Resources Without Authorization**: Including related resources without checking user permissions.

## Examples
```php
// Controller — mapping includes to eager loads
public function index(Request $request)
{
    $includes = explode(',', $request->input('include', ''));
    $allowedIncludes = ['author', 'comments', 'author.profile'];

    $query = Article::query();
    foreach ($includes as $include) {
        if (in_array($include, $allowedIncludes)) {
            $query->with($include);
        }
    }

    return ArticleResource::collection($query->paginate());
}

// Response structure
// {
//   "data": [ { "type": "articles", "id": "1", "relationships": { "author": { "data": { "type": "people", "id": "9" } } } } ],
//   "included": [ { "type": "people", "id": "9", "attributes": { "name": "Alice" } } ]
// }
```

## Related Topics
- **Prerequisites**: json-api-resource-structure, conditional-relationship-inclusion
- **Related**: sparse-fieldset-design
- **Advanced**: response-versioning

## AI Agent Notes
- Always define an allowed include list per resource — never accept arbitrary includes.
- Map `include` query parameter to `->with()` calls in the controller, not in the resource.
- Implement depth limiting on dot-notation includes.
- Use a `$included = []` registry keyed by `type:id` for deduplication.
- Test that compound documents with circular relationships do not infinitely recurse.

## Verification
- Include allowlist is enforced — invalid includes return 400 or are silently ignored.
- Depth limit enforced — includes exceeding max depth are rejected.
- No duplicate resources appear in `included` — deduplication works.
- Every resource in `included` has a corresponding `data` entry in a relationship object.
- Responses without includes return the primary resource without the `included` key.
