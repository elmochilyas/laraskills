# json-api-resource-structure
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** json-api-resource-structure  
**Difficulty Level:** Advanced  
**Last Updated:** 2026-06-02

## Executive Summary
JSON:API resource structure defines a strict, standardized format for representing resources in API responses. Every resource object contains mandatory `type` and `id` members, optional `attributes`, `relationships`, `links`, and `meta` objects. This specification-level format decouples resource identification from representation, enables client-side caching by type+id, and provides a foundation for compound documents, sparse fieldsets, and inclusion of related resources.

## Core Concepts
- **Resource Identifier**: Every resource must have a `type` (string, pluralized resource type name) and `id` (string, globally unique within the type). Together they form the resource identifier used for caching, relationships, and inclusion.
- **Attributes Object**: An object representing resource-specific data (e.g., `title`, `body`, `createdAt`). Attributes should not include relationships, meta, or links.
- **Relationships Object**: An object describing links to related resources. Each relationship has `links` (self, related) and optionally `data` (resource linkage).
- **Resource Links**: Optional `self` link pointing to the resource's canonical URL. Enables HATEOAS and cache invalidation.
- **Top-Level `data` Key**: The primary resource(s) are always under the `data` top-level key. A single resource has `data` as an object; a collection has `data` as an array.
- **`included` Key**: An array of included related resources (compound documents). Resources in `included` must not repeat the primary data.
- **Member Names**: JSON:API restricts member names to allowed characters (a-z, A-Z, 0-9, hyphen, underscore, space). Names should be camelCase or kebab-case consistently.

## Mental Models
- **Driver's License**: A resource is like a driver's license — it has a type (e.g., "Driver's License"), an ID (the license number), attributes (name, address), and relationships (to the issuing state). The license is useless if you strip away the type and ID.
- **Foreign Key Constraint**: The `type` + `id` combination is the API's foreign key constraint. Clients use type+id to link resources locally without refetching.
- **Separation of Concerns**: The JSON:API structure enforces separation between identity (type+id), representation (attributes), connections (relationships), and context (links, meta).

## Internal Mechanics
- **JSON:API Resource Object Structure**: A compliant resource object always has:
  ```json
  {
    "type": "articles",
    "id": "1",
    "attributes": { "title": "Hello", "body": "World" },
    "relationships": {
      "author": {
        "links": { "self": "/articles/1/relationships/author", "related": "/articles/1/author" },
        "data": { "type": "people", "id": "9" }
      }
    },
    "links": { "self": "/articles/1" }
  }
  ```
- **Resource Wrapper**: In JSON:API, `$wrap` should always be `'data'`. Custom wrapper keys violate the spec. The JSON:API envelope is always `{ data, included?, meta?, links?, errors? }`.
- **Attribute Serialization**: Attributes omit `id`, `type`, and relationship fields. All other resource fields from the model flow into `attributes`.
- **Relationship Serialization**: For each Eloquent relationship, the resource includes a `relationships` entry with `data` as resource linkage and optionally `links` for relationship URLs.
- **Type Naming Convention**: The `type` string uses dashes by convention for multi-word types (e.g., `blog-posts`), but can be any string. The spec recommends pluralized kebab-case.
- **ID as String**: The `id` member must be a string in JSON:API. Integer IDs are serialized as strings to maintain language-agnostic identity.

## Patterns
- **Resource Identifier Pattern**: Always include `type` and `id` on every resource object. This enables client-side normalization (e.g., Redux, Apollo, Ember Data store).
- **Attribute Separation Pattern**: Keep computed values and metadata out of attributes. Use `meta` on the resource object for non-spec attributes.
- **Relationship Data Pattern**: Always include `data` in relationship objects whenever possible. This allows clients to build a complete resource graph without fetching.
- **Self Link Pattern**: Every resource should have a `links.self` member pointing to its canonical URL. This enables cache invalidation and resource discovery.
- **Relationship Link Pattern**: Provide both `self` (relationship endpoint) and `related` (resource endpoint) links for each relationship to enable CRUD operations on relationships.
- **Type Namespace Pattern**: Prefix type names to avoid collisions in multi-domain APIs: `api:users`, `admin:users`. Some packages support scoped types.

## Architectural Decisions
- **Full Compliance vs. Pragmatic JSON:API**: Strict compliance requires significant boilerplate (relationship objects for every relation, resource linkage, self links). Decide whether full compliance or a pragmatic subset (type+id+attributes) is appropriate.
- **Type String Strategy**: Choose a type naming convention (singular vs. plural, kebab-case vs. snake_case) and apply consistently. Changes are breaking.
- **Included Resource Depth**: Limit the depth of included resources to prevent runaway response sizes. A common limit is 3 levels deep.
- **Attribute Exposure**: JSON:API does not distinguish between public and private attributes within the specification. Implement role-based visibility as a layer on top.
- **Pagination Format**: JSON:API specifies pagination via `links` objects with `first`, `last`, `prev`, `next`. Pagination metadata should use `meta` rather than custom top-level keys.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Client-side resource normalization | Significant boilerplate per resource | Every relationship requires explicit mapping |
| Strong caching by type+id | Strict format constraints | Changes require specification version updates |
| Rich client ecosystem (Ember, Orbit) | Steep learning curve for new developers | Teams must learn the specification before being productive |
| Self-describing API responses | Larger payloads than bare-body | Response size increased by structural keys |
| Relationship linkage enables graph queries | N+1 inclusion risk | Aggressive client includes cause performance issues |

