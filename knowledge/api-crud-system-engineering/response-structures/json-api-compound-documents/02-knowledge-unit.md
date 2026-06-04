# json-api-compound-documents
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** json-api-compound-documents  
**Difficulty Level:** Advanced  
**Last Updated:** 2026-06-02

## Executive Summary
JSON:API compound documents deliver a primary resource along with related resources in a single response via the `included` top-level key. This reduces the number of HTTP requests clients need to make by embedding a complete resource graph in one response. Compound documents require resource linkage (type+id references in relationship objects) and deduplication (the same resource appears only once in `included` even if referenced multiple times).

## Core Concepts
- **`included` Key**: A top-level array in the response containing related resource objects. Resources in `included` are additional to the primary `data`.
- **Resource Linkage**: Relationship objects contain a `data` key with `{ type, id }` entries. This is the linkage that tells the client which resources in `included` correspond to which relationships.
- **Deduplication**: If two primary resources both relate to the same author, that author appears only once in `included`. The client uses type+id to find the shared resource.
- **Inclusion Request**: The client requests related resources via the `include` query parameter: `?include=author,comments`.
- **Dot-Notation Nested Includes**: Deep inclusion via `?include=author.organization,comments`. Each dot represents a relationship traversal.
- **Primary Data vs. Included**: Primary data are the resources directly requested. Included resources are supplementary. A compound document must have primary data to justify included resources.

## Mental Models
- **Grocery Receipt**: The primary `data` is your purchased items. The `included` resources are the coupon details, store locations, and loyalty points — useful context that you didn't directly pay for.
- **Family Tree**: The primary resource is one person. The `included` resources are their family members. Each member appears once even if they are related to multiple people in the tree.
- **Normalized Database**: Compound documents are like a normalized database with foreign keys. The `data` relationship object is the foreign key, and `included` is the joined table data.

## Internal Mechanics
- **Eager Loading Relationship**: The controller must eager-load all relationships that will be included: `Article::with('author', 'comments')->get()`. The resource serializes them into `included`.
- **Resource Serialization for Included**: Each included resource is serialized through its own resource class, ensuring consistent `type`, `id`, `attributes`, and `relationships` structure.
- **Deduplication Logic**: During serialization, the compound document builder maintains a set of `type:id` strings. A resource is only added to `included` if its `type:id` is not already in the set.
- **Circular Reference Handling**: A depth limit (typically 3-5 levels) prevents infinite recursion when resources include each other (e.g., `?include=comments.author.comments`).
- **Relationship Resolution**: The relationship object's `data` key provides resource linkage. The client matches `data.type` + `data.id` with an entry in `included` to build the full resource graph.
- **Pagination and Includes**: When paginating primary data with includes, the included resources are typically not paginated. All related resources across all pages are included.

## Patterns
- **Controlled Inclusion via Query Parameter**: The `include` parameter is always client-driven. The server defines acceptable include paths; the client selects which to activate. This prevents unbounded response sizes.
- **Depth-Limited Inclusion**: Enforce a maximum inclusion depth (e.g., 3 levels). `?include=author.organization.address` is depth 4 and rejected with 400 Bad Request.
- **Server-Side Include Allowlist**: Define which relationships can be included. `ArticleResource` declares `allowedIncludes = ['author', 'comments']`. Requests for unlisted includes return 400 or are silently ignored.
- **Dot-Notation Include Parsing**: Parse dot-notation includes into nested eager-load chains. `author.organization` becomes `->with('author.organization')` on the query.
- **Include-Driven Loading**: The controller maps the `include` parameter to Eloquent's `with()` calls. Never load more than requested. Never load less than requested.
- **Resource Deduplication with Collision Prevention**: Use a type-scoped registry. Two resources with the same ID but different types are both included. Two resources with the same type and ID are deduplicated.

## Architectural Decisions
- **Include Depth Limit**: Choose a maximum include depth that balances client convenience (deeper is better) with server performance (shallower is faster). 3 levels is a common default.
- **Default Includes**: Decide whether some relationships are always included (default includes) or only when requested. Default includes increase baseline response size but improve client ergonomics.
- **Include and Sparse Fieldsets**: An included resource's fields can be restricted via sparse fieldsets: `?include=comments&fields[comments]=id,body`. The fieldset applies to the included resource type.
- **Relationship Pagination with Includes**: For HasMany relationships, decide whether included resources are all related records or just the most recent N. Large collections in includes balloon response size.
- **Include Validation Strategy**: Strict mode returns 400 for invalid includes. Lenient mode silently ignores invalid includes. Strict mode is better for public APIs.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Reduces client HTTP requests | Increases single response size | Compound documents can exceed 10MB for deeply related data |
| Enables rich client-side resource graphs | Server must eager-load and serialize all included resources | Serialization time increases with inclusion count |
| Deduplication saves bandwidth | Deduplication logic adds complexity | Duplicate detection requires memory for `type:id` set |
| Nested includes support complex UIs | Nested includes multiply query load | `?include=comments.author` loads 2 levels of relationships |
| Standardizes how related data is served | Must handle circular references explicitly | Circular reference detection is extra code |

