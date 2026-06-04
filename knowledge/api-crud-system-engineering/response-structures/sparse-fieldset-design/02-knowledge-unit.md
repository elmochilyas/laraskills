# sparse-fieldset-design
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** sparse-fieldset-design  
**Difficulty Level:** Advanced  
**Last Updated:** 2026-06-02

## Executive Summary
Sparse fieldset design allows API clients to request only specific fields of a resource type by passing a `fields[resourceType]=field1,field2` query parameter. This reduces over-fetching, bandwidth usage, and response processing time by returning only the attributes the client needs. The pattern is formalized in the JSON:API specification but can be implemented in any REST API. In Laravel, sparse fieldsets require combining request-parameter parsing with conditional field inclusion in resources.

## Core Concepts
- **Fieldset Parameter**: A query parameter following the pattern `fields[resourceType]=field1,field2` where `resourceType` matches the resource's type identifier (e.g., `fields[users]=id,name,email`).
- **Per-Resource-Type Selection**: Each resource type in the response can have its own fieldset. A compound document with users and posts can have `fields[users]=id,name&fields[posts]=id,title`.
- **Client-Controlled Scope**: The client decides which fields to receive, not the server. The server defines which fields are available; the client selects from them.
- **Server-Defined Allowlist**: The server must define a whitelist of fields that clients can request. Requesting non-whitelisted fields typically returns an error or silently ignores them.
- **Default Fieldset**: When no fieldset is specified for a resource type, the server returns a default set of fields (usually all public fields).
- **Relationship Field Restriction**: Sparse fieldsets can also restrict which fields are returned on included relationships.

## Mental Models
- **Camera Lens**: Sparse fieldsets are like choosing a camera lens — you zoom in on specific fields (telephoto) or capture the full view (wide-angle). The camera (server) has all the details, but the lens (fieldset) determines what appears in the photo.
- **Custom Sandwich Order**: The client is ordering a custom sandwich — they specify exactly which ingredients (fields) they want. The kitchen (server) prepares only what was requested.
- **SQL SELECT Analogy**: `fields[users]=id,name,email` is the API equivalent of `SELECT id, name, email FROM users`. It's the projection operation from relational algebra.

## Internal Mechanics
- **Request Parameter Parsing**: Parse the `fields` query parameter from the request. The parameter is an associative array keyed by resource type. `$request->input('fields', [])` returns the parsed structure.
- **Resolver Integration**: The resource's `toArray()` method must inspect the parsed fields array and conditionally include only the requested attributes. This is typically done by wrapping each field in a condition check.
- **Default Set Resolution**: If `fields[users]` is not present, the resource returns its full default set of attributes. If present, only the listed attributes are included.
- **Relationship Fieldsets**: When including related resources, the fieldset for the related type also applies. `fields[comments]=id,body` restricts fields on included comments resources.
- **Validation Layer**: The server should validate that requested field names exist in the resource's whitelist and return 400 Bad Request for invalid field names if strict mode is enabled.
- **Performance: Resource `toArray()`**: The resource's `toArray()` must be designed to respect sparse fieldsets. With dozens of conditional checks, the method can become verbose. Use helper methods to reduce duplication.

## Patterns
- **Whitelist-Based Field Filtering**: Define a public `$availableFields` array on each resource. The sparse fieldset implementation intersects the requested fields with this whitelist before filtering.
- **Fieldset-Aware Resource Trait**: Extract sparse fieldset logic into a reusable trait that resources can use. The trait overrides `toArray()` to apply field filtering after the parent's `toArray()`.
- **Relationship Fieldset Propagation**: When a parent resource includes relationships, propagate the fieldset to nested resource serialization. The nested resource's `toArray()` also applies its own fieldset.
- **Default Fieldset Constant**: Define a constant `DEFAULT_FIELDS` on each resource that specifies which fields to return when no fieldset is requested. This prevents accidentally exposing internal attributes.
- **Fieldset Caching**: Cache the parsed fieldset per request to avoid parsing multiple times across resources and nested resources.
- **Tight Integration with Sparse Fieldsets + Includes**: Combine `?include=comments&fields[comments]=id,body` with conditional loading. The controller maps included resources to eager loads, and the fieldset restricts which columns are serialized.

## Architectural Decisions
- **Strict vs. Lenient Field Validation**: Strict mode returns 400 for unknown fields. Lenient mode silently ignores them. Strict mode is better for public APIs; lenient mode is better for internal APIs where clients may request fields that don't exist yet.
- **Global vs. Per-Resource Fieldset Control**: Decide whether all resources support sparse fieldsets or only specific ones. If globally, enforce a consistent implementation pattern.
- **Fieldset on Non-Paginated Collections**: Sparse fieldsets are useful on both single resources and collections. Apply consistently regardless of pagination.
- **Default Fieldset Selection**: The default set of fields shapes client expectations. Include only commonly-used fields in the default. Add rarely-used fields to the allowable fieldset but not the default.
- **Field Aliasing**: Some APIs allow fieldname aliases (e.g., `fn` for `firstName`). Aliases add complexity. Consider whether aliasing is justified by the client ergonomics gain.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Reduced bandwidth (client fetches only needed fields) | Increased resource code complexity | Every field needs a conditional check or filter step |
| Faster client processing (less data to parse) | Server still queries all columns from database | Sparse fieldsets reduce response size, not query cost |
| Client-optimized payloads | Fieldset parsing and validation overhead | Adds ~0.1ms per request to validate fields |
| Backward-compatible field addition | Requires client awareness of available fields | Clients must discover available fields via documentation |
| JSON:API specification compliance | Strict implementation requires significant boilerplate | Non-spec implementers can use simpler approaches |