## Performance Considerations
- **Response Size**: JSON:API responses are typically 20-40% larger than equivalent envelope responses due to `type`, `id`, `relationships`, and `links` structure.
- **Relationship Serialization Cost**: Serializing relationship objects for every relation adds CPU time proportional to the number of relationships defined on the resource.
- **Included Resource Serialization**: Compound documents serialize each included resource through its own resource class. The serialization cost multiplies with inclusion depth.
- **Client-Side Processing**: JSON:API clients (Ember Data, Redux) normalize responses into a flat cache. This normalization is CPU-intensive on the client but enables efficient local queries.

## Production Considerations
- **Specification Version Tracking**: Track which version of the JSON:API specification your implementation targets. Breaking changes between spec versions must be handled through API versioning.
- **Compliance Testing**: Use JSON:API compliance test suites to verify implementation correctness. Missing `type` or `id` fields are the most common compliance failures.
- **Documentation Generation**: JSON:API responses require per-type documentation. Use tools that understand the JSON:API structure (e.g., Scribe with JSON:API extension).
- **Client SDK Generation**: JSON:API's strict format enables robust SDK generation. Consider using json-api-client, Ember Data, or custom generators.

## Common Mistakes
- **Missing `type` or `id`**: The most common JSON:API violation. Every resource object MUST have both `type` and `id`.
- **Inconsistent Type Names**: Using `user` in one endpoint and `users` in another. Type names must be consistent across the entire API.
- **Numeric IDs**: Returning `"id": 1` instead of `"id": "1"`. The spec requires `id` to be a string.
- **Attributes Containing Relationships**: Putting related resource data inside `attributes`. Relationships must be in the `relationships` object.
- **Missing Relationship Data**: Omitting `data` from relationship objects forces clients to fetch the relationship endpoint. Always include resource linkage when possible.

## Failure Modes
- **Circular Included Resources**: Resource A includes resource B, which includes resource A, causing infinite serialization. Implement depth limits and circular reference detection.
- **Type Collision**: Two different models map to the same JSON:API type string. The client cache conflates them. Ensure unique type-to-model mapping.
- **ID Type Confusion**: Client treats `id` as integer and performs arithmetic. String IDs prevent accidental arithmetic.
- **Missing Self Links on Relationships**: Without self links, clients cannot update or delete relationships. This limits the API's CRUD capabilities.

## Ecosystem Usage
- **Laravel JSON:API (`laravel-json-api`)**: The most comprehensive JSON:API implementation for Laravel. Provides schema classes, resource type mapping, and request/response encoding.
- **Laravel Framework**: Laravel does not natively support JSON:API. Developers must use packages or implement the spec manually via Resource classes with careful `$wrap` and `toArray()` configuration.
- **Ember Data**: Ember.js's data layer expects JSON:API format by default. Laravel APIs serving Ember frontends benefit from strict compliance.
- **Orbit.js**: A client-side data layer that consumes JSON:API. Used with Glimmer.js and other JavaScript frameworks.
- **Fractal (deprecated)**: Fractal included JSON:API serializers that transformed resources into JSON:API format. Now superseded by native Resource classes with careful implementation.
- **API Platform (Symfony)**: Symfony's API Platform generates JSON:API responses natively. Laravel lacks an equivalent first-party solution.

## Related Knowledge Units
### Prerequisites
- envelope-response-design
- data-wrapping-configuration

### Related Topics
- json-api-compound-documents
- sparse-fieldset-design

### Advanced Follow-up Topics
- rfc-9457-problem-details
- response-versioning

---

## Research Notes

### Source Analysis
- JSON:API Specification (Sections 5.1-5.5) — resource objects, identifiers, attributes, relationships
- `Illuminate\Http\Resources\Json\JsonResource` — `toArray()` must manually construct `type`, `id`, `attributes`, `relationships`
- `laravel-json-api` package — schema classes, type mapping, relationship serialization
- `CloudCreativity\LaravelJsonApi\Contracts\Encoder\SerializerInterface` — resource encoding

### Key Insight
Every resource in JSON:API has a mandatory `type`+`id` identity pair that decouples the resource's database identity from its API identity — this enables client-side normalization, compound document deduplication, and cache keying by `type:id` rather than URL.

### Version-Specific Notes
- Laravel 10/11/12/13: No native JSON:API support; all versions require packages or manual implementation
- JSON:API spec 1.0 and 1.1 differ on extension member handling — both supported by `laravel-json-api`
- ID field must be serialized as string in all versions; Eloquent's integer IDs need explicit `(string)` casting