## Performance Considerations
- **Serialization Multiplier**: Including `comments` for 10 articles means serializing N comments per article. If each article has 20 comments, the included array has 200 resources. This dominates response time.
- **Eager Loading Overhead**: Each included relationship adds a JOIN or separate query. Deep inclusion chains multiply query count. Use `with()` carefully.
- **Response Size Growth**: Compound documents can be 10-100x larger than primary-only responses. Monitor response size and warn when it exceeds thresholds (e.g., 1MB).
- **Memory Usage**: The `type:id` set for deduplication requires memory proportional to the number of unique included resources. For large compound documents, this can be significant.

## Production Considerations
- **Size Limits**: Enforce a maximum response size or maximum number of included resources. Return 413 Payload Too Large or truncate includes beyond the limit.
- **Performance Budget**: Define a performance budget for compound document endpoints. If `?include=comments` makes the response 10x slower, document this tradeoff for API consumers.
- **Caching Compound Documents**: Cache the entire compound document response. Sparse fieldsets and include parameters create cache fragmentation. Consider caching primary data and included resources separately.
- **API Versioning for Includes**: Adding new includable relationships is a backward-compatible change. Removing or renaming includable relationships is breaking.

## Common Mistakes
- **No Resource Deduplication**: Adding the same related resource to `included` multiple times. This wastes bandwidth and breaks client normalization.
- **Included Without Resource Linkage**: Adding resources to `included` but not providing `data` in the relationship object. The client cannot map the include to the relationship.
- **Missing Eager Loading**: Forgetting to call `->with()` for included relationships causes N+1 queries inside the resource serialization.
- **Circular Reference Infinite Loop**: Primary data includes comment → comment includes article → article includes comment → ... Implement depth limits.
- **Included Resources at Top Level of Data**: Putting included resources inside the `data` object. `included` is a separate top-level key, not nested under `data`.
- **Incomplete Resource Objects in Included**: Omitting `type` or `id` from included resources breaks client normalization. Included resources must be full resource objects.

## Failure Modes
- **Included Resource Bloat**: A client requests `?include=comments` for an article with 10,000 comments. The response becomes 50MB and times out. Enforce `max_included_count` limits.
- **Stale Included Data**: After including `author`, the author's name changes. The compound document response is cached with the old name. Consider cache invalidation strategies for included resources.
- **Relationship Linkage Mismatch**: The `data` in the relationship object references a `type:id` that doesn't exist in `included`. This is valid JSON:API but forces the client to fetch it separately.
- **Deeply Nested Include Denial of Service**: A malicious client sends `?include=a.b.c.d.e.f.g.h` to trigger excessive eager loading. Validate and reject deep inclusion.

## Ecosystem Usage
- **JSON:API Specification**: Sections 5.8-5.10 define compound documents, includes, and resource linkage. The `include` parameter is defined in section 5.9.
- **Laravel JSON:API (`laravel-json-api`)**: Provides built-in compound document support with include parsing, eager loading, deduplication, and depth limits.
- **Ember Data**: Ember Data's `findRecord()` with `include` parameter automatically normalizes compound documents into its store.
- **Orbit.js**: Consumes JSON:API compound documents and normalizes them into a key-value store keyed by `type:id`.
- **Spatie/laravel-query-builder**: The `allowedIncludes()` method integrates with JSON:API includes, automatically eager-loading requested relationships.

## Related Knowledge Units
### Prerequisites
- json-api-resource-structure

### Related Topics
- sparse-fieldset-design
- conditional-relationship-inclusion

### Advanced Follow-up Topics
- response-versioning

---

## Research Notes

### Source Analysis
- JSON:API Specification (Sections 5.8-5.10) — compound documents, includes, resource linkage
- `laravel-json-api` package (T向tin) — PHP implementation with include parsing, eager loading, deduplication
- `Spatie\LaravelQueryBuilder\Includes\AllowedInclude` — include resolution and eager loading
- `Illuminate\Http\Resources\Json\JsonResource` — base serialization for included resources

### Key Insight
Compound documents normalize the response graph by deduplicating included resources via a `type:id` registry — the same related resource appearing through multiple relationship paths is serialized exactly once, matching normalized client-side stores (Redux, Ember Data, Orbit).

### Version-Specific Notes
- Laravel 10/11/12/13: No native compound document support; relies on third-party packages
- JSON:API spec version 1.1 (2022) added optional `meta` on relationship objects
- Compound document deduplication and depth limiting are package-level concerns, not framework features