## Performance Considerations
- **Database Query Optimization**: Sparse fieldsets control response columns, not database query columns. Eloquent still loads all model attributes. To truly optimize, combine sparse fieldsets with `Model::select()` or query builder column selection.
- **Fieldset Parsing Caching**: Parse and validate fieldsets once per request, not once per resource. Store the parsed fields in a request-scoped cache.
- **Serialization Bypass**: With sparse fieldsets, the resource skips serialization for omitted fields. The `toArray()` method processes fewer items, reducing CPU time.
- **Pagination Metadata Stability**: Pagination metadata should not be affected by sparse fieldsets. `meta` and `links` remain complete regardless of which resource fields are selected.

## Production Considerations
- **Documenting Available Fields**: Maintain a machine-readable list of available fields per resource type. API documentation generators (Scribe, Swagger) should include this.
- **Monitoring Field Usage**: Track which sparse fieldsets clients use most. This data informs default fieldset decisions and identifies over-fetching patterns.
- **SDK Generation**: If generating client SDKs, sparse fieldset support must be reflected in the generated types. A client that requests `fields[users]=id,name` should receive typed objects with only `id` and `name` properties.
- **Caching with Sparse Fieldsets**: Cache keys must include the sparse fieldset parameter. Different fieldsets produce different response bodies that cannot share cache entries.

## Common Mistakes
- **No Whitelist for Available Fields**: Accepting any field name from clients exposes model internal attributes (timestamps, `_pivot`, etc.). Always validate against a whitelist.
- **Only One Resource Type's Fieldset**: Supporting `fields[users]` but ignoring `fields[posts]` when posts are included in the response. Apply fieldsets recursively to all included resource types.
- **Database Query Ignorance**: Assuming sparse fieldsets make the database query faster. By default, Eloquent loads all columns. Sparse fieldsets only affect serialization. Optimize the query separately.
- **Inconsistent Default Fields**: Some endpoints return a different default fieldset than others for the same resource type. The default set should be consistent across all endpoints.
- **Field Names Not Matching JSON Keys**: The fieldset parameter uses attribute names that don't match the JSON response keys. `fields[users]=full_name` but the JSON has `fullName`. Always align.

## Failure Modes
- **Missing Required Fields**: A client requests `fields[users]=id` but the client's UI also needs the `name` field to render correctly. The response is technically valid but practically broken.
- **Too Many Fields Requested**: A client requests `fields[users]=*` or every available field. The response size is the same as the default. Consider capping the number of requested fields.
- **Fieldset on Compound Documents**: In JSON:API compound documents, applying a fieldset to a primary resource type also affects the same resource type in the `included` array. This can strip required fields from included resources.
- **Fieldset Ignored for Non-Public Fields**: Clients can only request public fields but may not know which fields are public. Rejecting an entire fieldset because one field is invalid is harsh — use lenient mode.

## Ecosystem Usage
- **JSON:API Specification**: Sparse fieldsets are a core feature of JSON:API (section 5.5). The spec mandates `fields[TYPE]=FIELD1,FIELD2` syntax.
- **Laravel JSON:API Package**: `laravel-json-api` provides built-in sparse fieldset support with validation and whitelist configuration.
- **Spatie/laravel-query-builder**: The `allowedFields()` method integrates with JSON:API sparse fieldsets, filtering query results and resource serialization.
- **WordPress REST API**: Uses `_fields` parameter for sparse fieldsets. `?_fields=id,title.rendered` restricts the response to specific fields.
- **GitHub API**: Uses the `fields` parameter in its GraphQL adapter for field selection. In REST, sparse fieldsets are available via conditional media types.
- **Stripe API**: Stripe's API supports `expand[]` for including specific relationships and omitting unrequested data by default.

## Related Knowledge Units
### Prerequisites
- conditional-field-inclusion

### Related Topics
- conditional-relationship-inclusion
- json-api-resource-structure

### Advanced Follow-up Topics
- json-api-compound-documents
- response-compression

---

## Research Notes

### Source Analysis
- JSON:API Specification (Section 5.5) — sparse fieldsets syntax `fields[TYPE]=FIELD1,FIELD2`
- `Illuminate\Http\Request::input('fields')` — parsed fieldset parameter access
- `Illuminate\Http\Resources\Json\JsonResource::toArray()` — field filtering integration point
- `laravel-json-api` package — built-in fieldset validation and whitelist configuration
- `Spatie\LaravelQueryBuilder\QueryBuilder::allowedFields()` — query-level field restriction

### Key Insight
Sparse fieldsets control response column visibility but not database query column selection — without combining them with `Model::select()` or query builder column restrictions, Eloquent still hydrates all model attributes into memory, negating performance benefits at the database level.

### Version-Specific Notes
- Laravel 10/11/12/13: No native sparse fieldset support — all implementations are custom or package-driven
- `Request::input('fields')` parsing consistent across versions
- JSON:API spec 1.0 and 1.1: fieldset syntax unchanged
- Spatie's `allowedFields()` provides per-field validation since package v5+
